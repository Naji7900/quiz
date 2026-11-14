import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  RefreshCw, 
  Check, 
  FileSpreadsheet, 
  AlertCircle, 
  Cloud, 
  Layers, 
  ArrowRight,
  Database
} from 'lucide-react';
import { GoogleSheetsService, DEFAULT_WEB_APP_URL } from '../services/googleSheetsService';
import { SparePartItem, dedupeSpareParts, normalizeProductKey, normalizeCargoKey } from '../data/initialData';
import { sound } from '../services/soundService';

interface Upload11ColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParts: SparePartItem[];
  onImportComplete: (updatedParts: SparePartItem[], message: string) => void;
}

export const Upload11ColumnsModal: React.FC<Upload11ColumnsModalProps> = ({
  isOpen,
  onClose,
  currentParts,
  onImportComplete
}) => {
  const [activeMode, setActiveMode] = useState<'cloud' | 'csv'>('cloud');
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return GoogleSheetsService.getSavedConfig().webAppUrl || DEFAULT_WEB_APP_URL;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [parsedPreview, setParsedPreview] = useState<SparePartItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [updateMatchingIds, setUpdateMatchingIds] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const cfg = GoogleSheetsService.getSavedConfig();
      if (cfg.webAppUrl) {
        setWebAppUrl(cfg.webAppUrl);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle live cloud fetch from Google Sheet
  const handleFetchFromGoogleSheet = async () => {
    if (!webAppUrl.trim()) {
      sound.playWrong();
      setStatusMessage({ type: 'error', text: 'Please enter a valid Google Apps Script Web App URL.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Fetching 11 columns from Google Sheet "ALL PRODUCT"...' });
    sound.playTick();

    try {
      GoogleSheetsService.saveConfig({ webAppUrl: webAppUrl.trim() });
      const res = await GoogleSheetsService.restoreCompleteSuite(webAppUrl);
      if (res && res.success && res.parts && res.parts.length > 0) {
        setParsedPreview(res.parts);
        setStatusMessage({
          type: 'success',
          text: `Found ${res.parts.length} products with 11 columns from Google Sheet!`
        });
        sound.playVictory();
      } else {
        throw new Error(res.message || 'No products found in "ALL PRODUCT" tab.');
      }
    } catch (err) {
      sound.playWrong();
      setStatusMessage({
        type: 'error',
        text: (err as Error).message || 'Failed to fetch from Google Sheet. Make sure the Web App is deployed as "Anyone".'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    sound.playTick();

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = GoogleSheetsService.parseCSV(text);
        if (rows.length < 2) {
          throw new Error('CSV file contains no data rows.');
        }

        const { parts } = GoogleSheetsService.parseRowsToParts(rows);
        if (parts.length === 0) {
          throw new Error('Could not parse any product rows with 11 columns from the CSV.');
        }

        setParsedPreview(parts);
        setStatusMessage({
          type: 'success',
          text: `Loaded ${parts.length} products from "${file.name}" with 11 columns!`
        });
        sound.playVictory();
      } catch (err) {
        sound.playWrong();
        setStatusMessage({
          type: 'error',
          text: (err as Error).message || 'Failed to parse CSV file.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      sound.playWrong();
      setStatusMessage({ type: 'error', text: 'Failed to read the selected file.' });
    };
    reader.readAsText(file);
  };

  // Merge products according to Smart Product Matching Rules 1-4 (Product Name + Company Name primary key)
  const handleApplyImport = () => {
    if (parsedPreview.length === 0) return;

    sound.playVictory();
    const normKey = normalizeProductKey;
    const makeCompositeKey = (name?: string, comp?: string, ship?: string) =>
      `${normKey(name)}||${normKey(comp)}||${normalizeCargoKey(ship)}`;

    let finalParts: SparePartItem[] = [];
    let duplicateSkipped = 0;

    if (updateMatchingIds) {
      const mergedList: SparePartItem[] = dedupeSpareParts([...currentParts]);
      const usedIds = new Set<string>(mergedList.map(p => (p.id || '').toLowerCase().trim()).filter(Boolean));
      let maxDx = 0;
      mergedList.forEach(p => {
        const m = String(p.id || '').match(/^DX-(\d+)$/i);
        if (m) maxDx = Math.max(maxDx, parseInt(m[1], 10));
      });
      const nextUniqueId = (preferred?: string) => {
        const clean = (preferred || '').trim();
        if (clean && !usedIds.has(clean.toLowerCase())) {
          usedIds.add(clean.toLowerCase());
          return clean;
        }
        maxDx += 1;
        let cand = `DX-${String(maxDx).padStart(6, '0')}`;
        while (usedIds.has(cand.toLowerCase())) {
          maxDx += 1;
          cand = `DX-${String(maxDx).padStart(6, '0')}`;
        }
        usedIds.add(cand.toLowerCase());
        return cand;
      };

      parsedPreview.forEach(incoming => {
        const incomingComp = incoming.companyName || 'NAJI HASSAN';
        const incomingShip = incoming.shippingMethod || 'air';
        const incomingKey = makeCompositeKey(incoming.name, incomingComp, incomingShip);
        const matchIndices: number[] = [];
        mergedList.forEach((p, idx) => {
          if (
            makeCompositeKey(p.name, p.companyName || 'NAJI HASSAN', p.shippingMethod) === incomingKey ||
            makeCompositeKey(p.name, p.companyName, p.shippingMethod) === makeCompositeKey(incoming.name, incoming.companyName, incomingShip)
          ) {
            matchIndices.push(idx);
          }
        });

        if (matchIndices.length >= 1) {
          // Same Name + Company + Cargo/Shipping => ONLY UPDATE existing row, preserving ID and Date Added
          const prev = mergedList[matchIndices[0]];
          mergedList[matchIndices[0]] = {
            ...prev,
            ...incoming,
            id: prev.id,
            purchaseDate: prev.purchaseDate || incoming.purchaseDate
          };
          if (matchIndices.length > 1) duplicateSkipped += matchIndices.length - 1;
        } else {
          // Same Name with DIFFERENT Company OR DIFFERENT Cargo/Shipping (or New) => Write NEW ROW with unique ID
          const uniqueId = nextUniqueId(incoming.id);
          mergedList.push({ ...incoming, id: uniqueId });
        }
      });

      finalParts = mergedList;
    } else {
      // Direct replace
      finalParts = parsedPreview;
    }

    // Guarantee all 11 columns are completely filled & deduplicated on (Name + Company + Cargo/Shipping)
    const todayStr = new Date().toISOString().split('T')[0];
    const sanitizedParts: SparePartItem[] = dedupeSpareParts(
      finalParts.map((p, idx) => ({
        ...p,
        id: p.id || `DX-${String(idx + 1).padStart(6, '0')}`,
        companyName: p.companyName || 'NAJI HASSAN',
        shippingMethod: (p.shippingMethod as any) || 'air',
        origin: (p.origin as any) || (p.cat && p.cat.includes('LCD') ? 'China' : 'Dubai'),
        purchaseDate: p.purchaseDate || todayStr,
        salesPrice: p.salesPrice && p.salesPrice > 0 ? p.salesPrice : p.usd,
        salesPriceD: p.salesPriceD && p.salesPriceD > 0 ? p.salesPriceD : Number(((p.salesPrice || p.usd) * 3.67).toFixed(1)),
        yuan: p.yuan && p.yuan > 0 ? p.yuan : 0
      }))
    );

    // Save to storage
    GoogleSheetsService.saveCustomParts(sanitizedParts);
    GoogleSheetsService.saveConfig({ webAppUrl });

    const reviewNote = duplicateSkipped > 0 ? ` (${duplicateSkipped} duplicate groups skipped for review)` : '';
    onImportComplete(
      sanitizedParts,
      `Successfully synced ${sanitizedParts.length} products with Smart Product Matching & all 11 columns filled!${reviewNote}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Upload 11 Columns</span>
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ALL PRODUCT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Import all 11 columns directly from Google Sheets or a CSV file
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

        {/* 11 Columns Badge Bar */}
        <div className="px-5 py-3 bg-[#070b14] border-b border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-400 flex items-center gap-2 shrink-0">
          <span className="font-sans font-bold text-cyan-400 shrink-0">11 Columns:</span>
          {['1. ID', '2. Product Name', '3. Category', '4. Price D', '5. Yuan ¥', '6. USD+', '7. Sales $', '8. Company', '9. Shipment', '10. Origin', '11. Date Added'].map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
              {c}
            </span>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveMode('cloud');
                sound.playTick();
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'cloud'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>1-Click Live Google Sheet Sync</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('csv');
                sound.playTick();
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'csv'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload CSV File (11 Columns)</span>
            </button>
          </div>

          {/* Mode 1: Cloud Web App */}
          {activeMode === 'cloud' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Google Apps Script Web App URL (/exec) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleFetchFromGoogleSheet}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Fetching...' : 'Fetch 11 Columns'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Reads directly from your connected Google Sheet tab <strong className="text-white">"ALL PRODUCT"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: CSV Upload */}
          {activeMode === 'csv' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Select CSV File (Exported from Google Sheets)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#070c18]/80 relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    {fileName ? `Selected: ${fileName}` : 'Click to choose or drag & drop a .csv file'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports 11-column header: ID, Product Name, Category, Price D, Yuan, USD+, Sales $, Company, Shipment, Origin, Date Added
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' 
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border border-red-500/50 text-red-300'
                : 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Merge Option Policy */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="updateMatch"
                checked={updateMatchingIds}
                onChange={(e) => setUpdateMatchingIds(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
              <label htmlFor="updateMatch" className="text-xs text-slate-200 font-medium cursor-pointer">
                <strong>Update matching IDs & append new products</strong> (Preserves existing catalog & prevents duplicates)
              </label>
            </div>
          </div>

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Preview ({parsedPreview.length} Items ready to import)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing first 5 rows
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-b border-slate-800">ID</th>
                      <th className="p-2 border-b border-slate-800 font-sans">Product Name</th>
                      <th className="p-2 border-b border-slate-800 font-sans">Category</th>
                      <th className="p-2 border-b border-slate-800 text-right">Price D</th>
                      <th className="p-2 border-b border-slate-800 text-right">USD+</th>
                      <th className="p-2 border-b border-slate-800 text-right">Sales $</th>
                      <th className="p-2 border-b border-slate-800 font-sans">Shipment</th>
                      <th className="p-2 border-b border-slate-800 font-sans">Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {parsedPreview.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="p-2 text-cyan-400 font-bold">{p.id}</td>
                        <td className="p-2 font-sans font-medium text-white">{p.name}</td>
                        <td className="p-2 font-sans text-slate-400">{p.cat}</td>
                        <td className="p-2 text-right text-cyan-300">{p.d} D</td>
                        <td className="p-2 text-right text-emerald-400">${p.usd}</td>
                        <td className="p-2 text-right text-violet-300">${p.salesPrice}</td>
                        <td className="p-2 font-sans">{p.shippingMethod === 'sea' ? '🚢 Sea' : '✈️ Air'}</td>
                        <td className="p-2 font-sans">{p.origin || 'Dubai'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyImport}
            disabled={parsedPreview.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Import {parsedPreview.length > 0 ? `${parsedPreview.length} Products` : ''} to Catalog</span>
          </button>
        </div>

      </div>
    </div>
  );
};
