import { SparePartItem, CompareItem, CompatItem, calculatePricing } from '../data/initialData';

export interface SheetSyncResult {
  success: boolean;
  message: string;
  partsCount: number;
  compatCount?: number;
  compareCount?: number;
  syncedAt: string;
  source: string;
}

export interface StoredDatabaseState {
  sheetUrl: string;
  lastSyncedAt: string | null;
  customParts: SparePartItem[];
  liveCompareItems: CompareItem[];
  liveCompatItems: CompatItem[];
  defaultExpense: number;
  defaultMarkupPercent: number;
}

const STORAGE_KEY_DB = 'spareparts_db_config_v3';
const STORAGE_KEY_CUSTOM_PARTS = 'spareparts_custom_items_v3';

export class GoogleSheetsService {
  public static getSavedConfig(): StoredDatabaseState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DB);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return {
      sheetUrl: '',
      lastSyncedAt: null,
      customParts: [],
      liveCompareItems: [],
      liveCompatItems: [],
      defaultExpense: 1.0,
      defaultMarkupPercent: 30
    };
  }

  public static saveConfig(state: Partial<StoredDatabaseState>) {
    try {
      const current = this.getSavedConfig();
      const updated = { ...current, ...state };
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save DB config', e);
    }
  }

  public static getCustomParts(): SparePartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PARTS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return [];
  }

  public static saveCustomParts(items: SparePartItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_PARTS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save custom parts', e);
    }
  }

  /**
   * Parses CSV string into array of rows
   */
  public static parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const result: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let inQuotes = false;
      let curVal = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(curVal.trim().replace(/^["']|["']$/g, ''));
      result.push(row);
    }
    return result;
  }

  /**
   * Format Google Sheet URL to direct CSV endpoint
   */
  public static formatSheetUrl(inputUrl: string): string {
    const url = inputUrl.trim();
    if (!url) return '';

    if (url.includes('/exec') || url.includes('output=csv') || url.includes('format=csv')) {
      return url;
    }

    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
    }

    return url;
  }

  /**
   * Sync from Google Sheet or Apps Script JSON endpoint
   */
  public static async syncFromSheet(rawUrl: string): Promise<{
    result: SheetSyncResult;
    parts: SparePartItem[];
    compareItems: CompareItem[];
  }> {
    const url = this.formatSheetUrl(rawUrl);
    if (!url) {
      throw new Error("Please enter a valid Google Sheet or Apps Script Web App URL.");
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/csv, text/plain, */*'
      },
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}. Please make sure the sheet is shared as "Anyone with the link can view".`);
    }

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    const parts: SparePartItem[] = [];
    const compareItems: CompareItem[] = [];

    // Case 1: JSON response
    if (contentType.includes('application/json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
      try {
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : (data.items || data.parts || data.data || []);
        
        list.forEach((item: Record<string, unknown>, index: number) => {
          if (item.url && item.brand) {
            compareItems.push({
              img: `live-${index}`,
              name: String(item.name || '').trim(),
              brand: String(item.brand || '').trim(),
              url: String(item.url || '').trim()
            });
          }

          const name = String(item.name || item.product || item.model || '').trim();
          if (name) {
            const cat = String(item.cat || item.category || 'General Spare Parts').trim();
            const d = Number(item.d ?? item.priceD ?? item.price_d ?? item.dirham ?? 0);
            const expense = Number(item.expense ?? 1.0);
            const pricing = calculatePricing(d, expense);

            parts.push({
              id: `sheet-${index}-${Date.now()}`,
              cat,
              name,
              d,
              usd: Number(item.usd ?? item.costUsd ?? pricing.costUsd),
              yuan: Number(item.yuan ?? pricing.yuan),
              salesPrice: Number(item.salesPrice ?? pricing.salesPrice),
              salesPriceD: Number(item.salesPriceD ?? pricing.salesPriceD),
              expense
            });
          }
        });
      } catch (err) {
        throw new Error("Failed to parse JSON response from Google Sheet: " + (err as Error).message);
      }
    } else {
      // Case 2: CSV response
      const rows = this.parseCSV(text);
      if (rows.length < 2) {
        throw new Error("The CSV sheet does not contain enough rows.");
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      
      const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('brand') || h.includes('group'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('product') || h.includes('model') || h.includes('item'));
      const dIdx = headers.findIndex(h => h === 'd' || h.includes('dirham') || h.includes('price d') || h.includes('aed'));
      const usdIdx = headers.findIndex(h => h.includes('usd+') || h.includes('cost') || h === 'usd');
      const yuanIdx = headers.findIndex(h => h.includes('yuan') || h.includes('rmb') || h.includes('¥') || h.includes('cny'));
      const salesIdx = headers.findIndex(h => h.includes('sale') || h.includes('retail') || h.includes('selling'));
      const expIdx = headers.findIndex(h => h.includes('exp') || h.includes('ship'));
      const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('photo') || h.includes('image'));

      const safeNameIdx = nameIdx >= 0 ? nameIdx : 0;
      const safeCatIdx = catIdx >= 0 ? catIdx : (safeNameIdx === 0 ? 1 : 0);
      const safeDIdx = dIdx >= 0 ? dIdx : (safeNameIdx === 0 ? 1 : 2);

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        const name = (row[safeNameIdx] || '').trim();
        if (!name) continue;

        const cat = (row[safeCatIdx] || 'General Spare Parts').trim();
        const d = parseFloat(String(row[safeDIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
        const exp = expIdx >= 0 ? (parseFloat(String(row[expIdx]).replace(/[^0-9.]/g, '')) || 1.0) : 1.0;
        const pricing = calculatePricing(d, exp);

        const customUsd = usdIdx >= 0 ? parseFloat(String(row[usdIdx]).replace(/[^0-9.]/g, '')) : NaN;
        const customYuan = yuanIdx >= 0 ? parseFloat(String(row[yuanIdx]).replace(/[^0-9.]/g, '')) : NaN;
        const customSales = salesIdx >= 0 ? parseFloat(String(row[salesIdx]).replace(/[^0-9.]/g, '')) : NaN;

        parts.push({
          id: `csv-${r}-${Date.now()}`,
          cat,
          name,
          d,
          usd: !isNaN(customUsd) && customUsd > 0 ? customUsd : pricing.costUsd,
          yuan: !isNaN(customYuan) && customYuan > 0 ? customYuan : pricing.yuan,
          salesPrice: !isNaN(customSales) && customSales > 0 ? customSales : pricing.salesPrice,
          salesPriceD: pricing.salesPriceD,
          expense: exp
        });

        if (urlIdx >= 0 && row[urlIdx]) {
          compareItems.push({
            img: `csv-img-${r}`,
            name,
            brand: cat,
            url: row[urlIdx].trim()
          });
        }
      }
    }

    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const result: SheetSyncResult = {
      success: true,
      message: `Successfully synchronized ${parts.length} products from Google Sheets!`,
      partsCount: parts.length,
      compareCount: compareItems.length,
      syncedAt: timestamp,
      source: url
    };

    this.saveConfig({
      sheetUrl: rawUrl,
      lastSyncedAt: timestamp,
      liveCompareItems: compareItems
    });

    return { result, parts, compareItems };
  }

  /**
   * Export catalog to All-In-One Google Sheet format
   * Product Name, Price D, USD+, Yuan ¥, Sales $, Category
   */
  public static exportToCSV(parts: SparePartItem[]) {
    const headers = [
      'Product Name',
      'Price D',
      'USD+',
      'Yuan ¥',
      'Sales $',
      'Category',
      'Expense $'
    ];
    const rows = parts.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.d,
      p.usd,
      p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
      p.salesPrice,
      `"${p.cat.replace(/"/g, '""')}"`,
      p.expense
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reer_Hassan_All_In_One_Google_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export catalog to JSON backup file
   */
  public static exportToJSON(parts: SparePartItem[], compat: CompatItem[], compare: CompareItem[]) {
    const data = {
      exportedAt: new Date().toISOString(),
      formula: "Cost USD = (Dirham / 3.67) + Expenses",
      parts,
      compat,
      compare
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Spare_Parts_AllInOne_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
