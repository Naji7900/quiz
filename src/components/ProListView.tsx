import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Smartphone, 
  Battery, 
  Layers, 
  Zap, 
  Plus, 
  AlertCircle,
  Cpu,
  Calculator,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Upload,
  RotateCcw
} from 'lucide-react';
import { SparePartItem, CompatItem, PART_CATEGORY_GROUPS, calculatePricing } from '../data/initialData';
import { sound } from '../services/soundService';

interface ProListViewProps {
  parts: SparePartItem[];
  compatList: CompatItem[];
  onAddPart: (part: Omit<SparePartItem, 'id'>) => void;
  onOpenDbModal?: () => void;
  onRestoreDefault?: () => void;
}

export const ProListView: React.FC<ProListViewProps> = ({
  parts,
  compatList,
  onAddPart,
  onOpenDbModal,
  onRestoreDefault
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulaBar, setShowFormulaBar] = useState(false);
  const [showAllCatalog, setShowAllCatalog] = useState(false);

  // New Part Form State
  const [newPartName, setNewPartName] = useState('');
  const [newPartCat, setNewPartCat] = useState('iPhone LCD');
  const [newPartD, setNewPartD] = useState('');
  const [newPartExpense, setNewPartExpense] = useState('1.0');

  // Categories list for Add Part modal
  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => set.add(p.cat));
    return Array.from(set).sort();
  }, [parts]);

  const formatNum = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    return rounded === 0 && val !== 0 ? val.toFixed(2) : rounded.toFixed(1);
  };

  const isProfileMode = searchTerm.trim().length >= 2;

  // Device Profile Breakdown when user searches a specific phone model
  const profileData = useMemo(() => {
    if (!isProfileMode) return null;
    const kw = searchTerm.trim().toLowerCase();

    const groups: Record<string, { label: string; iconKey: string; items: SparePartItem[] }> = {};
    
    parts.forEach(part => {
      if (part.name.toLowerCase().includes(kw)) {
        const config = PART_CATEGORY_GROUPS[part.cat] || { label: part.cat, iconKey: 'screen' };
        const groupKey = config.label;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            label: config.label,
            iconKey: config.iconKey,
            items: []
          };
        }
        groups[groupKey].items.push(part);
      }
    });

    const matchingCompat = compatList.filter(c => 
      c.lcd.toLowerCase().includes(kw) || c.fits.toLowerCase().includes(kw)
    );

    const standardComponents = [
      "LCD Screen",
      "Battery",
      "Flex Charger Port",
      "Cover / Housing",
      "Back Glass",
      "SIM Tray",
      "Sensor & Earpiece Speaker"
    ];
    const presentLabels = new Set(Object.keys(groups));
    const missing = standardComponents.filter(c => !presentLabels.has(c));

    return {
      groups: Object.values(groups),
      compat: matchingCompat,
      missing,
      totalFound: Object.values(groups).reduce((acc, g) => acc + g.items.length, 0)
    };
  }, [parts, compatList, searchTerm, isProfileMode]);

  // Real-time instant search filter across all parts
  const filteredParts = useMemo(() => {
    let result = [...parts];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.cat.toLowerCase().includes(q)
      );
    }

    return result;
  }, [parts, searchTerm]);

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !newPartD) return;

    const dirham = parseFloat(newPartD) || 0;
    const exp = parseFloat(newPartExpense) || 1.0;
    const pricing = calculatePricing(dirham, exp);

    onAddPart({
      name: newPartName.trim(),
      cat: newPartCat,
      d: dirham,
      usd: pricing.costUsd,
      yuan: pricing.yuan,
      salesPrice: pricing.salesPrice,
      salesPriceD: pricing.salesPriceD,
      expense: exp,
      isCustom: true
    });

    sound.playVictory();
    setNewPartName('');
    setNewPartD('');
    setShowAddModal(false);
  };

  const getIconForGroup = (iconKey: string) => {
    switch (iconKey) {
      case 'screen': return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'battery': return <Battery className="w-5 h-5 text-emerald-400" />;
      case 'glass': return <Layers className="w-5 h-5 text-purple-400" />;
      case 'port': return <Zap className="w-5 h-5 text-amber-400" />;
      default: return <Tag className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      
      {/* Top Search Header Bar - Only Search Bar & Key Actions, No Popular Chips */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Clean Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spare part or phone model (e.g. 13 Pro Max, A12, Note 13, Battery)..."
              className="w-full bg-[#070c18] border-2 border-slate-700/80 focus:border-cyan-400 rounded-2xl pl-13 pr-10 py-3.5 text-base sm:text-lg text-white font-medium placeholder-slate-400 outline-none transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Formulas, Add Part */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:w-auto sm:items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowFormulaBar(!showFormulaBar);
              }}
              className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                showFormulaBar
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Formulas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowAddModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Part</span>
            </button>
          </div>
        </div>

        {/* Expandable Formula Explanation */}
        {showFormulaBar && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-cyan-500/40 text-xs sm:text-sm text-slate-300 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="font-bold text-cyan-300 flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="w-4 h-4" />
              <span>Official Price Formulas & Conversions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">USD+ (Cost in USD):</span>
                <span className="text-emerald-400 font-bold text-sm sm:text-base">
                  (Price D / 3.67) + Expense
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Standard exchange rate 1$ = 3.67 AED + shipping cost.
                </span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">Yuan ¥ (China RMB):</span>
                <span className="text-amber-300 font-bold text-sm sm:text-base">
                  (Price D / 3.67) * 7.23
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Direct Guangzhou factory market rate.
                </span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">Sales $ (Customer Price):</span>
                <span className="text-violet-300 font-bold text-sm sm:text-base">
                  USD+ * 1.30 (30% Profit)
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Final shop retail price.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEVICE PROFILE DRILLDOWN (When user types a model) */}
      {isProfileMode && profileData && (
        <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Device Profile: "{searchTerm}"
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
                Showing all compatible replacement parts for this phone model.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-800/60">
                {profileData.totalFound} Parts Found
              </span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
              >
                Back to Full Catalog
              </button>
            </div>
          </div>

          {profileData.totalFound === 0 ? (
            <div className="py-12 text-center text-slate-400 font-normal">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">No spare parts found matching "{searchTerm}".</p>
              <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">Try a shorter model search such as "A12", "13 Pro", or "Note 13".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {profileData.groups.map((group) => (
                <div key={group.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                        {getIconForGroup(group.iconKey)}
                        <span>{group.label}</span>
                      </div>
                      <span className="text-xs text-cyan-400 font-mono font-medium bg-cyan-950/40 px-2 py-0.5 rounded-md">
                        {group.items.length} parts
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
                      {group.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-start justify-between text-xs sm:text-sm gap-3">
                          <span className="text-white font-semibold leading-snug flex-1">{item.name}</span>
                          <div className="text-right shrink-0 font-mono">
                            <span className="font-bold text-cyan-300 text-sm block">
                              {formatNum(item.d)} D
                            </span>
                            <span className="font-bold text-emerald-400 text-xs block">
                              USD+ ${formatNum(item.usd)}
                            </span>
                            <span className="font-medium text-violet-300 text-[11px] block">
                              Sales ${formatNum(item.salesPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Cross-model compatibility */}
              {profileData.compat.length > 0 && (
                <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 md:col-span-2 lg:col-span-3 shadow-xl">
                  <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm sm:text-base mb-3 pb-2 border-b border-slate-800">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span>Cross-Model Screen Compatibility (Fits Other Phones)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                    {profileData.compat.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-1.5">
                        <span className="text-white font-semibold">{c.lcd}</span>
                        <span className="text-cyan-300 font-mono text-xs font-medium bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-900/50">
                          Fits: {c.fits}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ZERO PARTS / FORMATTED STATE (Clean Slate ready for new upload) */}
      {!isProfileMode && !searchTerm.trim() && parts.length === 0 && (
        <div className="bg-[#0b111e] border-2 border-dashed border-cyan-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-5 animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-300">
            <Database className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Database is Formatted (0 Products)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              The database has been cleared to a clean blank slate. You can now connect your Google Sheet or upload a CSV file to populate your custom catalog!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenDbModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onOpenDbModal();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Google Sheet / CSV</span>
              </button>
            )}

            {onRestoreDefault && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onRestoreDefault();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Restore Demo Catalog (480 Parts)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEARCH PROMPT / CLEAN STATE (When search bar is empty and parts exist) */}
      {!isProfileMode && !searchTerm.trim() && !showAllCatalog && parts.length > 0 && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-5 animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Search className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Spare Parts Catalog Search
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              Type any phone model (e.g. 13 Pro Max, A12, Note 13) or spare part name in the search bar above to look up prices, Guangzhou Yuan rates, and USD profit margins.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowAllCatalog(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <span>Browse All {parts.length} Spare Parts</span>
              <ChevronDown className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      )}

      {/* FULL-PAGE CATALOG BROWSER TABLE (Active when user types in search or chooses to browse all) */}
      {!isProfileMode && (searchTerm.trim() !== '' || showAllCatalog) && (
        <div className="space-y-4 w-full animate-in fade-in duration-150">
          {/* Full Page Width Product Table */}
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white font-mono text-base">{filteredParts.length}</span>
                <span className="font-medium text-slate-300">items found</span>
                {searchTerm && (
                  <span className="text-xs text-cyan-400 font-medium ml-1">
                    matching "{searchTerm}"
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
                {showAllCatalog && !searchTerm && (
                  <button
                    type="button"
                    onClick={() => setShowAllCatalog(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Hide Catalog</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table - Order: #, Product Name, Category (Brand _Part Type), Price D, Yuan ¥, USD+, Sales $ */}
            <div className="hidden md:block overflow-x-auto max-h-[750px] divide-y divide-slate-800/60">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-[#070c18] text-slate-300 uppercase text-xs font-semibold tracking-wider z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center text-slate-500 font-medium">#</th>
                    <th className="py-4 px-5 font-semibold">Product Name</th>
                    <th className="py-4 px-4 font-semibold">Category (Brand _Part Type)</th>
                    <th className="py-4 px-5 text-right font-mono text-cyan-400 font-semibold">Price D</th>
                    <th className="py-4 px-5 text-right font-mono text-amber-300 font-semibold">Yuan ¥</th>
                    <th className="py-4 px-5 text-right font-mono text-emerald-400 font-semibold">USD+</th>
                    <th className="py-4 px-5 text-right font-mono text-violet-400 font-semibold">Sales $</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#090e1a]/60 font-medium">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 font-normal text-base">
                        No spare parts match your search query "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        onClick={() => {
                          sound.playTick();
                          setSearchTerm(item.name);
                        }}
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500 font-normal tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors text-base">
                            {item.name}
                          </span>
                          {item.isCustom && (
                            <span className="ml-2 text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                              CUSTOM
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 whitespace-nowrap">
                            {item.cat}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-cyan-300 font-bold text-base tabular-nums">
                          {formatNum(item.d)} D
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-amber-300 font-bold text-base tabular-nums">
                          ¥{formatNum(item.yuan ?? ((item.d / 3.67) * 7.23))}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-emerald-400 font-bold text-base tabular-nums">
                          ${formatNum(item.usd)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-violet-300 font-bold text-base tabular-nums">
                          ${formatNum(item.salesPrice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Optimized for Small Screens) */}
            <div className="md:hidden divide-y divide-slate-800/70 max-h-[750px] overflow-y-auto">
              {filteredParts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-normal">
                  No spare parts found matching "{searchTerm}".
                </div>
              ) : (
                filteredParts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playTick();
                      setSearchTerm(item.name);
                    }}
                    className="p-4 hover:bg-slate-850/60 transition-colors active:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold text-white text-base leading-tight">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                        {item.cat}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs mt-2 font-medium">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Price D</span>
                        <span className="text-cyan-300 font-bold text-sm">{formatNum(item.d)} D</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Yuan ¥</span>
                        <span className="text-amber-300 font-bold text-sm">¥{formatNum(item.yuan ?? ((item.d / 3.67) * 7.23))}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">USD+</span>
                        <span className="text-emerald-400 font-bold text-sm">${formatNum(item.usd)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Sales $</span>
                        <span className="text-violet-300 font-bold text-sm">${formatNum(item.salesPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add New Product Modal - 500 Medium labels/inputs, 600 SemiBold buttons, 700 Bold headings */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">Add New Spare Part</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. LCD IPHONE 16 PRO MAX"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newPartCat}
                    onChange={(e) => setNewPartCat(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 rounded-xl px-3 py-3 text-xs text-white font-medium outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Price D (Dirham)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPartD}
                    onChange={(e) => setNewPartD(e.target.value)}
                    placeholder="e.g. 115.0"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-mono font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Expense $ (Shipping / Handling)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPartExpense}
                  onChange={(e) => setNewPartExpense(e.target.value)}
                  placeholder="1.0"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-mono font-medium outline-none"
                />
              </div>

              {newPartD && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-slate-400 font-sans font-normal">Calculated Preview:</div>
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>USD+:</span>
                    <span>${formatNum((parseFloat(newPartD) / 3.67) + (parseFloat(newPartExpense) || 1.0))}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Yuan ¥:</span>
                    <span>¥{formatNum(((parseFloat(newPartD) / 3.67) * 7.23))}</span>
                  </div>
                  <div className="flex justify-between text-violet-300 font-bold">
                    <span>Sales $:</span>
                    <span>${formatNum(((parseFloat(newPartD) / 3.67) + (parseFloat(newPartExpense) || 1.0)) * 1.30)}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
