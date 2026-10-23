import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  Smartphone, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  List,
  LayoutGrid,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { CompatItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface CompatViewProps {
  compatList: CompatItem[];
  onAddCompat: (item: Omit<CompatItem, 'id'>) => void;
  onUpdateCompat: (id: string, updated: Partial<CompatItem>) => void;
  onDeleteCompat: (id: string) => void;
}

export const CompatView: React.FC<CompatViewProps> = ({
  compatList,
  onAddCompat,
  onUpdateCompat,
  onDeleteCompat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CompatItem | null>(null);

  // Quick Append Model State
  const [appendTargetId, setAppendTargetId] = useState<string | null>(null);
  const [newModelToAppend, setNewModelToAppend] = useState('');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<CompatItem | null>(null);

  // Form State
  const [lcdName, setLcdName] = useState('');
  const [fitsModels, setFitsModels] = useState('');
  const [note, setNote] = useState('');

  // Interactive Quick Compatibility Tester State
  const [testModel, setTestModel] = useState('');

  const filteredCompat = useMemo(() => {
    if (!searchTerm.trim()) return compatList;
    const q = searchTerm.trim().toLowerCase();
    return compatList.filter(item => 
      item.lcd.toLowerCase().includes(q) || 
      item.fits.toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q)
    );
  }, [compatList, searchTerm]);

  // Quick live match tester results
  const testResults = useMemo(() => {
    if (!testModel.trim()) return null;
    const q = testModel.trim().toLowerCase();
    return compatList.filter(item => 
      item.lcd.toLowerCase().includes(q) || 
      item.fits.toLowerCase().includes(q)
    );
  }, [compatList, testModel]);

  // Helper to parse multiple compatible models from a string
  const getModelsArray = (fitsStr: string): string[] => {
    return fitsStr
      .split(/[/,;+]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcdName.trim() || !fitsModels.trim()) {
      alert('Please enter both LCD name and compatible models.');
      return;
    }

    sound.playVictory();

    if (editingItem) {
      onUpdateCompat(editingItem.id, {
        lcd: lcdName.trim(),
        fits: fitsModels.trim(),
        note: note.trim()
      });
      setEditingItem(null);
    } else {
      onAddCompat({
        lcd: lcdName.trim(),
        fits: fitsModels.trim(),
        note: note.trim()
      });
    }

    // Reset Form
    setLcdName('');
    setFitsModels('');
    setNote('');
    setShowAddForm(false);
  };

  const handleStartEdit = (item: CompatItem) => {
    sound.playTick();
    setEditingItem(item);
    setLcdName(item.lcd);
    setFitsModels(item.fits);
    setNote(item.note || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setLcdName('');
    setFitsModels('');
    setNote('');
    setShowAddForm(false);
  };

  // Quick append an additional compatible phone model to an existing screen set
  const handleAppendModelSubmit = (item: CompatItem) => {
    if (!newModelToAppend.trim()) return;
    sound.playVictory();
    const updatedFits = `${item.fits} / ${newModelToAppend.trim()}`;
    onUpdateCompat(item.id, { fits: updatedFits });
    setNewModelToAppend('');
    setAppendTargetId(null);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    sound.playWrong();
    onDeleteCompat(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header Card */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/40">
                Cross-Device Compatibility Hub
              </span>
              <span className="text-xs font-mono text-slate-400">
                {compatList.length} Multi-Model Screen Sets
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <Layers className="w-7 h-7 text-cyan-400" />
              <span>Compatible LCDs List & Matrix</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
              A single screen can fit 3, 4, or more smartphone models. View in structured list format and add new compatible models anytime.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Switcher (List vs Grid) */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => { sound.playTick(); setViewMode('list'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Structured List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => { sound.playTick(); setViewMode('grid'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                if (showAddForm) {
                  handleCancel();
                } else {
                  setShowAddForm(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-cyan-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{showAddForm ? 'Close Form' : 'Add Compatible LCD'}</span>
            </button>
          </div>
        </div>

        {/* Quick Compatibility Tester Bar */}
        <div className="p-4 rounded-2xl bg-[#070c18] border border-cyan-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Instant Compatibility Tester:
              </span>
            </div>
            <span className="text-xs text-slate-400">Type any smartphone model to find all compatible LCD screens</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={testModel}
              onChange={(e) => setTestModel(e.target.value)}
              placeholder="e.g. Hot 60i, Spark 20, Realme Note 60, Smart 8, A60..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            {testModel && (
              <button
                type="button"
                onClick={() => setTestModel('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tester Match Feedback */}
          {testModel.trim() && (
            <div className="pt-1">
              {testResults && testResults.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Found {testResults.length} matching screen {testResults.length === 1 ? 'set' : 'sets'}:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {testResults.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{item.lcd}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">FITS ALL</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {getModelsArray(item.fits).map((m, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-500/30 font-mono font-medium text-[11px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  No exact match found for "{testModel}". You can add this compatible set using the "Add Compatible LCD" button above!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter screen list by name or compatible phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Reset Search
            </button>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT FORM ================= */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#0b1424] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Compatible LCD Set' : 'Add New Compatible LCD (3+ Models)'}
                </h3>
                <p className="text-xs text-slate-300">
                  Enter the primary LCD name and all phone models it fits (separated by slash / or comma).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                1. Base LCD Screen Name *
              </label>
              <input
                type="text"
                required
                value={lcdName}
                onChange={(e) => setLcdName(e.target.value)}
                placeholder="e.g. INFINIX HOT 60i"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                2. Compatible Phone Models (3 or more) *
              </label>
              <input
                type="text"
                required
                value={fitsModels}
                onChange={(e) => setFitsModels(e.target.value)}
                placeholder="e.g. TECNO KM4 / SPARK GO 2 / SMART 8 / ITEL A60"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1.5">
                3. Technical Note / IC Pinout (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Same display IC, same connector pinout, requires no modification."
                className="w-full px-4 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{editingItem ? 'Save Updates' : 'Add Compatible LCD'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= VIEW 1: STRUCTURED LIST VIEW (QAAB LIST AHAAN) ================= */}
      {viewMode === 'list' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#070c18] text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-slate-500">#</th>
                  <th className="py-3.5 px-4 w-64">Primary LCD Screen</th>
                  <th className="py-3.5 px-4">Compatible Phone Models (3+ Fits)</th>
                  <th className="py-3.5 px-4 w-44">Technical Note</th>
                  <th className="py-3.5 px-4 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {filteredCompat.map((item, index) => {
                  const models = getModelsArray(item.fits);
                  const isAppending = appendTargetId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-cyan-500/5 transition-colors group">
                      
                      {/* # Index */}
                      <td className="py-4 px-4 font-mono text-slate-500 font-bold text-xs">
                        {index + 1}
                      </td>

                      {/* Primary LCD */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 font-mono font-bold text-white text-sm sm:text-base">
                          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{item.lcd}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold tracking-wider mt-1 block">
                          Base Replacement Unit
                        </span>
                      </td>

                      {/* Compatible Models List (Supports 3, 4, 5+ models with clear badges) */}
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {models.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-semibold shadow-sm"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>{m}</span>
                              </span>
                            ))}

                            {/* Inline Button to add another compatible model */}
                            {!isAppending ? (
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playTick();
                                  setAppendTargetId(item.id);
                                  setNewModelToAppend('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                                title="Add another compatible model to this LCD"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Model</span>
                              </button>
                            ) : null}
                          </div>

                          {/* Quick Append Input form */}
                          {isAppending && (
                            <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-100">
                              <input
                                type="text"
                                autoFocus
                                value={newModelToAppend}
                                onChange={(e) => setNewModelToAppend(e.target.value)}
                                placeholder="Enter compatible model name (e.g. Spark 20 Pro)..."
                                className="px-3 py-1.5 text-xs bg-slate-900 border border-cyan-400 rounded-lg text-white font-mono focus:outline-none w-64"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAppendModelSubmit(item);
                                  } else if (e.key === 'Escape') {
                                    setAppendTargetId(null);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAppendModelSubmit(item)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAppendTargetId(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Technical Note */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {item.note || <span className="text-slate-600 italic">No custom notes</span>}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit compatible LCD set"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Delete this set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: CARDS GRID VIEW ================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompat.map((item, index) => {
            const models = getModelsArray(item.fits);
            return (
              <div
                key={item.id}
                className="group bg-[#0b111e] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {models.length} Compatible Models
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer border border-slate-700/60"
                        title="Edit set"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700/60"
                        title="Delete set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                      Screen Model:
                    </span>
                    <div className="text-base font-bold text-white font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/90 flex items-center justify-between">
                      <span>{item.lcd}</span>
                      <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-1 text-emerald-400 font-semibold text-xs gap-1.5">
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-mono uppercase text-[10px] tracking-widest font-bold">Fits All Models</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                      Compatible Phone Models:
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
                      {models.map((m, mIdx) => (
                        <span key={mIdx} className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.note && (
                    <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed italic">
                      Note: {item.note}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-cyan-400 font-semibold">Tested & Verified</span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    + Add More Models
                  </button>
                </div>
              </div>
            );
          })}
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
                <h3 className="font-bold text-white text-base">Confirm Delete Compatible LCD</h3>
                <p className="text-xs text-slate-400">Remove this compatibility record?</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Are you sure you want to delete compatibility for <strong>"{itemToDelete.lcd}"</strong>?
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
