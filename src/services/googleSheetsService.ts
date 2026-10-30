import { SparePartItem, CompareItem, CompatItem, PhotoItem, calculatePricing } from '../data/initialData';

export interface SheetSyncResult {
  success: boolean;
  message: string;
  partsCount: number;
  photosCount?: number;
  compatCount?: number;
  compareCount?: number;
  syncedAt: string;
  source: string;
  sheetsFound?: string[];
}

export interface StoredDatabaseState {
  sheetUrl: string;
  lastSyncedAt: string | null;
  customParts: SparePartItem[];
  liveCompareItems: CompareItem[];
  liveCompatItems: CompatItem[];
  defaultExpense: number;
  defaultMarkupPercent: number;
  isFormattedEmpty?: boolean;
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
      defaultExpense: 0,
      defaultMarkupPercent: 0,
      isFormattedEmpty: false
    };
  }

  public static isFormattedEmpty(): boolean {
    const config = this.getSavedConfig();
    return Boolean(config.isFormattedEmpty);
  }

  public static formatAllData() {
    this.saveCustomParts([]);
    this.saveConfig({
      sheetUrl: '',
      lastSyncedAt: null,
      customParts: [],
      liveCompareItems: [],
      liveCompatItems: [],
      isFormattedEmpty: true
    });
  }

  public static restoreDefaultData() {
    this.saveCustomParts([]);
    this.saveConfig({
      sheetUrl: '',
      lastSyncedAt: null,
      customParts: [],
      liveCompareItems: [],
      liveCompatItems: [],
      isFormattedEmpty: false
    });
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
      if (items.length > 0) {
        this.saveConfig({ isFormattedEmpty: false });
      }
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
   * Intelligently parses tabular rows (CSV/TSV from Google Sheets)
   * into SparePartItem[] matching the exact Google Sheet format:
   * Col A: Product Name
   * Col B: Category (Brand _Part Type)
   * Col C: Price D
   * Col D: Yuan ¥
   * Col E: USD+
   * Col F: Sales $
   */
  public static parseRowsToParts(rows: string[][]): {
    parts: SparePartItem[];
    compareItems: CompareItem[];
  } {
    const parts: SparePartItem[] = [];
    const compareItems: CompareItem[] = [];
    if (!rows || rows.length < 2) return { parts, compareItems };

    const rawHeaders = rows[0].map(h => (h || '').trim().toLowerCase());

    const nameIdx = rawHeaders.findIndex(h => h.includes('name') || h.includes('product') || h.includes('model') || h.includes('item'));
    const catIdx = rawHeaders.findIndex(h => h.includes('category') || h.includes('brand') || h.includes('part type') || h.includes('cat'));
    const dIdx = rawHeaders.findIndex(h => h === 'price d' || h === 'dirham' || h === 'd' || h.includes('price d') || h.includes('dirham') || (h.includes('price') && !h.includes('sale')));
    const yuanIdx = rawHeaders.findIndex(h => h.includes('yuan') || h.includes('¥') || h.includes('rmb') || h.includes('cny'));
    const usdIdx = rawHeaders.findIndex(h => h.includes('usd+') || h.includes('usd +') || h.includes('cost') || (h.includes('usd') && !h.includes('sales')));
    const salesIdx = rawHeaders.findIndex(h => h.includes('sales') || h.includes('sale') || h.includes('retail') || h.includes('selling'));
    const expIdx = rawHeaders.findIndex(h => h.includes('exp') || h.includes('ship'));
    const urlIdx = rawHeaders.findIndex(h => h.includes('url') || h.includes('photo') || h.includes('image'));

    // Fallbacks corresponding directly to user's exact 6 columns:
    // A: Product Name, B: Category (Brand _Part Type), C: Price D, D: Yuan ¥, E: USD+, F: Sales $
    const safeNameIdx = nameIdx >= 0 ? nameIdx : 0;
    const safeCatIdx = catIdx >= 0 ? catIdx : 1;
    const safeDIdx = dIdx >= 0 ? dIdx : 2;
    const safeYuanIdx = yuanIdx >= 0 ? yuanIdx : 3;
    const safeUsdIdx = usdIdx >= 0 ? usdIdx : 4;
    const safeSalesIdx = salesIdx >= 0 ? salesIdx : 5;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const name = (row[safeNameIdx] || '').trim();
      if (!name || name.toLowerCase() === 'product name') continue;

      const cat = (row[safeCatIdx] || 'General Spare Parts').trim();
      const rawD = String(row[safeDIdx] || '0').replace(/[^0-9.]/g, '');
      const d = parseFloat(rawD) || 0;
      // Strictly 0 expense by default - user rule: NO SHIPPING AND EXPENSES
      const exp = expIdx >= 0 ? (parseFloat(String(row[expIdx]).replace(/[^0-9.]/g, '')) || 0) : 0;
      const pricing = calculatePricing(d, exp);

      const rawUsd = safeUsdIdx >= 0 && row[safeUsdIdx] ? parseFloat(String(row[safeUsdIdx]).replace(/[^0-9.]/g, '')) : NaN;
      const rawYuan = safeYuanIdx >= 0 && row[safeYuanIdx] ? parseFloat(String(row[safeYuanIdx]).replace(/[^0-9.]/g, '')) : NaN;
      const rawSales = safeSalesIdx >= 0 && row[safeSalesIdx] ? parseFloat(String(row[safeSalesIdx]).replace(/[^0-9.]/g, '')) : NaN;

      const usd = !isNaN(rawUsd) && rawUsd > 0 ? rawUsd : pricing.costUsd;
      const yuan = !isNaN(rawYuan) && rawYuan > 0 ? rawYuan : pricing.yuan;
      // Sales $ strictly follows origin price $
      const salesPrice = !isNaN(rawSales) && rawSales > 0 ? rawSales : usd;

      parts.push({
        id: `row-${r}-${Date.now()}`,
        cat: cat || 'General Spare Parts',
        name,
        d,
        usd,
        yuan,
        salesPrice,
        salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
        expense: exp
      });

      if (urlIdx >= 0 && row[urlIdx]) {
        compareItems.push({
          img: `row-img-${r}`,
          name,
          brand: cat,
          url: row[urlIdx].trim()
        });
      }
    }

    return { parts, compareItems };
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
   * Handles multi-category sheets, 2D arrays, objects, Photos tab, and Compatible LCDs tab!
   */
  public static async syncFromSheet(rawUrl: string): Promise<{
    result: SheetSyncResult;
    parts: SparePartItem[];
    photos: PhotoItem[];
    compat: CompatItem[];
    compareItems: CompareItem[];
  }> {
    let text = '';
    let contentType = '';
    let activeUrl = this.formatSheetUrl(rawUrl);

    // If it's a standard spreadsheets link, prioritize fetching the "ALL PRODUCT" tab
    const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1] && !rawUrl.includes('/exec')) {
      const sheetId = match[1];
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=ALL+PRODUCT`;
        activeUrl = gvizUrl;
        const gvizRes = await fetch(gvizUrl, { cache: 'no-cache' });
        if (gvizRes.ok) {
          const gvizText = await gvizRes.text();
          if (gvizText && gvizText.length > 30 && !gvizText.includes('<!DOCTYPE html>')) {
            text = gvizText;
            contentType = 'text/csv';
          }
        }
      } catch (e) {
        console.warn('GViz ALL PRODUCT fetch notice:', e);
      }
    }

    if (!text) {
      if (!activeUrl) {
        activeUrl = this.formatSheetUrl(rawUrl);
      }
      if (!activeUrl) {
        throw new Error("Please enter a valid Google Sheet or Apps Script Web App URL.");
      }

      const res = await fetch(activeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/csv, text/plain, */*'
        },
        cache: 'no-cache'
      });

      if (!res.ok) {
        throw new Error(`Google Sheets responded with HTTP ${res.status}. Please make sure the sheet is shared as "Anyone with the link can view" or Apps Script is deployed as "Anyone".`);
      }

      contentType = res.headers.get('content-type') || '';
      text = await res.text();
    }

    const parts: SparePartItem[] = [];
    const photos: PhotoItem[] = [];
    const compat: CompatItem[] = [];
    const compareItems: CompareItem[] = [];
    let sheetsFound: string[] = [];

    // Case 1: JSON response
    if (contentType.includes('application/json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
      try {
        const data = JSON.parse(text);

        // Subcase 1A: Advanced multi-sheet Apps Script response { success, parts, photos, compat, sheetsFound }
        if (data && typeof data === 'object' && !Array.isArray(data) && (data.parts || data.items || data.photos || data.compat)) {
          if (Array.isArray(data.sheetsFound)) {
            sheetsFound = data.sheetsFound;
          }

          // Parse Parts
          const rawPartsList = Array.isArray(data.parts) ? data.parts : (Array.isArray(data.items) ? data.items : []);
          rawPartsList.forEach((item: any, index: number) => {
            // Check if item is array or object
            let name = '';
            let cat = 'General Spare Parts';
            let d = 0;
            let yuan: number | undefined;
            let usd: number | undefined;
            let salesPrice: number | undefined;
            let expense = 0;

            if (Array.isArray(item)) {
              name = String(item[0] || '').trim();
              cat = String(item[1] || 'General Spare Parts').trim();
              d = parseFloat(String(item[2] || '0').replace(/[^0-9.]/g, '')) || 0;
              yuan = item[3] ? parseFloat(String(item[3]).replace(/[^0-9.]/g, '')) : undefined;
              usd = item[4] ? parseFloat(String(item[4]).replace(/[^0-9.]/g, '')) : undefined;
              salesPrice = item[5] ? parseFloat(String(item[5]).replace(/[^0-9.]/g, '')) : undefined;
            } else if (item && typeof item === 'object') {
              name = String(item.name || item.product || item.model || '').trim();
              cat = String(item.cat || item.category || 'General Spare Parts').trim();
              d = Number(item.d ?? item.priceD ?? item.price_d ?? item.dirham ?? 0);
              yuan = item.yuan !== undefined ? Number(item.yuan) : undefined;
              usd = item.usd !== undefined ? Number(item.usd) : undefined;
              salesPrice = item.salesPrice !== undefined ? Number(item.salesPrice) : undefined;
              expense = Number(item.expense ?? 0);
            }

            if (name && name.toLowerCase() !== 'product name') {
              const pricing = calculatePricing(d, expense);
              const finalUsd = usd !== undefined && usd > 0 ? usd : pricing.costUsd;
              const finalYuan = yuan !== undefined && yuan > 0 ? yuan : pricing.yuan;
              const finalSalesPrice = salesPrice !== undefined && salesPrice > 0 ? salesPrice : finalUsd;

              parts.push({
                id: `sheet-${index}-${Date.now()}`,
                cat: cat || 'General Spare Parts',
                name,
                d,
                usd: finalUsd,
                yuan: finalYuan,
                salesPrice: finalSalesPrice,
                salesPriceD: Number((finalSalesPrice * 3.67).toFixed(1)),
                expense
              });
            }
          });

          // Parse Photos tab
          if (Array.isArray(data.photos)) {
            data.photos.forEach((ph: any, pIdx: number) => {
              if (Array.isArray(ph)) {
                const name = String(ph[0] || '').trim();
                const url = String(ph[1] || '').trim();
                const description = String(ph[2] || '').trim();
                const brand = String(ph[3] || '').trim();
                const createdAt = String(ph[4] || new Date().toISOString().split('T')[0]).trim();
                if (name && name.toLowerCase() !== 'photo name') {
                  photos.push({
                    id: `sheet-photo-${pIdx}-${Date.now()}`,
                    name,
                    url,
                    description,
                    brand,
                    createdAt
                  });
                }
              } else if (ph && typeof ph === 'object') {
                const name = String(ph.name || '').trim();
                if (name && name.toLowerCase() !== 'photo name') {
                  photos.push({
                    id: `sheet-photo-${pIdx}-${Date.now()}`,
                    name,
                    url: String(ph.url || ph.link || '').trim(),
                    description: String(ph.description || '').trim(),
                    brand: String(ph.brand || ph.category || '').trim(),
                    createdAt: String(ph.createdAt || new Date().toISOString().split('T')[0]).trim()
                  });
                }
              }
            });
          }

          // Parse Compatible LCDs tab
          if (Array.isArray(data.compat)) {
            data.compat.forEach((c: any, cIdx: number) => {
              if (Array.isArray(c)) {
                const lcd = String(c[0] || '').trim();
                const fits = String(c[1] || '').trim();
                const note = String(c[2] || '').trim();
                if (lcd && lcd.toLowerCase() !== 'main model' && lcd.toLowerCase() !== 'lcd') {
                  compat.push({
                    id: `sheet-compat-${cIdx}-${Date.now()}`,
                    lcd,
                    fits,
                    note
                  });
                }
              } else if (c && typeof c === 'object') {
                const lcd = String(c.lcd || c.mainModel || '').trim();
                if (lcd && lcd.toLowerCase() !== 'main model' && lcd.toLowerCase() !== 'lcd') {
                  compat.push({
                    id: `sheet-compat-${cIdx}-${Date.now()}`,
                    lcd,
                    fits: Array.isArray(c.fits) ? c.fits.join(', ') : String(c.fits || c.compatibleModels || '').trim(),
                    note: String(c.note || '').trim()
                  });
                }
              }
            });
          }
        }
        // Subcase 1B: 2D array of rows from getDataRange().getValues()
        else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
          const parsed = this.parseRowsToParts(data as string[][]);
          parts.push(...parsed.parts);
          compareItems.push(...parsed.compareItems);
        }
        // Subcase 1C: Flat array of objects
        else if (Array.isArray(data)) {
          data.forEach((item: any, index: number) => {
            if (Array.isArray(item)) {
              const name = String(item[0] || '').trim();
              const cat = String(item[1] || 'General Spare Parts').trim();
              const d = parseFloat(String(item[2] || '0').replace(/[^0-9.]/g, '')) || 0;
              const yuan = item[3] ? parseFloat(String(item[3]).replace(/[^0-9.]/g, '')) : undefined;
              const usd = item[4] ? parseFloat(String(item[4]).replace(/[^0-9.]/g, '')) : undefined;
              const salesPrice = item[5] ? parseFloat(String(item[5]).replace(/[^0-9.]/g, '')) : undefined;

              if (name && name.toLowerCase() !== 'product name') {
                const pricing = calculatePricing(d, 0);
                const finalUsd = usd !== undefined && usd > 0 ? usd : pricing.costUsd;
                const finalYuan = yuan !== undefined && yuan > 0 ? yuan : pricing.yuan;
                const finalSalesPrice = salesPrice !== undefined && salesPrice > 0 ? salesPrice : finalUsd;

                parts.push({
                  id: `sheet-${index}-${Date.now()}`,
                  cat: cat || 'General Spare Parts',
                  name,
                  d,
                  usd: finalUsd,
                  yuan: finalYuan,
                  salesPrice: finalSalesPrice,
                  salesPriceD: Number((finalSalesPrice * 3.67).toFixed(1)),
                  expense: 0
                });
              }
            } else if (item && typeof item === 'object') {
              if (item.url && item.brand) {
                compareItems.push({
                  img: `live-${index}`,
                  name: String(item.name || '').trim(),
                  brand: String(item.brand || '').trim(),
                  url: String(item.url || '').trim()
                });
              }

              const name = String(item.name || item.product || item.model || '').trim();
              if (name && name.toLowerCase() !== 'product name') {
                const cat = String(item.cat || item.category || 'General Spare Parts').trim();
                const d = Number(item.d ?? item.priceD ?? item.price_d ?? item.dirham ?? 0);
                const expense = Number(item.expense ?? 0);
                const pricing = calculatePricing(d, expense);

                const usd = item.usd !== undefined ? Number(item.usd) : pricing.costUsd;
                const yuan = item.yuan !== undefined ? Number(item.yuan) : pricing.yuan;
                const salesPrice = item.salesPrice !== undefined ? Number(item.salesPrice) : usd;

                parts.push({
                  id: `sheet-${index}-${Date.now()}`,
                  cat,
                  name,
                  d,
                  usd,
                  yuan,
                  salesPrice,
                  salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
                  expense
                });
              }
            }
          });
        }
      } catch (err) {
        throw new Error("Failed to parse JSON response from Google Sheet: " + (err as Error).message);
      }
    } else {
      // Case 2: CSV response
      const rows = this.parseCSV(text);
      if (rows.length < 2) {
        throw new Error("The CSV sheet does not contain enough rows.");
      }
      const parsedData = this.parseRowsToParts(rows);
      parts.push(...parsedData.parts);
      compareItems.push(...parsedData.compareItems);
    }

    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const sheetsMsg = sheetsFound.length > 0 ? ` across ${sheetsFound.length} categories (${sheetsFound.slice(0, 3).join(', ')}...)` : '';
    const extraMsg = (photos.length > 0 || compat.length > 0)
      ? ` + ${photos.length} photos and ${compat.length} compatible LCD sets`
      : '';

    const result: SheetSyncResult = {
      success: true,
      message: `Successfully synchronized ${parts.length} products${sheetsMsg}${extraMsg}!`,
      partsCount: parts.length,
      photosCount: photos.length,
      compatCount: compat.length,
      compareCount: compareItems.length,
      syncedAt: timestamp,
      source: activeUrl || rawUrl,
      sheetsFound
    };

    this.saveConfig({
      sheetUrl: rawUrl,
      lastSyncedAt: timestamp,
      liveCompareItems: compareItems
    });

    return { result, parts, photos, compat, compareItems };
  }

  /**
   * Export catalog to All-In-One Google Sheet format
   * Product Name, Price D, USD+, Yuan ¥, Sales $, Category
   */
  public static exportToCSV(parts: SparePartItem[]) {
    const headers = [
      'Product Name',
      'Category (Brand _Part Type)',
      'Price D',
      'Yuan ¥',
      'USD+',
      'Sales $'
    ];
    const rows = parts.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.cat.replace(/"/g, '""')}"`,
      p.d,
      p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
      p.usd,
      p.salesPrice
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ALL_PRODUCT_Master_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy all products as tab-delimited values (TSV) directly to the clipboard
   * so the user can paste directly into Google Sheets cell A1 with Ctrl+V
   */
  public static async copyAllProductsToClipboard(parts: SparePartItem[]): Promise<boolean> {
    try {
      const headers = ['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'];
      const rows = parts.map(p => [
        p.name,
        p.cat,
        p.d,
        p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
        p.usd,
        p.salesPrice
      ]);
      const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
      await navigator.clipboard.writeText(tsvContent);
      return true;
    } catch (e) {
      console.warn('Clipboard write failed', e);
      return false;
    }
  }

  /**
   * Export catalog to JSON backup file
   */
  public static exportToJSON(parts: SparePartItem[], compat: CompatItem[], compare: CompareItem[], photos: PhotoItem[] = []) {
    const data = {
      exportedAt: new Date().toISOString(),
      formula: "Cost USD = Price D / 3.67 (No Extra Expenses)",
      parts,
      compat,
      compare,
      photos
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

  /**
   * Append a row and automatically create a new sheet tab in Google Sheets
   * using a connected Google Apps Script Web App endpoint
   */
  /**
   * Append a row to Google Sheets (specifically the 'ALL PRODUCT' sheet)
   * using dual POST and GET query fallback to guarantee delivery across Google 302 redirects.
   */
  public static async appendToGoogleSheet(
    endpointUrl: string, 
    item: SparePartItem, 
    sheetName: string = 'ALL PRODUCT'
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    const targetSheet = sheetName || 'ALL PRODUCT';
    const yuanVal = item.yuan ?? Number(((item.d / 3.67) * 7.23).toFixed(1));

    try {
      // 1. Primary method: POST with JSON payload in text/plain (avoids CORS preflight)
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_product',
          sheetName: targetSheet,
          name: item.name,
          productName: item.name,
          category: item.cat,
          cat: item.cat,
          d: item.d,
          yuan: yuanVal,
          usd: item.usd,
          salesPrice: item.salesPrice,
          row: [
            item.name,
            item.cat,
            item.d,
            yuanVal,
            item.usd,
            item.salesPrice
          ]
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST append notice:', e));

      // 2. Dual fallback: GET query parameter (preserves parameters across Google 302 redirects)
      const queryParams = new URLSearchParams({
        action: 'add_product',
        sheetName: targetSheet,
        name: item.name,
        productName: item.name,
        cat: item.cat,
        d: String(item.d),
        yuan: String(yuanVal),
        usd: String(item.usd),
        salesPrice: String(item.salesPrice),
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET append notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return { 
        success: true, 
        message: `Successfully saved "${item.name}" to Google Sheet "ALL PRODUCT"!` 
      };
    } catch (err) {
      console.warn('Google Sheet append error:', err);
      return { 
        success: false, 
        message: (err as Error).message || 'Failed to append row to Google Sheets.' 
      };
    }
  }

  /**
   * Automatically delete a single product from Google Sheet when deleted from the app interface
   */
  public static async deleteFromGoogleSheet(
    endpointUrl: string,
    productName: string,
    category?: string
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    try {
      // 1. Primary method: POST with JSON payload in text/plain
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_product',
          productName,
          name: productName,
          category
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST delete notice:', e));

      // 2. Dual fallback: GET query parameter (survives Google 302 redirects)
      const queryParams = new URLSearchParams({
        action: 'delete_product',
        productName: productName,
        name: productName,
        category: category || '',
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET delete notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return {
        success: true,
        message: `Successfully sent delete request for "${productName}" to Google Sheets!`
      };
    } catch (err) {
      console.warn('Google Sheet delete error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to delete row from Google Sheets.'
      };
    }
  }

  /**
   * Automatically bulk-delete multiple products from Google Sheet
   */
  public static async bulkDeleteFromGoogleSheet(
    endpointUrl: string,
    productNames: string[]
  ): Promise<{ success: boolean; message: string }> {
    if (!endpointUrl.trim() || productNames.length === 0) {
      return { success: false, message: 'No products or endpoint configured.' };
    }

    try {
      await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'bulk_delete_products',
          productNames
        }),
        mode: 'no-cors'
      });

      return {
        success: true,
        message: `Successfully requested deletion of ${productNames.length} products from Google Sheets!`
      };
    } catch (err) {
      console.warn('Google Sheet bulk delete error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to bulk-delete from Google Sheets.'
      };
    }
  }

  /**
   * Automatically update an existing product in Google Sheets when edited in the app
   * Updates matching row in 'ALL PRODUCT' and any category sheets.
   * Uses both POST and GET query parameters to guarantee delivery across Google 302 redirects.
   */
  public static async updateInGoogleSheet(
    endpointUrl: string,
    oldProductName: string,
    updatedItem: SparePartItem
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    const yuanVal = updatedItem.yuan ?? Number(((updatedItem.d / 3.67) * 7.23).toFixed(1));

    try {
      // 1. Primary method: POST with JSON payload in text/plain (avoids CORS preflight)
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_product',
          oldName: oldProductName,
          productName: updatedItem.name,
          name: updatedItem.name,
          category: updatedItem.cat,
          cat: updatedItem.cat,
          sheetName: updatedItem.cat,
          d: updatedItem.d,
          yuan: yuanVal,
          usd: updatedItem.usd,
          salesPrice: updatedItem.salesPrice,
          row: [
            updatedItem.name,
            updatedItem.cat,
            updatedItem.d,
            yuanVal,
            updatedItem.usd,
            updatedItem.salesPrice
          ]
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST update notice:', e));

      // 2. Dual fallback: GET query parameter (preserves parameters across Google 302 redirects)
      const queryParams = new URLSearchParams({
        action: 'update_product',
        oldName: oldProductName,
        name: updatedItem.name,
        productName: updatedItem.name,
        cat: updatedItem.cat,
        d: String(updatedItem.d),
        yuan: String(yuanVal),
        usd: String(updatedItem.usd),
        salesPrice: String(updatedItem.salesPrice),
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET update notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return {
        success: true,
        message: `Directly synced "${updatedItem.name}" to Google Sheet!`
      };
    } catch (err) {
      console.warn('Google Sheet update error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to update row in Google Sheets.'
      };
    }
  }

  /**
   * Automatically synchronize photo actions (add, update, delete) to the "Photos" tab in Google Sheets
   */
  public static async syncPhotoToGoogleSheet(
    endpointUrl: string,
    action: 'add' | 'update' | 'delete',
    photo: Partial<PhotoItem>,
    oldName?: string
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    const actionKey = action === 'delete' ? 'delete_photo' : (action === 'update' ? 'update_photo' : 'add_photo');

    try {
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: actionKey,
          oldName: oldName || photo.name,
          name: photo.name,
          photoName: photo.name,
          url: photo.url || photo.link || '',
          description: photo.description || '',
          brand: photo.brand || '',
          createdAt: photo.createdAt || new Date().toISOString().split('T')[0]
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST photo sync notice:', e));

      const queryParams = new URLSearchParams({
        action: actionKey,
        oldName: oldName || photo.name || '',
        name: photo.name || '',
        photoName: photo.name || '',
        url: photo.url || photo.link || '',
        description: photo.description || '',
        brand: photo.brand || '',
        createdAt: photo.createdAt || '',
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET photo sync notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return {
        success: true,
        message: `Synced photo "${photo.name}" to Google Sheet "Photos" tab!`
      };
    } catch (err) {
      console.warn('Google Sheet photo sync error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to sync photo to Google Sheets.'
      };
    }
  }

  /**
   * Automatically synchronize compatible LCD actions (add, update, delete) to "Compatible LCDs" tab in Google Sheets
   */
  public static async syncCompatToGoogleSheet(
    endpointUrl: string,
    action: 'add' | 'update' | 'delete',
    compat: Partial<CompatItem>,
    oldLcd?: string
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    const actionKey = action === 'delete' ? 'delete_compat' : (action === 'update' ? 'update_compat' : 'add_compat');

    try {
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: actionKey,
          oldLcd: oldLcd || compat.lcd,
          lcd: compat.lcd,
          mainModel: compat.lcd,
          fits: compat.fits || '',
          note: compat.note || ''
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST compat sync notice:', e));

      const queryParams = new URLSearchParams({
        action: actionKey,
        oldLcd: oldLcd || compat.lcd || '',
        lcd: compat.lcd || '',
        mainModel: compat.lcd || '',
        fits: compat.fits || '',
        note: compat.note || '',
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET compat sync notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return {
        success: true,
        message: `Synced compatibility "${compat.lcd}" to Google Sheet "Compatible LCDs" tab!`
      };
    } catch (err) {
      console.warn('Google Sheet compat sync error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to sync compatibility to Google Sheets.'
      };
    }
  }

  /**
   * Backup all current local parts, photos, and compatible LCDs to Google Sheets in one batch.
   * Mode 'all_in_one': Consolidates ALL products from all categories into 1 single sheet named "ALL PRODUCT"
   * Mode 'multi_tab': Splits products into individual category tabs (SAMSUNG / LCD, REDMI / LCD, etc.)
   */
  public static async backupAllToGoogleSheet(
    endpointUrl: string,
    items: SparePartItem[],
    photos: PhotoItem[] = [],
    compat: CompatItem[] = [],
    mode: 'all_in_one' | 'multi_tab' = 'all_in_one'
  ): Promise<{ success: boolean; message: string }> {
    if (!endpointUrl.trim()) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    try {
      const payloadRows = items.map(p => ({
        sheetName: mode === 'all_in_one' ? 'ALL PRODUCT' : (p.cat || 'General Spare Parts'),
        row: [
          p.name,
          p.cat,
          p.d,
          p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
          p.usd,
          p.salesPrice
        ]
      }));

      const payloadPhotos = photos.map(ph => ({
        name: ph.name,
        url: ph.url || ph.link || '',
        description: ph.description || '',
        brand: ph.brand || '',
        createdAt: ph.createdAt || ''
      }));

      const payloadCompat = compat.map(c => ({
        lcd: c.lcd,
        fits: c.fits,
        note: c.note || ''
      }));

      await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'batch_backup_all',
          backup_mode: mode,
          mode: mode,
          is_all_in_one: mode === 'all_in_one',
          sheetName: mode === 'all_in_one' ? 'ALL PRODUCT' : 'General Spare Parts',
          items: payloadRows,
          parts: payloadRows,
          photos: payloadPhotos,
          compat: payloadCompat
        }),
        mode: 'no-cors'
      });

      const modeTitle = mode === 'all_in_one'
        ? "1 single master sheet ('ALL PRODUCT')"
        : "individual category sheets";

      return {
        success: true,
        message: `Successfully sent backup request for ${items.length} products to ${modeTitle}, with ${photos.length} photos and ${compat.length} compatible LCD sets!`
      };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'Failed to backup database to Google Sheets.'
      };
    }
  }

  /**
   * Copy-ready Google Apps Script for the user's Google Sheet
   * Supports:
   * 1. 1-Sheet All-In-One Mode: Reads/Writes all products to a single sheet named "ALL PRODUCT"
   * 2. Multi-tab category scanning (iterates all sheets: SAMSUNG / LCD, REDMI / LCD, IPHONE / BATTERY, etc.)
   * 3. Dedicated "Photos" and "Compatible LCDs" backup and restore tabs
   * 4. Automatic bidirectional deletion (deleting in app deletes in Google Sheet)
   * 5. Auto-creating new sheets on add
   */
  public static getAppsScriptCode(): string {
    return `// ========================================================
// SPARE PARTS MASTERY - LIVE ALL-IN-ONE & MULTI-CATEGORY GOOGLE APPS SCRIPT
// Features:
// 1. 1-SHEET ALL-IN-ONE: Backs up ALL products into a single sheet named "ALL PRODUCT"
// 2. Multi-Category Scanning: Scans all category tabs (SAMSUNG / LCD, REDMI / LCD, etc.)
// 3. Synchronizes & Backs Up "Photos" and "Compatible LCDs" Tabs
// 4. Automatic Row Deletion when deleted in the App
// 5. Zero extra expense calculation (USD = Price D / 3.67)
// ========================================================
// SETUP INSTRUCTIONS:
// 1. In your Google Sheet, click "Extensions" > "Apps Script".
// 2. Delete ALL existing code, paste this entire script, and click "Save" (Disk icon).
// 3. Click "Deploy" > "Manage deployments" (or "New deployment").
// 4. Click the gear icon > select "Web app".
// 5. Set:
//    - Description: All In One Sync
//    - Execute as: "Me"
//    - Who has access: "Anyone"  <-- CRITICAL!
// 6. Click "Deploy", authorize permissions, copy the Web App URL,
//    and paste it into the app's Google Sheets Database tab!
// ========================================================

// Helper: Normalize product names for fuzzy matching (IP 8 + <-> LCD IPHONE X8 +)
function _normName(str) {
  if (!str) return '';
  return String(str).toLowerCase()
    .replace(/^lcd\s+/i, '')
    .replace(/^battery\s+/i, '')
    .replace(/^flex charger\s+/i, '')
    .replace(/\biphone\b/g, 'ip')
    .replace(/\bsamsung\b/g, 'sam')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _matchProd(a, b) {
  if (!a || !b) return false;
  var rawA = String(a).toLowerCase().trim();
  var rawB = String(b).toLowerCase().trim();
  if (rawA === rawB) return true;
  var nA = _normName(rawA);
  var nB = _normName(rawB);
  if (nA === nB && nA.length > 0) return true;
  if (nA.length >= 3 && nB.length >= 3 && (nA.indexOf(nB) !== -1 || nB.indexOf(nA) !== -1)) return true;
  return false;
}

function _updateSheetRow(sh, oldTarget, newTarget, rowData) {
  var lastR = sh.getLastRow();
  var lastC = Math.max(sh.getLastColumn(), 6);
  if (lastR < 2) return false;
  var values = sh.getRange(1, 1, lastR, lastC).getValues();
  var headers = values[0].map(function(h) { return String(h || '').trim().toLowerCase(); });

  var nameIdx = 0, catIdx = 1, dIdx = 2, yuanIdx = 3, usdIdx = 4, salesIdx = 5;
  for (var h = 0; h < headers.length; h++) {
    var head = headers[h];
    if (head.indexOf('name') !== -1 || head.indexOf('product') !== -1 || head.indexOf('model') !== -1) nameIdx = h;
    if (head.indexOf('category') !== -1 || head.indexOf('brand') !== -1) catIdx = h;
    if (head === 'price d' || head === 'd' || head.indexOf('dirham') !== -1 || (head.indexOf('price') !== -1 && head.indexOf('sale') === -1)) dIdx = h;
    if (head.indexOf('yuan') !== -1 || head.indexOf('¥') !== -1 || head.indexOf('rmb') !== -1) yuanIdx = h;
    if (head.indexOf('usd') !== -1 && head.indexOf('sale') === -1) usdIdx = h;
    if (head.indexOf('sales') !== -1 || head.indexOf('sale') !== -1 || head.indexOf('retail') !== -1) salesIdx = h;
  }

  for (var r = 2; r <= lastR; r++) {
    var cellName = String(values[r - 1][nameIdx] || '').trim();
    if (_matchProd(cellName, oldTarget) || _matchProd(cellName, newTarget)) {
      if (rowData.name) sh.getRange(r, nameIdx + 1).setValue(rowData.name);
      if (rowData.cat) sh.getRange(r, catIdx + 1).setValue(rowData.cat);
      if (rowData.d !== undefined) sh.getRange(r, dIdx + 1).setValue(rowData.d);
      if (rowData.yuan !== undefined) sh.getRange(r, yuanIdx + 1).setValue(rowData.yuan);
      if (rowData.usd !== undefined) sh.getRange(r, usdIdx + 1).setValue(rowData.usd);
      if (rowData.salesPrice !== undefined) sh.getRange(r, salesIdx + 1).setValue(rowData.salesPrice);
      return true;
    }
  }
  return false;
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params ? params.action : null;

  // DIRECT ACTION DISPATCH FOR GET (Guarantees execution across redirects)
  if (action === 'add_product' || action === 'create_sheet_and_add_row') {
    var newRow = [
      params.name || params.productName || '',
      params.cat || params.category || 'General Spare Parts',
      parseFloat(params.d || '0') || 0,
      parseFloat(params.yuan || '0') || 0,
      parseFloat(params.usd || '0') || 0,
      parseFloat(params.salesPrice || params.sales || '0') || 0
    ];
    var targetSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (!targetSheet) {
      targetSheet = ss.insertSheet("ALL PRODUCT");
      targetSheet.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
      targetSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      targetSheet.setFrozenRows(1);
    }
    var rowData = {
      name: newRow[0],
      cat: newRow[1],
      d: newRow[2],
      yuan: newRow[3],
      usd: newRow[4],
      salesPrice: newRow[5]
    };
    var found = _updateSheetRow(targetSheet, newRow[0], newRow[0], rowData);
    if (!found && newRow[0]) {
      targetSheet.appendRow(newRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, added: true, action: 'add_product' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'update_product') {
    var oldTarget = String(params.oldName || params.productName || params.name || '').trim();
    var newTarget = String(params.name || params.productName || params.oldName || '').trim();
    var rowData = {
      name: newTarget,
      cat: params.cat || params.category || 'General Spare Parts',
      d: parseFloat(params.d || '0') || 0,
      yuan: parseFloat(params.yuan || '0') || 0,
      usd: parseFloat(params.usd || '0') || 0,
      salesPrice: parseFloat(params.salesPrice || params.sales || '0') || 0
    };
    var updated = false;

    // 1. Primary target: "ALL PRODUCT" tab
    var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (!allProdSheet) {
      allProdSheet = ss.insertSheet("ALL PRODUCT");
      allProdSheet.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
      allProdSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      allProdSheet.setFrozenRows(1);
    }

    updated = _updateSheetRow(allProdSheet, oldTarget, newTarget, rowData);

    // Also update any matching category tabs if they exist
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      var sh = allSheets[s];
      if (sh.getName() !== allProdSheet.getName()) {
        _updateSheetRow(sh, oldTarget, newTarget, rowData);
      }
    }

    // If product wasn't found in any row, append directly to "ALL PRODUCT"
    if (!updated && rowData.name) {
      allProdSheet.appendRow([rowData.name, rowData.cat, rowData.d, rowData.yuan, rowData.usd, rowData.salesPrice]);
      updated = true;
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updated: updated,
      action: 'update_product',
      productName: rowData.name,
      d: rowData.d,
      salesPrice: rowData.salesPrice
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete_product') {
    var targetName = String(params.productName || params.name || '').trim().toLowerCase();
    var deleted = false;
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      var sh = allSheets[s];
      var lastR = sh.getLastRow();
      if (lastR < 2) continue;
      var colA = sh.getRange(1, 1, lastR, 1).getValues();
      for (var r = lastR; r >= 2; r--) {
        var val = String(colA[r - 1][0] || '').trim().toLowerCase();
        if (val === targetName) {
          sh.deleteRow(r);
          deleted = true;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: deleted, action: 'delete_product' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // PHOTOS ACTIONS (add_photo, update_photo, delete_photo)
  if (action === 'add_photo' || action === 'update_photo') {
    var pSheet = ss.getSheetByName("Photos") || ss.getSheetByName("Photo") || ss.getSheetByName("Sawiro");
    if (!pSheet) {
      pSheet = ss.insertSheet("Photos");
      pSheet.appendRow(["Photo Name", "Image URL / Link", "Description", "Brand / Category", "Date Added"]);
      pSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0b1324").setFontColor("#34d399");
      pSheet.setFrozenRows(1);
    }
    var oldPName = String(params.oldName || params.name || '').trim();
    var pName = String(params.name || params.photoName || '').trim();
    var pUrl = String(params.url || params.link || '').trim();
    var pDesc = String(params.description || params.desc || '').trim();
    var pBrand = String(params.brand || params.cat || '').trim();
    var pDate = String(params.createdAt || params.date || new Date().toISOString().split('T')[0]).trim();
    var pRow = [pName, pUrl, pDesc, pBrand, pDate];

    var pFound = false;
    var pLastR = pSheet.getLastRow();
    if (pLastR >= 2) {
      var pColA = pSheet.getRange(1, 1, pLastR, 1).getValues();
      for (var pr = 2; pr <= pLastR; pr++) {
        var existingPName = String(pColA[pr - 1][0] || '').trim();
        if (_matchProd(existingPName, oldPName) || _matchProd(existingPName, pName)) {
          pSheet.getRange(pr, 1, 1, 5).setValues([pRow]);
          pFound = true;
          break;
        }
      }
    }
    if (!pFound && pName) {
      pSheet.appendRow(pRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action, name: pName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete_photo') {
    var pSheet = ss.getSheetByName("Photos") || ss.getSheetByName("Photo") || ss.getSheetByName("Sawiro");
    if (pSheet && pSheet.getLastRow() >= 2) {
      var delPName = String(params.name || params.photoName || '').trim();
      var pLastR = pSheet.getLastRow();
      var pColA = pSheet.getRange(1, 1, pLastR, 1).getValues();
      for (var pr = pLastR; pr >= 2; pr--) {
        if (_matchProd(String(pColA[pr - 1][0] || '').trim(), delPName)) {
          pSheet.deleteRow(pr);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'delete_photo' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // COMPATIBLE LCDS ACTIONS (add_compat, update_compat, delete_compat)
  if (action === 'add_compat' || action === 'update_compat') {
    var cSheet = ss.getSheetByName("Compatible LCDs") || ss.getSheetByName("Compatibility") || ss.getSheetByName("Fits");
    if (!cSheet) {
      cSheet = ss.insertSheet("Compatible LCDs");
      cSheet.appendRow(["Main Model (LCD)", "Compatible Models (Fits)", "Notes"]);
      cSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0b1324").setFontColor("#f59e0b");
      cSheet.setFrozenRows(1);
    }
    var oldLcd = String(params.oldLcd || params.lcd || '').trim();
    var cLcd = String(params.lcd || params.mainModel || '').trim();
    var cFits = String(params.fits || params.compatibleModels || '').trim();
    var cNote = String(params.note || '').trim();
    var cRow = [cLcd, cFits, cNote];

    var cFound = false;
    var cLastR = cSheet.getLastRow();
    if (cLastR >= 2) {
      var cColA = cSheet.getRange(1, 1, cLastR, 1).getValues();
      for (var cr = 2; cr <= cLastR; cr++) {
        var existingLcd = String(cColA[cr - 1][0] || '').trim();
        if (_matchProd(existingLcd, oldLcd) || _matchProd(existingLcd, cLcd)) {
          cSheet.getRange(cr, 1, 1, 3).setValues([cRow]);
          cFound = true;
          break;
        }
      }
    }
    if (!cFound && cLcd) {
      cSheet.appendRow(cRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action, lcd: cLcd }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete_compat') {
    var cSheet = ss.getSheetByName("Compatible LCDs") || ss.getSheetByName("Compatibility") || ss.getSheetByName("Fits");
    if (cSheet && cSheet.getLastRow() >= 2) {
      var delLcd = String(params.lcd || params.mainModel || '').trim();
      var cLastR = cSheet.getLastRow();
      var cColA = cSheet.getRange(1, 1, cLastR, 1).getValues();
      for (var cr = cLastR; cr >= 2; cr--) {
        if (_matchProd(String(cColA[cr - 1][0] || '').trim(), delLcd)) {
          cSheet.deleteRow(cr);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'delete_compat' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheets = ss.getSheets();
  var allParts = [];
  var allPhotos = [];
  var allCompat = [];
  var sheetsFound = [];

  // 1. FIRST PRIORITY: Check for single consolidated "ALL PRODUCT" or "ALL PRODUCTS" sheet
  var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
  if (allProdSheet && allProdSheet.getLastRow() >= 2) {
    sheetsFound.push(allProdSheet.getName());
    var lastRow = allProdSheet.getLastRow();
    var lastCol = allProdSheet.getLastColumn();
    var values = allProdSheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0].map(function(h) { return String(h || '').trim().toLowerCase(); });

    var nameIdx = -1, catIdx = -1, dIdx = -1, yuanIdx = -1, usdIdx = -1, salesIdx = -1;
    for (var h = 0; h < headers.length; h++) {
      var head = headers[h];
      if (nameIdx === -1 && (head.indexOf('name') !== -1 || head.indexOf('product') !== -1 || head.indexOf('model') !== -1)) nameIdx = h;
      if (catIdx === -1 && (head.indexOf('category') !== -1 || head.indexOf('brand') !== -1 || head.indexOf('part') !== -1)) catIdx = h;
      if (dIdx === -1 && (head === 'price d' || head === 'd' || head.indexOf('dirham') !== -1 || (head.indexOf('price') !== -1 && head.indexOf('sale') === -1))) dIdx = h;
      if (yuanIdx === -1 && (head.indexOf('yuan') !== -1 || head.indexOf('¥') !== -1 || head.indexOf('rmb') !== -1)) yuanIdx = h;
      if (usdIdx === -1 && (head.indexOf('usd') !== -1 && head.indexOf('sale') === -1)) usdIdx = h;
      if (salesIdx === -1 && (head.indexOf('sales') !== -1 || head.indexOf('sale') !== -1 || head.indexOf('retail') !== -1)) salesIdx = h;
    }

    if (nameIdx === -1) nameIdx = 0;
    if (catIdx === -1) catIdx = 1;
    if (dIdx === -1) dIdx = 2;
    if (yuanIdx === -1) yuanIdx = 3;
    if (usdIdx === -1) usdIdx = 4;
    if (salesIdx === -1) salesIdx = 5;

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var name = String(row[nameIdx] || '').trim();
      if (!name || name.toLowerCase() === 'product name') continue;

      var rawCat = catIdx < row.length ? String(row[catIdx] || '').trim() : '';
      var cat = rawCat || "General Spare Parts";
      var rawD = dIdx < row.length ? String(row[dIdx] || '0').replace(/[^0-9.]/g, '') : '0';
      var d = parseFloat(rawD) || 0;

      var rawYuan = yuanIdx < row.length && row[yuanIdx] ? parseFloat(String(row[yuanIdx]).replace(/[^0-9.]/g, '')) : NaN;
      var rawUsd = usdIdx < row.length && row[usdIdx] ? parseFloat(String(row[usdIdx]).replace(/[^0-9.]/g, '')) : NaN;
      var rawSales = salesIdx < row.length && row[salesIdx] ? parseFloat(String(row[salesIdx]).replace(/[^0-9.]/g, '')) : NaN;

      var baseUsd = d > 0 ? (d / 3.67) : 0;
      var usd = !isNaN(rawUsd) && rawUsd > 0 ? rawUsd : Number(baseUsd.toFixed(2));
      var yuan = !isNaN(rawYuan) && rawYuan > 0 ? rawYuan : Number((baseUsd * 7.23).toFixed(2));
      var salesPrice = !isNaN(rawSales) && rawSales > 0 ? rawSales : usd;

      allParts.push({
        name: name,
        cat: cat,
        d: d,
        yuan: yuan,
        usd: usd,
        salesPrice: salesPrice,
        expense: 0
      });
    }
  }

  // 2. FALLBACK: If no "ALL PRODUCT" sheet was found, scan individual category sheets
  if (allParts.length === 0) {
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var sheetName = sheet.getName().trim();
      var sLower = sheetName.toLowerCase();
      
      // Skip empty or cover tabs
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 2) continue;
      if (sLower === 'photos' || sLower === 'photo' || sLower.indexOf('compat') !== -1 || sLower.indexOf('fits') !== -1) continue;

      var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      if (values.length < 2) continue;

      sheetsFound.push(sheetName);
      var headers = values[0].map(function(h) { return String(h || '').trim().toLowerCase(); });

      var nameIdx = -1, catIdx = -1, dIdx = -1, yuanIdx = -1, usdIdx = -1, salesIdx = -1;
      for (var h = 0; h < headers.length; h++) {
        var head = headers[h];
        if (nameIdx === -1 && (head.indexOf('name') !== -1 || head.indexOf('product') !== -1 || head.indexOf('model') !== -1)) nameIdx = h;
        if (catIdx === -1 && (head.indexOf('category') !== -1 || head.indexOf('brand') !== -1 || head.indexOf('part') !== -1)) catIdx = h;
        if (dIdx === -1 && (head === 'price d' || head === 'd' || head.indexOf('dirham') !== -1 || (head.indexOf('price') !== -1 && head.indexOf('sale') === -1))) dIdx = h;
        if (yuanIdx === -1 && (head.indexOf('yuan') !== -1 || head.indexOf('¥') !== -1 || head.indexOf('rmb') !== -1)) yuanIdx = h;
        if (usdIdx === -1 && (head.indexOf('usd') !== -1 && head.indexOf('sale') === -1)) usdIdx = h;
        if (salesIdx === -1 && (head.indexOf('sales') !== -1 || head.indexOf('sale') !== -1 || head.indexOf('retail') !== -1)) salesIdx = h;
      }

      if (nameIdx === -1) nameIdx = 0;
      if (catIdx === -1) catIdx = 1;
      if (dIdx === -1) dIdx = 2;
      if (yuanIdx === -1) yuanIdx = 3;
      if (usdIdx === -1) usdIdx = 4;
      if (salesIdx === -1) salesIdx = 5;

      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        var name = String(row[nameIdx] || '').trim();
        if (!name || name.toLowerCase() === 'product name') continue;

        var rawCat = catIdx < row.length ? String(row[catIdx] || '').trim() : '';
        var cat = rawCat || sheetName;
        var rawD = dIdx < row.length ? String(row[dIdx] || '0').replace(/[^0-9.]/g, '') : '0';
        var d = parseFloat(rawD) || 0;

        var rawYuan = yuanIdx < row.length && row[yuanIdx] ? parseFloat(String(row[yuanIdx]).replace(/[^0-9.]/g, '')) : NaN;
        var rawUsd = usdIdx < row.length && row[usdIdx] ? parseFloat(String(row[usdIdx]).replace(/[^0-9.]/g, '')) : NaN;
        var rawSales = salesIdx < row.length && row[salesIdx] ? parseFloat(String(row[salesIdx]).replace(/[^0-9.]/g, '')) : NaN;

        var baseUsd = d > 0 ? (d / 3.67) : 0;
        var usd = !isNaN(rawUsd) && rawUsd > 0 ? rawUsd : Number(baseUsd.toFixed(2));
        var yuan = !isNaN(rawYuan) && rawYuan > 0 ? rawYuan : Number((baseUsd * 7.23).toFixed(2));
        var salesPrice = !isNaN(rawSales) && rawSales > 0 ? rawSales : usd;

        allParts.push({
          name: name,
          cat: cat,
          d: d,
          yuan: yuan,
          usd: usd,
          salesPrice: salesPrice,
          expense: 0
        });
      }
    }
  }

  // 3. Scan Photos & Compatible LCDs tabs
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var sLower = sheet.getName().trim().toLowerCase();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 2) continue;

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    if (values.length < 2) continue;

    if (sLower === 'photos' || sLower === 'photo' || sLower === 'sawiro') {
      for (var r = 1; r < values.length; r++) {
        var pRow = values[r];
        var pName = String(pRow[0] || '').trim();
        var pUrl = String(pRow[1] || '').trim();
        if (pName && pName.toLowerCase() !== 'photo name' && pName.toLowerCase() !== 'name') {
          allPhotos.push({
            name: pName,
            url: pUrl,
            description: String(pRow[2] || '').trim(),
            brand: String(pRow[3] || '').trim(),
            createdAt: String(pRow[4] || '').trim()
          });
        }
      }
    }

    if (sLower.indexOf('compat') !== -1 || sLower.indexOf('fits') !== -1) {
      for (var r = 1; r < values.length; r++) {
        var cRow = values[r];
        var cLcd = String(cRow[0] || '').trim();
        var cFits = String(cRow[1] || '').trim();
        if (cLcd && cLcd.toLowerCase() !== 'main model' && cLcd.toLowerCase() !== 'lcd') {
          allCompat.push({
            lcd: cLcd,
            fits: cFits,
            note: String(cRow[2] || '').trim()
          });
        }
      }
    }
  }

  var output = {
    success: true,
    parts: allParts,
    photos: allPhotos,
    compat: allCompat,
    sheetsFound: sheetsFound,
    partsCount: allParts.length,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = (e && e.parameter) ? e.parameter : {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    var action = payload ? payload.action : null;

    // 1. UPDATE PRODUCT DIRECTLY IN GOOGLE SHEETS (Searches ALL PRODUCT first, then all tabs)
    if (action === 'update_product') {
      var oldTarget = String(payload.oldName || payload.productName || payload.name || '').trim();
      var newTarget = String(payload.productName || payload.name || payload.oldName || '').trim();
      var rowData = {
        name: newTarget,
        cat: payload.cat || payload.category || 'General Spare Parts',
        d: parseFloat(payload.d || '0') || 0,
        yuan: parseFloat(payload.yuan || '0') || 0,
        usd: parseFloat(payload.usd || '0') || 0,
        salesPrice: parseFloat(payload.salesPrice || payload.sales || '0') || 0
      };
      var updated = false;

      // 1. Primary target: "ALL PRODUCT" tab
      var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
      if (!allProdSheet) {
        allProdSheet = ss.insertSheet("ALL PRODUCT");
        allProdSheet.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
        allProdSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
        allProdSheet.setFrozenRows(1);
      }

      updated = _updateSheetRow(allProdSheet, oldTarget, newTarget, rowData);

      // Also update any other category tabs
      var allSheets = ss.getSheets();
      for (var s = 0; s < allSheets.length; s++) {
        var sh = allSheets[s];
        if (sh.getName() !== allProdSheet.getName()) {
          _updateSheetRow(sh, oldTarget, newTarget, rowData);
        }
      }

      // If product wasn't found in any row, append directly to "ALL PRODUCT"
      if (!updated && rowData.name) {
        allProdSheet.appendRow([rowData.name, rowData.cat, rowData.d, rowData.yuan, rowData.usd, rowData.salesPrice]);
        updated = true;
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        updated: updated,
        message: updated ? "Updated " + rowData.name + " (" + rowData.d + " D)" : "Appended new product to ALL PRODUCT",
        productName: rowData.name,
        d: rowData.d,
        salesPrice: rowData.salesPrice
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. DELETE SINGLE PRODUCT FROM GOOGLE SHEETS (Searches ALL PRODUCT and all other tabs)
    if (action === 'delete_product') {
      var targetName = String(payload.productName || payload.name || '').trim();
      var deleted = false;
      var sheets = ss.getSheets();

      for (var s = 0; s < sheets.length; s++) {
        var sh = sheets[s];
        var lastR = sh.getLastRow();
        if (lastR < 2) continue;
        var colA = sh.getRange(1, 1, lastR, 1).getValues();
        for (var r = lastR; r >= 2; r--) {
          var val = String(colA[r - 1][0] || '').trim();
          if (_matchProd(val, targetName)) {
            sh.deleteRow(r);
            deleted = true;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deleted: deleted,
        message: deleted ? "Deleted " + payload.productName : "Product not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. BULK DELETE MULTIPLE PRODUCTS FROM GOOGLE SHEETS
    if (action === 'bulk_delete_products' && payload.productNames) {
      var nameSet = {};
      for (var i = 0; i < payload.productNames.length; i++) {
        nameSet[String(payload.productNames[i]).trim().toLowerCase()] = true;
      }
      var count = 0;
      var sheets = ss.getSheets();
      for (var s = 0; s < sheets.length; s++) {
        var sh = sheets[s];
        var lastR = sh.getLastRow();
        if (lastR < 2) continue;
        var colA = sh.getRange(1, 1, lastR, 1).getValues();
        for (var r = lastR; r >= 2; r--) {
          var val = String(colA[r - 1][0] || '').trim().toLowerCase();
          if (nameSet[val]) {
            sh.deleteRow(r);
            count++;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: count,
        message: "Deleted " + count + " rows"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // PHOTOS ACTIONS (add_photo, update_photo, delete_photo)
    if (action === 'add_photo' || action === 'update_photo') {
      var pSheet = ss.getSheetByName("Photos") || ss.getSheetByName("Photo") || ss.getSheetByName("Sawiro");
      if (!pSheet) {
        pSheet = ss.insertSheet("Photos");
        pSheet.appendRow(["Photo Name", "Image URL / Link", "Description", "Brand / Category", "Date Added"]);
        pSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0b1324").setFontColor("#34d399");
        pSheet.setFrozenRows(1);
      }
      var oldPName = String(payload.oldName || payload.name || '').trim();
      var pName = String(payload.name || payload.photoName || '').trim();
      var pUrl = String(payload.url || payload.link || '').trim();
      var pDesc = String(payload.description || payload.desc || '').trim();
      var pBrand = String(payload.brand || payload.cat || '').trim();
      var pDate = String(payload.createdAt || payload.date || new Date().toISOString().split('T')[0]).trim();
      var pRow = [pName, pUrl, pDesc, pBrand, pDate];

      var pFound = false;
      var pLastR = pSheet.getLastRow();
      if (pLastR >= 2) {
        var pColA = pSheet.getRange(1, 1, pLastR, 1).getValues();
        for (var pr = 2; pr <= pLastR; pr++) {
          var existingPName = String(pColA[pr - 1][0] || '').trim();
          if (_matchProd(existingPName, oldPName) || _matchProd(existingPName, pName)) {
            pSheet.getRange(pr, 1, 1, 5).setValues([pRow]);
            pFound = true;
            break;
          }
        }
      }
      if (!pFound && pName) {
        pSheet.appendRow(pRow);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action, name: pName }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete_photo') {
      var pSheet = ss.getSheetByName("Photos") || ss.getSheetByName("Photo") || ss.getSheetByName("Sawiro");
      if (pSheet && pSheet.getLastRow() >= 2) {
        var delPName = String(payload.name || payload.photoName || '').trim();
        var pLastR = pSheet.getLastRow();
        var pColA = pSheet.getRange(1, 1, pLastR, 1).getValues();
        for (var pr = pLastR; pr >= 2; pr--) {
          if (_matchProd(String(pColA[pr - 1][0] || '').trim(), delPName)) {
            pSheet.deleteRow(pr);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'delete_photo' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // COMPATIBLE LCDS ACTIONS (add_compat, update_compat, delete_compat)
    if (action === 'add_compat' || action === 'update_compat') {
      var cSheet = ss.getSheetByName("Compatible LCDs") || ss.getSheetByName("Compatibility") || ss.getSheetByName("Fits");
      if (!cSheet) {
        cSheet = ss.insertSheet("Compatible LCDs");
        cSheet.appendRow(["Main Model (LCD)", "Compatible Models (Fits)", "Notes"]);
        cSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0b1324").setFontColor("#f59e0b");
        cSheet.setFrozenRows(1);
      }
      var oldLcd = String(payload.oldLcd || payload.lcd || '').trim();
      var cLcd = String(payload.lcd || payload.mainModel || '').trim();
      var cFits = String(payload.fits || payload.compatibleModels || '').trim();
      var cNote = String(payload.note || '').trim();
      var cRow = [cLcd, cFits, cNote];

      var cFound = false;
      var cLastR = cSheet.getLastRow();
      if (cLastR >= 2) {
        var cColA = cSheet.getRange(1, 1, cLastR, 1).getValues();
        for (var cr = 2; cr <= cLastR; cr++) {
          var existingLcd = String(cColA[cr - 1][0] || '').trim();
          if (_matchProd(existingLcd, oldLcd) || _matchProd(existingLcd, cLcd)) {
            cSheet.getRange(cr, 1, 1, 3).setValues([cRow]);
            cFound = true;
            break;
          }
        }
      }
      if (!cFound && cLcd) {
        cSheet.appendRow(cRow);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action, lcd: cLcd }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete_compat') {
      var cSheet = ss.getSheetByName("Compatible LCDs") || ss.getSheetByName("Compatibility") || ss.getSheetByName("Fits");
      if (cSheet && cSheet.getLastRow() >= 2) {
        var delLcd = String(payload.lcd || payload.mainModel || '').trim();
        var cLastR = cSheet.getLastRow();
        var cColA = cSheet.getRange(1, 1, cLastR, 1).getValues();
        for (var cr = cLastR; cr >= 2; cr--) {
          if (_matchProd(String(cColA[cr - 1][0] || '').trim(), delLcd)) {
            cSheet.deleteRow(cr);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'delete_compat' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 1-SHEET ALL-IN-ONE BACKUP: Consolidates ALL categories into 1 sheet named "ALL PRODUCT"
    if (action === 'backup_all_in_one') {
      var partsList = payload.parts || payload.items || [];
      var sh = ss.getSheetByName("ALL PRODUCT");
      if (!sh) {
        sh = ss.insertSheet("ALL PRODUCT");
      } else {
        sh.clearContents();
      }

      // Add bold header
      sh.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
      sh.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      sh.setFrozenRows(1);

      var rowsToAdd = [];
      for (var i = 0; i < partsList.length; i++) {
        if (partsList[i].row) {
          rowsToAdd.push(partsList[i].row);
        }
      }

      if (rowsToAdd.length > 0) {
        sh.getRange(2, 1, rowsToAdd.length, 6).setValues(rowsToAdd);
      }

      // Photos Tab Backup
      if (payload.photos && payload.photos.length > 0) {
        var photoSheet = ss.getSheetByName("Photos");
        if (!photoSheet) {
          photoSheet = ss.insertSheet("Photos");
        } else {
          photoSheet.clearContents();
        }
        photoSheet.appendRow(["Photo Name", "Image URL / Link", "Description", "Brand / Category", "Date Added"]);
        photoSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0b1324").setFontColor("#34d399");
        photoSheet.setFrozenRows(1);
        var photoRows = payload.photos.map(function(ph) {
          return [ph.name || '', ph.url || '', ph.description || '', ph.brand || ph.category || '', ph.createdAt || ''];
        });
        if (photoRows.length > 0) {
          photoSheet.getRange(2, 1, photoRows.length, 5).setValues(photoRows);
        }
      }

      // Compatible LCDs Tab Backup
      if (payload.compat && payload.compat.length > 0) {
        var compatSheet = ss.getSheetByName("Compatible LCDs");
        if (!compatSheet) {
          compatSheet = ss.insertSheet("Compatible LCDs");
        } else {
          compatSheet.clearContents();
        }
        compatSheet.appendRow(["Main Model (LCD)", "Compatible Models (Fits)", "Notes"]);
        compatSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0b1324").setFontColor("#f59e0b");
        compatSheet.setFrozenRows(1);
        var compatRows = payload.compat.map(function(c) {
          return [c.lcd || '', c.fits || '', c.note || ''];
        });
        if (compatRows.length > 0) {
          compatSheet.getRange(2, 1, compatRows.length, 3).setValues(compatRows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: rowsToAdd.length,
        message: "Successfully backed up " + rowsToAdd.length + " products into 1 sheet named 'ALL PRODUCT'!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. MULTI-TAB BATCH BACKUP: Splits into individual category sheets
    if (action === 'batch_backup_all') {
      var partsList = payload.parts || payload.items || [];
      
      // Group parts by sheet name
      var bySheet = {};
      for (var i = 0; i < partsList.length; i++) {
        var item = partsList[i];
        var sName = item.sheetName || (item.row ? item.row[1] : null) || "General Spare Parts";
        if (!bySheet[sName]) bySheet[sName] = [];
        if (item.row) {
          bySheet[sName].push(item.row);
        }
      }

      for (var sheetName in bySheet) {
        var sh = ss.getSheetByName(sheetName);
        if (!sh) {
          sh = ss.insertSheet(sheetName);
          sh.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
          sh.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
        }
        var rowsToAdd = bySheet[sheetName];
        if (rowsToAdd.length > 0) {
          var startR = sh.getLastRow() + 1;
          sh.getRange(startR, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
        }
      }

      // Photos Tab Backup
      if (payload.photos && payload.photos.length > 0) {
        var photoSheet = ss.getSheetByName("Photos");
        if (!photoSheet) {
          photoSheet = ss.insertSheet("Photos");
          photoSheet.appendRow(["Photo Name", "Image URL / Link", "Description", "Brand / Category", "Date Added"]);
          photoSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0b1324").setFontColor("#34d399");
        }
        var photoRows = payload.photos.map(function(ph) {
          return [ph.name || '', ph.url || '', ph.description || '', ph.brand || ph.category || '', ph.createdAt || ''];
        });
        if (photoRows.length > 0) {
          var startR = photoSheet.getLastRow() + 1;
          photoSheet.getRange(startR, 1, photoRows.length, 5).setValues(photoRows);
        }
      }

      // Compatible LCDs Tab Backup
      if (payload.compat && payload.compat.length > 0) {
        var compatSheet = ss.getSheetByName("Compatible LCDs");
        if (!compatSheet) {
          compatSheet = ss.insertSheet("Compatible LCDs");
          compatSheet.appendRow(["Main Model (LCD)", "Compatible Models (Fits)", "Notes"]);
          compatSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0b1324").setFontColor("#f59e0b");
        }
        var compatRows = payload.compat.map(function(c) {
          return [c.lcd || '', c.fits || '', c.note || ''];
        });
        if (compatRows.length > 0) {
          var startR = compatSheet.getLastRow() + 1;
          compatSheet.getRange(startR, 1, compatRows.length, 3).setValues(compatRows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Successfully backed up parts, photos, and compatible LCDs to Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. AUTO-ADD SINGLE ROW AND SAVE DIRECTLY TO "ALL PRODUCT" MASTER SHEET
    var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (!allProdSheet) {
      allProdSheet = ss.insertSheet("ALL PRODUCT");
      allProdSheet.appendRow(["Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $"]);
      allProdSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      allProdSheet.setFrozenRows(1);
    }

    var rowToAppend = payload.row || [
      payload.name || payload.productName || '',
      payload.cat || payload.category || 'General Spare Parts',
      parseFloat(payload.d || '0') || 0,
      parseFloat(payload.yuan || '0') || 0,
      parseFloat(payload.usd || '0') || 0,
      parseFloat(payload.salesPrice || payload.sales || '0') || 0
    ];

    var foundInAll = false;
    var targetLower = String(rowToAppend[0] || '').trim().toLowerCase();
    var lastR = allProdSheet.getLastRow();
    if (lastR >= 2 && targetLower) {
      var colA = allProdSheet.getRange(1, 1, lastR, 1).getValues();
      for (var r = 2; r <= lastR; r++) {
        if (String(colA[r - 1][0] || '').trim().toLowerCase() === targetLower) {
          allProdSheet.getRange(r, 1, 1, 6).setValues([rowToAppend]);
          foundInAll = true;
          break;
        }
      }
    }
    if (!foundInAll && rowToAppend[0]) {
      allProdSheet.appendRow(rowToAppend);
    }

    // Also add to category sheet if different and exists
    var catSheetName = payload.sheetName || payload.cat || payload.category;
    if (catSheetName && catSheetName !== "ALL PRODUCT" && catSheetName !== "ALL PRODUCTS") {
      var catSheet = ss.getSheetByName(catSheetName);
      if (catSheet) {
        catSheet.appendRow(rowToAppend);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Row saved directly into 'ALL PRODUCT' in Google Sheets!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}
