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
  RotateCcw,
  CheckCircle2,
  Sparkles
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
  const [recentlyAddedPart, setRecentlyAddedPart] = useState<SparePartItem | null>(null);

  // New Part Form State
  const [newPartName, setNewPartName] = useState('');
  const [newPartCat, setNewPartCat] = useState('iPhone LCD');
  const [customCatInput, setCustomCatInput] = useState('');
  const [newPartD, setNewPartD] = useState('');
  const [newPartYuan, setNewPartYuan] = useState('');
  const [newPartUsd, setNewPartUsd] = useState('');
  const [newPartSalesPrice, setNewPartSalesPrice] = useState('');
  const [newPartExpense, setNewPartExpense] = useState('');

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

  // Synchronize prices when user types Dirham (1 / 3.67 = 0.27 USD, (1/3.67)*7.23 = 1.97 Yuan)
  const handleDirhamChange = (val: string) => {
    setNewPartD(val);
    const d = parseFloat(val);
    if (!isNaN(d) && d >= 0) {
      const exp = parseFloat(newPartExpense) || 0;
      const pricing = calculatePricing(d, exp);
      setNewPartYuan(String(pricing.yuan));
      setNewPartUsd(String(pricing.costUsd));
      setNewPartSalesPrice(String(pricing.salesPrice));
    }
  };

  // Synchronize prices when user types Yuan
  const handleYuanChange = (val: string) => {
    setNewPartYuan(val);
    const y = parseFloat(val);
    if (!isNaN(y) && y >= 0) {
      const baseUsd = y / 7.23;
      const d = Number((baseUsd * 3.67).toFixed(2));
      const exp = parseFloat(newPartExpense) || 0;
      const costUsd = Number((baseUsd + exp).toFixed(2));
      const sales = Number((costUsd * 1.30).toFixed(2));
      setNewPartD(String(d));
      setNewPartUsd(String(costUsd));
      setNewPartSalesPrice(String(sales));
    }
  };

  // Synchronize prices when user types USD+
  const handleUsdChange = (val: string) => {
    setNewPartUsd(val);
    const u = parseFloat(val);
    if (!isNaN(u) && u >= 0) {
      const exp = parseFloat(newPartExpense) || 0;
      const baseUsd = Math.max(0, u - exp);
      const d = Number((baseUsd * 3.67).toFixed(2));
      const yuan = Number((baseUsd * 7.23).toFixed(2));
      const sales = Number((u * 1.30).toFixed(2));
      setNewPartD(String(d));
      setNewPartYuan(String(yuan));
      setNewPartSalesPrice(String(sales));
    }
  };

  const handleSalesPriceChange = (val: string) => {
    setNewPartSalesPrice(val);
  };

  const handleExpenseChange = (expVal: string) => {
    setNewPartExpense(expVal);
    const exp = parseFloat(expVal) || 0;
    const d = parseFloat(newPartD);
    if (!isNaN(d) && d >= 0) {
      const pricing = calculatePricing(d, exp);
      setNewPartUsd(String(pricing.costUsd));
      setNewPartSalesPrice(String(pricing.salesPrice));
    }
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    const finalCat = newPartCat === '__custom__' && customCatInput.trim()
      ? customCatInput.trim()
      : newPartCat;

    const dirham = parseFloat(newPartD) || 0;
    const exp = parseFloat(newPartExpense) || 0;
    const pricing = calculatePricing(dirham, exp);

    const yuan = newPartYuan ? (parseFloat(newPartYuan) || pricing.yuan) : pricing.yuan;
    const usd = newPartUsd ? (parseFloat(newPartUsd) || pricing.costUsd) : pricing.costUsd;
    const salesPrice = newPartSalesPrice ? (parseFloat(newPartSalesPrice) || pricing.salesPrice) : pricing.salesPrice;

    const createdPart: SparePartItem = {
      id: `custom-${Date.now()}`,
      name: newPartName.trim(),
      cat: finalCat,
      d: dirham,
      usd,
      yuan,
      salesPrice,
      salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
      expense: exp,
      isCustom: true
    };

    onAddPart(createdPart);

    sound.playVictory();
    setRecentlyAddedPart(createdPart);
    setShowAllCatalog(true);
    setSearchTerm('');
    setNewPartName('');
    setNewPartD('');
    setNewPartYuan('');
    setNewPartUsd('');
    setNewPartSalesPrice('');
    setCustomCatInput('');
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
                  Price D / 3.67 (1 D = $0.27)
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Exact exchange rate: 1 USD = 3.67 AED (1 AED = 0.27 USD).
                </span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">Yuan ¥ (China RMB):</span>
                <span className="text-amber-300 font-bold text-sm sm:text-base">
                  (Price D / 3.67) * 7.23 (1 D = ¥1.97)
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Direct Guangzhou factory market rate: 1 USD = 7.23 RMB.
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

      {/* RECENTLY ADDED ITEM CONFIRMATION BANNER */}
      {recentlyAddedPart && (
        <div className="bg-[#0b1626] border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saved to Database (Row #1)
                  </span>
                  <span className="text-xs text-slate-400">
                    Persisted in Local Storage & App Catalog
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <span>{recentlyAddedPart.name}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {recentlyAddedPart.cat}
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  setSearchTerm(recentlyAddedPart.name);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search This Part</span>
              </button>
              {onOpenDbModal && (
                <button
                  type="button"
                  onClick={() => onOpenDbModal()}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700 text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Google Sheets DB</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setRecentlyAddedPart(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Confirmation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Dirham (AED)</span>
              <span className="text-cyan-300 font-bold text-sm sm:text-base">{formatNum(recentlyAddedPart.d)} D</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Guangzhou Yuan (¥)</span>
              <span className="text-amber-300 font-bold text-sm sm:text-base">¥{formatNum(recentlyAddedPart.yuan ?? ((recentlyAddedPart.d / 3.67) * 7.23))}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">USD+ Cost</span>
              <span className="text-emerald-400 font-bold text-sm sm:text-base">${formatNum(recentlyAddedPart.usd)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Customer Sales Price</span>
              <span className="text-violet-300 font-bold text-sm sm:text-base">${formatNum(recentlyAddedPart.salesPrice)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            ✓ Available immediately below in the catalog table (Row #1), in the Quiz Practice pool, and auto-synced or backed up in the Google Sheets database.
          </p>
        </div>
      )}

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
                    filteredParts.map((item, idx) => {
                      const isRecentlyAdded = recentlyAddedPart && (item.id === recentlyAddedPart.id || (idx === 0 && item.name === recentlyAddedPart.name));
                      return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors cursor-pointer group ${
                          isRecentlyAdded 
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-l-4 border-l-emerald-400' 
                            : 'hover:bg-slate-800/60'
                        }`}
                        onClick={() => {
                          sound.playTick();
                          setSearchTerm(item.name);
                        }}
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-xs font-normal tabular-nums">
                          {isRecentlyAdded ? (
                            <span className="font-bold text-emerald-400">1 ★</span>
                          ) : (
                            <span className="text-slate-500">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`font-semibold transition-colors text-base ${isRecentlyAdded ? 'text-emerald-200 group-hover:text-white' : 'text-white group-hover:text-cyan-300'}`}>
                            {item.name}
                          </span>
                          {isRecentlyAdded && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> JUST ADDED
                            </span>
                          )}
                          {item.isCustom && !isRecentlyAdded && (
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
                    );})
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
                filteredParts.map((item, idx) => {
                  const isRecentlyAdded = recentlyAddedPart && (item.id === recentlyAddedPart.id || (idx === 0 && item.name === recentlyAddedPart.name));
                  return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playTick();
                      setSearchTerm(item.name);
                    }}
                    className={`p-4 transition-colors active:bg-slate-800 ${
                      isRecentlyAdded
                        ? 'bg-emerald-950/30 border-l-4 border-l-emerald-400'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-base leading-tight">
                          {item.name}
                        </span>
                        {isRecentlyAdded && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> JUST ADDED
                          </span>
                        )}
                      </div>
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
                );})
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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. LCD IPHONE 16 PRO MAX"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-colors"
                />
              </div>

              {/* Select Category + Custom Category */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newPartCat}
                    onChange={(e) => setNewPartCat(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-3 text-xs text-white font-medium outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Create New Category...</option>
                  </select>

                  {newPartCat === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="Type custom category name..."
                      className="w-full bg-[#070c18] border border-cyan-500/70 focus:border-cyan-400 rounded-xl px-3 py-3 text-xs text-white font-medium outline-none"
                    />
                  )}
                </div>
              </div>

              {/* 4 Currency Options: Dirham, Yuan, USD+, Sales Price MUST */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1 flex items-center justify-between">
                    <span>Dirham Option (Price D)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={newPartD}
                      onChange={(e) => handleDirhamChange(e.target.value)}
                      placeholder="e.g. 1.0"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-cyan-400 font-mono pointer-events-none">
                      AED
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 flex items-center justify-between">
                    <span>Yuan Option (¥)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={newPartYuan}
                      onChange={(e) => handleYuanChange(e.target.value)}
                      placeholder="e.g. 1.97"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-amber-400 font-mono pointer-events-none">
                      RMB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1 flex items-center justify-between">
                    <span>USD+ Option (Cost)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={newPartUsd}
                      onChange={(e) => handleUsdChange(e.target.value)}
                      placeholder="e.g. 0.27"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-slate-700 focus:border-emerald-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-emerald-400 font-mono pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>

                <div className="p-1 rounded-2xl bg-violet-950/30 border-2 border-violet-500/70 shadow-lg shadow-violet-950/40">
                  <label className="block text-xs font-bold text-violet-300 uppercase mb-1 flex items-center justify-between px-1.5">
                    <span>Sales Price (MUST) *</span>
                    <span className="text-[10px] bg-violet-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                      MUST
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={newPartSalesPrice}
                      onChange={(e) => handleSalesPriceChange(e.target.value)}
                      placeholder="e.g. 0.35"
                      className="w-full h-10 sm:h-11 bg-[#070c18] border border-violet-500/80 focus:border-violet-400 rounded-xl pl-3 pr-10 text-sm sm:text-base text-violet-200 font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 text-xs font-bold text-violet-400 font-mono pointer-events-none">
                      $
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Option (Optional) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <div>
                  <span className="font-semibold text-slate-300 block">Optional Expense $ (Shipping / Customs):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave 0 for pure 1/3.67 exchange rate</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={newPartExpense}
                  onChange={(e) => handleExpenseChange(e.target.value)}
                  placeholder="0.0"
                  className="w-20 bg-[#070c18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right outline-none"
                />
              </div>

              {/* Google Sheets Backup Status */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Google Sheet Backup:</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  Auto-Sync Enabled
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 cursor-pointer transition-all"
                >
                  Save & Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
