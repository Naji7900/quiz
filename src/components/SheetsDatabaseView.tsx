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
  onDataSynced: (newParts: SparePartItem[], newCompare?: CompareItem[]) => void;
  onResetToDefault: () => void;
  onFormatDatabase: () => void;
  lastSyncedAt: string | null;
}

export const SheetsDatabaseView: React.FC<SheetsDatabaseViewProps> = ({
  parts,
  compatList,
  compareList,
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

  // Format confirmation state
  const [formatConfirmText, setFormatConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Backup all local products to Google Sheets database
  const handleBackupToSheet = async () => {
    if (!sheetUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Google Apps Script Web App URL first to enable cloud backup.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const res = await GoogleSheetsService.backupAllToGoogleSheet(sheetUrl, parts);
      if (res.success) {
        sound.playVictory();
        setStatusMessage({
          type: 'success',
          text: `Backup complete! ${parts.length} products sent directly into your Google Sheets tabs.`
        });
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: (err as Error).message || 'Failed to backup to Google Sheets.'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle live sync from Google Sheet
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
      const { result, parts: syncedParts, compareItems: syncedCompare } = await GoogleSheetsService.syncFromSheet(sheetUrl);
      sound.playVictory();
      setStatusMessage({
        type: 'success',
        text: result.message
      });
      onDataSynced(syncedParts, syncedCompare.length ? syncedCompare : undefined);
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export CSV</span>
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
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              <span>Connect Live Google Sheet Database</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Paste your Google Sheet URL. The app will fetch all rows, calculate currencies, and populate your entire catalog and quizzes.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
              Google Sheet URL or Apps Script Link:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit#gid=0"
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={handleSync}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-900/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Download latest products from Google Sheet into app"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Syncing...' : 'Sync from Sheet'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading || isBackingUp}
                  onClick={handleBackupToSheet}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Upload all local app products into Google Sheet tabs"
                >
                  <Upload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  <span>{isBackingUp ? 'Backing up...' : 'Backup to Sheet'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sharing Setup Tip */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Google Sheet Sharing Instructions:</span>
            </div>
            <p>
              1. In Google Sheets, click the green <strong>"Share"</strong> button at top right.
            </p>
            <p>
              2. Under General access, change to: <strong>"Anyone with the link can view"</strong>.
            </p>
            <p>
              3. Copy the URL from your browser address bar and paste it in the box above.
            </p>
          </div>

          {/* Current Database Summary */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Current Local Cache:</span>
            <span className="text-cyan-400 font-bold">{parts.length} Products Active</span>
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
