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
  Code2
} from 'lucide-react';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { SparePartItem, CompatItem, CompareItem } from '../data/initialData';
import { getNajiHassanCatalog } from '../data/najiHassanCatalog';
import { sound } from '../services/soundService';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: SparePartItem[];
  compatList: CompatItem[];
  compareList: CompareItem[];
  photosList?: any[];
  onDataSynced: (
    newParts: SparePartItem[], 
    newCompare?: CompareItem[],
    newPhotos?: any[],
    newCompat?: any[]
  ) => void;
  onResetToDefault: () => void;
  onFormatDatabase: () => void;
  lastSyncedAt: string | null;
}

// 5 rows per category for the official All-In-One Google Sheet template (0 expenses)
const ALL_IN_ONE_TEMPLATE_ROWS = [
  // iPhone LCD (5 rows)
  { name: 'LCD IPHONE X8 +', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'iPhone LCD', exp: 0 },
  { name: 'LCD IPHONE X7 +', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'iPhone LCD', exp: 0 },
  { name: 'LCD IPHONE DD X13 PRO', priceD: 117.0, usdPlus: 31.88, yuan: 230.5, sales: 31.88, cat: 'iPhone LCD', exp: 0 },
  { name: 'LCD IPHONE DD X14 PRO MAX', priceD: 121.0, usdPlus: 32.97, yuan: 238.4, sales: 32.97, cat: 'iPhone LCD', exp: 0 },
  { name: 'LCD IPHONE DD X15 PRO MAX', priceD: 121.0, usdPlus: 32.97, yuan: 238.4, sales: 32.97, cat: 'iPhone LCD', exp: 0 },

  // Samsung LCD (5 rows)
  { name: 'LCD SAM A12 (INCELL)', priceD: 19.8, usdPlus: 5.4, yuan: 39.0, sales: 5.4, cat: 'Samsung LCD', exp: 0 },
  { name: 'LCD SAM A15 (INCELL)', priceD: 24.5, usdPlus: 6.68, yuan: 48.3, sales: 6.68, cat: 'Samsung LCD', exp: 0 },
  { name: 'LCD SAM A54 (OLED)', priceD: 68.0, usdPlus: 18.53, yuan: 134.0, sales: 18.53, cat: 'Samsung LCD', exp: 0 },
  { name: 'LCD SAM A10 (ORIGINAL)', priceD: 22.0, usdPlus: 5.99, yuan: 43.3, sales: 5.99, cat: 'Samsung LCD', exp: 0 },
  { name: 'LCD SAM A24 (INCELL)', priceD: 28.5, usdPlus: 7.77, yuan: 56.1, sales: 7.77, cat: 'Samsung LCD', exp: 0 },

  // Redmi LCD (5 rows)
  { name: 'LCD Redmi Note 13 4G', priceD: 19.4, usdPlus: 5.29, yuan: 38.2, sales: 5.29, cat: 'Redmi LCD', exp: 0 },
  { name: 'LCD Redmi Note 12 4G', priceD: 18.5, usdPlus: 5.04, yuan: 36.4, sales: 5.04, cat: 'Redmi LCD', exp: 0 },
  { name: 'LCD Redmi Note 11', priceD: 21.0, usdPlus: 5.72, yuan: 41.4, sales: 5.72, cat: 'Redmi LCD', exp: 0 },
  { name: 'LCD Redmi Note 10', priceD: 19.0, usdPlus: 5.18, yuan: 37.4, sales: 5.18, cat: 'Redmi LCD', exp: 0 },
  { name: 'LCD Redmi Note 9 Pro', priceD: 17.5, usdPlus: 4.77, yuan: 34.5, sales: 4.77, cat: 'Redmi LCD', exp: 0 },

  // Infinix / Tecno LCD (5 rows)
  { name: 'LCD Infinix Hot 12i', priceD: 16.5, usdPlus: 4.5, yuan: 32.5, sales: 4.5, cat: 'Infinix / Tecno LCD', exp: 0 },
  { name: 'LCD Tecno Spark 20', priceD: 18.0, usdPlus: 4.9, yuan: 35.5, sales: 4.9, cat: 'Infinix / Tecno LCD', exp: 0 },
  { name: 'LCD Infinix Hot 30', priceD: 19.0, usdPlus: 5.18, yuan: 37.4, sales: 5.18, cat: 'Infinix / Tecno LCD', exp: 0 },
  { name: 'LCD Tecno Spark 10', priceD: 17.0, usdPlus: 4.63, yuan: 33.5, sales: 4.63, cat: 'Infinix / Tecno LCD', exp: 0 },
  { name: 'LCD Tecno Camon 20', priceD: 23.5, usdPlus: 6.4, yuan: 46.3, sales: 6.4, cat: 'Infinix / Tecno LCD', exp: 0 },

  // iPhone Battery (5 rows)
  { name: 'BATTERY IPHONE X14 PRO MAX', priceD: 16.5, usdPlus: 4.5, yuan: 32.5, sales: 4.5, cat: 'iPhone Battery', exp: 0 },
  { name: 'BATTERY IPHONE X13 PRO MAX', priceD: 14.8, usdPlus: 4.03, yuan: 29.2, sales: 4.03, cat: 'iPhone Battery', exp: 0 },
  { name: 'BATTERY IPHONE X12 PRO', priceD: 12.5, usdPlus: 3.41, yuan: 24.6, sales: 3.41, cat: 'iPhone Battery', exp: 0 },
  { name: 'BATTERY IPHONE X11 PRO', priceD: 11.0, usdPlus: 3.0, yuan: 21.7, sales: 3.0, cat: 'iPhone Battery', exp: 0 },
  { name: 'BATTERY IPHONE X8 PLUS', priceD: 8.5, usdPlus: 2.32, yuan: 16.7, sales: 2.32, cat: 'iPhone Battery', exp: 0 },

  // Samsung Flex Charger (5 rows)
  { name: 'FLEX CHARGER SAM A15', priceD: 0.6, usdPlus: 0.16, yuan: 1.18, sales: 0.16, cat: 'Samsung Flex Charger', exp: 0 },
  { name: 'FLEX CHARGER SAM A12', priceD: 0.5, usdPlus: 0.14, yuan: 0.98, sales: 0.14, cat: 'Samsung Flex Charger', exp: 0 },
  { name: 'FLEX CHARGER SAM A54', priceD: 0.8, usdPlus: 0.22, yuan: 1.58, sales: 0.22, cat: 'Samsung Flex Charger', exp: 0 },
  { name: 'FLEX CHARGER SAM A24', priceD: 0.6, usdPlus: 0.16, yuan: 1.18, sales: 0.16, cat: 'Samsung Flex Charger', exp: 0 },
  { name: 'FLEX CHARGER SAM A32', priceD: 0.55, usdPlus: 0.15, yuan: 1.08, sales: 0.15, cat: 'Samsung Flex Charger', exp: 0 }
];

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  parts,
  compatList,
  compareList,
  photosList = [],
  onDataSynced,
  onResetToDefault,
  onFormatDatabase,
  lastSyncedAt
}) => {
  const [sheetUrl, setSheetUrl] = useState(() => {
    return GoogleSheetsService.getSavedConfig().sheetUrl || '';
  });
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return (GoogleSheetsService.getSavedConfig() as any).webAppUrl || '';
  });
  const [activeTab, setActiveTab] = useState<'template' | 'sync' | 'manage'>('template');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
      text: `Guul! Dhammaan 584 alaabood iyo ${catCount} category pages (SAMSUNG / LCD, IPhone / LCD, TECNO / LCD, iwm.) ee NAJI HASSAN si buuxda ayaa loo soo roray!`
    });
  };

  const handleBackupToSheet = async (mode: 'all_in_one' | 'multi_tab' = 'all_in_one') => {
    if (parts.length === 0) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Your catalog currently has 0 products. Please add products or click "Soo Ror 584 Alaabood" before creating a backup.'
      });
      return;
    }

    const currentUrl = sheetUrl.trim();
    const currentWebAppUrl = webAppUrl.trim();
    if (!currentUrl && !currentWebAppUrl) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Fadlan geli link-ga Google Sheets ama Google Apps Script Web App ee kore si aad ugu backup garayso.'
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
          ? `Waxaa toos loogu dirayaa Google Sheet-kaaga: ${parts.length} alaabood oo loo kala saarayo ${categories.length} category spreadsheet tabs (pages: SAMSUNG - LCD, IPhone - LCD, TECNO - LCD, iwm.)...`
          : `Waxaa toos loogu dirayaa Google Sheet-kaaga: ${parts.length} alaabood tab-ka 'ALL PRODUCT'...`
      });

      try {
        await GoogleSheetsService.backupAllToGoogleSheet(targetEndpoint, parts, photosList, compatList, mode);
        sound.playVictory();
        const modeDesc = mode === 'multi_tab' 
          ? `Dhammaan ${parts.length} alaabood waxaa si toos ah loogu dhex sameeyay ${categories.length} category spreadsheet tabs (pages) ee Google Sheet-kaaga NAJI HASSAN!` 
          : `Dhammaan ${parts.length} alaabood waxaa toos loogu backup gareeyay tab-ka 'ALL PRODUCT' ee Google Sheet-kaaga NAJI HASSAN!`;
        setStatusMessage({
          type: 'success',
          text: `Guul! ${modeDesc}`
        });
      } catch (err) {
        sound.playWrong();
        setStatusMessage({
          type: 'error',
          text: `Khalad ayaa dhacay xilligii loo dirayay Google Sheets: ${(err as Error).message || 'Hubi xiriirka internet-kaaga ama Web App-ka.'}`
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
      text: `Link-ga Google Sheet-ka NAJI HASSAN waa la helay (Sheet ID: ${sheetId || 'link-gaaga'}). Si uu toos ugu dhex abuuro dhammaan ${categories.length}-ka qaybood Google Sheet-kaaga: nuqul ka qaado script-ka hoose (oo leh Sheet ID-gaaga), ku dar Google Sheet-kaaga (Extensions > Apps Script > Deploy > Web App: Anyone), kadibna Web App URL-ka ku dar sanduuqa kore!`
    });
  };

  const handleDownloadOfflineWorkbook = () => {
    sound.playTick();
    GoogleSheetsService.exportToMultiTabWorkbook(parts, photosList, compatList);
    setStatusMessage({
      type: 'success',
      text: `Faylka offline-ka ah (.xls) ee dhammaan ${categories.length} category tabs ayaa laguu soo dejiyay kumbuyuutarkaaga.`
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
                  {['__all__', 'iPhone LCD', 'Samsung LCD', 'Redmi LCD', 'Infinix / Tecno LCD', 'iPhone Battery', 'Samsung Flex Charger'].map(cat => (
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
                        Katalog-ga Buuxa ee NAJI HASSAN (584 Alaabood &amp; 38 Qaybood)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Dhammaan category pages: SAMSUNG / LCD, IPhone / LCD, TECNO / LCD, iwm.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadNajiCatalog}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Soo Ror 584 Alaabood (NAJI HASSAN Pages)</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Google Sheet Link ama Apps Script Web App URL
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
                      placeholder="https://script.google.com/macros/s/AKfy.../exec ama https://docs.google.com/spreadsheets/d/..."
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
                        title="Toos ugu dhex samee category kasta (38 qaybood) Google Sheet-kaaga NAJI HASSAN adigoon waxba soo dejisan"
                      >
                        <FileSpreadsheet className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
                        <span>{isBackingUp ? 'Ku qoraya Google Sheet...' : '📂 Multi-Tab Backup (Toos ugu qor Google Sheet)'}</span>
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
                          <span>{copiedScript ? 'Copied Pre-Configured Script!' : 'Nuqul Script (Pre-configured ID)'}</span>
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-slate-800">
                        <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                          Web App URL (ikhtiyaari haddii la deploy gareeyay):
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
                      <strong>📂 Multi-Tab Backup:</strong> Waxay <strong>category kasta ka dhigaysaa spreadsheet tab u gaar ah</strong> ({categories.length} tabs) oo toos loogu dhex abuurayo Google Sheet-kaaga NAJI HASSAN (ma soo dejinayo fayl).
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
                      title="Haddii aad rabto inaad fayl offline ah (.xls) ku keydiso kumbuyuutarkaaga"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Soo Dajiso Faylka Offline (.xls)</span>
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
