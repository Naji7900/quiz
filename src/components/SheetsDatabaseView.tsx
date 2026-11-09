import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Table, 
  RotateCcw,
  Zap,
  Code2,
  Lock,
  Unlock,
  ShieldAlert,
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

interface SheetsDatabaseViewProps {
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
  onResetToDefault: () => void;
  onFormatDatabase: () => void;
  onRestoreCompleteSuite?: (data: CompleteSuiteRestoreResult) => void;
  lastSyncedAt: string | null;
}

export const SheetsDatabaseView: React.FC<SheetsDatabaseViewProps> = ({
  parts,
  compatList,
  compareList,
  photosList = [],
  companies = [],
  priceChanges = [],
  onDataSynced,
  onResetToDefault,
  onFormatDatabase,
  onRestoreCompleteSuite,
  lastSyncedAt
}) => {
  const [sheetUrl, setSheetUrl] = useState(() => {
    return GoogleSheetsService.getSavedConfig().sheetUrl || DEFAULT_WEB_APP_URL;
  });
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return (GoogleSheetsService.getSavedConfig() as any).webAppUrl || DEFAULT_WEB_APP_URL;
  });
  const [activeTab, setActiveTab] = useState<'connect' | 'upload' | 'autosheet' | 'dictionary' | 'format'>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ verified: boolean; sheetName?: string; error?: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isBackingUpSuite, setIsBackingUpSuite] = useState(false);
  const [isRestoringSuite, setIsRestoringSuite] = useState(false);
  const [restorePreview, setRestorePreview] = useState<CompleteSuiteRestoreResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showAppsScriptCard, setShowAppsScriptCard] = useState(false);

  // Format confirmation state
  const [formatConfirmText, setFormatConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [copiedCat, setCopiedCat] = useState<string | null>(null);

  // Group of unique categories present in the catalog
  const categories = Array.from(new Set(parts.map(p => (p.cat || 'General Spare Parts').trim()))).sort();

  // Complete Suite 1-Click Backup (All 5 Sheets)
  const handleBackupCompleteSuite = async () => {
    const currentUrl = (sheetUrl || webAppUrl).trim();
    if (!currentUrl) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Fadlan geli link-ga Google Apps Script Web App ee kore si aad u backup garayso Complete Suite.'
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
        text: 'Backup-ka tooska ah ee Complete Suite wuxuu u baahan yahay Google Apps Script Web App URL (oo ku dhamaanaya /exec).'
      });
      return;
    }

    setIsBackingUpSuite(true);
    setStatusMessage({
      type: 'success',
      text: `Waxaa si buuxda Google Sheet-ka loogu dirayaa Complete Suite: ${parts.length} Spare Parts, ${companies.length} Shirkadood, ${priceChanges.length} Price Tracker records, ${photosList.length} Sawirro, & ${compatList.length} LCD sets...`
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
          text: `Guul! Dhammaan Complete Suite (585+ Parts, Shirkadaha, Price Tracker, Sawirrada, & LCD-yada) si buuxda ayaa loogu kaydiyay Google Sheet-kaaga!`
        });
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Khalad ayaa dhacay xilligii kaydinta Complete Suite: ' + (err as Error).message
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
        text: 'Fadlan marka hore geli Google Apps Script Web App URL-kaaga (link-ga ku dhamaanaya /exec).'
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
        text: 'Soo celinta tooska ah waxay u baahan tahay Google Apps Script Web App URL (oo ku dhamaanaya /exec).'
      });
      return;
    }

    setIsRestoringSuite(true);
    setStatusMessage({
      type: 'success',
      text: 'Waxaa Google Sheet-kaaga laga soo aqrinayaa dhammaan 5-ta tab...'
    });

    try {
      const result = await GoogleSheetsService.restoreCompleteSuite(targetEndpoint);
      sound.playVictory();
      setRestorePreview(result);
      setStatusMessage({
        type: 'success',
        text: `Waxaa Google Sheet-ka laga helay: ${result.partsCount} Spare Parts, ${result.companiesCount} Shirkadood, ${result.priceChangesCount} Price Tracker records, ${result.photosCount} Sawirro, iyo ${result.compatCount} Compatible LCD sets. Guji "Confirm Restore" si aad app-ka ugu shubto!`
      });
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Khalad ayaa dhacay xilligii xogta laga soo aqrinayay Google Sheet: ' + (err as Error).message
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
      text: `Guul! Dhammaan xogtii Complete Suite ee Google Sheet-ka si guul leh ayaa loogu soo celiyay app-kaaga!`
    });
    setRestorePreview(null);
  };

  const handleTestConnection = async () => {
    const target = (webAppUrl || sheetUrl).trim();
    if (!target) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Fadlan marka hore gali Google Apps Script Web App URL (/exec) si aad u tijaabiso xiriirka!'
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
          text: `🟢 Xiriirka wuu guuleystay! Connected to Google Sheet "${res.sheetName || 'NAJI HASSAN'}" (Spreadsheet is active & responding)!`
        });
      } else {
        sound.playWrong();
        setConnectionResult({ verified: false, error: res.message });
        setStatusMessage({
          type: 'error',
          text: `❌ Xiriirka Google Sheet wuu fashilmay: ${res.message || 'Deployment error'}. Hubi in Apps Script deployment-kaagu yahay "Execute as: Me" iyo "Who has access: Anyone".`
        });
      }
    } catch (err: any) {
      sound.playWrong();
      setConnectionResult({ verified: false, error: err?.message || 'Connection failed' });
      setStatusMessage({
        type: 'error',
        text: `❌ Xiriirka Google Sheet wuu fashilmay: ${err?.message || 'Connection error'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

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

  // Backup all local products, photos, and compatible LCDs to Google Sheets database
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
        await GoogleSheetsService.backupAllToGoogleSheet(targetEndpoint, parts, photosList, compatList, mode, companies);
        sound.playVictory();
        const modeDesc = mode === 'multi_tab' 
          ? `Dhammaan ${parts.length} alaabood waxaa si toos ah loogu dhex sameeyay ${categories.length} category spreadsheet tabs + Photos, Compatible LCDs & REGISTERED COMPANIES ee Google Sheet-kaaga NAJI HASSAN!` 
          : `Dhammaan ${parts.length} alaabood waxaa toos loogu backup gareeyay tab-ka 'ALL PRODUCT' iyo tab-ka 'REGISTERED COMPANIES' ee Google Sheet-kaaga NAJI HASSAN!`;
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
    setShowAppsScriptCard(true);
    setStatusMessage({
      type: 'success',
      text: `Link-ga Google Sheet-ka NAJI HASSAN waa la helay (Sheet ID: ${sheetId || 'link-gaaga'}). Si uu toos ugu dhex abuuro dhammaan category tabs iyo REGISTERED COMPANIES Google Sheet-kaaga: nuqul ka qaado script-ka hoose (oo leh Sheet ID-gaaga), ku dar Google Sheet-kaaga (Extensions > Apps Script > Deploy > Web App: Anyone), kadibna Web App URL-ka ku dar sanduuqa kore!`
    });
  };

  // Dedicated Auto-Creation for REGISTERED COMPANIES tab
  const handleCreateRegisteredCompaniesTab = async () => {
    const currentUrl = sheetUrl.trim();
    const currentWebAppUrl = webAppUrl.trim();
    let targetEndpoint = '';
    if (GoogleSheetsService.isWebAppUrl(currentUrl)) targetEndpoint = currentUrl;
    else if (GoogleSheetsService.isWebAppUrl(currentWebAppUrl)) targetEndpoint = currentWebAppUrl;

    if (!targetEndpoint) {
      sound.playTick();
      setShowAppsScriptCard(true);
      setStatusMessage({
        type: 'error',
        text: 'Fadlan ku dar Web App URL-kaaga sanduuqa kore si toos ah loogu abuuro tab-ka REGISTERED COMPANIES ee Google Sheet-kaaga NAJI HASSAN.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage({
      type: 'success',
      text: `Waxaa toos loogu abuurayaa tab-ka "REGISTERED COMPANIES" Google Sheet-kaaga NAJI HASSAN...`
    });

    try {
      const res = await GoogleSheetsService.createOrSyncRegisteredCompaniesTab(targetEndpoint, companies);
      if (res.success) {
        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `Guul! Waxaa si toos ah Google Sheet-kaaga NAJI HASSAN loogu abuuray tab-ka cusub ee "REGISTERED COMPANIES" oo leh dhammaan tiirarka (Company Name, Phone No, WhatsApp, Location, Note, iwm.)!`
        });
      } else {
        sound.playWrong();
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (e) {
      sound.playWrong();
      setStatusMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadCompaniesCsv = () => {
    sound.playTick();
    GoogleSheetsService.downloadRegisteredCompaniesCsv(companies);
    setStatusMessage({
      type: 'success',
      text: `Faylka CSV ee "REGISTERED COMPANIES" waa laguu soo dejiyay. Google Sheet-kaaga ka fur: File > Import > Upload > Dooro "Insert new sheet(s)" si uu 5 ilbiriqsi ugu dhex noqdo tab-ka 4-aad!`
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

  // Handle live sync from Google Sheet (scans all categories + photos + compat)
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

  // Handle local CSV/TSV File Upload
  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        const parsedRows = GoogleSheetsService.parseCSV(content);
        if (parsedRows.length < 2) {
          setStatusMessage({
            type: 'error',
            text: 'Uploaded file does not have enough rows or columns.'
          });
          return;
        }

        const headers = parsedRows[0];
        const sampleRows = parsedRows.slice(1, 6);
        setUploadedPreview({ headers, rows: sampleRows });

        const { parts: importedParts, compareItems: importedCompare } = GoogleSheetsService.parseRowsToParts(parsedRows);
        if (importedParts.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'Could not detect any valid parts. Ensure columns follow: Product Name, Category, Price D, Yuan ¥, USD+, Sales $'
          });
          return;
        }

        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `File parsed successfully! Ready to import ${importedParts.length} parts into database.`
        });
        onDataSynced(importedParts, importedCompare.length ? importedCompare : undefined);
      } catch (err) {
        sound.playWrong();
        setStatusMessage({
          type: 'error',
          text: 'Error processing uploaded file: ' + (err as Error).message
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleCopyScript = () => {
    const script = GoogleSheetsService.getAppsScriptCode();
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    sound.playVictory();
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/40">
                Live Cloud Sync & Data Warehouse
              </span>
              {lastSyncedAt && (
                <span className="text-xs font-mono text-emerald-400">
                  Last Synced: {lastSyncedAt}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <Database className="w-7 h-7 text-cyan-400" />
              <span>Google Sheets Database Hub</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
              Connect your Google Sheet directly, upload CSV catalog files, and automatically create new sheet tabs when adding parts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => { sound.playTick(); GoogleSheetsService.exportToCSV(parts); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg"
              title="Download all products consolidated in 1 single sheet format ('ALL PRODUCT')"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export "ALL PRODUCT" CSV</span>
            </button>
          </div>
        </div>

        {/* Status Message Toast */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-200' 
              : 'bg-rose-950/60 border border-rose-500 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'connect', label: '1. Connect Google Sheet Link', icon: ExternalLink },
            { id: 'upload', label: '2. Upload CSV / Sheet File', icon: Upload },
            { id: 'autosheet', label: '3. Auto-Create Sheet on Add', icon: Zap },
            { id: 'dictionary', label: '4. Data Dictionary & Restore README', icon: BookOpen, badge: 'NEW' },
            { id: 'format', label: '5. Format & Reset Controls', icon: RotateCcw }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { sound.playTick(); setActiveTab(tab.id as any); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-400 text-slate-950 tracking-wider">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: CONNECT GOOGLE SHEET LINK ================= */}
      {activeTab === 'connect' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-cyan-400" />
                <span>Multi-Category Google Sheets Live Cloud Database</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Sync all 17+ category tabs (SAMSUNG / LCD, REDMI / LCD, IPHONE / BATTERY, etc.), backup Photos and Compatible LCDs, and enable auto-delete from the interface.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAppsScriptCard(!showAppsScriptCard)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shrink-0"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>{showAppsScriptCard ? 'Hide Apps Script' : 'View Multi-Category Script'}</span>
            </button>
          </div>

          {/* 584 Items Naji Hassan Catalog Quick-Loader */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm border border-cyan-500/40">
                584
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  Katalog-ga Buuxa ee NAJI HASSAN (584 Alaabood &amp; 38 Qaybood)
                </span>
                <span className="text-xs text-slate-400">
                  Dhammaan category pages: SAMSUNG / LCD, IPhone / LCD, TECNO / LCD, iwm.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadNajiCatalog}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Soo Ror 584 Alaabood (NAJI HASSAN Pages)</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
                Live Google Sheet Link ama Apps Script Web App URL:
              </label>
              <span className="text-xs text-cyan-400 font-mono">
                {parts.length} Products Active
              </span>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
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
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={handleSync}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-900/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Download and sync all products ('ALL PRODUCT' sheet or all category tabs), photos, and compatible LCDs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Syncing...' : '🔄 1-Click Sync'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={() => handleBackupToSheet('all_in_one')}
                  className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Make all data into 1 single sheet named 'ALL PRODUCT' (Uploads to Google Sheet, copies to clipboard, and downloads CSV)"
                >
                  <Upload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce text-amber-300' : 'text-emerald-200'}`} />
                  <span>{isBackingUp ? 'Backing up...' : '⚡ 1 Sheet ("ALL PRODUCT")'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={() => handleBackupToSheet('multi_tab')}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Toos ugu dhex samee category kasta (38 qaybood) Google Sheet-kaaga NAJI HASSAN adigoon waxba soo dejisan"
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isBackingUp ? 'animate-spin text-amber-300' : 'text-blue-200'}`} />
                  <span>{isBackingUp ? 'Ku qoraya Google Sheet...' : '📂 Multi-Tab Backup (Toos ugu qor Google Sheet)'}</span>
                </button>
              </div>
            </div>

            {/* Detected Sheet ID Banner & Web App connector */}
            {GoogleSheetsService.isSpreadsheetUrl(sheetUrl) && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-xs space-y-2">
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
                    Web App URL:
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
                  <button
                    type="button"
                    disabled={isTestingConnection}
                    onClick={handleTestConnection}
                    className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                    )}
                    <span>{isTestingConnection ? 'Testing...' : '⚡ Test Connection'}</span>
                  </button>
                </div>
                {connectionResult && (
                  <div className={`mt-2 p-2 rounded-lg border text-[11px] flex items-center gap-2 ${
                    connectionResult.verified 
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300' 
                      : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                  }`}>
                    {connectionResult.verified ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>
                      {connectionResult.verified 
                        ? `Connected to: "${connectionResult.sheetName || 'NAJI HASSAN'}"` 
                        : `Error: ${connectionResult.error}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Backup Modes Explanation Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>⚡ 1 Sheet ("ALL PRODUCT"):</strong> Writes all {parts.length} items into 1 consolidated master sheet tab + REGISTERED COMPANIES.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>📂 Multi-Tab Backup:</strong> Waxay <strong>category kasta ka dhigaysaa spreadsheet tab u gaar ah</strong> ({categories.length} tabs) + REGISTERED COMPANIES oo toos loogu dhex abuuro Google Sheet-kaaga NAJI HASSAN.
                </span>
              </div>
            </div>

            {/* REGISTERED COMPANIES Tab Auto-Creator & Sync Hub (User Requirement 3) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/50 space-y-3.5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm border border-cyan-500/40">
                    <Table className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base">
                        Google Spreadsheet Tab: "REGISTERED COMPANIES"
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40 uppercase">
                        Tab 4 of NAJI HASSAN
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your Google Sheet currently has 3 tabs: <span className="text-slate-300 font-mono font-semibold">ALL PRODUCT</span>, <span className="text-slate-300 font-mono font-semibold">Photos</span>, and <span className="text-slate-300 font-mono font-semibold">Compatible LCDs</span>. Create or sync the 4th tab: <span className="text-cyan-300 font-mono font-bold">REGISTERED COMPANIES</span> ({companies.length} suppliers).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBackingUp}
                    onClick={handleCreateRegisteredCompaniesTab}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>⚡ Auto-Create "REGISTERED COMPANIES" Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCompaniesCsv}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Download CSV to manually import into Google Sheets: File > Import > Insert new sheet(s)"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>📥 Download CSV (1-Click Import)</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  💡 <strong>Tip for Google Sheets:</strong> If using Web App, clicking <strong>Auto-Create</strong> inserts the tab automatically. Or click <strong>Download CSV</strong> ➔ in your Google Sheet: <code className="text-cyan-300 font-mono">File &gt; Import &gt; Upload &gt; Insert new sheet(s)</code>.
                </span>
                <span className="text-emerald-400 font-mono font-bold shrink-0">
                  {companies.length} Registered Companies
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible / Quick Multi-Category Apps Script Block */}
          {showAppsScriptCard && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Category Apps Script {GoogleSheetsService.extractSpreadsheetId(sheetUrl) && '(Bound to Sheet ID)'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paste this into your Google Sheet: <strong>Extensions &gt; Apps Script</strong> &gt; Deploy as Web App ("Who has access: Anyone").
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sid = GoogleSheetsService.extractSpreadsheetId(sheetUrl) || undefined;
                    navigator.clipboard.writeText(GoogleSheetsService.getAppsScriptCode(sid));
                    sound.playVictory();
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg"
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Multi-Category Script'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-52 leading-relaxed">
                {GoogleSheetsService.getAppsScriptCode(GoogleSheetsService.extractSpreadsheetId(sheetUrl) || undefined)}
              </pre>
            </div>
          )}

          {/* Quick Sharing Setup Tip & Feature Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-slate-300 space-y-1.5">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1-Sheet All-In-One vs Multi-Category:</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
                <li><strong>"ALL PRODUCT" Sheet:</strong> Consolidates all {parts.length} products from all categories into 1 single master sheet.</li>
                <li><strong>Multi-Tab Option:</strong> Splits items into individual brand sheets (SAMSUNG / LCD, REDMI / LCD, etc.).</li>
                <li><strong>1-Click Sync:</strong> Automatically detects and reads the "ALL PRODUCT" sheet or all category sheets.</li>
                <li><strong>Exact Origin Price $:</strong> Formula is strictly Price D / 3.67 with zero extra shipping or hidden fees.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-slate-300 space-y-1.5">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automatic Bidirectional Deletion:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                When you delete or bulk-delete any product from the catalog table, the system automatically sends a delete request to your Google Sheet to remove the matching row instantly.
              </p>
            </div>
          </div>

          {/* Category Spreadsheet Tabs (1-Click Paste into Google Sheets) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  <span>Category Spreadsheet Tabs ({categories.length} Categories Found)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every category can be exported or copied as its own spreadsheet tab. Click "Copy Tab" to paste with Ctrl+V into that category's Google Sheet tab:
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadOfflineWorkbook}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700 shadow-md shrink-0"
                title="Haddii aad rabto inaad fayl offline ah (.xls) ku keydiso kumbuyuutarkaaga"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Soo Dajiso Faylka Offline (.xls)</span>
              </button>
            </div>

            {/* Category pills list */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {categories.map(cat => {
                const count = parts.filter(p => (p.cat || 'General Spare Parts').trim() === cat).length;
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all text-xs"
                  >
                    <span className="font-semibold text-slate-200">{cat}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                      {count} items
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
                            text: `Copied ${count} items of "${cat}" to clipboard! Open your "${cat}" tab in Google Sheets, click cell A1 and press Ctrl+V.`
                          });
                        }
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Copy ${cat} rows formatted for Google Sheets`}
                    >
                      {copiedCat === cat ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCat === cat ? 'Copied!' : 'Copy Tab'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        GoogleSheetsService.exportCategoryToCSV(parts, cat);
                      }}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                      title={`Download ${cat} CSV`}
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Database Summary Metrics */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Catalog Products</div>
              <div className="text-cyan-400 font-bold text-base mt-0.5">{parts.length} Active</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Photos in Hub</div>
              <div className="text-emerald-400 font-bold text-base mt-0.5">{photosList.length} Photos</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Compatible LCDs</div>
              <div className="text-amber-400 font-bold text-base mt-0.5">{compatList.length} Sets</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Cloud Auto-Delete</div>
              <div className="text-rose-400 font-bold text-base mt-0.5">Enabled ⚡</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: UPLOAD CSV / SHEET FILE ================= */}
      {activeTab === 'upload' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Upload CSV / Excel Spreadsheet File</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Upload your catalog file directly. It will parse all spare parts, categories, and prices instantly.
            </p>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-950/20' 
                : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                Drag & Drop CSV / TSV File Here
              </h4>
              <p className="text-xs text-slate-400">
                or click below to choose a file from your computer
              </p>
            </div>

            <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-lg transition-all">
              <span>Browse File</span>
              <input
                type="file"
                accept=".csv, .txt, .tsv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Preview Table */}
          {uploadedPreview && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Uploaded Data Preview (First 5 Rows):</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#070c18] text-slate-300 border-b border-slate-800">
                    <tr>
                      {uploadedPreview.headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {uploadedPreview.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3 text-slate-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: AUTO-CREATE SHEET ON ADD ================= */}
      {activeTab === 'autosheet' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Auto-Create Sheet & Live Database Write</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Have Google Sheets function as your live, bidirectional database. Whenever you click "Add", the system automatically creates a new sheet tab for the category and appends the product row in real time!
            </p>
          </div>

          {/* How It Works 3-Step Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-white text-sm">Paste Apps Script</h4>
              <p className="text-xs text-slate-400">
                Open your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>, and paste our automated script below.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-white text-sm">Deploy Web App</h4>
              <p className="text-xs text-slate-400">
                Click <strong>Deploy &gt; New deployment</strong>, select <strong>Web app</strong>, choose <em>"Anyone"</em> access, and copy the Web App URL.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-white text-sm">Instant Live Writes</h4>
              <p className="text-xs text-slate-400">
                Paste the URL into the app. Now every product you Add immediately creates a new sheet tab and writes directly into your Google Sheet!
              </p>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>Ready-To-Copy Google Apps Script:</span>
              </label>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-60 leading-relaxed selection:bg-cyan-500/30">
              {GoogleSheetsService.getAppsScriptCode()}
            </pre>
          </div>

          {/* Pre-Configured Category Tabs Breakdown */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>Pre-Configured Google Sheet Category Tabs</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  When you add products under these categories, a matching sheet tab is created automatically:
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playVictory();
                  GoogleSheetsService.exportToCSV(parts);
                  setStatusMessage({
                    type: 'success',
                    text: `Exported ${parts.length} catalog products to CSV! Ready to import directly into Google Sheets.`
                  });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All Products CSV Template</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {[
                { name: 'SAMSUNG / LCD', count: parts.filter(p => p.cat === 'SAMSUNG / LCD').length, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20' },
                { name: 'IPhone / LCD', count: parts.filter(p => p.cat === 'IPhone / LCD').length, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' },
                { name: 'REDMI / LCD', count: parts.filter(p => p.cat === 'REDMI / LCD').length, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
                { name: 'INFINIX /  LCD', count: parts.filter(p => p.cat.includes('INFINIX') && p.cat.includes('LCD')).length, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
                { name: 'TECNO /  LCD', count: parts.filter(p => p.cat.includes('TECNO')).length, color: 'text-teal-400 border-teal-500/30 bg-teal-950/20' },
                { name: 'MOTOROLA / LCD', count: parts.filter(p => p.cat === 'MOTOROLA / LCD').length, color: 'text-violet-400 border-violet-500/30 bg-violet-950/20' },
                { name: 'OPPO / LCD', count: parts.filter(p => p.cat === 'OPPO / LCD').length, color: 'text-green-400 border-green-500/30 bg-green-950/20' },
                { name: 'REALME / LCD', count: parts.filter(p => p.cat === 'REALME / LCD').length, color: 'text-lime-400 border-lime-500/30 bg-lime-950/20' },
                { name: 'IPhone / BATTERY', count: parts.filter(p => p.cat === 'IPhone / BATTERY').length, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20' },
                { name: 'SAMSUNG / BATTERY', count: parts.filter(p => p.cat === 'SAMSUNG / BATTERY').length, color: 'text-orange-400 border-orange-500/30 bg-orange-950/20' },
                { name: 'SAMSUNG / FLEX CHARGER', count: parts.filter(p => p.cat === 'SAMSUNG / FLEX CHARGER').length, color: 'text-sky-400 border-sky-500/30 bg-sky-950/20' },
                { name: 'TOOL', count: parts.filter(p => p.cat === 'TOOL').length, color: 'text-rose-400 border-rose-500/30 bg-rose-950/20' }
              ].map(cat => (
                <div key={cat.name} className={`p-3 rounded-xl border ${cat.color} flex flex-col justify-between`}>
                  <span className="text-xs font-bold text-white leading-tight font-mono">{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-80 mt-1">{cat.count} items recorded</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DATA DICTIONARY & RESTORE README ================= */}
      {activeTab === 'dictionary' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Data Dictionary & Restore Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  All 5 Sheets · 100% Non-Destructive
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                <span>Complete Data Dictionary & Restore README</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                Every single piece of data (Catalog, Registered Companies, Price Changes, Photos, Compatible LCDs) stored in your Google Spreadsheet is documented below with exact column schemas and 2-way sync rules.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  const script = GoogleSheetsService.getAppsScriptCode(sheetUrl || 'ALL PRODUCT');
                  navigator.clipboard.writeText(script);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2500);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Script Copied!' : 'Copy Code.gs Script'}</span>
              </button>
            </div>
          </div>

          {/* 1. Quick Backup & Restore Action Hub */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  1-Click Complete Suite Action Hub
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Target Endpoint:</span>
                <span className="font-mono text-cyan-300 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                  {GoogleSheetsService.isWebAppUrl(sheetUrl || webAppUrl) ? 'Web App Ready (/exec)' : 'Need Web App URL'}
                </span>
              </div>
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
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Apply Restore to App</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Comprehensive Data Dictionary (README for All 5 Sheets) */}
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
                Tracks newly added items, price increases (Price Up / Kor u kacay), and price drops (Price Down / Hoos u dhacay) with delta calculations.
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

      {/* ================= TAB 5: FORMAT & RESET CONTROLS ================= */}
      {activeTab === 'format' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              <span>Database Clean Slate & Factory Reset</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Format the database to 0 items for a completely fresh custom upload, or restore original factory parts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Format Database Box (Clean Slate 0) */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border-2 border-rose-500/40 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Format Database (0 Products)</span>
              </div>
              <p className="text-xs text-slate-300">
                Wipes all cached items and sets catalog to 0 products. To prevent accidents, type <strong>format database</strong> below to proceed:
              </p>
              <input
                type="text"
                value={formatConfirmText}
                onChange={(e) => setFormatConfirmText(e.target.value)}
                placeholder='Type "format database"'
                className="w-full px-4 py-2.5 text-xs bg-slate-900 border border-rose-500/40 rounded-xl text-white font-mono focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                disabled={formatConfirmText.trim().toLowerCase() !== 'format database'}
                onClick={() => {
                  sound.playWrong();
                  onFormatDatabase();
                  setFormatConfirmText('');
                  setStatusMessage({
                    type: 'success',
                    text: 'Database formatted! You now have a clean slate (0 products) ready for your new Google Sheet or CSV upload.'
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Confirm Format (Clean Slate 0)
              </button>
            </div>

            {/* Reset to Factory Snapshot */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-cyan-400" />
                <span>Restore Factory Snapshot</span>
              </div>
              <p className="text-xs text-slate-300">
                Restores the standard 331+ smartphone spare parts and compatibility sets. Type <strong>reset all data</strong> below:
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder='Type "reset all data"'
                className="w-full px-4 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                disabled={resetConfirmText.trim().toLowerCase() !== 'reset all data'}
                onClick={() => {
                  sound.playVictory();
                  onResetToDefault();
                  setResetConfirmText('');
                  setStatusMessage({
                    type: 'success',
                    text: 'Factory default catalog restored successfully!'
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                Restore Factory Default
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
