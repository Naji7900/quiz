import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Plus, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  Check, 
  X, 
  Filter, 
  Trash2, 
  Sparkles,
  BarChart3,
  Percent,
  Clock,
  PackagePlus,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { PriceChangeRecord, SparePartItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface PriceTrackerViewProps {
  priceChanges: PriceChangeRecord[];
  parts: SparePartItem[];
  onAddPriceChange: (record: Omit<PriceChangeRecord, 'id'>) => void;
  onDeletePriceChange: (id: string) => void;
}

export const PriceTrackerView: React.FC<PriceTrackerViewProps> = ({
  priceChanges,
  parts,
  onAddPriceChange,
  onDeletePriceChange
}) => {
  const [filterType, setFilterType] = useState<'all' | 'decrease' | 'increase' | 'new'>('all');
  const [weeklyFilter, setWeeklyFilter] = useState<'all' | 'this_week' | 'last_week'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PriceChangeRecord | null>(null);

  // New Price Change Form State
  const [recordMode, setRecordMode] = useState<'change' | 'new_product'>('change');
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState('Samsung LCD');
  const [oldPriceD, setOldPriceD] = useState('');
  const [newPriceD, setNewPriceD] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => set.add(p.cat));
    priceChanges.forEach(p => set.add(p.cat));
    return Array.from(set).sort();
  }, [parts, priceChanges]);

  // Weekly Date Calculations (relative to current date)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Helper to check if date string falls within weekly windows
  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d >= sevenDaysAgo;
  };

  const isLastWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d < sevenDaysAgo && d >= fourteenDaysAgo;
  };

  // Statistics
  const stats = useMemo(() => {
    const total = priceChanges.length;
    const decreases = priceChanges.filter(c => c.type === 'decrease');
    const increases = priceChanges.filter(c => c.type === 'increase');
    const newItems = priceChanges.filter(c => c.type === 'new');

    const thisWeekItems = priceChanges.filter(c => isThisWeek(c.date));
    const thisWeekNew = thisWeekItems.filter(c => c.type === 'new').length;
    const thisWeekDecreases = thisWeekItems.filter(c => c.type === 'decrease').length;
    const thisWeekIncreases = thisWeekItems.filter(c => c.type === 'increase').length;

    const totalSavedAED = decreases.reduce((acc, c) => acc + Math.abs(c.deltaD), 0);
    const totalIncreasedAED = increases.reduce((acc, c) => acc + Math.abs(c.deltaD), 0);

    return {
      total,
      decreasesCount: decreases.length,
      increasesCount: increases.length,
      newItemsCount: newItems.length,
      thisWeekTotal: thisWeekItems.length,
      thisWeekNew,
      thisWeekDecreases,
      thisWeekIncreases,
      totalSavedAED: Math.round(totalSavedAED * 10) / 10,
      totalIncreasedAED: Math.round(totalIncreasedAED * 10) / 10
    };
  }, [priceChanges]);

  const filteredChanges = useMemo(() => {
    let list = [...priceChanges];

    // Weekly filter
    if (weeklyFilter === 'this_week') {
      list = list.filter(c => isThisWeek(c.date));
    } else if (weeklyFilter === 'last_week') {
      list = list.filter(c => isLastWeek(c.date));
    }

    // Type filter
    if (filterType !== 'all') {
      list = list.filter(c => c.type === filterType);
    }

    if (selectedCategory !== '__all__') {
      list = list.filter(c => c.cat.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.cat.toLowerCase().includes(q) ||
        (c.note || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [priceChanges, weeklyFilter, filterType, selectedCategory, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newD = parseFloat(newPriceD);

    if (isNaN(newD) || !partName.trim()) {
      alert('Please enter valid product name and new price.');
      return;
    }

    sound.playVictory();

    if (recordMode === 'new_product') {
      const newUsd = Number(((newD / 3.67) + 1.0).toFixed(2));
      onAddPriceChange({
        name: partName.trim(),
        cat: category,
        oldD: 0,
        newD,
        oldUsd: 0,
        newUsd,
        type: 'new',
        deltaD: newD,
        percentage: 100,
        date,
        note: note.trim() || 'New product added from Google Sheet / Catalog (Cusub)'
      });
    } else {
      const oldD = parseFloat(oldPriceD);
      if (isNaN(oldD)) {
        alert('Please enter previous price for a price change record.');
        return;
      }
      const deltaD = Math.round((newD - oldD) * 100) / 100;
      const percentage = oldD > 0 ? Math.round(((newD - oldD) / oldD) * 1000) / 10 : 0;
      const type: 'increase' | 'decrease' = newD >= oldD ? 'increase' : 'decrease';
      const oldUsd = Number(((oldD / 3.67) + 1.0).toFixed(2));
      const newUsd = Number(((newD / 3.67) + 1.0).toFixed(2));

      onAddPriceChange({
        name: partName.trim(),
        cat: category,
        oldD,
        newD,
        oldUsd,
        newUsd,
        type,
        deltaD,
        percentage,
        date,
        note: note.trim()
      });
    }

    // Reset Form
    setPartName('');
    setOldPriceD('');
    setNewPriceD('');
    setNote('');
    setShowAddForm(false);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    sound.playWrong();
    onDeletePriceChange(itemToDelete.id);
    setItemToDelete(null);
  };

  const fmt = (num: number) => {
    const r = Math.round(num * 10) / 10;
    return r === 0 && num !== 0 ? num.toFixed(2) : r.toFixed(1);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/40">
                Weekly Price Tracker & New Arrivals
              </span>
              <span className="text-xs font-mono text-slate-400">
                {priceChanges.length} Recorded Movements
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <BarChart3 className="w-7 h-7 text-cyan-400" />
              <span>Weekly Price Changes & New Products Tracker</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
              Monitor weekly supplier price movements, drops (Price Decrease), inflation (Price Increase), and new items sent from Google Sheets (Cusub).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowAddForm(prev => !prev);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{showAddForm ? 'Close Form' : 'Record Change / New Product'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          
          {/* Card 1: This Week's Activity */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-400 block">
                This Week's Activity
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.thisWeekTotal}
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">
                  ({stats.thisWeekNew} New · {stats.thisWeekDecreases} Drops)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 2: New Products Added (Cusub) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-blue-400 block">
                New Products (Cusub)
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-0.5 block">
                {stats.newItemsCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <PackagePlus className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 3: Price Decreases (Savings) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 block">
                Price Decreases
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {stats.decreasesCount}
                </span>
                <span className="text-xs text-emerald-300/80 font-mono">
                  (-{stats.totalSavedAED} D)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 4: Price Increases */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 block">
                Price Increases
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                  {stats.increasesCount}
                </span>
                <span className="text-xs text-amber-300/80 font-mono">
                  (+{stats.totalIncreasedAED} D)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

        </div>

        {/* Weekly & Movement Filters */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          
          {/* Row 1: Weekly Timing Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeframe:</span>
            </span>
            {[
              { id: 'all', label: 'All Recorded Time' },
              { id: 'this_week', label: "This Week's Changes" },
              { id: 'last_week', label: "Last Week's Changes" }
            ].map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => { sound.playTick(); setWeeklyFilter(w.id as any); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  weeklyFilter === w.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-bold'
                    : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Row 2: Type Filter Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { sound.playTick(); setFilterType('all'); }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-bold'
                    : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                All Movements ({priceChanges.length})
              </button>

              <button
                type="button"
                onClick={() => { sound.playTick(); setFilterType('new'); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  filterType === 'new'
                    ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md font-bold'
                    : 'bg-[#070c18] border-blue-500/40 text-blue-400 hover:border-blue-400'
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                <span>New Products ({stats.newItemsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => { sound.playTick(); setFilterType('decrease'); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  filterType === 'decrease'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                    : 'bg-[#070c18] border-emerald-500/40 text-emerald-400 hover:border-emerald-400'
                }`}
              >
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                <span>Price Decrease ({stats.decreasesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => { sound.playTick(); setFilterType('increase'); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  filterType === 'increase'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-[#070c18] border-amber-500/40 text-amber-400 hover:border-amber-400'
                }`}
              >
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                <span>Price Increase ({stats.increasesCount})</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search part name, category or note..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ================= ADD PRICE CHANGE OR NEW PRODUCT FORM ================= */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#0b1424] border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Record Price Movement or New Product Arrival
                </h3>
                <p className="text-xs text-slate-300">
                  Select whether this is an existing product price shift or a new product model (Cusub).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Record Mode Toggle */}
          <div className="flex items-center gap-3 p-1.5 bg-slate-900 rounded-xl border border-slate-800 w-max">
            <button
              type="button"
              onClick={() => { sound.playTick(); setRecordMode('change'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recordMode === 'change'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Price Change (Existing Part)
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setRecordMode('new_product'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recordMode === 'new_product'
                  ? 'bg-blue-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Product Arrival (Cusub)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Part Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                1. Product Model Name *
              </label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. LCD SAM A17 Orginal 4G"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                2. Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                3. Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Old Price D (Only in change mode) */}
            {recordMode === 'change' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                  4. Previous Price D (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={oldPriceD}
                  onChange={(e) => setOldPriceD(e.target.value)}
                  placeholder="e.g. 23.5"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            )}

            {/* New Price D */}
            <div className={recordMode === 'new_product' ? 'lg:col-span-2' : ''}>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                {recordMode === 'new_product' ? '4. Initial Price D (AED) *' : '5. New Price D (AED) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newPriceD}
                onChange={(e) => setNewPriceD(e.target.value)}
                placeholder="e.g. 21.5"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Note */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                Notes / Change Reason
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. New arrival from Google Sheet sync, seasonal supplier discount, or model revision"
                className="w-full px-4 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= MOVEMENTS & NEW PRODUCTS TABLE ================= */}
      {filteredChanges.length === 0 ? (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Price Records Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {searchTerm ? 'No items match your search filters.' : 'No price records found for this timeframe.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#070c18] text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Status / Type</th>
                  <th className="py-3.5 px-4">Product Model</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Previous Price</th>
                  <th className="py-3.5 px-4 text-center">→</th>
                  <th className="py-3.5 px-4 text-right">Current Price D</th>
                  <th className="py-3.5 px-4 text-right">AED Delta</th>
                  <th className="py-3.5 px-4 text-right">% Change</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Note / Source</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredChanges.map((change) => {
                  const isDecrease = change.type === 'decrease';
                  const isNew = change.type === 'new';
                  const isRecent = isThisWeek(change.date);

                  return (
                    <tr 
                      key={change.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isNew ? 'hover:bg-blue-500/5' : isDecrease ? 'hover:bg-emerald-500/5' : 'hover:bg-amber-500/5'
                      }`}
                    >
                      {/* Status / Type Badge */}
                      <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                        {isNew ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>New Product</span>
                            {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                          </span>
                        ) : isDecrease ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Price Decrease</span>
                            {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold">
                            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Price Increase</span>
                            {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>}
                          </span>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4 font-sans font-bold text-white whitespace-nowrap">
                        {change.name}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-sans text-slate-400 text-xs whitespace-nowrap">
                        {change.cat}
                      </td>

                      {/* Old Price D */}
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {isNew ? '—' : `${fmt(change.oldD)} D`}
                      </td>

                      <td className="py-3.5 px-2 text-center text-slate-600">
                        →
                      </td>

                      {/* New Price D */}
                      <td className={`py-3.5 px-4 text-right font-bold text-sm ${
                        isNew ? 'text-blue-300' : isDecrease ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {fmt(change.newD)} D
                      </td>

                      {/* AED Delta */}
                      <td className={`py-3.5 px-4 text-right font-bold ${
                        isNew ? 'text-blue-300' : isDecrease ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isNew ? `+${fmt(change.newD)} D` : isDecrease ? `-${Math.abs(change.deltaD)} D` : `+${Math.abs(change.deltaD)} D`}
                      </td>

                      {/* Percentage */}
                      <td className={`py-3.5 px-4 text-right font-bold ${
                        isNew ? 'text-blue-300' : isDecrease ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isNew ? 'NEW' : change.percentage > 0 ? `+${change.percentage}%` : `${change.percentage}%`}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <span>{change.date}</span>
                          {isRecent && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold">
                              THIS WEEK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-sans max-w-xs truncate" title={change.note}>
                        {change.note || '—'}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setItemToDelete(change)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= IN-APP SAFE DELETE CONFIRMATION MODAL ================= */}
      {itemToDelete && (
        <div 
          onClick={() => setItemToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0b111e] border-2 border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Delete Price Record</h3>
                <p className="text-xs text-slate-400">Remove from price movement audit log?</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Are you sure you want to delete the record for <strong>"{itemToDelete.name}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-950/60"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
