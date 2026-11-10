import { SparePartItem, CompareItem, CompatItem, PhotoItem, RegisteredCompany, PriceChangeRecord, calculatePricing, generateSmartPartId } from '../data/initialData';

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
  webAppUrl?: string;
  lastSyncedAt: string | null;
  customParts: SparePartItem[];
  liveCompareItems: CompareItem[];
  liveCompatItems: CompatItem[];
  defaultExpense: number;
  defaultMarkupPercent: number;
  isFormattedEmpty?: boolean;
}

export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxY6NbvZoADg7L1Gm59tuSHz79E0zEnMbK5kfq3lHbTGaVxO2fgNnWtualZjc0U_y9t/exec';

export interface CompleteSuiteBackupPayload {
  parts: SparePartItem[];
  companies?: RegisteredCompany[];
  priceChanges?: PriceChangeRecord[];
  photos?: PhotoItem[];
  compat?: CompatItem[];
}

export interface CompleteSuiteRestoreResult {
  success: boolean;
  message: string;
  parts: SparePartItem[];
  companies: RegisteredCompany[];
  priceChanges: PriceChangeRecord[];
  photos: PhotoItem[];
  compat: CompatItem[];
  partsCount: number;
  companiesCount: number;
  priceChangesCount: number;
  photosCount: number;
  compatCount: number;
  timestamp: string;
}

const STORAGE_KEY_DB = 'spareparts_db_config_v3';
const STORAGE_KEY_CUSTOM_PARTS = 'spareparts_custom_items_v3';

export class GoogleSheetsService {
  public static getSavedConfig(): StoredDatabaseState {
    const fallbackUrl = DEFAULT_WEB_APP_URL;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DB);
      if (raw) {
        const parsed: StoredDatabaseState = JSON.parse(raw);
        if (!parsed.sheetUrl && !parsed.webAppUrl) {
          parsed.sheetUrl = fallbackUrl;
          parsed.webAppUrl = fallbackUrl;
        } else if (!parsed.webAppUrl && parsed.sheetUrl && parsed.sheetUrl.includes('/exec')) {
          parsed.webAppUrl = parsed.sheetUrl;
        } else if (!parsed.sheetUrl && parsed.webAppUrl) {
          parsed.sheetUrl = parsed.webAppUrl;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return {
      sheetUrl: fallbackUrl,
      webAppUrl: fallbackUrl,
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

    const idIdx = rawHeaders.findIndex(h => h === 'id' || h === 'sku' || h === 'product id' || h.includes('part id') || h === 'sku / id');
    const nameIdx = rawHeaders.findIndex(h => (h.includes('name') || h.includes('product') || h.includes('model') || h.includes('item')) && h !== 'id' && h !== 'product id' && h !== 'part id');
    const catIdx = rawHeaders.findIndex(h => h.includes('category') || h.includes('brand') || h.includes('part type') || h.includes('cat'));
    const dIdx = rawHeaders.findIndex(h => h === 'price d' || h === 'dirham' || h === 'd' || h.includes('price d') || h.includes('dirham') || (h.includes('price') && !h.includes('sale')));
    const yuanIdx = rawHeaders.findIndex(h => h.includes('yuan') || h.includes('¥') || h.includes('rmb') || h.includes('cny'));
    const usdIdx = rawHeaders.findIndex(h => h.includes('usd+') || h.includes('usd +') || h.includes('cost') || (h.includes('usd') && !h.includes('sales')));
    const salesIdx = rawHeaders.findIndex(h => h.includes('sales') || h.includes('sale') || h.includes('retail') || h.includes('selling'));
    const expIdx = rawHeaders.findIndex(h => h.includes('exp') || h.includes('shipping fee'));
    const compIdx = rawHeaders.findIndex(h => h.includes('company') || h.includes('supplier') || h.includes('vendor'));
    const shipIdx = rawHeaders.findIndex(h => h.includes('ship') || h.includes('cargo') || h.includes('air') || h.includes('sea'));
    const originIdx = rawHeaders.findIndex(h => h.includes('origin') || h.includes('from') || h.includes('dubai') || h.includes('china'));
    const urlIdx = rawHeaders.findIndex(h => h.includes('url') || h.includes('photo') || h.includes('image'));

    // Fallbacks corresponding directly to user's exact 11 columns:
    // A: ID, B: Product Name, C: Category (Brand _Part Type), D: Price D, E: Yuan ¥, F: USD+, G: Sales $, H: Company, I: Shipment, J: Origin, K: Date Added
    const hasExplicitId = idIdx >= 0 || (rawHeaders.length >= 10 && rawHeaders[0] === 'id');
    const safeNameIdx = nameIdx >= 0 ? nameIdx : (hasExplicitId ? 1 : 0);
    const safeCatIdx = catIdx >= 0 ? catIdx : (hasExplicitId ? 2 : 1);
    const safeDIdx = dIdx >= 0 ? dIdx : (hasExplicitId ? 3 : 2);
    const safeYuanIdx = yuanIdx >= 0 ? yuanIdx : (hasExplicitId ? 4 : 3);
    const safeUsdIdx = usdIdx >= 0 ? usdIdx : (hasExplicitId ? 5 : 4);
    const safeSalesIdx = salesIdx >= 0 ? salesIdx : (hasExplicitId ? 6 : 5);
    const safeCompIdx = compIdx >= 0 ? compIdx : (hasExplicitId ? 7 : 6);
    const safeShipIdx = shipIdx >= 0 ? shipIdx : (hasExplicitId ? 8 : 7);
    const safeOriginIdx = originIdx >= 0 ? originIdx : (hasExplicitId ? 9 : 8);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const name = (row[safeNameIdx] || '').trim();
      if (!name || name.toLowerCase() === 'product name') continue;

      const rawId = (idIdx >= 0 && row[idIdx]) ? String(row[idIdx]).trim() : (hasExplicitId && row[0] ? String(row[0]).trim() : '');

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

      // Parse Company / Supplier, Shipment (By Air / By Sea), and Origin (Dubai / China)
      const rawComp = safeCompIdx >= 0 && row[safeCompIdx] ? row[safeCompIdx].trim() : '';
      const rawShip = safeShipIdx >= 0 && row[safeShipIdx] ? row[safeShipIdx].trim().toLowerCase() : '';
      const rawOrigin = safeOriginIdx >= 0 && row[safeOriginIdx] ? row[safeOriginIdx].trim().toLowerCase() : '';

      const companyName = rawComp || undefined;
      const shippingMethod: 'air' | 'sea' = rawShip.includes('sea') ? 'sea' : 'air';
      const origin: 'Dubai' | 'China' = rawOrigin.includes('china') ? 'China' : (rawOrigin.includes('dubai') ? 'Dubai' : (cat.includes('LCD') ? 'China' : 'Dubai'));

      const finalId = rawId || generateSmartPartId(name, companyName, shippingMethod, origin, new Set(parts.map(p => p.id))) || `part-${r}`;

      parts.push({
        id: finalId,
        cat: cat || 'General Spare Parts',
        name,
        d,
        usd,
        yuan,
        salesPrice,
        salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
        expense: exp,
        companyName,
        shippingMethod,
        origin
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
   * Export an authentic Multi-Tab Workbook (.xls / SpreadsheetML XML) where
   * EVERY category gets its own spreadsheet tab, alongside master "ALL PRODUCT",
   * "Photos", and "Compatible LCDs" worksheets.
   * Can be opened directly in Excel or imported directly into Google Sheets (File > Import > Upload).
   */
  public static exportToMultiTabWorkbook(
    parts: SparePartItem[],
    photos: PhotoItem[] = [],
    compat: CompatItem[] = []
  ) {
    const xmlEscape = (str: any) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    // 1. Group parts by category
    const categoriesMap: { [cat: string]: SparePartItem[] } = {};
    for (const p of parts) {
      const cat = (p.cat || 'General Spare Parts').trim();
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(p);
    }

    const cleanSheetName = (name: string, usedNames: Set<string>): string => {
      // Excel tab names cannot contain: \ / ? * [ ] : and max length is 31 chars
      let clean = name.replace(/[:\\?*\[\]\/]/g, ' - ').replace(/\s+/g, ' ').trim();
      if (!clean) clean = 'Sheet';
      if (clean.length > 28) clean = clean.substring(0, 28);
      let candidate = clean;
      let counter = 1;
      while (usedNames.has(candidate.toLowerCase())) {
        candidate = `${clean.substring(0, 25)}_${counter}`;
        counter++;
      }
      usedNames.add(candidate.toLowerCase());
      return candidate;
    };

    const usedNames = new Set<string>();
    let worksheetsXml = '';

    // Sheet 1: Master "ALL PRODUCT" tab
    const allProdTabName = cleanSheetName('ALL PRODUCT', usedNames);
    worksheetsXml += `
  <Worksheet ss:Name="${xmlEscape(allProdTabName)}">
    <Table>
      <Row ss:StyleID="HeaderStyle">
        <Cell><Data ss:Type="String">Product Name</Data></Cell>
        <Cell><Data ss:Type="String">Category (Brand _Part Type)</Data></Cell>
        <Cell><Data ss:Type="String">Price D</Data></Cell>
        <Cell><Data ss:Type="String">Yuan ¥</Data></Cell>
        <Cell><Data ss:Type="String">USD+</Data></Cell>
        <Cell><Data ss:Type="String">Sales $</Data></Cell>
      </Row>
      ${parts.map(p => {
        const yuan = p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1));
        return `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(p.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(p.cat)}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.d}</Data></Cell>
        <Cell><Data ss:Type="Number">${yuan}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.usd}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.salesPrice}</Data></Cell>
      </Row>`;
      }).join('')}
    </Table>
  </Worksheet>`;

    // Sheet 2..N: Every single category as its own dedicated worksheet!
    const sortedCategories = Object.keys(categoriesMap).sort((a, b) => a.localeCompare(b));
    for (const cat of sortedCategories) {
      const catParts = categoriesMap[cat];
      const tabName = cleanSheetName(cat, usedNames);
      worksheetsXml += `
  <Worksheet ss:Name="${xmlEscape(tabName)}">
    <Table>
      <Row ss:StyleID="HeaderStyle">
        <Cell><Data ss:Type="String">Product Name</Data></Cell>
        <Cell><Data ss:Type="String">Category (Brand _Part Type)</Data></Cell>
        <Cell><Data ss:Type="String">Price D</Data></Cell>
        <Cell><Data ss:Type="String">Yuan ¥</Data></Cell>
        <Cell><Data ss:Type="String">USD+</Data></Cell>
        <Cell><Data ss:Type="String">Sales $</Data></Cell>
      </Row>
      ${catParts.map(p => {
        const yuan = p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1));
        return `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(p.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(p.cat)}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.d}</Data></Cell>
        <Cell><Data ss:Type="Number">${yuan}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.usd}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.salesPrice}</Data></Cell>
      </Row>`;
      }).join('')}
    </Table>
  </Worksheet>`;
    }

    // Photos tab
    if (photos.length > 0) {
      const photosTabName = cleanSheetName('Photos', usedNames);
      worksheetsXml += `
  <Worksheet ss:Name="${xmlEscape(photosTabName)}">
    <Table>
      <Row ss:StyleID="HeaderStyleEmerald">
        <Cell><Data ss:Type="String">Photo Name</Data></Cell>
        <Cell><Data ss:Type="String">Image URL / Link</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Brand / Category</Data></Cell>
        <Cell><Data ss:Type="String">Date Added</Data></Cell>
      </Row>
      ${photos.map(ph => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(ph.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(ph.url || ph.link || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(ph.description || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(ph.brand || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(ph.createdAt || '')}</Data></Cell>
      </Row>`).join('')}
    </Table>
  </Worksheet>`;
    }

    // Compatible LCDs tab
    if (compat.length > 0) {
      const compatTabName = cleanSheetName('Compatible LCDs', usedNames);
      worksheetsXml += `
  <Worksheet ss:Name="${xmlEscape(compatTabName)}">
    <Table>
      <Row ss:StyleID="HeaderStyleAmber">
        <Cell><Data ss:Type="String">Main Model (LCD)</Data></Cell>
        <Cell><Data ss:Type="String">Compatible Models (Fits)</Data></Cell>
        <Cell><Data ss:Type="String">Notes</Data></Cell>
      </Row>
      ${compat.map(c => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(c.lcd)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.fits)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.note || '')}</Data></Cell>
      </Row>`).join('')}
    </Table>
  </Worksheet>`;
    }

    const xmlWorkbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#38BDF8" ss:Bold="1"/>
   <Interior ss:Color="#0B1324" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyleAmber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#F59E0B" ss:Bold="1"/>
   <Interior ss:Color="#0B1324" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyleEmerald">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#34D399" ss:Bold="1"/>
   <Interior ss:Color="#0B1324" ss:Pattern="Solid"/>
  </Style>
 </Styles>
${worksheetsXml}
</Workbook>`;

    const blob = new Blob([xmlWorkbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Spare_Parts_MultiTab_Workbook_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export a single category to CSV file
   */
  public static exportCategoryToCSV(parts: SparePartItem[], categoryName: string) {
    const filtered = parts.filter(p => p.cat.toLowerCase().trim() === categoryName.toLowerCase().trim());
    const headers = ['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'];
    const rows = filtered.map(p => [
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
    const cleanFileCat = categoryName.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${cleanFileCat}_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy specific category products formatted for direct Ctrl+V pasting into that category's Google Sheet tab
   */
  public static async copyCategoryProductsToClipboard(parts: SparePartItem[], categoryName: string): Promise<boolean> {
    try {
      const filtered = parts.filter(p => p.cat.toLowerCase().trim() === categoryName.toLowerCase().trim());
      const headers = ['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'];
      const rows = filtered.map(p => [
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
      console.warn('Category clipboard write failed', e);
      return false;
    }
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
   * Download blank 11-column template CSV
   */
  public static download11ColumnTemplate() {
    const headers = ["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"];
    const sampleRows = [
      ["DX0001", "A025", "SAMSUNG / LCD", "18.9", "37.23", "5.15", "5.7", "Royal Company", "By Air", "China", new Date().toISOString().split('T')[0]],
      ["DX0002", "A03 CORE", "SAMSUNG / LCD", "19.2", "37.82", "5.23", "5.7", "Dubai VX", "By Air", "China", new Date().toISOString().split('T')[0]]
    ];
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Blank_11_Column_Google_Sheet_Template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download parts catalog as 11-column CSV
   */
  public static download11ColumnCsv(parts: SparePartItem[], filename: string = 'Catalog_11_Columns.csv') {
    const headers = ["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"];
    const rows = parts.map(p => [
      p.id,
      p.name,
      p.cat,
      p.d,
      p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
      p.usd,
      p.salesPrice,
      p.companyName || '',
      p.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
      p.origin || 'Dubai',
      (p as any).createdAt || (p as any).date || new Date().toISOString().split('T')[0]
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    const yuanVal = typeof item.yuan === 'number' && !isNaN(item.yuan) ? item.yuan : 0;

    try {
      // Single POST request with JSON payload in text/plain (avoids CORS preflight & prevents duplicate appends)
      await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_product',
          sheetName: targetSheet,
          id: item.id,
          sku: item.id,
          productId: item.id,
          name: item.name,
          productName: item.name,
          category: item.cat,
          cat: item.cat,
          d: item.d,
          yuan: yuanVal,
          usd: item.usd,
          salesPrice: item.salesPrice,
          company: item.companyName || '',
          companyName: item.companyName || '',
          shipping: item.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          shippingMethod: item.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          origin: item.origin || 'Dubai',
          date: item.purchaseDate || new Date().toISOString().split('T')[0],
          row: [
            item.id,
            item.name,
            item.cat,
            item.d,
            yuanVal,
            item.usd,
            item.salesPrice,
            item.companyName || '',
            item.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
            item.origin || 'Dubai',
            item.purchaseDate || new Date().toISOString().split('T')[0]
          ]
        }),
        mode: 'no-cors'
      });

      return { 
        success: true, 
        message: `Successfully saved "${item.name}" to Google Sheet "ALL PRODUCT"!` 
      };
    } catch (err) {
      console.warn('Primary POST append failed, trying fallback GET:', err);
      try {
        const queryParams = new URLSearchParams({
          action: 'add_product',
          sheetName: targetSheet,
          id: item.id,
          name: item.name,
          cat: item.cat,
          d: String(item.d),
          yuan: String(yuanVal),
          usd: String(item.usd),
          salesPrice: String(item.salesPrice),
          company: item.companyName || '',
          shipping: item.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          origin: item.origin || 'Dubai',
          date: item.purchaseDate || new Date().toISOString().split('T')[0]
        });
        const separator = rawUrl.includes('?') ? '&' : '?';
        await fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
          method: 'GET',
          mode: 'no-cors'
        });
      } catch (getErr) {
        console.warn('GET fallback failed:', getErr);
      }

      return { 
        success: true, 
        message: `Successfully saved "${item.name}" to Google Sheet "ALL PRODUCT"!` 
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

    const yuanVal = typeof updatedItem.yuan === 'number' && !isNaN(updatedItem.yuan) ? updatedItem.yuan : 0;

    try {
      // 1. Primary method: POST with JSON payload in text/plain (avoids CORS preflight)
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_product',
          oldName: oldProductName,
          id: updatedItem.id,
          sku: updatedItem.id,
          productId: updatedItem.id,
          productName: updatedItem.name,
          name: updatedItem.name,
          category: updatedItem.cat,
          cat: updatedItem.cat,
          sheetName: updatedItem.cat,
          d: updatedItem.d,
          yuan: yuanVal,
          usd: updatedItem.usd,
          salesPrice: updatedItem.salesPrice,
          company: updatedItem.companyName || '',
          companyName: updatedItem.companyName || '',
          shipping: updatedItem.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          shippingMethod: updatedItem.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          origin: updatedItem.origin || 'Dubai',
          date: new Date().toISOString().split('T')[0],
          row: [
            updatedItem.id,
            updatedItem.name,
            updatedItem.cat,
            updatedItem.d,
            yuanVal,
            updatedItem.usd,
            updatedItem.salesPrice,
            updatedItem.companyName || '',
            updatedItem.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
            updatedItem.origin || 'Dubai',
            new Date().toISOString().split('T')[0]
          ]
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST update notice:', e));

      // 2. Dual fallback: GET query parameter (preserves parameters across Google 302 redirects)
      const queryParams = new URLSearchParams({
        action: 'update_product',
        oldName: oldProductName,
        id: updatedItem.id,
        sku: updatedItem.id,
        name: updatedItem.name,
        productName: updatedItem.name,
        cat: updatedItem.cat,
        d: String(updatedItem.d),
        yuan: String(yuanVal),
        usd: String(updatedItem.usd),
        salesPrice: String(updatedItem.salesPrice),
        company: updatedItem.companyName || '',
        shipping: updatedItem.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
        origin: updatedItem.origin || 'Dubai',
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
   * Automatically sync a registered company to Google Sheets
   * Saves to the dedicated tab "REGISTERED COMPANIES" in the user's spreadsheet.
   */
  public static async syncCompanyToGoogleSheet(
    endpointUrl: string,
    company: RegisteredCompany,
    action: 'add' | 'update' | 'delete' = 'add'
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    const sheetName = 'REGISTERED COMPANIES';
    const actionKey = action === 'add' ? 'add_company' : action === 'update' ? 'update_company' : 'delete_company';

    try {
      // 1. Primary method: POST with JSON payload in text/plain (avoids CORS preflight)
      const postPromise = fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: actionKey,
          sheetName: sheetName,
          companyId: company.id,
          id: company.id,
          name: company.name,
          companyName: company.name,
          phone: company.phoneNo,
          whatsapp: company.whatsappNo || '',
          location: company.location,
          category: company.category || 'All LCD Screens',
          contactPerson: company.contactPerson || '',
          status: company.status || 'active',
          note: company.note || '',
          createdAt: company.createdAt || new Date().toISOString().slice(0, 10),
          row: [
            company.name,
            company.phoneNo,
            company.whatsappNo || '',
            company.location,
            company.category || 'All LCD Screens',
            company.contactPerson || '',
            company.status || 'active',
            company.note || '',
            company.createdAt || new Date().toISOString().slice(0, 10)
          ]
        }),
        mode: 'no-cors'
      }).catch(e => console.warn('POST company sync notice:', e));

      // 2. Dual fallback: GET query parameter (preserves parameters across Google 302 redirects)
      const queryParams = new URLSearchParams({
        action: actionKey,
        sheetName: sheetName,
        id: company.id,
        name: company.name,
        companyName: company.name,
        phone: company.phoneNo,
        whatsapp: company.whatsappNo || '',
        location: company.location,
        category: company.category || '',
        contactPerson: company.contactPerson || '',
        status: company.status || 'active',
        note: company.note || '',
        createdAt: company.createdAt || '',
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      const getPromise = fetch(`${rawUrl}${separator}${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => console.warn('GET company sync notice:', e));

      await Promise.allSettled([postPromise, getPromise]);

      return {
        success: true,
        message: `Successfully synced company "${company.name}" to Google Spreadsheet tab "${sheetName}"!`
      };
    } catch (err) {
      console.warn('Google Sheet company sync error:', err);
      return {
        success: false,
        message: (err as Error).message || 'Failed to sync company to Google Sheets.'
      };
    }
  }

  /**
   * Sync all registered companies to Google Sheets in bulk
   */
  public static async syncAllCompaniesToGoogleSheet(
    endpointUrl: string,
    companies: RegisteredCompany[]
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    try {
      const rows = companies.map(c => [
        c.name,
        c.phoneNo,
        c.whatsappNo || '',
        c.location,
        c.category || 'All LCD Screens',
        c.contactPerson || '',
        c.status || 'active',
        c.note || '',
        c.createdAt || new Date().toISOString().slice(0, 10)
      ]);

      await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_all_companies',
          sheetName: 'REGISTERED COMPANIES',
          companies: companies,
          rows: rows
        }),
        mode: 'no-cors'
      });

      return {
        success: true,
        message: `Successfully synced ${companies.length} companies to Google Spreadsheet tab "REGISTERED COMPANIES"!`
      };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'Failed to sync companies to Google Sheets.'
      };
    }
  }

  /**
   * Explicitly auto-creates or refreshes the "REGISTERED COMPANIES" spreadsheet tab in the user's Google Sheet
   */
  public static async createOrSyncRegisteredCompaniesTab(
    endpointUrl: string,
    companies: RegisteredCompany[]
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'Fadlan geli link-ga Google Sheets ama Web App-ka si loo abuuro tab-ka REGISTERED COMPANIES.' };
    }

    try {
      const rows = companies.map(c => [
        c.name,
        c.phoneNo,
        c.whatsappNo || '',
        c.location,
        c.category || 'All LCD Screens',
        c.contactPerson || '',
        c.status || 'active',
        c.note || '',
        c.createdAt || new Date().toISOString().slice(0, 10)
      ]);

      // 1. POST with action 'create_registered_companies_tab' & 'sync_all_companies'
      await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'create_registered_companies_tab',
          sheetName: 'REGISTERED COMPANIES',
          companies: companies,
          rows: rows
        }),
        mode: 'no-cors'
      });

      // 2. Dual GET fallback
      const queryParams = new URLSearchParams({
        action: 'create_registered_companies_tab',
        sheetName: 'REGISTERED COMPANIES',
        _t: String(Date.now())
      });
      const separator = rawUrl.includes('?') ? '&' : '?';
      fetch(`${rawUrl}${separator}${queryParams.toString()}`, { method: 'GET', mode: 'no-cors' })
        .catch(() => {});

      return {
        success: true,
        message: `Guul! Waxaa toos loo abuuray loona cusboonaysiiyay tab-ka 'REGISTERED COMPANIES' ee Google Sheet-kaaga NAJI HASSAN!`
      };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'Failed to create tab in Google Sheets.'
      };
    }
  }

  /**
   * Download ready-to-import CSV file for REGISTERED COMPANIES tab
   * Allows 1-click manual import directly into Google Sheets (File > Import > Insert new sheet)
   */
  public static downloadRegisteredCompaniesCsv(companies: RegisteredCompany[]) {
    const headers = ["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"];
    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = headers.map(escapeCsv).join(',') + '\n';
    companies.forEach(c => {
      const row = [
        c.name,
        c.phoneNo,
        c.whatsappNo || '',
        c.location,
        c.category || 'All LCD Screens',
        c.contactPerson || '',
        c.status || 'active',
        c.note || '',
        c.createdAt || new Date().toISOString().slice(0, 10)
      ];
      csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    // If no companies registered yet, provide a sample row so the user gets a complete sheet structure
    if (companies.length === 0) {
      csvContent += [
        "Example Supplier",
        "+971 50 123 4567",
        "+971 50 123 4567",
        "Deira Dubai / Guangzhou",
        "All LCD Screens",
        "Manager",
        "active",
        "LCD & Battery Supplier",
        new Date().toISOString().slice(0, 10)
      ].map(escapeCsv).join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REGISTERED_COMPANIES_NAJI_HASSAN.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export an authentic Multi-Tab Workbook (.xls / SpreadsheetML XML) for Registered Companies.
   * Tab 1: "REGISTERED COMPANIES" (Master company registry with phone, whatsapp, location, category, note)
   * Tab 2..N: Dedicated tabs for each company listing the exact parts/LCDs they supply!
   */
  public static exportCompaniesSpreadsheet(companies: RegisteredCompany[], parts: SparePartItem[]) {
    const xmlEscape = (str: any) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const usedNames = new Set<string>();
    const cleanSheetName = (name: string): string => {
      let clean = name.replace(/[\\/?*[\]:]/g, '_').trim();
      if (!clean) clean = 'Sheet';
      if (clean.length > 31) clean = clean.slice(0, 31).trim();
      let unique = clean;
      let counter = 1;
      while (usedNames.has(unique.toLowerCase())) {
        const suffix = `_${counter}`;
        unique = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
        counter++;
      }
      usedNames.add(unique.toLowerCase());
      return unique;
    };

    // Calculate parts supplied by each company
    const partsByCompany: Record<string, SparePartItem[]> = {};
    companies.forEach(c => {
      const cNorm = c.name.trim().toLowerCase();
      partsByCompany[c.id] = parts.filter(p => p.companyName && p.companyName.trim().toLowerCase() === cNorm);
    });

    let worksheetsXml = `
  <Worksheet ss:Name="${xmlEscape(cleanSheetName('REGISTERED COMPANIES'))}">
    <Table>
      <Row ss:StyleID="HeaderStyle">
        <Cell><Data ss:Type="String">Company Name</Data></Cell>
        <Cell><Data ss:Type="String">Phone No</Data></Cell>
        <Cell><Data ss:Type="String">WhatsApp</Data></Cell>
        <Cell><Data ss:Type="String">Location</Data></Cell>
        <Cell><Data ss:Type="String">Category / Specialty</Data></Cell>
        <Cell><Data ss:Type="String">Contact Person</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Notes</Data></Cell>
        <Cell><Data ss:Type="String">Supplied Parts Count</Data></Cell>
        <Cell><Data ss:Type="String">Date Registered</Data></Cell>
      </Row>
      ${companies.map(c => {
        const suppliedCount = (partsByCompany[c.id] || []).length;
        return `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(c.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.phoneNo)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.whatsappNo || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.location)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.category || 'All LCD Screens')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.contactPerson || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape((c.status || 'active').toUpperCase())}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.note || '')}</Data></Cell>
        <Cell><Data ss:Type="Number">${suppliedCount}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(c.createdAt || '')}</Data></Cell>
      </Row>`;
      }).join('')}
    </Table>
  </Worksheet>`;

    // Add individual company tabs for vendors that have assigned spare parts
    companies.forEach(c => {
      const supplied = partsByCompany[c.id] || [];
      if (supplied.length > 0) {
        const tabName = cleanSheetName(`${c.name.slice(0, 20)} Parts`);
        worksheetsXml += `
  <Worksheet ss:Name="${xmlEscape(tabName)}">
    <Table>
      <Row ss:StyleID="HeaderStyle">
        <Cell><Data ss:Type="String">Product Name</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Price D (AED)</Data></Cell>
        <Cell><Data ss:Type="String">Yuan ¥</Data></Cell>
        <Cell><Data ss:Type="String">USD+</Data></Cell>
        <Cell><Data ss:Type="String">Sales $</Data></Cell>
      </Row>
      ${supplied.map(p => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(p.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(p.cat)}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.d}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.yuan || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.usd}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.salesPrice}</Data></Cell>
      </Row>`).join('')}
    </Table>
  </Worksheet>`;
      }
    });

    const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="HeaderStyle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0284c7"/>
      </Borders>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#0f172a" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${worksheetsXml}
</Workbook>`;

    const blob = new Blob([fullXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Registered_Companies_Spreadsheet_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    mode: 'all_in_one' | 'multi_tab' = 'all_in_one',
    companies: RegisteredCompany[] = []
  ): Promise<{ success: boolean; message: string }> {
    if (!endpointUrl.trim()) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    try {
      // Group items by category for clean multi-tab writing (Strict 11 Columns)
      const byCategory: { [cat: string]: any[] } = {};
      for (const p of items) {
        const catName = (p.cat || 'General Spare Parts').trim();
        if (!byCategory[catName]) byCategory[catName] = [];
        const pDate = p.purchaseDate || (p as any).createdAt || new Date().toISOString().split('T')[0];
        byCategory[catName].push([
          p.id || '',
          p.name,
          p.cat,
          p.d,
          p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
          p.usd,
          p.salesPrice,
          p.companyName || '',
          p.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
          p.origin || (p.cat && p.cat.includes('LCD') ? 'China' : 'Dubai'),
          pDate
        ]);
      }

      const payloadRows = items.map(p => {
        const pDate = p.purchaseDate || (p as any).createdAt || new Date().toISOString().split('T')[0];
        return {
          sheetName: mode === 'all_in_one' ? 'ALL PRODUCT' : (p.cat || 'General Spare Parts'),
          category: p.cat || 'General Spare Parts',
          row: [
            p.id || '',
            p.name,
            p.cat,
            p.d,
            p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
            p.usd,
            p.salesPrice,
            p.companyName || '',
            p.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
            p.origin || (p.cat && p.cat.includes('LCD') ? 'China' : 'Dubai'),
            pDate
          ]
        };
      });

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

      const payloadCompanies = companies.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phoneNo,
        phoneNo: c.phoneNo,
        whatsapp: c.whatsappNo || '',
        whatsappNo: c.whatsappNo || '',
        location: c.location,
        category: c.category || 'All LCD Screens',
        contactPerson: c.contactPerson || '',
        status: c.status || 'active',
        note: c.note || '',
        createdAt: c.createdAt || ''
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
          categories: Object.keys(byCategory),
          byCategory: byCategory,
          items: payloadRows,
          parts: payloadRows,
          photos: payloadPhotos,
          compat: payloadCompat,
          companies: payloadCompanies
        }),
        mode: 'no-cors'
      });

      const modeTitle = mode === 'all_in_one'
        ? "1 single master sheet ('ALL PRODUCT')"
        : "individual category sheets";

      return {
        success: true,
        message: `Successfully sent backup request for ${items.length} products to ${modeTitle}, with ${photos.length} photos, ${compat.length} compatible LCD sets, and ${companies.length} registered companies!`
      };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'Failed to backup database to Google Sheets.'
      };
    }
  }

  /**
   * Complete Suite Backup: Backs up all 5 collections (Spare Parts, Register Companies, Price Tracker, Photos, Compat LCDs)
   * to Google Sheets in one single call.
   */
  public static async backupCompleteSuite(
    endpointUrl: string,
    payload: CompleteSuiteBackupPayload
  ): Promise<{ success: boolean; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'No Google Sheets API / Web App URL configured.' };
    }

    try {
      const parts = payload.parts || [];
      const companies = payload.companies || [];
      const priceChanges = payload.priceChanges || [];
      const photos = payload.photos || [];
      const compat = payload.compat || [];

      // 1. Catalog Parts Rows (11 columns with ID in Col A)
      const partRows = parts.map(p => [
        p.id,
        p.name,
        p.cat,
        p.d,
        p.yuan ?? Number(((p.d / 3.67) * 7.23).toFixed(1)),
        p.usd,
        p.salesPrice,
        p.companyName || '',
        p.shippingMethod === 'sea' ? 'By Sea' : 'By Air',
        p.origin || (p.cat && p.cat.includes('LCD') ? 'China' : 'Dubai'),
        p.purchaseDate || new Date().toISOString().split('T')[0]
      ]);

      // 2. Register Companies Rows (9 columns)
      const companyRows = companies.map(c => [
        c.name,
        c.phoneNo || '',
        c.whatsappNo || '',
        c.location || '',
        c.category || 'All LCD Screens',
        c.contactPerson || '',
        c.status || 'active',
        c.note || '',
        c.createdAt || new Date().toISOString().split('T')[0]
      ]);

      // 3. Price Tracker Rows (9 columns)
      const trackerRows = priceChanges.map(pc => [
        pc.date || new Date().toISOString().split('T')[0],
        pc.name,
        pc.cat,
        pc.type === 'increase' ? 'Price Increase' : (pc.type === 'decrease' ? 'Price Decrease' : 'New Product'),
        pc.oldD,
        pc.newD,
        pc.deltaD,
        pc.percentage,
        pc.note || ''
      ]);

      // 4. Photos Rows (5 columns)
      const photoRows = photos.map(ph => [
        ph.name,
        ph.url || ph.link || '',
        ph.description || '',
        ph.brand || (ph as any).category || '',
        ph.createdAt || new Date().toISOString().split('T')[0]
      ]);

      // 5. Compatible LCDs Rows (3 columns)
      const compatRows = compat.map(c => [
        c.lcd,
        c.fits,
        c.note || ''
      ]);

      await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'backup_complete',
          partRows,
          companyRows,
          trackerRows,
          photoRows,
          compatRows,
          counts: {
            parts: parts.length,
            companies: companies.length,
            priceChanges: priceChanges.length,
            photos: photos.length,
            compat: compat.length
          }
        }),
        mode: 'no-cors'
      });

      return {
        success: true,
        message: `Successfully backed up Complete Suite to Google Sheets! (${parts.length} parts, ${companies.length} companies, ${priceChanges.length} price changes, ${photos.length} photos, ${compat.length} compatible LCD sets).`
      };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'Failed to backup Complete Suite to Google Sheets.'
      };
    }
  }

  /**
   * Complete Suite Restore: Reads ALL 5 tabs from Google Sheets and reconstructs
   * the local database state.
   */
  public static async restoreCompleteSuite(
    endpointUrl: string
  ): Promise<CompleteSuiteRestoreResult> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      throw new Error('No Google Sheets API / Web App URL configured.');
    }

    const separator = rawUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${rawUrl}${separator}action=read_complete_suite&_t=${Date.now()}`;

    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Failed to restore from Google Sheets (HTTP ${res.status}).`);
    }

    const data = await res.json();
    if (!data || !data.success) {
      throw new Error(data?.message || 'Google Sheets script did not return success.');
    }

    const rawParts: any[] = data.parts || [];
    const rawCompanies: any[] = data.companies || [];
    const rawPriceChanges: any[] = data.priceChanges || [];
    const rawPhotos: any[] = data.photos || [];
    const rawCompat: any[] = data.compat || [];

    // Parse parts into typed SparePartItem[]
    const parts: SparePartItem[] = rawParts.map((p, idx) => {
      const rawId = String(p.id || p.sku || '').trim();
      const name = String(p.name || '').trim();
      const cat = String(p.cat || p.category || 'General Spare Parts').trim();
      const d = Number(p.d ?? p.priceD ?? 0);
      const usd = Number(p.usd ?? Number((d / 3.67).toFixed(2)));
      const yuan = Number(p.yuan ?? Number(((d / 3.67) * 7.23).toFixed(1)));
      const salesPrice = Number(p.salesPrice ?? usd);
      const companyName = p.companyName || p.company || undefined;
      const shippingMethod = p.shippingMethod === 'sea' || p.shipping === 'By Sea' ? 'sea' : 'air';
      const origin = p.origin || (cat.includes('LCD') ? 'China' : 'Dubai');
      const fallbackId = generateSmartPartId(name, companyName, shippingMethod, origin);

      return {
        id: rawId || `${fallbackId}-${idx + 1}`,
        name,
        cat,
        d,
        usd,
        yuan,
        salesPrice,
        salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
        expense: 0,
        companyName,
        shippingMethod,
        origin
      };
    });

    // Parse companies into typed RegisteredCompany[]
    const companies: RegisteredCompany[] = rawCompanies.map((c, idx) => ({
      id: c.id || `comp-${idx}-${Date.now()}`,
      name: String(c.name || c.companyName || '').trim(),
      phoneNo: String(c.phoneNo || c.phone || '').trim(),
      whatsappNo: String(c.whatsappNo || c.whatsapp || '').trim(),
      location: String(c.location || '').trim(),
      category: String(c.category || 'All LCD Screens').trim(),
      contactPerson: String(c.contactPerson || '').trim(),
      status: (c.status === 'preferred' || c.status === 'verified' ? c.status : 'active') as 'active' | 'preferred' | 'verified',
      note: String(c.note || '').trim(),
      createdAt: String(c.createdAt || c.date || new Date().toISOString().split('T')[0]).trim()
    }));

    // Parse price changes into typed PriceChangeRecord[]
    const priceChanges: PriceChangeRecord[] = rawPriceChanges.map((pc, idx) => ({
      id: pc.id || `pc-restored-${idx}-${Date.now()}`,
      name: String(pc.name || '').trim(),
      cat: String(pc.cat || '').trim(),
      oldD: Number(pc.oldD ?? 0),
      newD: Number(pc.newD ?? 0),
      oldUsd: Number(pc.oldUsd ?? 0),
      newUsd: Number(pc.newUsd ?? 0),
      type: (pc.type === 'increase' || pc.type === 'decrease' ? pc.type : 'new') as 'new' | 'increase' | 'decrease',
      deltaD: Number(pc.deltaD ?? 0),
      percentage: Number(pc.percentage ?? 0),
      date: String(pc.date || new Date().toISOString().split('T')[0]),
      note: String(pc.note || '')
    }));

    // Parse photos
    const photos: PhotoItem[] = rawPhotos.map((ph, idx) => ({
      id: `photo-restored-${idx}-${Date.now()}`,
      name: String(ph.name || '').trim(),
      url: String(ph.url || ph.link || '').trim(),
      link: String(ph.url || ph.link || '').trim(),
      description: String(ph.description || '').trim(),
      brand: String(ph.brand || ph.category || '').trim(),
      createdAt: String(ph.createdAt || new Date().toISOString().split('T')[0]).trim()
    }));

    // Parse compat
    const compat: CompatItem[] = rawCompat.map((c, idx) => ({
      id: `compat-restored-${idx}-${Date.now()}`,
      lcd: String(c.lcd || '').trim(),
      fits: String(c.fits || '').trim(),
      note: String(c.note || '').trim()
    }));

    return {
      success: true,
      message: `Successfully restored ${parts.length} spare parts, ${companies.length} companies, ${priceChanges.length} price change records, ${photos.length} photos, and ${compat.length} compatible LCD sets from Google Sheets!`,
      parts,
      companies,
      priceChanges,
      photos,
      compat,
      partsCount: parts.length,
      companiesCount: companies.length,
      priceChangesCount: priceChanges.length,
      photosCount: photos.length,
      compatCount: compat.length,
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Check if URL is a Google Apps Script Web App endpoint (/exec)
   */
  public static isWebAppUrl(url: string): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.includes('/exec') ||
      trimmed.includes('script.google.com') ||
      trimmed.includes('script.googleusercontent.com')
    );
  }

  /**
   * Test direct connection to Google Apps Script Web App
   */
  public static async testConnection(endpointUrl: string): Promise<{ success: boolean; sheetName?: string; message: string }> {
    const rawUrl = endpointUrl.trim();
    if (!rawUrl) {
      return { success: false, message: 'Fadlan geli link-ga Google Apps Script Web App (/exec).' };
    }
    if (!this.isWebAppUrl(rawUrl)) {
      return {
        success: false,
        message: 'Link-gan ma ahan Google Apps Script Web App. Wuxuu u baahan yahay inuu ku dhamaado /exec (waxaad heshay link-ga spreadsheet-ka caadiga ah).'
      };
    }
    try {
      const sep = rawUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${rawUrl}${sep}action=ping&_t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success) {
        return {
          success: true,
          sheetName: data.spreadsheetName || 'Google Sheet',
          message: `Xiriirku waa sax! Wuxuu ku xiran yahay Google Sheet: "${data.spreadsheetName || 'NAJI HASSAN'}"`
        };
      }
      return { success: false, message: data?.message || 'Xiriirinta laguma guuleysan.' };
    } catch (err) {
      return {
        success: false,
        message: 'Khalad ayaa dhacay: ' + (err as Error).message + '. Hubi in "Who has access" uu yahay "Anyone".'
      };
    }
  }

  /**
   * Check if URL is a standard Google Sheet link
   */
  public static isSpreadsheetUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('/spreadsheets/d/');
  }

  /**
   * Extract spreadsheet ID from Google Sheet URL
   */
  public static extractSpreadsheetId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match && match[1] ? match[1] : null;
  }

  /**
   * Copy-ready Google Apps Script for the user's Google Sheet
   * Supports:
   * 1. 1-Sheet All-In-One Mode: Reads/Writes all products to a single sheet named "ALL PRODUCT" (11 Columns with ID in Col A)
   * 2. Preserves same-name products with different IDs or suppliers (never overwrites!)
   * 3. Full 5-Suite Tabs: ALL PRODUCT, REGISTERED COMPANIES, Price Tracker, Photos, Compatible LCDs
   * 4. Automatic ping/healthcheck support
   */
  public static getAppsScriptCode(customSpreadsheetId?: string): string {
    let boundId = '';
    if (customSpreadsheetId) {
      const extracted = GoogleSheetsService.extractSpreadsheetId(customSpreadsheetId);
      if (extracted) {
        boundId = extracted;
      } else if (!customSpreadsheetId.includes(' ') && !customSpreadsheetId.includes('/') && customSpreadsheetId.length > 15) {
        boundId = customSpreadsheetId.trim();
      }
    }
    if (!boundId) {
      boundId = '1zNmNffLiaPrgWVzwLgn52pEV2HsagMVtGeQEthIpmow';
    }
    return `// ========================================================
// SPARE PARTS MASTERY - LIVE ALL-IN-ONE & 5-SHEET COMPLETE SUITE ENGINE
// 1. ALL PRODUCT Tab (11 Columns: ID in Col A, Product Name, Category, Price D, Yuan ¥, USD+, Sales $, Company, Shipment, Origin, Date Added)
// 2. REGISTERED COMPANIES Tab (9 Columns: Suppliers Directory)
// 3. Price Tracker Tab (9 Columns: Price Movements & Deltas)
// 4. Photos Tab (5 Columns: Image Hub)
// 5. Compatible LCDs Tab (3 Columns: LCD Interchangeability)
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

// Automatically linked to your Google Sheet:
var TARGET_SPREADSHEET_ID = "${boundId}";

function _getSpreadsheet() {
  // 1. Active container sheet is 100% reliable when bound via Extensions > Apps Script
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (err) {}

  // 2. Open by explicit ID if provided and valid
  if (TARGET_SPREADSHEET_ID && TARGET_SPREADSHEET_ID.length > 15 && TARGET_SPREADSHEET_ID.indexOf('http') === -1) {
    try {
      return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    } catch (e) {}
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Helper: Normalize product names for comparison
function _normName(str) {
  if (!str) return '';
  return String(str).toLowerCase()
    .replace(/^lcd\\s+/i, '')
    .replace(/^battery\\s+/i, '')
    .replace(/^flex charger\\s+/i, '')
    .replace(/\\biphone\\b/g, 'ip')
    .replace(/\\bsamsung\\b/g, 'sam')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function _matchProd(a, b) {
  if (!a || !b) return false;
  var rawA = String(a).toLowerCase().trim();
  var rawB = String(b).toLowerCase().trim();
  if (rawA === rawB) return true;
  var nA = _normName(rawA);
  var nB = _normName(rawB);
  return (nA.length > 0 && nA === nB);
}

function _updateSheetRow(sh, oldTarget, newTarget, rowData) {
  var lastR = sh.getLastRow();
  var lastC = Math.max(sh.getLastColumn(), 11);
  if (lastR < 2) return false;
  var values = sh.getRange(1, 1, lastR, lastC).getValues();
  var headers = values[0].map(function(h) { return String(h || '').trim().toLowerCase(); });

  var idIdx = -1, nameIdx = -1, catIdx = -1, dIdx = -1, yuanIdx = -1, usdIdx = -1, salesIdx = -1;
  var compIdx = -1, shipIdx = -1, originIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var head = headers[h];
    if (idIdx === -1 && (head === 'id' || head.indexOf('sku') !== -1 || head === 'product id')) idIdx = h;
    if (nameIdx === -1 && (head.indexOf('name') !== -1 || head.indexOf('product') !== -1 || head.indexOf('model') !== -1) && head !== 'id' && head !== 'product id') nameIdx = h;
    if (catIdx === -1 && (head.indexOf('category') !== -1 || head.indexOf('brand') !== -1)) catIdx = h;
    if (dIdx === -1 && (head === 'price d' || head === 'd' || head.indexOf('dirham') !== -1 || (head.indexOf('price') !== -1 && head.indexOf('sale') === -1))) dIdx = h;
    if (yuanIdx === -1 && (head.indexOf('yuan') !== -1 || head.indexOf('¥') !== -1 || head.indexOf('rmb') !== -1)) yuanIdx = h;
    if (usdIdx === -1 && (head.indexOf('usd') !== -1 && head.indexOf('sale') === -1)) usdIdx = h;
    if (salesIdx === -1 && (head.indexOf('sales') !== -1 || head.indexOf('sale') !== -1 || head.indexOf('retail') !== -1)) salesIdx = h;
    if (compIdx === -1 && (head.indexOf('company') !== -1 || head.indexOf('supplier') !== -1 || head.indexOf('vendor') !== -1)) compIdx = h;
    if (shipIdx === -1 && (head.indexOf('ship') !== -1 || head.indexOf('cargo') !== -1)) shipIdx = h;
    if (originIdx === -1 && (head.indexOf('origin') !== -1 || head.indexOf('country') !== -1 || head.indexOf('from') !== -1)) originIdx = h;
  }

  if (idIdx === 0 && nameIdx === -1) nameIdx = 1;
  else if (nameIdx === -1) nameIdx = 0;
  if (catIdx === -1) catIdx = idIdx !== -1 ? 2 : 1;
  if (dIdx === -1) dIdx = idIdx !== -1 ? 3 : 2;
  if (yuanIdx === -1) yuanIdx = idIdx !== -1 ? 4 : 3;
  if (usdIdx === -1) usdIdx = idIdx !== -1 ? 5 : 4;
  if (salesIdx === -1) salesIdx = idIdx !== -1 ? 6 : 5;

  for (var r = 2; r <= lastR; r++) {
    var cellId = idIdx !== -1 ? String(values[r - 1][idIdx] || '').trim() : '';
    var cellName = String(values[r - 1][nameIdx] || '').trim();

    // 1. If matched by ID, exact row update
    var matchById = (rowData.id && cellId && String(rowData.id).trim().toLowerCase() === cellId.toLowerCase());
    var matchByName = (_matchProd(cellName, oldTarget) || _matchProd(cellName, newTarget));

    if (matchById || matchByName) {
      // RULE: If matched by name, but ID or company differs, DO NOT OVERWRITE!
      if (!matchById && rowData.id && cellId && cellId.toLowerCase() !== String(rowData.id).trim().toLowerCase()) {
        continue;
      }
      if (compIdx !== -1 && rowData.company) {
        var cellComp = String(values[r - 1][compIdx] || '').trim();
        if (cellComp && rowData.company && cellComp.toLowerCase() !== String(rowData.company).trim().toLowerCase()) {
          continue;
        }
      }
      if (idIdx !== -1 && rowData.id) sh.getRange(r, idIdx + 1).setValue(rowData.id);
      if (rowData.name) sh.getRange(r, nameIdx + 1).setValue(rowData.name);
      if (rowData.cat) sh.getRange(r, catIdx + 1).setValue(rowData.cat);
      if (rowData.d !== undefined) sh.getRange(r, dIdx + 1).setValue(rowData.d);
      if (rowData.yuan !== undefined) sh.getRange(r, yuanIdx + 1).setValue(rowData.yuan);
      if (rowData.usd !== undefined) sh.getRange(r, usdIdx + 1).setValue(rowData.usd);
      if (rowData.salesPrice !== undefined) sh.getRange(r, salesIdx + 1).setValue(rowData.salesPrice);
      if (compIdx !== -1 && rowData.company) sh.getRange(r, compIdx + 1).setValue(rowData.company);
      if (shipIdx !== -1 && rowData.shippingMethod) sh.getRange(r, shipIdx + 1).setValue(rowData.shippingMethod);
      if (originIdx !== -1 && rowData.origin) sh.getRange(r, originIdx + 1).setValue(rowData.origin);
      return true;
    }
  }
  return false;
}

function doGet(e) {
  var ss = _getSpreadsheet();
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params ? params.action : null;

  // 0. HEALTHCHECK / PING
  if (action === 'ping' || action === 'test_connection') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      status: 'connected',
      spreadsheetName: ss ? ss.getName() : 'Google Sheet',
      spreadsheetId: ss ? ss.getId() : '',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // DIRECT ACTION DISPATCH FOR GET
  if (action === 'add_product' || action === 'create_sheet_and_add_row') {
    var newRow = [
      params.id || params.sku || ('p-' + Date.now()),
      params.name || params.productName || '',
      params.cat || params.category || 'General Spare Parts',
      parseFloat(params.d || '0') || 0,
      parseFloat(params.yuan || '0') || 0,
      parseFloat(params.usd || '0') || 0,
      parseFloat(params.salesPrice || params.sales || '0') || 0,
      params.company || params.companyName || '',
      params.shipping || params.shippingMethod || 'By Air',
      params.origin || 'Dubai',
      params.date || new Date().toISOString().split('T')[0]
    ];
    var targetSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (!targetSheet) {
      targetSheet = ss.insertSheet("ALL PRODUCT");
      targetSheet.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
      targetSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      targetSheet.setFrozenRows(1);
    }
    if (newRow[1]) {
      targetSheet.appendRow(newRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, added: true, action: 'add_product' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'format_all') {
    var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (allProdSheet) {
      var lastR = allProdSheet.getLastRow();
      if (lastR >= 2) {
        allProdSheet.getRange(2, 1, lastR - 1, Math.max(allProdSheet.getLastColumn(), 11)).clearContent();
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'format_all', message: 'All products formatted in Google Sheets' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'update_product') {
    var oldTarget = String(params.oldName || params.productName || params.name || '').trim();
    var newTarget = String(params.name || params.productName || params.oldName || '').trim();
    var rowData = {
      id: params.id || params.sku || '',
      name: newTarget,
      cat: params.cat || params.category || 'General Spare Parts',
      d: parseFloat(params.d || '0') || 0,
      yuan: parseFloat(params.yuan || '0') || 0,
      usd: parseFloat(params.usd || '0') || 0,
      salesPrice: parseFloat(params.salesPrice || params.sales || '0') || 0,
      company: params.company || params.companyName || '',
      shippingMethod: params.shipping || params.shippingMethod || '',
      origin: params.origin || ''
    };
    var updated = false;

    // 1. Primary target: "ALL PRODUCT" tab (11 Columns)
    var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
    if (!allProdSheet) {
      allProdSheet = ss.insertSheet("ALL PRODUCT");
      allProdSheet.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
      allProdSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
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
      allProdSheet.appendRow([
        rowData.id || ('p-' + Date.now()),
        rowData.name,
        rowData.cat,
        rowData.d,
        rowData.yuan,
        rowData.usd,
        rowData.salesPrice,
        rowData.company || '',
        rowData.shippingMethod || 'By Air',
        rowData.origin || 'Dubai',
        new Date().toISOString().split('T')[0]
      ]);
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

  // REGISTERED COMPANIES ACTIONS (add_company, update_company, delete_company, sync_all_companies)
  if (action === 'add_company' || action === 'update_company') {
    var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
    if (!compSheet) {
      compSheet = ss.insertSheet("REGISTERED COMPANIES");
      compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
      compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      compSheet.setFrozenRows(1);
    }
    var oldCompName = String(params.oldName || params.oldCompanyName || params.name || '').trim();
    var compName = String(params.name || params.companyName || '').trim();
    var compPhone = String(params.phone || '').trim();
    var compWa = String(params.whatsapp || '').trim();
    var compLoc = String(params.location || '').trim();
    var compCat = String(params.category || 'All LCD Screens').trim();
    var compContact = String(params.contactPerson || '').trim();
    var compStatus = String(params.status || 'active').trim();
    var compNote = String(params.note || '').trim();
    var compDate = String(params.createdAt || new Date().toISOString().split('T')[0]).trim();
    var compRow = [compName, compPhone, compWa, compLoc, compCat, compContact, compStatus, compNote, compDate];

    var compFound = false;
    var compLastR = compSheet.getLastRow();
    if (compLastR >= 2) {
      var compColA = compSheet.getRange(1, 1, compLastR, 1).getValues();
      for (var cr = 2; cr <= compLastR; cr++) {
        var existingName = String(compColA[cr - 1][0] || '').trim();
        if (_matchProd(existingName, oldCompName) || _matchProd(existingName, compName)) {
          compSheet.getRange(cr, 1, 1, 9).setValues([compRow]);
          compFound = true;
          break;
        }
      }
    }
    if (!compFound && compName) {
      compSheet.appendRow(compRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action, company: compName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete_company') {
    var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
    if (compSheet && compSheet.getLastRow() >= 2) {
      var delCompName = String(params.name || params.companyName || '').trim();
      var compLastR = compSheet.getLastRow();
      var compColA = compSheet.getRange(1, 1, compLastR, 1).getValues();
      for (var cr = compLastR; cr >= 2; cr--) {
        if (_matchProd(String(compColA[cr - 1][0] || '').trim(), delCompName)) {
          compSheet.deleteRow(cr);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'delete_company' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'create_registered_companies_tab' || action === 'create_company_sheet') {
    var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
    if (!compSheet) {
      compSheet = ss.insertSheet("REGISTERED COMPANIES");
    }
    if (compSheet.getLastRow() < 1) {
      compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
      compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      compSheet.setFrozenRows(1);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'create_registered_companies_tab', created: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'sync_all_companies') {
    var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
    if (!compSheet) {
      compSheet = ss.insertSheet("REGISTERED COMPANIES");
    } else {
      compSheet.clear();
    }
    compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
    compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
    compSheet.setFrozenRows(1);
    var inRows = params.rows || [];
    if (inRows.length > 0) {
      compSheet.getRange(2, 1, inRows.length, 9).setValues(inRows);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'sync_all_companies', count: inRows.length }))
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

    var idIdx = -1, nameIdx = -1, catIdx = -1, dIdx = -1, yuanIdx = -1, usdIdx = -1, salesIdx = -1;
    var compIdx = -1, shipIdx = -1, originIdx = -1;
    for (var h = 0; h < headers.length; h++) {
      var head = headers[h];
      if (idIdx === -1 && (head === 'id' || head.indexOf('sku') !== -1 || head === 'product id' || head === 'part id')) idIdx = h;
      if (nameIdx === -1 && (head.indexOf('name') !== -1 || head.indexOf('product') !== -1 || head.indexOf('model') !== -1) && head !== 'id' && head !== 'product id') nameIdx = h;
      if (catIdx === -1 && (head.indexOf('category') !== -1 || head.indexOf('brand') !== -1 || head.indexOf('part') !== -1)) catIdx = h;
      if (dIdx === -1 && (head === 'price d' || head === 'd' || head.indexOf('dirham') !== -1 || (head.indexOf('price') !== -1 && head.indexOf('sale') === -1))) dIdx = h;
      if (yuanIdx === -1 && (head.indexOf('yuan') !== -1 || head.indexOf('¥') !== -1 || head.indexOf('rmb') !== -1)) yuanIdx = h;
      if (usdIdx === -1 && (head.indexOf('usd') !== -1 && head.indexOf('sale') === -1)) usdIdx = h;
      if (salesIdx === -1 && (head.indexOf('sales') !== -1 || head.indexOf('sale') !== -1 || head.indexOf('retail') !== -1)) salesIdx = h;
      if (compIdx === -1 && (head.indexOf('company') !== -1 || head.indexOf('supplier') !== -1 || head.indexOf('vendor') !== -1)) compIdx = h;
      if (shipIdx === -1 && (head.indexOf('ship') !== -1 || head.indexOf('cargo') !== -1)) shipIdx = h;
      if (originIdx === -1 && (head.indexOf('origin') !== -1 || head.indexOf('country') !== -1 || head.indexOf('from') !== -1)) originIdx = h;
    }

    if (idIdx === 0 && nameIdx === -1 && headers.length > 1) nameIdx = 1;
    else if (nameIdx === -1) nameIdx = 0;
    if (catIdx === -1) catIdx = idIdx !== -1 ? 2 : 1;
    if (dIdx === -1) dIdx = idIdx !== -1 ? 3 : 2;
    if (yuanIdx === -1) yuanIdx = idIdx !== -1 ? 4 : 3;
    if (usdIdx === -1) usdIdx = idIdx !== -1 ? 5 : 4;
    if (salesIdx === -1) salesIdx = idIdx !== -1 ? 6 : 5;

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

      var companyName = compIdx !== -1 && compIdx < row.length ? String(row[compIdx] || '').trim() : (row.length > 6 ? String(row[6] || '').trim() : '');
      var rawShip = shipIdx !== -1 && shipIdx < row.length ? String(row[shipIdx] || '').trim().toLowerCase() : (row.length > 7 ? String(row[7] || '').trim().toLowerCase() : '');
      var rawOrigin = originIdx !== -1 && originIdx < row.length ? String(row[originIdx] || '').trim() : (row.length > 8 ? String(row[8] || '').trim() : '');
      var shippingMethod = rawShip.indexOf('sea') !== -1 ? 'sea' : 'air';
      var origin = rawOrigin ? (rawOrigin.toLowerCase().indexOf('china') !== -1 ? 'China' : (rawOrigin.toLowerCase().indexOf('dubai') !== -1 ? 'Dubai' : rawOrigin)) : (cat.indexOf('LCD') !== -1 ? 'China' : 'Dubai');
      var rawId = idIdx !== -1 && idIdx < row.length ? String(row[idIdx] || '').trim() : '';

      allParts.push({
        id: rawId || ('part-' + r),
        name: name,
        cat: cat,
        d: d,
        yuan: yuan,
        usd: usd,
        salesPrice: salesPrice,
        expense: 0,
        companyName: companyName,
        shippingMethod: shippingMethod,
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

  // 4. Scan REGISTERED COMPANIES tab
  var allCompanies = [];
  var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Register Companies") || ss.getSheetByName("Shirkadaha");
  if (compSheet && compSheet.getLastRow() >= 2) {
    var compValues = compSheet.getRange(1, 1, compSheet.getLastRow(), Math.max(compSheet.getLastColumn(), 9)).getValues();
    for (var cr = 1; cr < compValues.length; cr++) {
      var compR = compValues[cr];
      var cName = String(compR[0] || '').trim();
      if (!cName || cName.toLowerCase() === 'company name') continue;
      allCompanies.push({
        id: 'comp-' + cr,
        name: cName,
        phoneNo: String(compR[1] || '').trim(),
        whatsappNo: String(compR[2] || '').trim(),
        location: String(compR[3] || '').trim(),
        category: String(compR[4] || 'All LCD Screens').trim(),
        contactPerson: String(compR[5] || '').trim(),
        status: String(compR[6] || 'active').trim().toLowerCase() === 'blocked' ? 'blocked' : 'active',
        note: String(compR[7] || '').trim(),
        createdAt: String(compR[8] || '').trim()
      });
    }
  }

  // 5. Scan Price Tracker tab
  var allPriceChanges = [];
  var ptSheet = ss.getSheetByName("Price Tracker") || ss.getSheetByName("PRICE TRACKER") || ss.getSheetByName("Tracker");
  if (ptSheet && ptSheet.getLastRow() >= 2) {
    var ptValues = ptSheet.getRange(1, 1, ptSheet.getLastRow(), Math.max(ptSheet.getLastColumn(), 9)).getValues();
    for (var ptr = 1; ptr < ptValues.length; ptr++) {
      var ptR = ptValues[ptr];
      var ptName = String(ptR[1] || '').trim();
      if (!ptName || ptName.toLowerCase() === 'product name') continue;
      var rawType = String(ptR[3] || '').toLowerCase();
      var movementType = rawType.indexOf('increase') !== -1 ? 'increase' : (rawType.indexOf('decrease') !== -1 ? 'decrease' : 'new');
      allPriceChanges.push({
        id: 'pc-' + ptr,
        date: String(ptR[0] || '').trim(),
        name: ptName,
        cat: String(ptR[2] || '').trim(),
        type: movementType,
        oldD: parseFloat(String(ptR[4] || '0').replace(/[^0-9.]/g, '')) || 0,
        newD: parseFloat(String(ptR[5] || '0').replace(/[^0-9.]/g, '')) || 0,
        deltaD: parseFloat(String(ptR[6] || '0').replace(/[^0-9.-]/g, '')) || 0,
        percentage: parseFloat(String(ptR[7] || '0').replace(/[^0-9.-]/g, '')) || 0,
        note: String(ptR[8] || '').trim()
      });
    }
  }

  var output = {
    success: true,
    parts: allParts,
    companies: allCompanies,
    priceChanges: allPriceChanges,
    photos: allPhotos,
    compat: allCompat,
    sheetsFound: sheetsFound,
    partsCount: allParts.length,
    companiesCount: allCompanies.length,
    priceChangesCount: allPriceChanges.length,
    photosCount: allPhotos.length,
    compatCount: allCompat.length,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = _getSpreadsheet();
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

    // 0. ADD NEW PRODUCT DIRECTLY TO GOOGLE SHEETS (ALWAYS appendRow 11 Columns, never overwrite)
    if (action === 'add_product' || action === 'create_sheet_and_add_row') {
      var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
      if (!allProdSheet) {
        allProdSheet = ss.insertSheet("ALL PRODUCT");
        allProdSheet.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
        allProdSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
        allProdSheet.setFrozenRows(1);
      }
      var newRow = payload.row || [
        payload.id || payload.sku || ('p-' + Date.now()),
        payload.name || payload.productName || '',
        payload.cat || payload.category || 'General Spare Parts',
        parseFloat(payload.d || '0') || 0,
        parseFloat(payload.yuan || '0') || 0,
        parseFloat(payload.usd || '0') || 0,
        parseFloat(payload.salesPrice || payload.sales || '0') || 0,
        payload.company || payload.companyName || '',
        payload.shipping || payload.shippingMethod || 'By Air',
        payload.origin || 'Dubai',
        payload.date || new Date().toISOString().split('T')[0]
      ];
      // ALWAYS append new row - never overwrite existing rows!
      if (newRow[1]) {
        allProdSheet.appendRow(newRow);
      }
      // Also append to category tab if different and exists
      var catSheetName = payload.sheetName || payload.cat || payload.category;
      if (catSheetName && catSheetName !== "ALL PRODUCT" && catSheetName !== "ALL PRODUCTS") {
        var catSheet = ss.getSheetByName(catSheetName);
        if (catSheet && newRow[1]) {
          catSheet.appendRow(newRow);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        added: true,
        action: 'add_product',
        productName: newRow[1]
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // FORMAT ALL PRODUCTS FROM GOOGLE SHEETS
    if (action === 'format_all') {
      var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
      if (allProdSheet) {
        var lastR = allProdSheet.getLastRow();
        if (lastR >= 2) {
          allProdSheet.getRange(2, 1, lastR - 1, Math.max(allProdSheet.getLastColumn(), 11)).clearContent();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: 'format_all',
        message: 'All products formatted in Google Sheets'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. UPDATE PRODUCT DIRECTLY IN GOOGLE SHEETS (Searches ALL PRODUCT first, then all tabs)
    if (action === 'update_product') {
      var oldTarget = String(payload.oldName || payload.productName || payload.name || '').trim();
      var newTarget = String(payload.productName || payload.name || payload.oldName || '').trim();
      var rowData = {
        id: payload.id || payload.sku || '',
        name: newTarget,
        cat: payload.cat || payload.category || 'General Spare Parts',
        d: parseFloat(payload.d || '0') || 0,
        yuan: parseFloat(payload.yuan || '0') || 0,
        usd: parseFloat(payload.usd || '0') || 0,
        salesPrice: parseFloat(payload.salesPrice || payload.sales || '0') || 0,
        company: payload.company || payload.companyName || '',
        shippingMethod: payload.shipping || payload.shippingMethod || '',
        origin: payload.origin || ''
      };
      var updated = false;

      // 1. Primary target: "ALL PRODUCT" tab (11 Columns)
      var allProdSheet = ss.getSheetByName("ALL PRODUCT") || ss.getSheetByName("ALL PRODUCTS");
      if (!allProdSheet) {
        allProdSheet = ss.insertSheet("ALL PRODUCT");
        allProdSheet.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
        allProdSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
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
        allProdSheet.appendRow([
          rowData.id || ('p-' + Date.now()),
          rowData.name,
          rowData.cat,
          rowData.d,
          rowData.yuan,
          rowData.usd,
          rowData.salesPrice,
          rowData.company || '',
          rowData.shippingMethod || 'By Air',
          rowData.origin || 'Dubai',
          new Date().toISOString().split('T')[0]
        ]);
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

    // 3A. COMPLETE SUITE BACKUP: Backs up ALL 5 collections into dedicated tabs
    if (action === 'backup_complete') {
      var partRows = payload.partRows || [];
      var companyRows = payload.companyRows || [];
      var trackerRows = payload.trackerRows || [];
      var photoRows = payload.photoRows || [];
      var compatRows = payload.compatRows || [];

      // 1. ALL PRODUCT Tab (11 Columns with ID in Col A)
      var sh = ss.getSheetByName("ALL PRODUCT");
      if (!sh) {
        sh = ss.insertSheet("ALL PRODUCT");
      } else {
        sh.clearContents();
      }
      sh.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
      sh.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      sh.setFrozenRows(1);
      if (partRows.length > 0) {
        sh.getRange(2, 1, partRows.length, partRows[0].length).setValues(partRows);
      }

      // 2. REGISTERED COMPANIES Tab (9 Columns)
      var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Register Companies");
      if (!compSheet) {
        compSheet = ss.insertSheet("REGISTERED COMPANIES");
      } else {
        compSheet.clearContents();
      }
      compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
      compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      compSheet.setFrozenRows(1);
      if (companyRows.length > 0) {
        compSheet.getRange(2, 1, companyRows.length, companyRows[0].length).setValues(companyRows);
      }

      // 3. Price Tracker Tab (9 Columns)
      var ptSheet = ss.getSheetByName("Price Tracker") || ss.getSheetByName("PRICE TRACKER");
      if (!ptSheet) {
        ptSheet = ss.insertSheet("Price Tracker");
      } else {
        ptSheet.clearContents();
      }
      ptSheet.appendRow(["Date", "Product Name", "Category", "Movement Type", "Old Price D", "New Price D", "Price Delta (D)", "Change %", "Notes / Supplier"]);
      ptSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      ptSheet.setFrozenRows(1);
      if (trackerRows.length > 0) {
        ptSheet.getRange(2, 1, trackerRows.length, trackerRows[0].length).setValues(trackerRows);
      }

      // 4. Photos Tab (5 Columns)
      var photoSheet = ss.getSheetByName("Photos");
      if (!photoSheet) {
        photoSheet = ss.insertSheet("Photos");
      } else {
        photoSheet.clearContents();
      }
      photoSheet.appendRow(["Photo Name", "Image URL / Link", "Description", "Brand / Category", "Date Added"]);
      photoSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0b1324").setFontColor("#34d399");
      photoSheet.setFrozenRows(1);
      if (photoRows.length > 0) {
        photoSheet.getRange(2, 1, photoRows.length, photoRows[0].length).setValues(photoRows);
      }

      // 5. Compatible LCDs Tab (3 Columns)
      var compatSheet = ss.getSheetByName("Compatible LCDs");
      if (!compatSheet) {
        compatSheet = ss.insertSheet("Compatible LCDs");
      } else {
        compatSheet.clearContents();
      }
      compatSheet.appendRow(["Main Model (LCD)", "Compatible Models (Fits)", "Notes"]);
      compatSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0b1324").setFontColor("#f59e0b");
      compatSheet.setFrozenRows(1);
      if (compatRows.length > 0) {
        compatSheet.getRange(2, 1, compatRows.length, compatRows[0].length).setValues(compatRows);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: 'backup_complete',
        counts: {
          parts: partRows.length,
          companies: companyRows.length,
          priceChanges: trackerRows.length,
          photos: photoRows.length,
          compat: compatRows.length
        },
        message: "Successfully backed up Complete Suite (" + partRows.length + " products, " + companyRows.length + " companies, " + trackerRows.length + " price movements) to Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3B. 1-SHEET ALL-IN-ONE BACKUP: Consolidates ALL categories into 1 sheet named "ALL PRODUCT"
    if (action === 'backup_all_in_one') {
      var partsList = payload.parts || payload.items || [];
      var sh = ss.getSheetByName("ALL PRODUCT");
      if (!sh) {
        sh = ss.insertSheet("ALL PRODUCT");
      } else {
        sh.clearContents();
      }

      // Add bold header (Strict 11 Columns matching Row 3 format)
      sh.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
      sh.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      sh.setFrozenRows(1);

      var rowsToAdd = [];
      for (var i = 0; i < partsList.length; i++) {
        if (partsList[i].row) {
          rowsToAdd.push(partsList[i].row);
        }
      }

      if (rowsToAdd.length > 0) {
        var numCols = rowsToAdd[0].length;
        sh.getRange(2, 1, rowsToAdd.length, numCols).setValues(rowsToAdd);
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

      // REGISTERED COMPANIES Tab Backup in All-In-One Mode
      var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
      if (!compSheet) {
        compSheet = ss.insertSheet("REGISTERED COMPANIES");
      } else {
        compSheet.clearContents();
      }
      compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
      compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      compSheet.setFrozenRows(1);
      if (payload.companies && payload.companies.length > 0) {
        var compRows = payload.companies.map(function(c) {
          return [
            c.name || '',
            c.phoneNo || c.phone || '',
            c.whatsappNo || c.whatsapp || '',
            c.location || '',
            c.category || 'All LCD Screens',
            c.contactPerson || '',
            c.status || 'active',
            c.note || '',
            c.createdAt || ''
          ];
        });
        if (compRows.length > 0) {
          compSheet.getRange(2, 1, compRows.length, 9).setValues(compRows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: rowsToAdd.length,
        message: "Successfully backed up " + rowsToAdd.length + " products into 1 sheet named 'ALL PRODUCT' and created 'REGISTERED COMPANIES' tab!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. MULTI-TAB BATCH BACKUP: Splits into individual category sheets (Every Category is its own Spreadsheet tab)
    if (action === 'batch_backup_all') {
      var partsList = payload.parts || payload.items || [];
      var bySheet = payload.byCategory || {};

      // If byCategory wasn't provided directly, group items by category name
      if (Object.keys(bySheet).length === 0) {
        for (var i = 0; i < partsList.length; i++) {
          var item = partsList[i];
          var sName = item.category || (item.row ? item.row[1] : null) || item.sheetName || "General Spare Parts";
          sName = String(sName).trim();
          if (!bySheet[sName]) bySheet[sName] = [];
          if (item.row) {
            bySheet[sName].push(item.row);
          }
        }
      }

      // Also create or refresh master "ALL PRODUCT" tab
      var masterSheet = ss.getSheetByName("ALL PRODUCT");
      if (!masterSheet) {
        masterSheet = ss.insertSheet("ALL PRODUCT");
      } else {
        masterSheet.clearContents();
      }
      masterSheet.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
      masterSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      masterSheet.setFrozenRows(1);
      var allMasterRows = [];
      for (var i = 0; i < partsList.length; i++) {
        if (partsList[i].row) allMasterRows.push(partsList[i].row);
      }
      if (allMasterRows.length > 0) {
        var numMasterCols = allMasterRows[0].length;
        masterSheet.getRange(2, 1, allMasterRows.length, numMasterCols).setValues(allMasterRows);
      }

      // Process EVERY category tab: clear contents and overwrite cleanly (prevents row duplication)
      var allExistingSheets = ss.getSheets();
      for (var catName in bySheet) {
        var cleanTabName = String(catName).replace(/[\/\\?*\[\]:]/g, " - ").replace(/\s+/g, " ").trim();
        if (cleanTabName.startsWith("'")) cleanTabName = cleanTabName.substring(1);
        if (cleanTabName.endsWith("'")) cleanTabName = cleanTabName.substring(0, cleanTabName.length - 1);
        if (!cleanTabName) cleanTabName = "General Spare Parts";
        if (cleanTabName.length > 85) cleanTabName = cleanTabName.substring(0, 85);

        var sh = ss.getSheetByName(cleanTabName);
        if (!sh) {
          for (var sIdx = 0; sIdx < allExistingSheets.length; sIdx++) {
            var esName = allExistingSheets[sIdx].getName().trim().toLowerCase();
            if (esName === cleanTabName.toLowerCase() || esName === String(catName).trim().toLowerCase()) {
              sh = allExistingSheets[sIdx];
              break;
            }
          }
        }
        if (!sh) {
          sh = ss.insertSheet(cleanTabName);
        } else {
          sh.clearContents();
        }
        sh.appendRow(["ID", "Product Name", "Category (Brand _Part Type)", "Price D", "Yuan ¥", "USD+", "Sales $", "Company / Supplier", "Shipment", "Origin", "Date Added"]);
        sh.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
        sh.setFrozenRows(1);

        var rowsToAdd = bySheet[catName];
        if (rowsToAdd && rowsToAdd.length > 0) {
          var numCatCols = rowsToAdd[0].length;
          sh.getRange(2, 1, rowsToAdd.length, numCatCols).setValues(rowsToAdd);
        }
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

      // 4. REGISTERED COMPANIES Tab Backup (Guarantees REGISTERED COMPANIES tab is created in NAJI HASSAN Sheet)
      var compSheet = ss.getSheetByName("REGISTERED COMPANIES") || ss.getSheetByName("Companies") || ss.getSheetByName("Shirkadaha");
      if (!compSheet) {
        compSheet = ss.insertSheet("REGISTERED COMPANIES");
      } else {
        compSheet.clearContents();
      }
      compSheet.appendRow(["Company Name", "Phone No", "WhatsApp", "Location", "Category / Specialty", "Contact Person", "Status", "Notes", "Date Registered"]);
      compSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0b1324").setFontColor("#38bdf8");
      compSheet.setFrozenRows(1);
      if (payload.companies && payload.companies.length > 0) {
        var compRows = payload.companies.map(function(c) {
          return [
            c.name || '',
            c.phoneNo || c.phone || '',
            c.whatsappNo || c.whatsapp || '',
            c.location || '',
            c.category || 'All LCD Screens',
            c.contactPerson || '',
            c.status || 'active',
            c.note || '',
            c.createdAt || ''
          ];
        });
        if (compRows.length > 0) {
          compSheet.getRange(2, 1, compRows.length, 9).setValues(compRows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        categoriesCount: Object.keys(bySheet).length,
        productsCount: partsList.length,
        message: "Successfully backed up " + partsList.length + " products into " + Object.keys(bySheet).length + " category spreadsheet tabs + Photos & Compatibility!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Action " + (action || 'none') + " processed successfully."
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
