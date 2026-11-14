import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  PackagePlus, 
  Search, 
  Calendar, 
  Trash2, 
  Sparkles,
  Filter,
  X,
  Plus,
  CheckCircle2,
  Building2,
  CheckSquare,
  ChevronDown,
  Eraser
} from 'lucide-react';
import { PriceChangeRecord, SparePartItem, AUTHENTIC_GOOGLE_SHEET_CATEGORIES } from '../data/initialData';
import { sound } from '../services/soundService';

interface PriceTrackerViewProps {
  priceChanges: PriceChangeRecord[];
  parts: SparePartItem[];
  onAddPriceChange?: (record: Omit<PriceChangeRecord, 'id'>) => void;
  onDeletePriceChange: (id: string) => void;
  onBulkDeletePriceChanges?: (ids: string[]) => void;
  onAddPart?: (part: Omit<SparePartItem, 'id'>, skipPriceTracker?: boolean) => void;
  onUpdatePart?: (id: string, updatedFields: Partial<SparePartItem>, skipPriceTracker?: boolean) => void;
  initialFilter?: 'all' | 'decrease' | 'increase' | 'new';
  initialOpenModal?: 'change' | 'new_product' | null;
}

export const PriceTrackerView: React.FC<PriceTrackerViewProps> = ({
  priceChanges,
  parts = [],
  onAddPriceChange,
  onDeletePriceChange,
  onBulkDeletePriceChanges,
  onAddPart,
  onUpdatePart,
  initialFilter = 'all',
  initialOpenModal = null
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'new' | 'increase' | 'decrease'>(initialFilter || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Row selection & inline Add dropdown menu state
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [openAddMenuSection, setOpenAddMenuSection] = useState<'new' | 'increase' | 'decrease' | null>(null);

  // Add Product / Price Change Modal State
  const [showAddModal, setShowAddModal] = useState(Boolean(initialOpenModal));
  const [modalMode, setModalMode] = useState<'new' | 'increase' | 'decrease'>(
    initialOpenModal === 'new_product' ? 'new' : 'increase'
  );
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [rowNewPriceD, setRowNewPriceD] = useState('');
  const [customNewPriceD, setCustomNewPriceD] = useState('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setActiveSection(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (initialOpenModal) {
      setModalMode(initialOpenModal === 'new_product' ? 'new' : 'increase');
      setShowAddModal(true);
    }
  }, [initialOpenModal]);

  const formatNum = (val: number) => {
    const r = Math.round(val * 10) / 10;
    return r === 0 && val !== 0 ? val.toFixed(2) : r.toFixed(1);
  };

  // Full list of categories (Google Sheet categories + any custom categories on parts)
  const allCatalogCategories = useMemo(() => {
    const set = new Set<string>(AUTHENTIC_GOOGLE_SHEET_CATEGORIES);
    parts.forEach(p => {
      if (p.cat && p.cat.trim()) set.add(p.cat.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parts]);

  // Live catalog search results for modal
  const matchingCatalogParts = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return [];
    return parts
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.companyName && p.companyName.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [parts, catalogSearch]);

  // Products inside the selected category
  const partsInSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const target = selectedCategory.trim().toLowerCase();
    return parts.filter(p => (p.cat || '').trim().toLowerCase() === target);
  }, [parts, selectedCategory]);

  const handleOpenAddModal = (defaultType?: 'new' | 'increase' | 'decrease') => {
    sound.playTick();
    setCatalogSearch('');
    setSelectedCategory('');
    setExpandedPartId(null);
    setRowNewPriceD('');
    setCustomNewPriceD('');
    setAddedNotice(null);
    setModalMode(defaultType || (activeSection === 'decrease' ? 'decrease' : activeSection === 'new' ? 'new' : 'increase'));
    setShowAddModal(true);
  };

  const handleToggleExpandPart = (part: SparePartItem) => {
    sound.playTick();
    if (expandedPartId === part.id) {
      setExpandedPartId(null);
      setRowNewPriceD('');
    } else {
      setExpandedPartId(part.id);
      setRowNewPriceD(String(part.d));
    }
  };

  const handleAddPartToPriceTracker = (part: SparePartItem, overridePriceStr?: string) => {
    const parsedNewD = overridePriceStr !== undefined && overridePriceStr.trim() !== ''
      ? parseFloat(overridePriceStr)
      : part.d;
    if (isNaN(parsedNewD) || parsedNewD < 0) return;

    const oldD = modalMode === 'new' ? 0 : part.d;
    const oldUsd = Number((oldD / 3.67).toFixed(2));
    const newUsd = Number((parsedNewD / 3.67).toFixed(2));
    const deltaD = modalMode === 'new' ? parsedNewD : Math.round((parsedNewD - oldD) * 100) / 100;
    const percentage = modalMode === 'new'
      ? 100
      : (oldD > 0 ? Math.round(((parsedNewD - oldD) / oldD) * 1000) / 10 : 0);
    const today = new Date().toISOString().split('T')[0];

    onAddPriceChange?.({
      name: part.name,
      cat: part.cat,
      oldD,
      newD: parsedNewD,
      oldUsd,
      newUsd,
      type: modalMode,
      deltaD,
      percentage,
      date: today,
      note: part.companyName ? `Supplier: ${part.companyName}` : undefined
    });

    if (onUpdatePart) {
      onUpdatePart(
        part.id,
        {
          d: parsedNewD,
          usd: newUsd,
          salesPriceD: parsedNewD,
          changeType: modalMode === 'new' ? 'New Product' : modalMode === 'increase' ? 'Price Increase' : 'Price Decrease'
        },
        true
      );
    }

    sound.playVictory();
    setActiveSection(modalMode);
    setExpandedPartId(null);
    setRowNewPriceD('');
    const modeLabel = modalMode === 'new' ? 'New Products' : modalMode === 'increase' ? 'Price Increase' : 'Price Decrease';
    setAddedNotice(`Added "${part.name}" (${formatNum(parsedNewD)} D) to ${modeLabel}`);
  };

  const handleAddCustomSearchedProduct = () => {
    const cleanName = catalogSearch.trim();
    const parsedNewD = parseFloat(customNewPriceD);
    if (!cleanName || isNaN(parsedNewD) || parsedNewD < 0) return;

    const cleanCat = selectedCategory || allCatalogCategories[0] || 'Spare Parts';
    const newUsd = Number((parsedNewD / 3.67).toFixed(2));
    const today = new Date().toISOString().split('T')[0];

    onAddPriceChange?.({
      name: cleanName,
      cat: cleanCat,
      oldD: 0,
      newD: parsedNewD,
      oldUsd: 0,
      newUsd,
      type: modalMode,
      deltaD: parsedNewD,
      percentage: 100,
      date: today
    });

    if (modalMode === 'new' && onAddPart) {
      onAddPart(
        {
          name: cleanName,
          cat: cleanCat,
          d: parsedNewD,
          usd: newUsd,
          yuan: Number(((parsedNewD / 3.67) * 7.23).toFixed(2)),
          salesPrice: newUsd,
          salesPriceD: parsedNewD,
          expense: 0,
          isCustom: true,
          changeType: 'New Product',
          purchaseDate: today
        },
        true
      );
    }

    sound.playVictory();
    setActiveSection(modalMode);
    setCatalogSearch('');
    setCustomNewPriceD('');
    const modeLabel = modalMode === 'new' ? 'New Products' : modalMode === 'increase' ? 'Price Increase' : 'Price Decrease';
    setAddedNotice(`Added "${cleanName}" (${formatNum(parsedNewD)} D) to ${modeLabel}`);
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

  const toggleSelectRecord = (id: string) => {
    sound.playTick();
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectSection = (list: PriceChangeRecord[]) => {
    sound.playTick();
    if (list.length === 0) return;
    const allSelected = list.every(item => selectedRecordIds.has(item.id));
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        list.forEach(item => next.delete(item.id));
      } else {
        list.forEach(item => next.add(item.id));
      }
      return next;
    });
  };

  const handleCleanSection = (list: PriceChangeRecord[]) => {
    sound.playTick();
    const selectedInList = list.filter(item => selectedRecordIds.has(item.id));
    const idsToDelete = (selectedInList.length > 0 ? selectedInList : list).map(item => item.id);
    if (idsToDelete.length === 0) {
      if (searchTerm || categoryFilter !== 'ALL') {
        setSearchTerm('');
        setCategoryFilter('ALL');
      }
      return;
    }

    if (onBulkDeletePriceChanges) {
      onBulkDeletePriceChanges(idsToDelete);
    } else {
      idsToDelete.forEach(id => onDeletePriceChange(id));
    }

    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      idsToDelete.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleAddSelectedToType = (list: PriceChangeRecord[], targetType: 'new' | 'increase' | 'decrease') => {
    const selectedItems = list.filter(item => selectedRecordIds.has(item.id));
    if (selectedItems.length === 0) {
      setOpenAddMenuSection(null);
      handleOpenAddModal(targetType);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    selectedItems.forEach(item => {
      onAddPriceChange?.({
        name: item.name,
        cat: item.cat,
        oldD: targetType === 'new' ? 0 : item.oldD,
        newD: item.newD,
        oldUsd: targetType === 'new' ? 0 : item.oldUsd,
        newUsd: item.newUsd,
        type: targetType,
        deltaD: targetType === 'new' ? item.newD : item.deltaD,
        percentage: targetType === 'new' ? 100 : item.percentage,
        date: today,
        note: item.note
      });
    });

    sound.playVictory();
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      selectedItems.forEach(item => next.delete(item.id));
      return next;
    });
    setOpenAddMenuSection(null);
    setActiveSection(targetType);
  };

  const renderSectionControlsBar = (
    sectionType: 'new' | 'increase' | 'decrease',
    list: PriceChangeRecord[]
  ) => {
    const selectedInSection = list.filter(item => selectedRecordIds.has(item.id));
    const allSelected = list.length > 0 && selectedInSection.length === list.length;
    const isMenuOpen = openAddMenuSection === sectionType;

    return (
      <div className="px-4 py-2.5 bg-slate-900/75 border-b border-slate-800 rounded-t-2xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleCleanSection(list)}
            disabled={list.length === 0 && !searchTerm && categoryFilter === 'ALL'}
            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title={selectedInSection.length > 0 ? 'Remove selected records' : 'Clean all records in this section'}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>
              {selectedInSection.length > 0 ? `Clean (${selectedInSection.length})` : 'Clean'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleSelectSection(list)}
            disabled={list.length === 0}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 ${
              allSelected || selectedInSection.length > 0
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {allSelected
                ? `Selected (${list.length})`
                : selectedInSection.length > 0
                ? `Select (${selectedInSection.length}/${list.length})`
                : 'Select'}
            </span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setOpenAddMenuSection(prev => (prev === sectionType ? null : sectionType));
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-400/50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-2xl bg-[#0b111e] border border-cyan-500/50 shadow-2xl z-30 p-1.5 space-y-1 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenAddMenuSection(null);
                    handleOpenAddModal('new');
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-cyan-500/15 text-left text-xs font-bold text-cyan-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <PackagePlus className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>- New Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenAddMenuSection(null);
                    handleOpenAddModal('increase');
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-amber-500/15 text-left text-xs font-bold text-amber-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>- Price Increase</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenAddMenuSection(null);
                    handleOpenAddModal('decrease');
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/15 text-left text-xs font-bold text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>- Price Decrease</span>
                </button>

                {selectedInSection.length > 0 && (
                  <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
                    <span className="block px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Add {selectedInSection.length} Selected To:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSelectedToType(list, 'new')}
                      className="w-full px-3 py-1.5 rounded-lg hover:bg-cyan-500/15 text-left text-[11px] font-semibold text-cyan-200 cursor-pointer"
                    >
                      + New Product ({selectedInSection.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSelectedToType(list, 'increase')}
                      className="w-full px-3 py-1.5 rounded-lg hover:bg-amber-500/15 text-left text-[11px] font-semibold text-amber-200 cursor-pointer"
                    >
                      + Price Increase ({selectedInSection.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSelectedToType(list, 'decrease')}
                      className="w-full px-3 py-1.5 rounded-lg hover:bg-emerald-500/15 text-left text-[11px] font-semibold text-emerald-200 cursor-pointer"
                    >
                      + Price Decrease ({selectedInSection.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          {selectedInSection.length > 0
            ? `${selectedInSection.length} of ${list.length} selected`
            : `${list.length} item${list.length === 1 ? '' : 's'}`}
        </span>
      </div>
    );
  };

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

          {/* Section Summary Badges + Add Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white border border-cyan-400/50 shadow-lg shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Product / Price</span>
            </button>

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
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
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
            <button
              type="button"
              onClick={() => handleOpenAddModal('new')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070c18]">
            {renderSectionControlsBar('new', filteredNew)}
            {filteredNew.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No new products recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredNew.length > 0 && filteredNew.every(i => selectedRecordIds.has(i.id))}
                          onChange={() => toggleSelectSection(filteredNew)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                          title="Select all in New Products"
                        />
                      </th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Registered Price D</th>
                      <th className="py-3 px-4 text-right">USD+</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                    {filteredNew.map(item => {
                      const isSelected = selectedRecordIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecord(item.id)}
                              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            <div>{item.name}</div>
                            {item.note && (
                              <span className="text-[11px] font-normal text-cyan-300/80">{item.note}</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: PRICE INCREASE */}
      {(activeSection === 'all' || activeSection === 'increase') && (
        <div className="bg-[#0b111e] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
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
            <button
              type="button"
              onClick={() => handleOpenAddModal('increase')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070c18]">
            {renderSectionControlsBar('increase', filteredIncreases)}
            {filteredIncreases.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No price increase records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredIncreases.length > 0 && filteredIncreases.every(i => selectedRecordIds.has(i.id))}
                          onChange={() => toggleSelectSection(filteredIncreases)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                          title="Select all in Price Increase"
                        />
                      </th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-right">Previous Price</th>
                      <th className="py-3 px-4 text-right">New Price</th>
                      <th className="py-3 px-4 text-right">Price Difference</th>
                      <th className="py-3 px-4">Date of Change</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                    {filteredIncreases.map(item => {
                      const isSelected = selectedRecordIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-amber-950/25' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecord(item.id)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            <div>{item.name}</div>
                            <span className="text-[11px] font-normal text-slate-400 font-sans block">{item.cat}</span>
                            {item.note && (
                              <span className="text-[11px] font-normal text-amber-300/80 font-sans block">{item.note}</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION C: PRICE DECREASE */}
      {(activeSection === 'all' || activeSection === 'decrease') && (
        <div className="bg-[#0b111e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
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
            <button
              type="button"
              onClick={() => handleOpenAddModal('decrease')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070c18]">
            {renderSectionControlsBar('decrease', filteredDecreases)}
            {filteredDecreases.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No price decrease records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredDecreases.length > 0 && filteredDecreases.every(i => selectedRecordIds.has(i.id))}
                          onChange={() => toggleSelectSection(filteredDecreases)}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                          title="Select all in Price Decrease"
                        />
                      </th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-right">Previous Price</th>
                      <th className="py-3 px-4 text-right">New Price</th>
                      <th className="py-3 px-4 text-right">Price Difference</th>
                      <th className="py-3 px-4">Date of Change</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-xs sm:text-sm">
                    {filteredDecreases.map(item => {
                      const isSelected = selectedRecordIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-950/25' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecord(item.id)}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            <div>{item.name}</div>
                            <span className="text-[11px] font-normal text-slate-400 font-sans block">{item.cat}</span>
                            {item.note && (
                              <span className="text-[11px] font-normal text-emerald-300/80 font-sans block">{item.note}</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD PRODUCT / PRICE TRACKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add to Price Tracker</h3>
                  <p className="text-xs text-slate-400">
                    Search a product or pick a category below to add to New Product, Price Increase, or Price Decrease
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addedNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{addedNotice}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAddedNotice(null)}
                  className="text-emerald-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {/* Div 1 (CSS 2): Search Product from Catalog */}
              <div className="p-3.5 rounded-2xl bg-[#070c18] border border-slate-700/80 space-y-2.5">
                <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Search Product from Catalog ({parts.length} parts)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Type product name, model, ID, or company..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {catalogSearch.trim() !== '' && (
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/70">
                    {matchingCatalogParts.length === 0 ? (
                      <div className="p-3 space-y-2">
                        <div className="text-xs text-slate-400">
                          No catalog product matches "{catalogSearch}".
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            value={customNewPriceD}
                            onChange={(e) => setCustomNewPriceD(e.target.value)}
                            placeholder="Price D (e.g. 25)"
                            className="w-32 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSearchedProduct}
                            disabled={!customNewPriceD.trim()}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add "{catalogSearch.trim()}"</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      matchingCatalogParts.map(part => {
                        const isExpanded = expandedPartId === part.id;
                        return (
                          <div key={part.id} className="hover:bg-slate-900/60 transition-colors">
                            <div
                              onClick={() => handleToggleExpandPart(part)}
                              className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white block truncate">{part.name}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <span>{part.cat}</span>
                                  {part.companyName && (
                                    <span className="text-cyan-300 flex items-center gap-0.5">
                                      <Building2 className="w-2.5 h-2.5" />
                                      {part.companyName}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right font-mono">
                                  <span className="text-xs font-bold text-cyan-300 block">{formatNum(part.d)} D</span>
                                  <span className="text-[10px] text-emerald-400">${formatNum(part.usd)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpandPart(part);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold cursor-pointer"
                                >
                                  {isExpanded ? 'Close' : 'Select'}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-3 pb-2.5 pt-1 flex flex-wrap items-center gap-2 bg-slate-900/80 border-t border-slate-800/80">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {modalMode === 'new' ? 'Price (D):' : `Old: ${formatNum(part.d)} D → New Price (D):`}
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  autoFocus
                                  value={rowNewPriceD}
                                  onChange={(e) => setRowNewPriceD(e.target.value)}
                                  placeholder={String(part.d)}
                                  className="w-24 bg-[#070c18] border border-cyan-500/60 focus:border-cyan-400 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddPartToPriceTracker(part, rowNewPriceD)}
                                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>
                                    Add to {modalMode === 'new' ? 'New Product' : modalMode === 'increase' ? 'Price Increase' : 'Price Decrease'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Div 2 (CSS 1): Record Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setModalMode('new');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      modalMode === 'new'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/70 font-bold'
                        : 'bg-[#070c18] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PackagePlus className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span className="block text-xs font-bold">New Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setModalMode('increase');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      modalMode === 'increase'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/70 font-bold'
                        : 'bg-[#070c18] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="block text-xs font-bold">Price Increase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setModalMode('decrease');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      modalMode === 'decrease'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/70 font-bold'
                        : 'bg-[#070c18] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="block text-xs font-bold">Price Decrease</span>
                  </button>
                </div>
              </div>

              {/* Div 3 (CSS 4): Full Category Dropdown & Product List inside Selected Category */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1 tracking-wider">
                    Category ({allCatalogCategories.length} Full Categories)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      sound.playTick();
                      setSelectedCategory(e.target.value);
                      setExpandedPartId(null);
                      setRowNewPriceD('');
                    }}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                  >
                    <option value="">-- Select Category ({allCatalogCategories.length} Categories) --</option>
                    {allCatalogCategories.map(cat => {
                      const count = parts.filter(p => (p.cat || '').trim().toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedCategory && (
                  <div className="rounded-2xl border border-slate-700/80 bg-[#070c18] overflow-hidden">
                    <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 truncate">{selectedCategory}</span>
                      <span className="font-mono text-slate-400 shrink-0">
                        {partsInSelectedCategory.length} products
                      </span>
                    </div>

                    {partsInSelectedCategory.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-slate-400">
                        No products found in "{selectedCategory}".
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                        {partsInSelectedCategory.map(part => {
                          const isExpanded = expandedPartId === part.id;
                          return (
                            <div key={part.id} className="hover:bg-slate-900/60 transition-colors">
                              <div
                                onClick={() => handleToggleExpandPart(part)}
                                className="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <span className="text-xs sm:text-sm font-bold text-white block truncate">
                                    {part.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                                    <span>{part.id}</span>
                                    {part.companyName && (
                                      <span className="text-cyan-300 flex items-center gap-0.5 font-sans">
                                        <Building2 className="w-2.5 h-2.5" />
                                        {part.companyName}
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <div className="text-right font-mono">
                                    <span className="text-xs font-bold text-cyan-300 block">{formatNum(part.d)} D</span>
                                    <span className="text-[10px] text-emerald-400">${formatNum(part.usd)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleExpandPart(part);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 text-xs font-bold cursor-pointer"
                                  >
                                    {isExpanded ? 'Close' : 'Select'}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-3.5 pb-3 pt-1.5 flex flex-wrap items-center gap-2 bg-slate-900/90 border-t border-slate-800/80">
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {modalMode === 'new' ? 'Price (D):' : `Old: ${formatNum(part.d)} D → New Price (D):`}
                                  </span>
                                  <input
                                    type="number"
                                    step="any"
                                    autoFocus
                                    value={rowNewPriceD}
                                    onChange={(e) => setRowNewPriceD(e.target.value)}
                                    placeholder={String(part.d)}
                                    className="w-24 bg-[#070c18] border border-cyan-500/60 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddPartToPriceTracker(part, rowNewPriceD)}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>
                                      Add to {modalMode === 'new' ? 'New Product' : modalMode === 'increase' ? 'Price Increase' : 'Price Decrease'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
