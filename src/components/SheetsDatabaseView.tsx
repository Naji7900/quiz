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
  ShieldAlert
} from 'lucide-react';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { SparePartItem, CompatItem, CompareItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface SheetsDatabaseViewProps {
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

export const SheetsDatabaseView: React.FC<SheetsDatabaseViewProps> = ({
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
  const [activeTab, setActiveTab] = useState<'connect' | 'upload' | 'autosheet' | 'format'>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showAppsScriptCard, setShowAppsScriptCard] = useState(false);

  // Format confirmation state
  const [formatConfirmText, setFormatConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Backup all local products, photos, and compatible LCDs to Google Sheets database
  const handleBackupToSheet = async (mode: 'all_in_one' | 'multi_tab' = 'all_in_one') => {
    if (parts.length === 0) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: 'Your catalog currently has 0 products. Please add products or restore defaults before creating 1 Sheet.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage(null);

    // 1. Always copy all products in tab-delimited format (ready to paste directly into Google Sheets with Ctrl+V)
    await GoogleSheetsService.copyAllProductsToClipboard(parts);

    const isWebEndpoint = sheetUrl.trim().includes('/exec') || sheetUrl.trim().includes('script.google.com');

    // 2. If connected to an Apps Script Web App, send cloud push to update "ALL PRODUCT" tab
    if (isWebEndpoint) {
      try {
        const res = await GoogleSheetsService.backupAllToGoogleSheet(sheetUrl, parts, photosList, compatList, mode);
        sound.playVictory();
        const targetDesc = mode === 'all_in_one' 
          ? "1 single sheet tab named 'ALL PRODUCT'" 
          : "individual category sheets";
        setStatusMessage({
          type: 'success',
          text: `Success! All ${parts.length} products backed up to ${targetDesc} in your Google Sheet, and copied to clipboard!`
        });
      } catch (err) {
        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `All ${parts.length} products copied to clipboard in 1-Sheet format! In Google Sheets, click cell A1 and press Ctrl+V to paste immediately.`
        });
      } finally {
        setIsBackingUp(false);
      }
      return;
    }

    // 3. If regular sheet link or empty: download CSV and copy to clipboard so they can paste directly
    GoogleSheetsService.exportToCSV(parts);
    sound.playVictory();
    setIsBackingUp(false);
    setStatusMessage({
      type: 'success',
      text: `1-Sheet Ready! All ${parts.length} products copied to clipboard and downloaded as 'ALL_PRODUCT_Master_Sheet.csv'. Open your Google Sheet, click cell A1 and press Ctrl+V!`
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
            { id: 'format', label: '4. Format & Reset Controls', icon: RotateCcw }
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

          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
              Google Apps Script Web App URL or Google Sheet Link:
            </label>
            <div className="flex flex-col lg:flex-row gap-3">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfy.../exec"
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
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Make all data into 1 single sheet named 'ALL PRODUCT' (Uploads to Google Sheet, copies to clipboard, and downloads CSV)"
                >
                  <Upload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce text-amber-300' : 'text-emerald-200'}`} />
                  <span>{isBackingUp ? 'Making 1 Sheet ("ALL PRODUCT")...' : '⚡ Backup All to 1 Sheet ("ALL PRODUCT")'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={() => handleBackupToSheet('multi_tab')}
                  className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Split products into individual category tabs (SAMSUNG / LCD, REDMI / LCD, etc.)"
                >
                  <span>📂 Multi-Tab Backup</span>
                </button>
              </div>
            </div>

            {/* All-In-One Notification Highlight */}
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-2.5 text-xs text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>1-Sheet Mode Active:</strong> Clicking <strong>"⚡ Backup All to 1 Sheet ("ALL PRODUCT")"</strong> prepares and uploads all {parts.length} products into <strong>1 single sheet tab named "ALL PRODUCT"</strong> with all columns (Product Name, Category, Price D, Yuan ¥, USD+, Sales $)!
              </span>
            </div>
          </div>

          {/* Collapsible / Quick Multi-Category Apps Script Block */}
          {showAppsScriptCard && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Category Apps Script (Scans all sheets, Photos & Compat)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paste this into your Google Sheet: <strong>Extensions &gt; Apps Script</strong> &gt; Deploy as Web App ("Who has access: Anyone").
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(GoogleSheetsService.getAppsScriptCode());
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
                {GoogleSheetsService.getAppsScriptCode()}
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
                { name: 'iPhone LCD', count: parts.filter(p => p.cat.toLowerCase().includes('iphone')).length, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' },
                { name: 'Samsung LCD', count: parts.filter(p => p.cat.toLowerCase().includes('samsung') && !p.cat.toLowerCase().includes('switch') && !p.cat.toLowerCase().includes('fingerprint')).length, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20' },
                { name: 'Redmi LCD', count: parts.filter(p => p.cat.toLowerCase().includes('redmi')).length, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
                { name: 'Infinix & Tecno LCD', count: parts.filter(p => p.cat.toLowerCase().includes('infinix') || p.cat.toLowerCase().includes('tecno')).length, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
                { name: 'Honor LCD', count: parts.filter(p => p.cat.toLowerCase().includes('honor')).length, color: 'text-violet-400 border-violet-500/30 bg-violet-950/20' },
                { name: 'Samsung Switches', count: parts.filter(p => p.cat.toLowerCase().includes('switch')).length, color: 'text-teal-400 border-teal-500/30 bg-teal-950/20' },
                { name: 'Samsung Fingerprint Sensors', count: parts.filter(p => p.cat.toLowerCase().includes('fingerprint')).length, color: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/20' },
                { name: 'Batteries', count: parts.filter(p => p.cat.toLowerCase().includes('batter')).length, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20' },
                { name: 'Tools & Equipment', count: parts.filter(p => p.cat.toLowerCase().includes('tool')).length, color: 'text-rose-400 border-rose-500/30 bg-rose-950/20' },
                { name: 'Compatible LCD Matrix', count: compatList.length, color: 'text-sky-400 border-sky-500/30 bg-sky-950/20' },
                { name: 'Price Tracker Logs', count: 18, color: 'text-orange-400 border-orange-500/30 bg-orange-950/20' }
              ].map(cat => (
                <div key={cat.name} className={`p-3 rounded-xl border ${cat.color} flex flex-col justify-between`}>
                  <span className="text-xs font-bold text-white leading-tight">{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-80 mt-1">{cat.count} items recorded</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FORMAT & RESET CONTROLS ================= */}
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
