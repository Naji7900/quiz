import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Hand, 
  Columns, 
  Grid, 
  Maximize2, 
  ExternalLink, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Eye, 
  Link as LinkIcon,
  Upload,
  AlertTriangle,
  Move,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PhotoItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface PhotosViewProps {
  photos: PhotoItem[];
  onAddPhoto: (photo: Omit<PhotoItem, 'id' | 'createdAt'>) => void;
  onUpdatePhoto: (id: string, updated: Partial<PhotoItem>) => void;
  onDeletePhoto: (id: string) => void;
}

type CompareMode = '1x' | '2x' | '3x' | '4x';

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export const PhotosView: React.FC<PhotosViewProps> = ({
  photos,
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('__all__');
  const [compareMode, setCompareMode] = useState<CompareMode>('2x');
  const [showListPanel, setShowListPanel] = useState(true);
  const [syncPanZoom, setSyncPanZoom] = useState(false);

  // Selected photo indices for each slot (up to 4 slots)
  const [slotIndices, setSlotIndices] = useState<number[]>([0, 1, 2, 3]);
  const [activeSlotTarget, setActiveSlotTarget] = useState<number>(0);

  // Independent viewport state per slot (zoom, panX, panY)
  const [viewports, setViewports] = useState<ViewportState[]>([
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 }
  ]);

  // Dragging state
  const isDraggingRef = useRef<{ slot: number; startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState<number | null>(null);

  // In-app safe deletion modal
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formBrand, setFormBrand] = useState('Redmi');
  const [formDescription, setFormDescription] = useState('');
  const [formLink, setFormLink] = useState('');

  // Extract brands for filter pills
  const brands = useMemo(() => {
    const set = new Set<string>();
    photos.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [photos]);

  // Filtered photos list (name list only)
  const filteredPhotos = useMemo(() => {
    let list = [...photos];
    if (selectedBrand !== '__all__') {
      list = list.filter(p => (p.brand || '').toLowerCase() === selectedBrand.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.brand || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [photos, selectedBrand, searchTerm]);

  // Ensure slot indices stay within valid range
  useEffect(() => {
    if (filteredPhotos.length === 0) return;
    setSlotIndices(prev => prev.map((idx, i) => {
      if (idx >= filteredPhotos.length) {
        return i % filteredPhotos.length;
      }
      return idx;
    }));
  }, [filteredPhotos.length]);

  // Get active photo for a given slot
  const getPhotoForSlot = (slotIdx: number): PhotoItem | undefined => {
    const listIndex = slotIndices[slotIdx] ?? 0;
    return filteredPhotos[listIndex] || photos[listIndex % Math.max(1, photos.length)] || photos[0];
  };

  // Next & Back Navigation handlers
  const handleNext = useCallback((slotIdx?: number) => {
    if (filteredPhotos.length === 0) return;
    sound.playTick();
    const target = slotIdx !== undefined ? slotIdx : activeSlotTarget;
    setSlotIndices(prev => {
      const next = [...prev];
      const cur = next[target] ?? 0;
      next[target] = (cur + 1) % filteredPhotos.length;
      return next;
    });
  }, [filteredPhotos.length, activeSlotTarget]);

  const handlePrev = useCallback((slotIdx?: number) => {
    if (filteredPhotos.length === 0) return;
    sound.playTick();
    const target = slotIdx !== undefined ? slotIdx : activeSlotTarget;
    setSlotIndices(prev => {
      const next = [...prev];
      const cur = next[target] ?? 0;
      next[target] = (cur - 1 + filteredPhotos.length) % filteredPhotos.length;
      return next;
    });
  }, [filteredPhotos.length, activeSlotTarget]);

  // Keyboard navigation support: Left / Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.key === 'ArrowRight' || e.key === 'l') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Zoom handlers
  const handleZoomChange = (slotIdx: number, newZoom: number) => {
    const clampedZoom = Math.max(0.5, Math.min(5, Number(newZoom.toFixed(2))));
    setViewports(prev => {
      if (syncPanZoom) {
        return prev.map(vp => ({ ...vp, zoom: clampedZoom }));
      }
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], zoom: clampedZoom };
      return next;
    });
  };

  const handleZoomIn = (slotIdx: number) => {
    sound.playTick();
    const current = viewports[slotIdx]?.zoom || 1;
    handleZoomChange(slotIdx, current + 0.25);
  };

  const handleZoomOut = (slotIdx: number) => {
    sound.playTick();
    const current = viewports[slotIdx]?.zoom || 1;
    handleZoomChange(slotIdx, current - 0.25);
  };

  const handleResetZoomPan = (slotIdx?: number) => {
    sound.playTick();
    setViewports(prev => {
      if (slotIdx === undefined || syncPanZoom) {
        return prev.map(() => ({ zoom: 1, panX: 0, panY: 0 }));
      }
      const next = [...prev];
      next[slotIdx] = { zoom: 1, panX: 0, panY: 0 };
      return next;
    });
  };

  // Mouse / Touch Drag Handlers ("Hand Move")
  const startDrag = (slotIdx: number, clientX: number, clientY: number) => {
    const vp = viewports[slotIdx] || { zoom: 1, panX: 0, panY: 0 };
    isDraggingRef.current = {
      slot: slotIdx,
      startX: clientX,
      startY: clientY,
      initialPanX: vp.panX,
      initialPanY: vp.panY
    };
    setIsCurrentlyDragging(slotIdx);
  };

  const onMouseDown = (slotIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(slotIdx, e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const { slot, startX, startY, initialPanX, initialPanY } = isDraggingRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    setViewports(prev => {
      if (syncPanZoom) {
        return prev.map(vp => ({
          ...vp,
          panX: initialPanX + deltaX,
          panY: initialPanY + deltaY
        }));
      }
      const next = [...prev];
      next[slot] = {
        ...next[slot],
        panX: initialPanX + deltaX,
        panY: initialPanY + deltaY
      };
      return next;
    });
  };

  const endDrag = () => {
    isDraggingRef.current = null;
    setIsCurrentlyDragging(null);
  };

  // Touch Drag
  const onTouchStart = (slotIdx: number, e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(slotIdx, e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const { slot, startX, startY, initialPanX, initialPanY } = isDraggingRef.current;
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;

    setViewports(prev => {
      if (syncPanZoom) {
        return prev.map(vp => ({
          ...vp,
          panX: initialPanX + deltaX,
          panY: initialPanY + deltaY
        }));
      }
      const next = [...prev];
      next[slot] = {
        ...next[slot],
        panX: initialPanX + deltaX,
        panY: initialPanY + deltaY
      };
      return next;
    });
  };

  // Mouse Wheel Zoom
  const onWheel = (slotIdx: number, e: React.WheelEvent) => {
    e.preventDefault();
    const current = viewports[slotIdx]?.zoom || 1;
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoomChange(slotIdx, current + delta);
  };

  // Add / Edit handlers
  const handleOpenAdd = () => {
    sound.playTick();
    setEditingPhoto(null);
    setFormName('');
    setFormUrl('');
    setFormBrand('Redmi');
    setFormDescription('');
    setFormLink('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: PhotoItem) => {
    sound.playTick();
    setEditingPhoto(p);
    setFormName(p.name);
    setFormUrl(p.url);
    setFormBrand(p.brand || 'Redmi');
    setFormDescription(p.description || '');
    setFormLink(p.link || '');
    setShowAddModal(true);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    sound.playVictory();
    if (editingPhoto) {
      onUpdatePhoto(editingPhoto.id, {
        name: formName.trim(),
        url: formUrl.trim(),
        brand: formBrand.trim(),
        description: formDescription.trim(),
        link: formLink.trim()
      });
    } else {
      onAddPhoto({
        name: formName.trim(),
        url: formUrl.trim(),
        brand: formBrand.trim(),
        description: formDescription.trim(),
        link: formLink.trim()
      });
    }
    setShowAddModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormUrl(result);
        if (!formName.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setFormName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Visible slots count based on compareMode
  const visibleSlotCount = compareMode === '1x' ? 1 : compareMode === '2x' ? 2 : compareMode === '3x' ? 3 : 4;

  return (
    <div 
      className="w-full space-y-4 animate-in fade-in duration-150 select-none"
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchEnd={endDrag}
    >
      
      {/* Top Utility Header Bar */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 shrink-0">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                LCD Inspection & Multi-Compare
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/40">
                Hand Move Active
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Screen Pinout & Connector Inspector
            </h2>
          </div>
        </div>

        {/* Global Toolbar: Compare Modes, Zoom Sync, Reset, Add Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Mode Switcher: 1x, 2x, 3x, 4x */}
          <div className="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase font-mono hidden sm:inline">
              Compare:
            </span>
            {(['1x', '2x', '3x', '4x'] as CompareMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => { sound.playTick(); setCompareMode(mode); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  compareMode === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={
                  mode === '1x' ? 'Single Screen Inspection' :
                  mode === '2x' ? 'Double Compare (2 Screens)' :
                  mode === '3x' ? 'Triple Compare (3 Screens)' : 'Quad Compare (4 Screens)'
                }
              >
                {mode === '1x' ? 'Single' : mode === '2x' ? '2-Way' : mode === '3x' ? '3-Way' : '4-Way'}
              </button>
            ))}
          </div>

          {/* Back & Next Navigation Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => handlePrev()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Previous Screen Model (ArrowLeft)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="text-[11px] font-mono text-cyan-300 px-2 font-bold whitespace-nowrap">
              {(slotIndices[activeSlotTarget] ?? 0) + 1} / {filteredPhotos.length}
            </span>

            <button
              type="button"
              onClick={() => handleNext()}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-cyan-950/50"
              title="Next Screen Model (ArrowRight)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Pan & Zoom Toggle */}
          {visibleSlotCount > 1 && (
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setSyncPanZoom(!syncPanZoom);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                syncPanZoom
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
              title="Synchronize Pan & Zoom across all comparison screens"
            >
              <Move className="w-3.5 h-3.5" />
              <span>{syncPanZoom ? 'Sync Locked' : 'Sync Move'}</span>
            </button>
          )}

          {/* Reset All Pan/Zoom */}
          <button
            type="button"
            onClick={() => handleResetZoomPan()}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Reset All Zooms & Pans to Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Zoom</span>
          </button>

          {/* Toggle Name List Panel */}
          <button
            type="button"
            onClick={() => setShowListPanel(!showListPanel)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            title={showListPanel ? 'Hide Name List Panel' : 'Show Name List Panel'}
          >
            {showListPanel ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="hidden md:inline">{showListPanel ? 'Hide List' : 'Show List'}</span>
          </button>

          {/* + Add New Screen Model */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Screen</span>
          </button>

        </div>

      </div>

      {/* Main Split Layout: Left Name List + Right Inspection Bench */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        
        {/* ================= LEFT SIDE: NAME LIST ONLY (NO PHOTO CARDS) ================= */}
        {showListPanel && (
          <aside className="w-full lg:w-80 xl:w-96 bg-[#0b111e] border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col space-y-3 shrink-0 max-h-[820px] overflow-hidden">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Screen Models List
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold">
                  {filteredPhotos.length}
                </span>
              </div>

              {visibleSlotCount > 1 && (
                <div className="text-[10px] font-mono text-slate-400">
                  Target: <strong className="text-cyan-400">Slot {activeSlotTarget + 1}</strong>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search screen model name..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 outline-none font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Brand Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedBrand('__all__')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBrand === '__all__'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All Brands
              </button>
              {brands.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBrand.toLowerCase() === b.toLowerCase()
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Slot Destination Switcher when in Multi-Compare */}
            {visibleSlotCount > 1 && (
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Clicking assigns to:</span>
                <div className="flex items-center gap-1">
                  {[...Array(visibleSlotCount)].map((_, s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveSlotTarget(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        activeSlotTarget === s
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Slot {s + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The Pure Name List */}
            <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[640px]">
              {filteredPhotos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No screen models found matching "{searchTerm}".
                </div>
              ) : (
                filteredPhotos.map((item, idx) => {
                  const isAssignedToAnySlot = slotIndices.slice(0, visibleSlotCount).includes(idx);
                  const isAssignedToActiveSlot = slotIndices[activeSlotTarget] === idx;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        sound.playTick();
                        setSlotIndices(prev => {
                          const next = [...prev];
                          next[activeSlotTarget] = idx;
                          return next;
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group flex items-center justify-between gap-2 ${
                        isAssignedToActiveSlot
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                          : isAssignedToAnySlot
                          ? 'bg-indigo-950/30 border-indigo-500/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white truncate block group-hover:text-cyan-300">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span className="text-cyan-400/90 font-medium">{item.brand || 'Screen'}</span>
                          {isAssignedToAnySlot && (
                            <span className="text-emerald-400 font-bold">
                              Slot {slotIndices.indexOf(idx) + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Actions: Edit & Delete */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Screen Info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoToDelete(item);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Screen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </aside>
        )}

        {/* ================= RIGHT SIDE: WORKBENCH (DOUBLE OR MORE COMPARE) ================= */}
        <main className="flex-1 w-full space-y-3">
          
          <div className={`grid gap-4 w-full ${
            compareMode === '1x'
              ? 'grid-cols-1'
              : compareMode === '2x'
              ? 'grid-cols-1 md:grid-cols-2'
              : compareMode === '3x'
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {[...Array(visibleSlotCount)].map((_, slotIdx) => {
              const currentPhoto = getPhotoForSlot(slotIdx);
              const vp = viewports[slotIdx] || { zoom: 1, panX: 0, panY: 0 };
              const isDraggingThisSlot = isCurrentlyDragging === slotIdx;

              return (
                <div 
                  key={slotIdx}
                  className={`bg-[#0b111e] border rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all ${
                    activeSlotTarget === slotIdx && visibleSlotCount > 1
                      ? 'border-cyan-400/80 ring-2 ring-cyan-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  
                  {/* Slot Top Bar: Product Dropdown Switcher & Zoom Tool */}
                  <div className="p-3 sm:p-3.5 bg-[#070c18] border-b border-slate-800 flex items-center justify-between gap-2">
                    
                    {/* Screen Selector Dropdown & Slot Back/Next Buttons */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {slotIdx + 1}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handlePrev(slotIdx)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors shrink-0"
                        title="Previous Screen Model"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <select
                        value={slotIndices[slotIdx] ?? 0}
                        onChange={(e) => {
                          const newIdx = parseInt(e.target.value, 10);
                          sound.playTick();
                          setSlotIndices(prev => {
                            const next = [...prev];
                            next[slotIdx] = newIdx;
                            return next;
                          });
                        }}
                        className="bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none truncate max-w-full cursor-pointer flex-1"
                      >
                        {filteredPhotos.map((p, pIdx) => (
                          <option key={p.id} value={pIdx}>
                            {p.name} ({p.brand || 'Screen'})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleNext(slotIdx)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors shrink-0"
                        title="Next Screen Model"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Per-Slot Zoom Controls */}
                    {/* Per-Slot Zoom Controls & Fit Display Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetZoomPan(slotIdx)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-500/50 cursor-pointer flex items-center gap-1 text-xs font-semibold transition-all shadow-sm active:scale-95"
                        title="Fit image to screen / display (100%)"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Fit Screen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoomOut(slotIdx)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono text-xs font-bold text-cyan-400 px-1 min-w-[42px] text-center">
                        {Math.round(vp.zoom * 100)}%
                      </span>

                      <button
                        type="button"
                        onClick={() => handleZoomIn(slotIdx)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetZoomPan(slotIdx)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 cursor-pointer"
                        title="Reset this screen"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                  </div>

                  {/* Interactive Inspection Canvas ("Hand Move" Drag + Wheel Zoom + Fit Display) */}
                  <div
                    onMouseDown={(e) => onMouseDown(slotIdx, e)}
                    onTouchStart={(e) => onTouchStart(slotIdx, e)}
                    onTouchMove={onTouchMove}
                    onWheel={(e) => onWheel(slotIdx, e)}
                    className={`relative w-full overflow-hidden bg-[#050811] flex items-center justify-center select-none ${
                      isDraggingThisSlot ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      compareMode === '1x' ? 'h-[620px] lg:h-[720px]' : 'h-[480px] lg:h-[580px]'
                    }`}
                  >
                    
                    {/* Floating Back Button on Canvas */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePrev(slotIdx); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/85 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90"
                      title="Previous Screen (ArrowLeft)"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Floating Next Button on Canvas */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNext(slotIdx); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/85 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90"
                      title="Next Screen (ArrowRight)"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Grid Blueprint Texture Background */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                      }}
                    />

                    {/* HUD Status Floating Badge with 1-Click Fit Display */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-auto">
                      <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
                        <Hand className="w-3 h-3 text-cyan-400" />
                        <span>Hand Move</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleResetZoomPan(slotIdx); }}
                        className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 backdrop-blur-md border border-cyan-500/50 text-[10px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        title="Fit image to screen"
                      >
                        <Maximize2 className="w-3 h-3 text-cyan-400" />
                        <span>Fit Display ({Math.round(vp.zoom * 100)}%)</span>
                      </button>
                    </div>

                    {/* Screen Image with Fluid Pan & Zoom Transform (Fit to Screen) */}
                    {currentPhoto?.url ? (
                      <div
                        style={{
                          transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom})`,
                          transformOrigin: 'center center',
                          transition: isDraggingThisSlot ? 'none' : 'transform 0.15s ease-out'
                        }}
                        className="w-full h-full flex items-center justify-center p-1 sm:p-2 pointer-events-none"
                      >
                        <img
                          src={currentPhoto.url}
                          alt={currentPhoto.name}
                          draggable={false}
                          className="w-auto h-auto max-w-full max-h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] select-none pointer-events-none transition-all duration-150"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 text-xs p-6 space-y-2">
                        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                        <p>No image loaded for this screen.</p>
                      </div>
                    )}

                    {/* Quick Drag & Wheel Hint */}
                    <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-70 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono bg-slate-950/80 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800">
                        Drag mouse to pan · Scroll wheel to zoom
                      </span>
                    </div>

                  </div>

                  {/* Clean Bottom Specification Details */}
                  {currentPhoto && (
                    <div className="p-3 bg-[#070c18] border-t border-slate-800 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">
                          {currentPhoto.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {currentPhoto.description || 'Original LCD module with connector flex cable.'}
                        </p>
                      </div>

                      {currentPhoto.link && (
                        <a
                          href={currentPhoto.link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <span>Ref Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </main>

      </div>

      {/* ================= MODAL: ADD / EDIT SCREEN MODEL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingPhoto ? 'Edit Screen Photo / Model' : 'Add Screen Model to Inspector'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold uppercase mb-1">
                  Screen Model Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. LCD REDMI NOTE 13 PRO 5G"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold uppercase mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Redmi"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold uppercase mb-1">
                    Upload Image
                  </label>
                  <label className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 cursor-pointer font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold uppercase mb-1">
                  Image Web URL (or uploaded base64) *
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://... or uploaded image"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white font-mono text-[11px] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold uppercase mb-1">
                  Reference Link (Optional)
                </label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://google.com/..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold uppercase mb-1">
                  Short Pinout Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details about flex cable connectors, IC markings, bezel size..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SAFE DELETE CONFIRMATION ================= */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border-2 border-rose-500/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Screen Model?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to remove <strong className="text-white">"{photoToDelete.name}"</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWrong();
                  onDeletePhoto(photoToDelete.id);
                  setPhotoToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
