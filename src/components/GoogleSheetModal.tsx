import React, { useState } from 'react';
import { 
  Database, 
  X, 
  RefreshCw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  Table,
  ExternalLink,
  Sparkles,
  Lock,
  Unlock,
  ShieldAlert,
  Code2,
  BookOpen,
  Building2,
  Plane,
  Ship,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { GoogleSheetsService, CompleteSuiteRestoreResult, DEFAULT_WEB_APP_URL } from '../services/googleSheetsService';
import { SparePartItem, CompatItem, CompareItem, RegisteredCompany, PriceChangeRecord } from '../data/initialData';
import { getNajiHassanCatalog } from '../data/najiHassanCatalog';
import { sound } from '../services/soundService';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: SparePartItem[];
  compatList: CompatItem[];
  compareList: CompareItem[];
  photosList?: any[];
  companies?: RegisteredCompany[];
  priceChanges?: PriceChangeRecord[];
  onDataSynced: (
    newParts: SparePartItem[], 
    newCompare?: CompareItem[],
    newPhotos?: any[],
    newCompat?: any[]
  ) => void;
  onRestoreCompleteSuite?: (data: CompleteSuiteRestoreResult) => void;
  onResetToDefault: () => void;
  onFormatDatabase: () => void;
  lastSyncedAt: string | null;
}

// 5 rows per category for the official All-In-One Google Sheet template (0 expenses)
const ALL_IN_ONE_TEMPLATE_ROWS = [
  // IPhone / LCD (5 rows)
  { name: 'LCD IPHONE X8 +', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'IPhone / LCD', exp: 0 },
  { name: 'LCD IPHONE X7 +', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'IPhone / LCD', exp: 0 },
  { name: 'LCD IPHONE DD X13 PRO', priceD: 117.0, usdPlus: 31.88, yuan: 230.5, sales: 31.88, cat: 'IPhone / LCD', exp: 0 },
  { name: 'LCD IPHONE DD X14 PRO MAX', priceD: 121.0, usdPlus: 32.97, yuan: 238.4, sales: 32.97, cat: 'IPhone / LCD', exp: 0 },
  { name: 'LCD IPHONE DD X15 PRO MAX', priceD: 121.0, usdPlus: 32.97, yuan: 238.4, sales: 32.97, cat: 'IPhone / LCD', exp: 0 },

  // SAMSUNG / LCD (5 rows)
  { name: 'LCD SAM A12 (INCELL)', priceD: 19.8, usdPlus: 5.4, yuan: 39.0, sales: 5.4, cat: 'SAMSUNG / LCD', exp: 0 },
  { name: 'LCD SAM A15 (INCELL)', priceD: 24.5, usdPlus: 6.68, yuan: 48.3, sales: 6.68, cat: 'SAMSUNG / LCD', exp: 0 },
  { name: 'LCD SAM A54 (OLED)', priceD: 68.0, usdPlus: 18.53, yuan: 134.0, sales: 18.53, cat: 'SAMSUNG / LCD', exp: 0 },
  { name: 'LCD SAM A10 (ORIGINAL)', priceD: 22.0, usdPlus: 5.99, yuan: 43.3, sales: 5.99, cat: 'SAMSUNG / LCD', exp: 0 },
  { name: 'LCD SAM A24 (INCELL)', priceD: 28.5, usdPlus: 7.77, yuan: 56.1, sales: 7.77, cat: 'SAMSUNG / LCD', exp: 0 },

  // REDMI / LCD (5 rows)
  { name: 'LCD Redmi Note 13 4G', priceD: 19.4, usdPlus: 5.29, yuan: 38.2, sales: 5.29, cat: 'REDMI / LCD', exp: 0 },
  { name: 'LCD Redmi Note 12 4G', priceD: 18.5, usdPlus: 5.04, yuan: 36.4, sales: 5.04, cat: 'REDMI / LCD', exp: 0 },
  { name: 'LCD Redmi Note 11', priceD: 21.0, usdPlus: 5.72, yuan: 41.4, sales: 5.72, cat: 'REDMI / LCD', exp: 0 },
  { name: 'LCD Redmi Note 10', priceD: 19.0, usdPlus: 5.18, yuan: 37.4, sales: 5.18, cat: 'REDMI / LCD', exp: 0 },
  { name: 'LCD Redmi Note 9 Pro', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'REDMI / LCD', exp: 0 },

  // INFINIX /  LCD (5 rows)
  { name: 'LCD Infinix Hot 12i', priceD: 16.5, usdPlus: 4.5, yuan: 32.5, sales: 4.5, cat: 'INFINIX /  LCD', exp: 0 },
  { name: 'LCD Tecno Spark 20', priceD: 18.0, usdPlus: 4.9, yuan: 35.5, sales: 4.9, cat: 'TECNO /  LCD', exp: 0 },
  { name: 'LCD Infinix Hot 30', priceD: 19.0, usdPlus: 5.18, yuan: 37.4, sales: 5.18, cat: 'INFINIX /  LCD', exp: 0 },
  { name: 'LCD Tecno Spark 10', priceD: 17.0, usdPlus: 4.63, yuan: 33.5, sales: 4.63, cat: 'TECNO /  LCD', exp: 0 },
  { name: 'LCD Tecno Camon 20', priceD: 23.5, usdPlus: 6.4, yuan: 46.3, sales: 6.4, cat: 'TECNO /  LCD', exp: 0 },

  // IPhone / BATTERY (5 rows)
  { name: 'BATTERY IPHONE X14 PRO MAX', priceD: 16.5, usdPlus: 4.5, yuan: 32.5, sales: 4.5, cat: 'IPhone / BATTERY', exp: 0 },
  { name: 'BATTERY IPHONE X13 PRO MAX', priceD: 14.8, usdPlus: 4.03, yuan: 29.2, sales: 4.03, cat: 'IPhone / BATTERY', exp: 0 },
  { name: 'BATTERY IPHONE X12 PRO', priceD: 12.5, usdPlus: 3.41, yuan: 24.6, sales: 3.41, cat: 'IPhone / BATTERY', exp: 0 },
  { name: 'BATTERY IPHONE X11 PRO', priceD: 11.0, usdPlus: 3.0, yuan: 21.7, sales: 3.0, cat: 'IPhone / BATTERY', exp: 0 },
  { name: 'BATTERY IPHONE X8 PLUS', priceD: 8.5, usdPlus: 2.32, yuan: 16.7, sales: 2.32, cat: 'IPhone / BATTERY', exp: 0 },

  // SAMSUNG / FLEX CHARGER (5 rows)
  { name: 'FLEX CHARGER SAM A15', priceD: 0.6, usdPlus: 0.16, yuan: 1.18, sales: 0.16, cat: 'SAMSUNG / FLEX CHARGER', exp: 0 },
  { name: 'FLEX CHARGER SAM A12', priceD: 0.5, usdPlus: 0.14, yuan: 0.98, sales: 0.14, cat: 'SAMSUNG / FLEX CHARGER', exp: 0 },
  { name: 'FLEX CHARGER SAM A54', priceD: 0.8, usdPlus: 0.22, yuan: 1.58, sales: 0.22, cat: 'SAMSUNG / FLEX CHARGER', exp: 0 },
  { name: 'FLEX CHARGER SAM A24', priceD: 0.6, usdPlus: 0.16, yuan: 1.18, sales: 0.16, cat: 'SAMSUNG / FLEX CHARGER', exp: 0 },
  { name: 'FLEX CHARGER SAM A32', priceD: 0.55, usdPlus: 0.15, yuan: 1.08, sales: 0.15, cat: 'SAMSUNG / FLEX CHARGER', exp: 0 }
];

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  parts,
  compatList,
  compareList,
  photosList = [],
  companies = [],
  priceChanges = [],
  onDataSynced,
  onRestoreCompleteSuite,
  onResetToDefault,
  onFormatDatabase,
  lastSyncedAt
}) => {
  const [sheetUrl, setSheetUrl] = useState(() => {
    return GoogleSheetsService.getSavedConfig().sheetUrl || DEFAULT_WEB_APP_URL;
  });
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return (GoogleSheetsService.getSavedConfig() as any).webAppUrl || DEFAULT_WEB_APP_URL;
  });
  const [activeTab, setActiveTab] = useState<'readme' | 'template' | 'sync' | 'manage'>('readme');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoringSuite, setIsRestoringSuite] = useState(false);
  const [isBackingUpSuite, setIsBackingUpSuite] = useState(false);
  const [restorePreview, setRestorePreview] = useState<CompleteSuiteRestoreResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ verified: boolean; sheetName?: string; error?: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('__all__');
  const [pasteText, setPasteText] = useState('');
  const [formatConfirmText, setFormatConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showAppsScript, setShowAppsScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCat, setCopiedCat] = useState<string | null>(null);

  // Group of unique categories present in the catalog
  const categories = Array.from(new Set(parts.map(p => (p.cat || 'General Spare Parts').trim()))).sort();

  if (!isOpen) return null;

  // 1-Click Load the complete 584 items & 38 category pages from NAJI HASSAN dataset
  const handleLoadNajiCatalog = () => {
    sound.playVictory();
    const catalog = getNajiHassanCatalog();
    onDataSynced(catalog);
    GoogleSheetsService.saveCustomParts(catalog);
    const catCount = Array.from(new Set(catalog.map(p => p.cat))).length;
    setStatusMessage({
      type: 'success',
      text: `Success! Loaded all 584 products and ${catCount} category pages (SAMSUNG / LCD, IPhone / LCD, TECNO / LCD, etc.) for NAJI HASSAN!`
    });
  };

  const handleBackupCompleteSuite = async () => {
    const currentUrl = (sheetUrl || webAppUrl).trim();
    if (!currentUrl) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Google Apps Script Web App URL first (link ending with /exec).'
      });
      return;
    }

    let targetEndpoint = '';
    if (GoogleSheetsService.isWebAppUrl(currentUrl)) {
      targetEndpoint = currentUrl;
    } else {
      sound.playWrong();
      setShowAppsScript(true);
      setStatusMessage({
        type: 'error',
        text: 'Direct backup requires a Google Apps Script Web App URL (ending with /exec). See the Script tab below.'
      });
      return;
    }

    setIsBackingUpSuite(true);
    setStatusMessage({
      type: 'success',
      text: `Saving Complete Suite to Google Sheet: ${parts.length} Spare Parts, ${companies.length} Companies, ${priceChanges.length} Price Movements, ${photosList.length} Photos, ${compatList.length} LCD Sets...`
    });

    try {
      const res = await GoogleSheetsService.backupCompleteSuite(targetEndpoint, {
        parts,
        companies,
        priceChanges,
        photos: photosList,
        compat: compatList
      });

      if (res.success) {
        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `Success! Complete Suite (Parts, Companies, Price Tracker, Photos, & Compatible LCDs) has been saved to your Google Sheet!`
        });
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Error backing up Complete Suite: ' + (err as Error).message
      });
    } finally {
      setIsBackingUpSuite(false);
    }
  };

  const handleFetchRestorePreview = async () => {
    const currentUrl = (sheetUrl || webAppUrl).trim();
    if (!currentUrl) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Google Apps Script Web App URL first (link ending with /exec).'
      });
      return;
    }

    let targetEndpoint = '';
    if (GoogleSheetsService.isWebAppUrl(currentUrl)) {
      targetEndpoint = currentUrl;
    } else {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Direct restore requires a Google Apps Script Web App URL (ending with /exec).'
      });
      return;
    }

    setIsRestoringSuite(true);
    setStatusMessage({
      type: 'success',
      text: 'Reading all 5 sheets from your Google Sheet...'
    });

    try {
      const result = await GoogleSheetsService.restoreCompleteSuite(targetEndpoint);
      sound.playVictory();
      setRestorePreview(result);
      setStatusMessage({
        type: 'success',
        text: `Found in Google Sheet: ${result.partsCount} Spare Parts, ${result.companiesCount} Companies, ${result.priceChangesCount} Price Tracker records, ${result.photosCount} Photos, and ${result.compatCount} Compatible LCD sets. Click "Confirm Restore" to load into the app!`
      });
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Error reading data from Google Sheet: ' + (err as Error).message
      });
    } finally {
      setIsRestoringSuite(false);
    }
  };

  const handleConfirmRestoreSuite = () => {
    if (!restorePreview) return;
    sound.playVictory();
    if (onRestoreCompleteSuite) {
      onRestoreCompleteSuite(restorePreview);
    } else {
      onDataSynced(restorePreview.parts, undefined, restorePreview.photos, restorePreview.compat);
    }
    setStatusMessage({
      type: 'success',
      text: `Success! All Complete Suite data from Google Sheet has been restored into your app!`
    });
    setRestorePreview(null);
  };

  const handleBackupToSheet = async (mode: 'all_in_one' | 'multi_tab' = 'all_in_one') => {
    if (parts.length === 0) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Your catalog currently has 0 products. Please add products or click "Load 584 Products" before creating a backup.'
      });
      return;
    }

    const currentUrl = sheetUrl.trim();
    const currentWebAppUrl = webAppUrl.trim();
    if (!currentUrl && !currentWebAppUrl) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Please enter a Google Sheets link or Google Apps Script Web App URL above to create a backup.'
      });
      return;
    }

    // Determine target Web App endpoint to send HTTP POST
    let targetEndpoint = '';
    if (GoogleSheetsService.isWebAppUrl(currentUrl)) {
      targetEndpoint = currentUrl;
    } else if (GoogleSheetsService.isWebAppUrl(currentWebAppUrl)) {
      targetEndpoint = currentWebAppUrl;
    }

    if (targetEndpoint) {
      setIsBackingUp(true);
      setStatusMessage({
        type: 'success',
        text: mode === 'multi_tab' 
          ? `Uploading directly to your Google Sheet: ${parts.length} products organized into ${categories.length} category spreadsheet tabs (SAMSUNG - LCD, IPhone - LCD, TECNO - LCD, etc.)...`
          : `Uploading directly to your Google Sheet: ${parts.length} products to 'ALL PRODUCT'...`
      });

      try {
        await GoogleSheetsService.backupAllToGoogleSheet(targetEndpoint, parts, photosList, compatList, mode, companies);
        sound.playVictory();
        const modeDesc = mode === 'multi_tab' 
          ? `All ${parts.length} products have been written directly into ${categories.length} category spreadsheet tabs (pages) in your NAJI HASSAN Google Sheet!` 
          : `All ${parts.length} products have been backed up directly to 'ALL PRODUCT' in your NAJI HASSAN Google Sheet!`;
        setStatusMessage({
          type: 'success',
          text: `Success! ${modeDesc}`
        });
      } catch (err) {
        sound.playWrong();
        setStatusMessage({
          type: 'error',
          text: `Error sending data to Google Sheets: ${(err as Error).message || 'Please check your internet connection or Web App URL.'}`
        });
      } finally {
        setIsBackingUp(false);
      }
      return;
    }

    // If standard Google Sheet URL was provided without Web App endpoint deployed yet:
    // DO NOT DOWNLOAD ANY FILE! Explain clearly how to connect the Web App so tabs are created directly in Google Sheets.
    const sheetId = GoogleSheetsService.extractSpreadsheetId(currentUrl);
    sound.playTick();
    setShowAppsScript(true);
    setStatusMessage({
      type: 'success',
      text: `NAJI HASSAN Google Sheet link detected (Sheet ID: ${sheetId || 'your link'}). To create all ${categories.length} category tabs directly in your Google Sheet: copy the script below (pre-configured with your Sheet ID), paste it into Extensions > Apps Script > Deploy > Web App (Anyone), then paste the Web App URL above!`
    });
  };

  const handleDownloadOfflineWorkbook = () => {
    sound.playTick();
    GoogleSheetsService.exportToMultiTabWorkbook(parts, photosList, compatList);
    setStatusMessage({
      type: 'success',
      text: `Downloaded offline workbook (.xls) containing all ${categories.length} category tabs to your computer.`
    });
  };

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Google Sheet link or Apps Script URL.'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const { result, parts: syncedParts, photos: syncedPhotos, compat: syncedCompat, compareItems: syncedCompare } = await GoogleSheetsService.syncFromSheet(sheetUrl);
      sound.playVictory();
      setStatusMessage({
        type: 'success',
        text: result.message
      });
      onDataSynced(
        syncedParts, 
        syncedCompare.length ? syncedCompare : undefined,
        syncedPhotos.length ? syncedPhotos : undefined,
        syncedCompat.length ? syncedCompat : undefined
      );
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: (err as Error).message || 'Failed to synchronize data from Google Sheets.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const target = (webAppUrl || sheetUrl).trim();
    if (!target) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Please enter a Google Apps Script Web App URL (/exec) first to test the connection!'
      });
      return;
    }
    setIsTestingConnection(true);
    setConnectionResult(null);
    sound.playTick();
    try {
      const res = await GoogleSheetsService.testConnection(target);
      if (res.success) {
        sound.playVictory();
        setConnectionResult({ verified: true, sheetName: res.sheetName });
        setStatusMessage({
          type: 'success',
          text: `🟢 Connection successful! Connected to Google Sheet "${res.sheetName || 'NAJI HASSAN'}" (Spreadsheet is active & responding)!`
        });
      } else {
        sound.playWrong();
        setConnectionResult({ verified: false, error: res.message });
        setStatusMessage({
          type: 'error',
          text: `❌ Google Sheet connection failed: ${res.message || 'Deployment error'}. Check that your Apps Script deployment has "Execute as: Me" and "Who has access: Anyone".`
        });
      }
    } catch (err: any) {
      sound.playWrong();
      setConnectionResult({ verified: false, error: err?.message || 'Connection failed' });
      setStatusMessage({
        type: 'error',
        text: `❌ Google Sheet connection failed: ${err?.message || 'Connection error'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExportCSV = () => {
    sound.playTick();
    GoogleSheetsService.exportToCSV(parts);
  };

  const handleExportJSON = () => {
    sound.playTick();
    GoogleSheetsService.exportToJSON(parts, compatList, compareList);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    try {
      sound.playTick();
      const lines = pasteText.split(/\r?\n/).filter(l => l.trim().length > 0);
      const parsedRows = lines.map(line => {
        if (line.includes('\t')) {
          return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
        }
        return GoogleSheetsService.parseCSV(line)[0] || [line];
      });

      const firstRow = parsedRows[0];
      const hasHeader = firstRow && firstRow.some(cell => 
        cell.toLowerCase().includes('name') || 
        cell.toLowerCase().includes('product') || 
        cell.toLowerCase().includes('price') ||
        cell.toLowerCase().includes('category')
      );

      const rowsToParse = hasHeader 
        ? parsedRows 
        : [['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'], ...parsedRows];

      const { parts: imported, compareItems: newCompare } = GoogleSheetsService.parseRowsToParts(rowsToParse);
      if (imported.length > 0) {
        onDataSynced(imported, newCompare);
        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `Successfully synced ${imported.length} products pasted from Google Sheets!`
        });
        setPasteText('');
      } else {
        throw new Error("Could not find valid product rows in pasted content.");
      }
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Failed to parse pasted data: ' + (err as Error).message
      });
    }
  };

  const handleCopyAllInOneTemplate = () => {
    sound.playTick();
    const headers = ['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'].join('\t');
    const rows = ALL_IN_ONE_TEMPLATE_ROWS.map((r, i) => {
      const rowNum = i + 2;
      return [
        r.name,
        r.cat,
        r.priceD,
        `=ROUND((C${rowNum}/3.67)*7.23, 1)`,
        `=ROUND((C${rowNum}/3.67)+1.0, 2)`,
        `=E${rowNum}`
      ].join('\t');
    }).join('\n');

    const fullTsv = headers + '\n' + rows;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullTsv);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    }
  };

  const handleDownloadTemplateCSV = () => {
    sound.playTick();
    const headers = ['Product Name', 'Category (Brand _Part Type)', 'Price D', 'Yuan ¥', 'USD+', 'Sales $'];
    const rows = ALL_IN_ONE_TEMPLATE_ROWS.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.cat.replace(/"/g, '""')}"`,
      r.priceD,
      r.yuan,
      r.usdPlus,
      r.sales
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reer_Hassan_All_In_One_Template_5Rows.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.parts) && parsed.parts.length > 0) {
            onDataSynced(parsed.parts, parsed.compare || []);
            sound.playVictory();
            setStatusMessage({
              type: 'success',
              text: `Imported ${parsed.parts.length} parts from JSON backup!`
            });
          }
        } else {
          // Parse CSV using unified accurate multi-format parser
          const rawRows = GoogleSheetsService.parseCSV(content);
          if (rawRows.length > 1) {
            const { parts: imported, compareItems: newCompare } = GoogleSheetsService.parseRowsToParts(rawRows);
            if (imported.length > 0) {
              onDataSynced(imported, newCompare);
              sound.playVictory();
              setStatusMessage({
                type: 'success',
                text: `Imported ${imported.length} parts from CSV file!`
              });
            } else {
              throw new Error("No valid rows could be imported from CSV.");
            }
          }
        }
      } catch (err) {
        sound.playWrong();
        setStatusMessage({
          type: 'error',
          text: 'Failed to read file: ' + (err as Error).message
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredTemplateRows = templateFilter === '__all__' 
    ? ALL_IN_ONE_TEMPLATE_ROWS 
    : ALL_IN_ONE_TEMPLATE_ROWS.filter(r => r.cat === templateFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Google Sheet Database
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/40">
                  ALL-IN-ONE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
                Single sheet for Product Name, Price D, USD+, Yuan ¥, and Sales $
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - 600 SemiBold */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800 bg-[#0d1527] flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('readme')}
            className={`px-4 sm:px-5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'readme'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Data Dictionary & Restore README</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`px-4 sm:px-5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'template'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>All-In-One Google Sheet Template (5 Rows)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-4 sm:px-5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Live Sync with Your Google Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 sm:px-5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Backup & Reset Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-[#090e18]">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-semibold ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200' 
                : 'bg-rose-950/40 border border-rose-500/50 text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 0: DATA DICTIONARY & RESTORE README */}
          {activeTab === 'readme' && (
            <div className="space-y-6">

              {/* 1. Quick Webhook Action Hub */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1527] to-[#080d19] border border-cyan-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-base font-bold text-white">Complete Suite 2-Way Synchronization Hub</h4>
                      <p className="text-xs text-slate-400">Back up or restore all 5 sheets (Spare Parts, Companies, Price Tracker, Photos, LCDs) with 1 click.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                      {parts.length} Parts Loaded
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-semibold">
                      {companies.length} Companies
                    </span>
                  </div>
                </div>

                {/* Web App URL input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                    <span>Google Apps Script Web App URL (/exec) *</span>
                    {webAppUrl || sheetUrl ? (
                      <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-mono">Needs Web App URL</span>
                    )}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={webAppUrl || sheetUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebAppUrl(val);
                        setSheetUrl(val);
                        GoogleSheetsService.saveConfig({ sheetUrl: val });
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isTestingConnection}
                      onClick={handleTestConnection}
                      title="Test connection to your Google Spreadsheet"
                      className="px-4 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>{isTestingConnection ? 'Testing...' : '⚡ Test Connection'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAppsScript(!showAppsScript)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      <span>{showAppsScript ? 'Hide Script' : 'Get Apps Script'}</span>
                    </button>
                  </div>

                  {connectionResult && (
                    <div className={`mt-2.5 p-3 rounded-xl border text-xs flex items-center gap-2.5 shadow-md animate-in fade-in ${
                      connectionResult.verified 
                        ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300' 
                        : 'bg-rose-950/80 border-rose-500/70 text-rose-300'
                    }`}>
                      {connectionResult.verified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div className="flex-1 leading-normal">
                        {connectionResult.verified ? (
                          <span>
                            <strong>🟢 Connection Active:</strong> Connected to spreadsheet <span className="underline font-bold text-white">"{connectionResult.sheetName || 'NAJI HASSAN'}"</span>. Backup and Restore are completely ready to use!
                          </span>
                        ) : (
                          <span>
                            <strong>❌ Connection Error:</strong> {connectionResult.error || 'Could not connect'}. Ensure Apps Script deployment is set to <span className="underline font-bold">"Execute as: Me"</span> and <span className="underline font-bold">"Who has access: Anyone"</span>.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2 Big Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Backup Button */}
                  <button
                    type="button"
                    disabled={isBackingUpSuite}
                    onClick={handleBackupCompleteSuite}
                    className="p-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-950/40 disabled:opacity-60 cursor-pointer"
                  >
                    {isBackingUpSuite ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Upload className="w-4 h-4 text-cyan-200" />
                    )}
                    <span>🚀 Backup Complete Suite to Google Sheet</span>
                  </button>

                  {/* Restore Button */}
                  <button
                    type="button"
                    disabled={isRestoringSuite}
                    onClick={handleFetchRestorePreview}
                    className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isRestoringSuite ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>🔄 Restore Complete Suite from Google Sheet</span>
                  </button>
                </div>

                {/* Restore Preview Confirmation Card */}
                {restorePreview && (
                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/30 border-2 border-emerald-500/60 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Google Sheet Data Found & Ready to Restore:</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(restorePreview.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Spare Parts</span>
                        <span className="text-base font-bold text-cyan-400">{restorePreview.partsCount}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Companies</span>
                        <span className="text-base font-bold text-indigo-400">{restorePreview.companiesCount}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Price Changes</span>
                        <span className="text-base font-bold text-amber-400">{restorePreview.priceChangesCount}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Photos</span>
                        <span className="text-base font-bold text-emerald-400">{restorePreview.photosCount}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">LCD Models</span>
                        <span className="text-base font-bold text-rose-400">{restorePreview.compatCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setRestorePreview(null)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRestoreSuite}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/50 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm & Apply Restore to App</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Apps Script Box if opened */}
              {showAppsScript && (
                <div className="p-5 rounded-2xl bg-[#070c18] border border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-cyan-400" />
                      <span className="font-bold text-white text-sm">Google Apps Script (Code.gs) for All 5 Tabs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const code = GoogleSheetsService.getAppsScriptCode(GoogleSheetsService.extractSpreadsheetId(sheetUrl || webAppUrl) || undefined);
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(code);
                          setCopiedScript(true);
                          setTimeout(() => setCopiedScript(false), 2500);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Copied Code!' : 'Copy Script Code'}</span>
                    </button>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <li>Open your Google Sheet and click <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Delete any existing code and paste this script.</li>
                    <li>Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>.</li>
                    <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                    <li>Copy the Web App URL and paste it into the Web App URL input above!</li>
                  </ol>
                </div>
              )}

              {/* 3. Comprehensive Data Dictionary (README for All 5 Sheets) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Complete Data Dictionary & Google Sheets Schema</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">5 Dedicated Sheets</span>
                </div>

                {/* Sheet 1: ALL PRODUCT */}
                <div className="bg-[#070c18] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold">
                        Sheet 1
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base">ALL PRODUCT (Master Spare Parts Catalog)</span>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono font-bold">11 Columns (with ID)</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Contains all 585+ spare parts across 38 category lines. Products with the same name from different companies (e.g. Royal vs Dubai VX) or different cargo methods (Sea vs Air) have unique IDs in Column A and are strictly preserved and never overwritten.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-2.5 font-bold">Col</th>
                          <th className="py-2 px-2.5 font-bold">Header Name</th>
                          <th className="py-2 px-2.5 font-bold">Type</th>
                          <th className="py-2 px-2.5 font-bold">Example Value</th>
                          <th className="py-2 px-2.5 font-bold">Description / Formula</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        <tr className="bg-cyan-950/20">
                          <td className="py-2 px-2.5 text-cyan-300 font-bold">A</td>
                          <td className="py-2 px-2.5 font-bold text-cyan-200">ID</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-cyan-300 font-bold">13PM-SEA-ROYAL-CHN-1</td>
                          <td className="py-2 px-2.5 text-cyan-300 font-semibold">Unique Part ID (Prevents duplicate overwrite)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">B</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Product Name</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-emerald-400">LCD IPHONE 11 PRO MAX</td>
                          <td className="py-2 px-2.5 text-slate-400">Full model and spare part name</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">C</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Category (Brand _Part Type)</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-emerald-400">iPhone / LCD</td>
                          <td className="py-2 px-2.5 text-slate-400">Brand and component grouping</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">D</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Price D</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-amber-400">117.0</td>
                          <td className="py-2 px-2.5 text-slate-400">AED Dirham base supplier price</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">E</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Yuan ¥</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-amber-400">230.5</td>
                          <td className="py-2 px-2.5 text-slate-400">China RMB (uses manual exchange rate)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">F</td>
                          <td className="py-2 px-2.5 font-semibold text-white">USD+</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-emerald-400">31.88</td>
                          <td className="py-2 px-2.5 text-slate-400">Cost in USD = (Price D / 3.67) + Expense Rate</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">G</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Sales $</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-emerald-400">34.00</td>
                          <td className="py-2 px-2.5 text-slate-400">Manual or target sales price in USD</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">H</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Company / Supplier</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-indigo-300">Al-Baraka Dubai</td>
                          <td className="py-2 px-2.5 text-slate-400">Linked registered supplier/company</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">I</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Shipment</td>
                          <td className="py-2 px-2.5 text-slate-400">Enum</td>
                          <td className="py-2 px-2.5 text-sky-300">By Air / By Sea</td>
                          <td className="py-2 px-2.5 text-slate-400">Cargo method (Diyaarad / Markab)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">J</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Origin</td>
                          <td className="py-2 px-2.5 text-slate-400">Enum</td>
                          <td className="py-2 px-2.5 text-rose-300">Dubai / China</td>
                          <td className="py-2 px-2.5 text-slate-400">Sourced country (🇦🇪 Dubai / 🇨🇳 China)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-cyan-400">K</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Date Added</td>
                          <td className="py-2 px-2.5 text-slate-400">Date</td>
                          <td className="py-2 px-2.5 text-slate-400">2026-11-06</td>
                          <td className="py-2 px-2.5 text-slate-400">Timestamp of registration</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sheet 2: REGISTERED COMPANIES */}
                <div className="bg-[#070c18] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-mono font-bold">
                        Sheet 2
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base">REGISTERED COMPANIES (Suppliers Directory)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">9 Columns</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Registry of all suppliers, phone numbers, WhatsApp, locations, and notes. Linked directly to products in the catalog and quiz.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-2.5 font-bold">Col</th>
                          <th className="py-2 px-2.5 font-bold">Header Name</th>
                          <th className="py-2 px-2.5 font-bold">Type</th>
                          <th className="py-2 px-2.5 font-bold">Example Value</th>
                          <th className="py-2 px-2.5 font-bold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">A</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Company Name</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-emerald-400">Al-Baraka Electronics</td>
                          <td className="py-2 px-2.5 text-slate-400">Supplier business name</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">B</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Phone No</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-amber-400">+971 50 123 4567</td>
                          <td className="py-2 px-2.5 text-slate-400">Primary phone for orders</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">C</td>
                          <td className="py-2 px-2.5 font-semibold text-white">WhatsApp</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-emerald-400">+971 50 123 4567</td>
                          <td className="py-2 px-2.5 text-slate-400">Direct WhatsApp order chat</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">D</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Location</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-200">Deira, Dubai</td>
                          <td className="py-2 px-2.5 text-slate-400">Physical market/store address</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">E</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Category / Specialty</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-200">All LCD Screens</td>
                          <td className="py-2 px-2.5 text-slate-400">Core specialty parts provided</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">F</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Contact Person</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-200">Manager Hassan</td>
                          <td className="py-2 px-2.5 text-slate-400">Agent or representative name</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">G</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Status</td>
                          <td className="py-2 px-2.5 text-slate-400">Enum</td>
                          <td className="py-2 px-2.5 text-emerald-400">active / blocked</td>
                          <td className="py-2 px-2.5 text-slate-400">Supplier partnership status</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">H</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Notes</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-400">High quality screens, 30 days warranty</td>
                          <td className="py-2 px-2.5 text-slate-400">Payment terms, warranties, delivery terms</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-indigo-400">I</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Date Registered</td>
                          <td className="py-2 px-2.5 text-slate-400">Date</td>
                          <td className="py-2 px-2.5 text-slate-400">2026-11-06</td>
                          <td className="py-2 px-2.5 text-slate-400">Date supplier was registered</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sheet 3: Price Tracker */}
                <div className="bg-[#070c18] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono font-bold">
                        Sheet 3
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base">Price Tracker (Audit Trail & Price Movements)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">9 Columns</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tracks newly added items, price increases (Price Up), and price drops (Price Down) with delta calculations.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-2.5 font-bold">Col</th>
                          <th className="py-2 px-2.5 font-bold">Header Name</th>
                          <th className="py-2 px-2.5 font-bold">Type</th>
                          <th className="py-2 px-2.5 font-bold">Example Value</th>
                          <th className="py-2 px-2.5 font-bold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">A</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Date</td>
                          <td className="py-2 px-2.5 text-slate-400">Date</td>
                          <td className="py-2 px-2.5 text-slate-200">2026-11-06</td>
                          <td className="py-2 px-2.5 text-slate-400">Date of recorded price change</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">B</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Product Name</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-emerald-400">LCD SAM A12 (INCELL)</td>
                          <td className="py-2 px-2.5 text-slate-400">Target product changed</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">C</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Category</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-200">Samsung LCD</td>
                          <td className="py-2 px-2.5 text-slate-400">Part category line</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">D</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Movement Type</td>
                          <td className="py-2 px-2.5 text-slate-400">Enum</td>
                          <td className="py-2 px-2.5 text-cyan-300">New Product / Price Increase / Price Decrease</td>
                          <td className="py-2 px-2.5 text-slate-400">Change classification</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">E</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Old Price D</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-slate-400">18.5</td>
                          <td className="py-2 px-2.5 text-slate-400">Previous Dirham price (0 if new)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">F</td>
                          <td className="py-2 px-2.5 font-semibold text-white">New Price D</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-amber-300">19.8</td>
                          <td className="py-2 px-2.5 text-slate-400">Current Dirham price</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">G</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Price Delta (D)</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-rose-400">+1.3</td>
                          <td className="py-2 px-2.5 text-slate-400">Difference in Dirhams (+ / -)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">H</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Change %</td>
                          <td className="py-2 px-2.5 text-slate-400">Number</td>
                          <td className="py-2 px-2.5 text-rose-400">+7.0%</td>
                          <td className="py-2 px-2.5 text-slate-400">Percentage shift</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-amber-400">I</td>
                          <td className="py-2 px-2.5 font-semibold text-white">Notes / Supplier</td>
                          <td className="py-2 px-2.5 text-slate-400">String</td>
                          <td className="py-2 px-2.5 text-slate-400">Price increase recorded</td>
                          <td className="py-2 px-2.5 text-slate-400">Movement rationale and context</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sheets 4 & 5: Photos & Compatible LCDs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sheet 4: Photos */}
                  <div className="bg-[#070c18] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
                        Sheet 4
                      </span>
                      <span className="font-bold text-white text-sm">Photos (Image Hub)</span>
                    </div>
                    <p className="text-xs text-slate-400">5 Columns: <code>Photo Name</code>, <code>Image URL / Link</code>, <code>Description</code>, <code>Brand / Category</code>, <code>Date Added</code>.</p>
                  </div>

                  {/* Sheet 5: Compatible LCDs */}
                  <div className="bg-[#070c18] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-bold">
                        Sheet 5
                      </span>
                      <span className="font-bold text-white text-sm">Compatible LCDs (Fits)</span>
                    </div>
                    <p className="text-xs text-slate-400">3 Columns: <code>Main Model (LCD)</code>, <code>Compatible Models (Fits)</code>, <code>Notes</code>.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: ALL-IN-ONE SHEET TEMPLATE */}
          {activeTab === 'template' && (
            <div className="space-y-5">
              
              {/* Formula & Rule Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-cyan-300 text-sm flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Single Sheet Design Formula</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300 font-mono">
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300 font-bold">
                      USD+ = (Price D / 3.67) + Exp
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300 font-bold">
                      Yuan ¥ = (Price D / 3.67) * 7.23
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-violet-300 font-bold">
                      Sales $ = Origin Price $ (No 1.3 markup)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyAllInOneTemplate}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap"
                  >
                    {copiedTemplate ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedTemplate ? 'Copied to Clipboard!' : 'Copy Sheet for Google Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTemplateCSV}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template CSV</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Filter Category Preview (5 Rows Each):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['__all__', 'IPhone / LCD', 'SAMSUNG / LCD', 'REDMI / LCD', 'INFINIX /  LCD', 'TECNO /  LCD', 'IPhone / BATTERY', 'SAMSUNG / FLEX CHARGER'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        templateFilter === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cat === '__all__' ? 'All Categories (30 Rows)' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Preview - 500 Medium data, 600 SemiBold product names */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 shadow-xl">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-[#0d1424] text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b-2 border-slate-700 z-10">
                      <tr>
                        <th className="py-3 px-4 font-semibold border-b border-slate-700">Product Name</th>
                        <th className="py-3 px-4 font-semibold border-b border-slate-700">Category (Brand _Part Type)</th>
                        <th className="py-3 px-4 text-right font-mono text-cyan-400 font-semibold border-b border-slate-700">Price D</th>
                        <th className="py-3 px-4 text-right font-mono text-amber-300 font-semibold border-b border-slate-700">Yuan ¥</th>
                        <th className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold border-b border-slate-700">USD+</th>
                        <th className="py-3 px-4 text-right font-mono text-violet-400 font-semibold border-b border-slate-700">Sales $</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/80 font-mono font-medium">
                      {filteredTemplateRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-850/50 transition-colors border-b border-slate-700/80">
                          <td className="py-2.5 px-4 font-sans font-semibold text-white text-xs sm:text-sm">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-4 font-sans text-xs text-slate-300 font-normal">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                              {r.cat}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-cyan-300 font-bold tabular-nums">
                            {r.priceD} D
                          </td>
                          <td className="py-2.5 px-4 text-right text-amber-300 font-bold tabular-nums">
                            ¥{r.yuan}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-400 font-bold tabular-nums">
                            ${r.usdPlus}
                          </td>
                          <td className="py-2.5 px-4 text-right text-violet-300 font-bold tabular-nums">
                            ${r.sales}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions on how to use in Google Sheets */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <span className="font-bold text-white block">
                  How to setup in Google Sheets in 3 easy steps:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 font-normal">
                  <li>Click <strong className="text-cyan-300">"Copy Sheet for Google Sheets"</strong> above.</li>
                  <li>Open a new sheet in <strong className="text-white">Google Sheets</strong> and press <strong className="text-white">Ctrl + V</strong> in cell A1.</li>
                  <li>Go to <em>File &gt; Share &gt; Publish to web &gt; Choose CSV &gt; Click Publish</em> and paste the link in the "Live Sync" tab, or copy your sheet cells and paste directly into the Direct Paste tool!</li>
                </ol>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE SHEET URL SYNC & DIRECT PASTE */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              
              {/* Option A: Direct Paste from Google Sheet (Zero Setup) */}
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Direct Paste from Google Sheets (Instant Sync)
                  </label>
                  <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                    Supports 6 columns: Product Name, Category, Price D, Yuan, USD+, Sales $
                  </span>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={4}
                  placeholder="In your Google Sheet, select your rows (or all cells with Ctrl+A) -> Ctrl+C -> Paste here with Ctrl+V..."
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 font-mono outline-none resize-y"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {pasteText.trim() ? `${pasteText.trim().split('\n').length} rows detected` : 'No cells pasted yet'}
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteImport}
                    disabled={!pasteText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sync Pasted Data Now</span>
                  </button>
                </div>
              </div>

              {/* Option B: Published Google Sheet URL Sync */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                
                {/* 584 Items Naji Hassan Catalog Quick-Loader */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
                      584
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Full NAJI HASSAN Catalog (584 Products &amp; 38 Categories)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        All category pages: SAMSUNG / LCD, IPhone / LCD, TECNO / LCD, etc.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadNajiCatalog}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Load 584 Products (NAJI HASSAN Pages)</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Google Sheet Link or Apps Script Web App URL
                    </label>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {parts.length} Products Active
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSheetUrl(val);
                        GoogleSheetsService.saveConfig({ sheetUrl: val.trim() });
                      }}
                      onBlur={() => GoogleSheetsService.saveConfig({ sheetUrl: sheetUrl.trim() })}
                      placeholder="https://script.google.com/macros/s/AKfy.../exec or https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-mono outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSync}
                        disabled={isLoading || isBackingUp}
                        className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                        title="Download latest data from Google Sheet ('ALL PRODUCT' sheet or all category tabs)"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Syncing...' : 'Sync From Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBackupToSheet('all_in_one')}
                        disabled={isLoading || isBackingUp}
                        className="px-3.5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                        title="Backup ALL products into 1 single sheet named 'ALL PRODUCT'"
                      >
                        <Upload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                        <span>{isBackingUp ? 'Backing up...' : '⚡ 1 Sheet ("ALL PRODUCT")'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBackupToSheet('multi_tab')}
                        disabled={isLoading || isBackingUp}
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                        title="Create each category (38 categories) directly in your NAJI HASSAN Google Sheet without downloading any files"
                      >
                        <FileSpreadsheet className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
                        <span>{isBackingUp ? 'Writing to Google Sheet...' : '📂 Multi-Tab Backup (Write Direct to Google Sheet)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Detected Sheet ID Banner & Web App connector */}
                  {GoogleSheetsService.isSpreadsheetUrl(sheetUrl) && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-cyan-300 font-mono text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Google Sheet ID: <strong>{GoogleSheetsService.extractSpreadsheetId(sheetUrl)}</strong></span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const sid = GoogleSheetsService.extractSpreadsheetId(sheetUrl);
                            if (sid) {
                              const code = GoogleSheetsService.getAppsScriptCode(sid);
                              navigator.clipboard.writeText(code);
                              setCopiedScript(true);
                              sound.playVictory();
                              setTimeout(() => setCopiedScript(false), 2500);
                              setStatusMessage({
                                type: 'success',
                                text: 'Apps Script code pre-configured with this Google Sheet ID copied to clipboard!'
                              });
                            }
                          }}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedScript ? 'Copied Pre-Configured Script!' : 'Copy Script (Pre-configured ID)'}</span>
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-slate-800">
                        <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                          Web App URL (optional if deployed):
                        </span>
                        <input
                          type="url"
                          value={webAppUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebAppUrl(val);
                            GoogleSheetsService.saveConfig({ webAppUrl: val.trim() } as any);
                          }}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>⚡ 1 Sheet ("ALL PRODUCT"):</strong> Writes all {parts.length} items into 1 consolidated master sheet tab.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 flex items-start gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>📂 Multi-Tab Backup:</strong> Turns <strong>each category into its own spreadsheet tab</strong> ({categories.length} tabs) directly inside your NAJI HASSAN Google Sheet (no file download needed).
                    </span>
                  </div>
                </div>

                {/* Category Spreadsheet Tabs 1-Click Copy */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-blue-400" />
                        <span>Category Spreadsheet Tabs ({categories.length} Categories Found)</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Copy any individual category tab to clipboard for direct Ctrl+V pasting into your Google Sheet:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadOfflineWorkbook}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shrink-0"
                      title="Download an offline Excel (.xls) workbook to your computer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Offline Workbook (.xls)</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {categories.map(cat => {
                      const count = parts.filter(p => (p.cat || 'General Spare Parts').trim() === cat).length;
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs"
                        >
                          <span className="font-semibold text-slate-200">{cat}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await GoogleSheetsService.copyCategoryProductsToClipboard(parts, cat);
                              if (ok) {
                                sound.playVictory();
                                setCopiedCat(cat);
                                setTimeout(() => setCopiedCat(null), 2500);
                                setStatusMessage({
                                  type: 'success',
                                  text: `Copied ${count} items of "${cat}" to clipboard! In Google Sheets, open your "${cat}" tab and press Ctrl+V at cell A1.`
                                });
                              }
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedCat === cat ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCat === cat ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playTick();
                              GoogleSheetsService.exportCategoryToCSV(parts, cat);
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                            title={`Download ${cat} CSV`}
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {lastSyncedAt && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Last synchronized: <strong>{lastSyncedAt}</strong></span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2 text-xs text-slate-400">
                <span className="font-bold text-white block">Requirement for Live CSV Link:</span>
                <p>
                  In your Google Sheet, click <strong>File &gt; Share &gt; Publish to web</strong>. Under Link, select <strong>Comma-separated values (.csv)</strong> and copy that URL here. Whenever you change prices in Google Sheets, open this app and click <strong>Sync From Link</strong>!
                </p>
              </div>

              {/* Direct 2-Way Sync with Google Apps Script (Auto-Edits & ALL PRODUCT Sync) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Direct 2-Way Editing Script (Auto-Update Google Sheet on Edit)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppsScript(!showAppsScript)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline"
                  >
                    {showAppsScript ? 'Hide Script' : 'Show Setup Script'}
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  To allow changes made in the app (like changing IP 8 + to 10.5 D) to automatically update your Google Sheet row in <strong className="text-white">Spare Parts Price Quiz & Inventory Suite / ALL PRODUCT</strong>, paste this script into your Google Sheet's <em>Extensions &gt; Apps Script</em> and deploy as a Web App.
                </p>

                {showAppsScript && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Google Apps Script Web App Code: {GoogleSheetsService.extractSpreadsheetId(sheetUrl) && <strong className="text-cyan-400 font-mono">(Linked to Sheet ID)</strong>}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sid = GoogleSheetsService.extractSpreadsheetId(sheetUrl) || undefined;
                          const code = GoogleSheetsService.getAppsScriptCode(sid);
                          navigator.clipboard.writeText(code);
                          setCopiedScript(true);
                          sound.playVictory();
                          setTimeout(() => setCopiedScript(false), 2500);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? 'Copied Code!' : 'Copy Script Code'}</span>
                      </button>
                    </div>

                    <pre className="p-3 bg-[#070b14] rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-52 overflow-y-auto select-all">
                      {GoogleSheetsService.getAppsScriptCode(GoogleSheetsService.extractSpreadsheetId(sheetUrl) || undefined)}
                    </pre>

                    <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <li>In Google Sheets: Click <strong className="text-white">Extensions &gt; Apps Script</strong>.</li>
                      <li>Delete all existing text, paste this script, and click <strong className="text-white">Save</strong>.</li>
                      <li>Click <strong className="text-white">Deploy &gt; New deployment</strong> &gt; Select <strong className="text-white">Web app</strong>.</li>
                      <li>Set Execute as: <strong className="text-white">Me</strong>, Who has access: <strong className="text-emerald-400">Anyone</strong>.</li>
                      <li>Copy the Web App URL and paste it in the box above!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD & BACKUP */}
          {activeTab === 'manage' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Download CSV */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-black text-white text-base block mb-1">
                      Export All 480+ Products (CSV)
                    </span>
                    <p className="text-xs text-slate-400">
                      Download the complete live database with Product Name, Price D, USD+, Yuan ¥, and Sales $ ready for Excel or Google Sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete CSV</span>
                  </button>
                </div>

                {/* JSON Backup */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-black text-white text-base block mb-1">
                      JSON Full Backup
                    </span>
                    <p className="text-xs text-slate-400">
                      Export all products, compatibility rules, and screen inspection photos into a single backup file.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import File */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 sm:col-span-2">
                  <div>
                    <span className="font-black text-white text-base block mb-1">
                      Import CSV or JSON File
                    </span>
                    <p className="text-xs text-slate-400">
                      Upload an updated CSV or JSON database file to update all prices on this device immediately.
                    </p>
                  </div>
                  <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs sm:text-sm border border-slate-700 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Choose File to Import</span>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {/* Action 1: Format Database (Wipe Clean / 0 Items for New Upload) */}
              {(() => {
                const isFormatUnlocked = formatConfirmText.trim().toLowerCase() === 'format database';
                return (
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-rose-950/30 to-rose-950/10 border border-rose-800/40 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                            <RotateCcw className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm sm:text-base text-rose-200 block">
                              Format Database (Wipe Clean / 0 Products for New Upload)
                            </span>
                            <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Safeguard: Typed confirmation required
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-rose-200/70 font-normal pt-1 leading-relaxed">
                          Completely wipes all catalog products and empties the database to 0 items. Use this to prepare a clean blank slate before uploading your own Google Sheet or CSV.
                        </p>
                      </div>
                    </div>

                    {/* Format Safeguard Input Field */}
                    <div className="bg-[#080d18] p-4 rounded-xl border border-rose-900/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <label htmlFor="format-confirm-input" className="text-slate-300 font-medium flex items-center gap-1.5">
                          {isFormatUnlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>To unlock format button, type:</span>
                          <span className="font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/60 select-all">
                            format database
                          </span>
                        </label>
                        <div>
                          {isFormatUnlocked ? (
                            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked (Ready to format)
                            </span>
                          ) : (
                            <span className="text-amber-400/90 font-mono text-[11px]">
                              Locked: Type "format database"
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          id="format-confirm-input"
                          type="text"
                          value={formatConfirmText}
                          onChange={(e) => setFormatConfirmText(e.target.value)}
                          placeholder='Type "format database" here to unlock...'
                          autoComplete="off"
                          spellCheck="false"
                          className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                            isFormatUnlocked
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                              : 'border-slate-700 focus:border-rose-500 text-slate-200'
                          }`}
                        />

                        <button
                          type="button"
                          disabled={!isFormatUnlocked}
                          onClick={() => {
                            if (!isFormatUnlocked) return;
                            sound.playVictory();
                            onFormatDatabase();
                            setFormatConfirmText('');
                            setStatusMessage({
                              type: 'success',
                              text: 'Database successfully formatted! Catalog cleared to 0 items. You can now upload or paste your fresh Google Sheet data.'
                            });
                          }}
                          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 ${
                            isFormatUnlocked
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 cursor-pointer shadow-rose-950/60 active:scale-95'
                              : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <RotateCcw className={`w-4 h-4 ${isFormatUnlocked ? 'text-white' : 'text-slate-500'}`} />
                          <span>Format & Clear Database (0 Items)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action 2: Restore Factory Demo Data (480+ Default Parts) */}
              {(() => {
                const isResetUnlocked = resetConfirmText.trim().toLowerCase() === 'restore default' || resetConfirmText.trim().toLowerCase() === 'reset all data';
                return (
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-indigo-950/10 border border-indigo-800/40 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm sm:text-base text-indigo-200 block">
                              Restore Factory Demo Data (480+ Default Parts)
                            </span>
                            <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Safeguard: Typed confirmation required
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-200/70 font-normal pt-1 leading-relaxed">
                          Restores the built-in factory demo catalog with 480+ spare parts, screen photos, formulas, and baseline prices.
                        </p>
                      </div>
                    </div>

                    {/* Reset Safeguard Input Field */}
                    <div className="bg-[#080d18] p-4 rounded-xl border border-indigo-900/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <label htmlFor="reset-confirm-input" className="text-slate-300 font-medium flex items-center gap-1.5">
                          {isResetUnlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>To unlock restore button, type:</span>
                          <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60 select-all">
                            restore default
                          </span>
                        </label>
                        <div>
                          {isResetUnlocked ? (
                            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked (Ready to restore)
                            </span>
                          ) : (
                            <span className="text-amber-400/90 font-mono text-[11px]">
                              Locked: Type "restore default"
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          id="reset-confirm-input"
                          type="text"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder='Type "restore default" here to unlock...'
                          autoComplete="off"
                          spellCheck="false"
                          className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                            isResetUnlocked
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                              : 'border-slate-700 focus:border-indigo-500 text-slate-200'
                          }`}
                        />

                        <button
                          type="button"
                          disabled={!isResetUnlocked}
                          onClick={() => {
                            if (!isResetUnlocked) return;
                            sound.playVictory();
                            onResetToDefault();
                            setResetConfirmText('');
                            setStatusMessage({
                              type: 'success',
                              text: 'Factory demo catalog restored with 480+ spare parts, formulas, and baseline prices.'
                            });
                          }}
                          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 ${
                            isResetUnlocked
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 cursor-pointer shadow-indigo-950/60 active:scale-95'
                              : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Sparkles className={`w-4 h-4 ${isResetUnlocked ? 'text-white' : 'text-slate-500'}`} />
                          <span>Restore Factory Demo (480+ Parts)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
