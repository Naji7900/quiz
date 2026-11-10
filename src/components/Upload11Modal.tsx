import React, { useState, useRef } from 'react';
import { 
  CloudUpload, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  Database,
  FileText,
  Table,
  Check
} from 'lucide-react';
import { SparePartItem } from '../data/initialData';
import { GoogleSheetsService, DEFAULT_WEB_APP_URL } from '../services/googleSheetsService';
import { sound } from '../services/soundService';

interface Upload11ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parts: SparePartItem[], mode: 'merge' | 'replace') => void;
  currentParts: SparePartItem[];
}

export const Upload11Modal: React.FC<Upload11ModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentParts
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'file'>('sheet');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge'); // 'merge' = update matching IDs and append new
  
  // File upload state
  const [parsedParts, setParsedParts] = useState<SparePartItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Live Google Sheet sync state
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [liveSyncMsg, setLiveSyncMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsParsing(true);
    setParseError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setParseError('The selected file is empty.');
          setIsParsing(false);
          return;
        }

        const rows = GoogleSheetsService.parseCSV(text);
        if (rows.length < 2) {
          setParseError('The file does not contain enough data rows.');
          setIsParsing(false);
          return;
        }

        const { parts } = GoogleSheetsService.parseRowsToParts(rows);
        if (parts.length === 0) {
          setParseError('Could not find valid product rows with 11 columns in this file.');
          setIsParsing(false);
          return;
        }

        setParsedParts(parts);
        setIsParsing(false);
        sound.playVictory();
      } catch (err) {
        setParseError((err as Error).message || 'Failed to parse file.');
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  // Handle 1-Click Live Sync from Google Sheet
  const handleLiveSyncFromSheet = async () => {
    setIsSyncingLive(true);
    setLiveSyncMsg('');
    sound.playTick();

    const config = GoogleSheetsService.getSavedConfig();
    const endpoint = config.webAppUrl || config.sheetUrl || DEFAULT_WEB_APP_URL;

    try {
      // Fetch complete suite or live sheet rows
      const result = await GoogleSheetsService.restoreCompleteSuite(endpoint);
      if (result && result.parts && result.parts.length > 0) {
        setParsedParts(result.parts);
        setLiveSyncMsg(`✅ Successfully loaded ${result.parts.length} products with 11 columns from Google Sheet!`);
        sound.playVictory();
      } else {
        // Fallback: try raw CSV export or read endpoint
        const syncRes = await GoogleSheetsService.syncFromSheet(endpoint);
        if (syncRes.parts && syncRes.parts.length > 0) {
          setParsedParts(syncRes.parts);
          setLiveSyncMsg(`✅ Loaded ${syncRes.parts.length} products directly from Google Sheet!`);
          sound.playVictory();
        } else {
          setLiveSyncMsg('Could not find products in Google Sheet. Please check the Web App connection.');
          sound.playWrong();
        }
      }
    } catch (err) {
      // Second fallback attempt with standard sheet sync
      try {
        const syncRes = await GoogleSheetsService.syncFromSheet(endpoint);
        if (syncRes.parts && syncRes.parts.length > 0) {
          setParsedParts(syncRes.parts);
          setLiveSyncMsg(`✅ Loaded ${syncRes.parts.length} products directly from Google Sheet!`);
          sound.playVictory();
        } else {
          setLiveSyncMsg(`Error: ${(err as Error).message}`);
          sound.playWrong();
        }
      } catch (secondErr) {
        setLiveSyncMsg(`Could not connect to Google Sheet: ${(secondErr as Error).message}`);
        sound.playWrong();
      }
    } finally {
      setIsSyncingLive(false);
    }
  };

  // Confirm Import
  const handleApplyImport = () => {
    if (parsedParts.length === 0) return;
    sound.playVictory();
    onImport(parsedParts, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Upload 11 Columns</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  2 - UPLOAD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Supports all 11 columns: ID, Product Name, Category, Price D, Yuan ¥, USD+, Sales $, Company, Shipment, Origin, Date Added
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#070c18] rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('sheet');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Sync from Google Sheet (Live)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('file');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. Upload CSV / Excel File</span>
          </button>
        </div>

        {/* Tab 1: Live Google Sheet */}
        {activeTab === 'sheet' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between font-semibold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Direct Google Sheet Cloud Connection</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                  LIVE READY
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                App-ku wuxuu si toos ah 11-ka column uga soo aqrinayaa xaashida <span className="text-white font-mono font-bold">"ALL PRODUCT"</span> ee ku xiran Google Sheet-kaaga.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLiveSyncFromSheet}
              disabled={isSyncingLive}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'Connecting to Google Sheet...' : 'Fetch & Read 11 Columns from Google Sheet'}</span>
            </button>

            {liveSyncMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                liveSyncMsg.startsWith('✅')
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}>
                {liveSyncMsg.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{liveSyncMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: File Upload (CSV) */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-[#070c18] hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 mx-auto flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white">
                {fileName ? fileName : 'Guji si aad u doorato faylka CSV (Click to select CSV file)'}
              </div>
              <p className="text-xs text-slate-400">
                Requires the 11 columns: ID, Product Name, Category, Price D, Yuan ¥, USD+, Sales $, Company, Shipment, Origin, Date Added
              </p>
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Template Download & Export options */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playVictory();
                  GoogleSheetsService.download11ColumnTemplate();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Blank 11-Column Template (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playVictory();
                  GoogleSheetsService.download11ColumnCsv(currentParts, 'Current_Catalog_11_Columns.csv');
                }}
                className="text-slate-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Export Current ({currentParts.length}) to CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Parsed Preview Section */}
        {parsedParts.length > 0 && (
          <div className="mt-5 space-y-3 pt-4 border-t border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-emerald-300">
                  Ready to Import: {parsedParts.length} Products Detected
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                11 Columns Validated
              </span>
            </div>

            {/* First 3 Rows Preview */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#070c18] p-2 max-h-36 overflow-y-auto">
              <table className="w-full text-[11px] text-slate-300 text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-cyan-400 font-bold font-mono">
                    <th className="py-1 px-2">ID</th>
                    <th className="py-1 px-2">Product Name</th>
                    <th className="py-1 px-2">Category</th>
                    <th className="py-1 px-2">Price D</th>
                    <th className="py-1 px-2">USD+</th>
                    <th className="py-1 px-2">Sales $</th>
                    <th className="py-1 px-2">Company</th>
                    <th className="py-1 px-2">Shipment</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedParts.slice(0, 4).map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="py-1 px-2 font-mono text-cyan-300 font-bold">{p.id}</td>
                      <td className="py-1 px-2 font-medium text-white">{p.name}</td>
                      <td className="py-1 px-2 text-slate-400 truncate max-w-[120px]">{p.cat}</td>
                      <td className="py-1 px-2 font-mono text-cyan-400">{p.d} D</td>
                      <td className="py-1 px-2 font-mono text-emerald-400">${p.usd}</td>
                      <td className="py-1 px-2 font-mono text-emerald-300">${p.salesPrice}</td>
                      <td className="py-1 px-2 text-slate-400">{p.companyName || '-'}</td>
                      <td className="py-1 px-2 text-slate-400">{p.shippingMethod === 'sea' ? 'By Sea' : 'By Air'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Merge Strategy (Selected by user: Update matching IDs & append new products) */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Upload Strategy (Sida loo shubo):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setImportMode('merge');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-cyan-950/80 border-cyan-500 text-white ring-2 ring-cyan-400/60'
                      : 'bg-[#070c18] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Update & Append (Recommended)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Updates matching IDs, appends new products
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setImportMode('replace');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-rose-950/80 border-rose-500 text-white ring-2 ring-rose-400/60'
                      : 'bg-[#070c18] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300">
                    <span>Replace Entire Catalog</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Wipes existing catalog and replaces with this sheet
                  </p>
                </button>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Upload & Apply {parsedParts.length} Products to App</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
