import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  PackagePlus, 
  Search, 
  Calendar, 
  Trash2, 
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  X
} from 'lucide-react';
import { PriceChangeRecord, SparePartItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface PriceTrackerViewProps {
  priceChanges: PriceChangeRecord[];
  parts: SparePartItem[];
  onAddPriceChange?: (record: Omit<PriceChangeRecord, 'id'>) => void;
  onDeletePriceChange: (id: string) => void;
  onAddPart?: (part: Omit<SparePartItem, 'id'>) => void;
  onUpdatePart?: (id: string, updatedFields: Partial<SparePartItem>) => void;
  initialFilter?: 'all' | 'decrease' | 'increase' | 'new';
  initialOpenModal?: 'change' | 'new_product' | null;
}

export const PriceTrackerView: React.FC<PriceTrackerViewProps> = ({
  priceChanges,
  onDeletePriceChange,
  initialFilter = 'all'
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'new' | 'increase' | 'decrease'>(initialFilter || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const formatNum = (val: number) => {
    const r = Math.round(val * 10) / 10;
    return r === 0 && val !== 0 ? val.toFixed(2) : r.toFixed(1);
  };

  // Group records into the three required sections based on actual recorded changes
  const newProducts = useMemo(() => {
    return priceChanges.filter(c => c.type === 'new');
  }, [priceChanges]);

  const priceIncreases = useMemo(() => {
    return priceChanges.filter(c => c.type === 'increase');
  }, [priceChanges]);

  const priceDecreases = useMemo(() => {
    return priceChanges.filter(c => c.type === 'decrease');
  }, [priceChanges]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    priceChanges.forEach(c => {
      if (c.cat) set.add(c.cat);
    });
    return Array.from(set).sort();
  }, [priceChanges]);

  const filterList = (list: PriceChangeRecord[]) => {
    return list.filter(item => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.cat.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'ALL' || item.cat === categoryFilter;

      return matchesSearch && matchesCat;
    });
  };

  const filteredNew = useMemo(() => filterList(newProducts), [newProducts, searchTerm, categoryFilter]);
  const filteredIncreases = useMemo(() => filterList(priceIncreases), [priceIncreases, searchTerm, categoryFilter]);
  const filteredDecreases = useMemo(() => filterList(priceDecreases), [priceDecreases, searchTerm, categoryFilter]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Clean Top Header */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Price Tracker
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Tracked price history: New Products, Price Increases, and Price Decreases
                </p>
              </div>
            </div>
          </div>

          {/* Section Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveSection('new'); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                activeSection === 'new'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md ring-1 ring-cyan-300'
                  : 'bg-slate-900 border-slate-700/80 text-cyan-300 hover:border-slate-500'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>New Products ({newProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveSection('increase'); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                activeSection === 'increase'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md ring-1 ring-amber-300'
                  : 'bg-slate-900 border-slate-700/80 text-amber-300 hover:border-slate-500'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Price Increase ({priceIncreases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveSection('decrease'); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                activeSection === 'decrease'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md ring-1 ring-emerald-300'
                  : 'bg-slate-900 border-slate-700/80 text-emerald-300 hover:border-slate-500'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Price Decrease ({priceDecreases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveSection('all'); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-md'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
              }`}
            >
              View All ({priceChanges.length})
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name or model..."
              className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-400 outline-none font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#070c18] border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SECTION A: NEW PRODUCTS */}
      {(activeSection === 'all' || activeSection === 'new') && (
        <div className="bg-[#0b111e] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>A. New Products</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {filteredNew.length} Products
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Newly registered products added to inventory</p>
              </div>
            </div>
          </div>

          {filteredNew.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 bg-[#070c18] rounded-2xl border border-slate-800">
              No new products recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#070c18]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Registered Price D</th>
                    <th className="py-3 px-4 text-right">USD+</th>
                    <th className="py-3 px-4">Date Added</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                  {filteredNew.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-slate-300">
                        <span className="px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700">
                          {item.cat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-cyan-400">
                        {formatNum(item.newD)} D
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                        ${formatNum(item.newUsd)}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{item.date}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            onDeletePriceChange(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remove record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION B: PRICE INCREASE */}
      {(activeSection === 'all' || activeSection === 'increase') && (
        <div className="bg-[#0b111e] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>B. Price Increase</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {filteredIncreases.length} Products
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Products whose supplier prices have increased (Price Up)</p>
              </div>
            </div>
          </div>

          {filteredIncreases.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 bg-[#070c18] rounded-2xl border border-slate-800">
              No price increase records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#070c18]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-right">Previous Price</th>
                    <th className="py-3 px-4 text-right">New Price</th>
                    <th className="py-3 px-4 text-right">Price Difference</th>
                    <th className="py-3 px-4">Date of Change</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                  {filteredIncreases.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-white">
                        <div>{item.name}</div>
                        <span className="text-[11px] font-normal text-slate-400 font-sans">{item.cat}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        <div>{formatNum(item.oldD)} D</div>
                        <span className="text-[11px] text-slate-500 font-sans">${formatNum(item.oldUsd)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        <div>{formatNum(item.newD)} D</div>
                        <span className="text-[11px] text-amber-300/80 font-sans">${formatNum(item.newUsd)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        <div>+{formatNum(item.deltaD)} D</div>
                        <span className="text-[11px] font-sans font-normal text-amber-300/70">+{item.percentage}%</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.date}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            onDeletePriceChange(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remove record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: PRICE DECREASE */}
      {(activeSection === 'all' || activeSection === 'decrease') && (
        <div className="bg-[#0b111e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>C. Price Decrease</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {filteredDecreases.length} Products
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Products whose supplier prices have dropped (Price Down / Markdowns)</p>
              </div>
            </div>
          </div>

          {filteredDecreases.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 bg-[#070c18] rounded-2xl border border-slate-800">
              No price decrease records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#070c18]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-right">Previous Price</th>
                    <th className="py-3 px-4 text-right">New Price</th>
                    <th className="py-3 px-4 text-right">Price Difference</th>
                    <th className="py-3 px-4">Date of Change</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                  {filteredDecreases.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-white">
                        <div>{item.name}</div>
                        <span className="text-[11px] font-normal text-slate-400 font-sans">{item.cat}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        <div>{formatNum(item.oldD)} D</div>
                        <span className="text-[11px] text-slate-500 font-sans">${formatNum(item.oldUsd)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        <div>{formatNum(item.newD)} D</div>
                        <span className="text-[11px] text-emerald-300/80 font-sans">${formatNum(item.newUsd)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        <div>{formatNum(item.deltaD)} D</div>
                        <span className="text-[11px] font-sans font-normal text-emerald-300/70">{item.percentage}%</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{item.date}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            onDeletePriceChange(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remove record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
