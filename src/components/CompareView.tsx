import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  ZoomIn, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Check, 
  Maximize2
} from 'lucide-react';
import { CompareItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface CompareViewProps {
  items: CompareItem[];
}

export const CompareView: React.FC<CompareViewProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('__all__');
  const [compareTray, setCompareTray] = useState<CompareItem[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [zoomScale, setZoomScale] = useState(1);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  const brands = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.brand) set.add(it.brand);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (selectedBrand !== '__all__') {
      list = list.filter(i => i.brand.toLowerCase() === selectedBrand.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q));
    }
    return list;
  }, [items, selectedBrand, searchTerm]);

  const currentItem = filteredItems[currentIndex] || items[0];

  const handleNext = () => {
    sound.playTick();
    setCurrentIndex(i => (i + 1) % Math.max(1, filteredItems.length));
  };

  const handlePrev = () => {
    sound.playTick();
    setCurrentIndex(i => (i - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
  };

  const toggleTrayItem = (item: CompareItem) => {
    sound.playTick();
    setCompareTray(prev => {
      const exists = prev.some(x => x.img === item.img);
      if (exists) {
        return prev.filter(x => x.img !== item.img);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), item];
        }
        return [...prev, item];
      }
    });
  };

  const openLightbox = (url: string, title: string) => {
    sound.playTick();
    setZoomScale(1);
    setLightboxUrl(url);
    setLightboxTitle(title);
  };

  const isCurrentInTray = currentItem && compareTray.some(x => x.img === currentItem.img);

  return (
    <div className="w-full space-y-6">
      
      {/* Top Banner & Search Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-cyan-400" />
              <span>Screen Packaging & Hardware Visual Comparison</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
              Inspect original screen packages, connector pinouts, barcodes, and markings (Redmi, Oppo, Moto, ZTE, etc.).
            </p>
          </div>

          {compareTray.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOverlay(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-950/50 hover:brightness-110 transition-all shrink-0"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Compare Side-by-Side ({compareTray.length} Screens)</span>
            </button>
          )}
        </div>

        {/* Search & Brands filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search screen model (e.g., Redmi 12c, Oppo A54, Moto G22)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white font-medium outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => { setSelectedBrand('__all__'); setCurrentIndex(0); }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                selectedBrand === '__all__'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white font-medium'
              }`}
            >
              All Brands ({items.length})
            </button>
            {brands.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => { setSelectedBrand(b); setCurrentIndex(0); }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                  selectedBrand.toLowerCase() === b.toLowerCase()
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Inspection View */}
      {filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl text-slate-500 font-medium">
          No screen photos found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          
          {/* Main Visual Display (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
                    {currentItem.brand} · Screen #{currentIndex + 1} of {filteredItems.length}
                  </span>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1">
                    {currentItem.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTrayItem(currentItem)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    isCurrentInTray
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Check className={`w-4 h-4 ${isCurrentInTray ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{isCurrentInTray ? 'In Comparison Tray' : '+ Add to Compare'}</span>
                </button>
              </div>

              {/* Image Container with Zoom */}
              <div 
                onClick={() => openLightbox(currentItem.url, currentItem.name)}
                className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden cursor-zoom-in group flex items-center justify-center p-3"
              >
                {imageErrorMap[currentItem.img] ? (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div className="text-sm font-bold text-slate-300">{currentItem.name}</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Google Drive image link is restricted. Set your Google Drive file or folder to <span className="text-slate-300 font-semibold">"Anyone with the link can view"</span> to view photos automatically.
                    </p>
                  </div>
                ) : (
                  <img
                    referrerPolicy="no-referrer"
                    src={currentItem.url}
                    alt={currentItem.name}
                    onError={() => {
                      setImageErrorMap(prev => ({ ...prev, [currentItem.img]: true }));
                    }}
                    className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 select-none"
                  />
                )}

                <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 shadow-md">
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Click to Zoom & Inspect</span>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-bold text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-xs sm:text-sm text-slate-400 font-bold">
                {currentIndex + 1} / {filteredItems.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-bold text-slate-300 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Side Comparison Tray */}
          <div className="space-y-4">
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Comparison Tray</span>
                <span className="text-xs font-mono text-cyan-400 font-bold">{compareTray.length} / 4 Screens</span>
              </div>

              {compareTray.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Select up to 4 models to compare side-by-side on screen.
                </div>
              ) : (
                <div className="space-y-2">
                  {compareTray.map(t => (
                    <div key={t.img} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-slate-200 truncate">{t.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleTrayItem(t)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowOverlay(true)}
                    className="w-full mt-3 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md"
                  >
                    Open Side-by-Side Comparison Window →
                  </button>
                </div>
              )}
            </div>

            {/* Quick List */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Available Screens ({filteredItems.length})
              </span>
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
                {filteredItems.map((item, idx) => (
                  <button
                    key={item.img}
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setCurrentIndex(idx);
                    }}
                    className={`w-full p-2.5 text-left text-xs rounded-xl transition-colors flex items-center justify-between ${
                      idx === currentIndex ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono text-[10.5px] text-slate-500 shrink-0">{item.brand}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Side-by-Side Comparative Grid Modal */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Side-by-Side Screen Hardware Comparison</h3>
              <p className="text-xs text-slate-400">Inspect packaging details, flex cable positions, and connectors</p>
            </div>
            <button
              type="button"
              onClick={() => setShowOverlay(false)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 my-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto">
            {compareTray.map(item => (
              <div key={item.img} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                <div 
                  onClick={() => openLightbox(item.url, item.name)}
                  className="aspect-square rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-center p-3 cursor-zoom-in overflow-hidden"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={() => {
                      setImageErrorMap(prev => ({ ...prev, [item.img]: true }));
                    }}
                  />
                </div>
                <div className="mt-3 text-center">
                  <div className="font-bold text-sm text-white truncate">{item.name}</div>
                  <div className="font-mono text-xs text-cyan-400 uppercase mt-0.5">{item.brand}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800">
            Click any image to open full resolution zoom view.
          </div>
        </div>
      )}

      {/* Lightbox Modal with Zoom */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between text-slate-200">
            <span className="font-bold text-sm sm:text-base">{lightboxTitle}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale(s => Math.min(3.5, s + 0.4))}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
            <img
              referrerPolicy="no-referrer"
              src={lightboxUrl}
              alt={lightboxTitle}
              style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.2s' }}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl select-none"
            />
          </div>

          <div className="text-center text-xs font-mono text-slate-500">
            Use pinch or zoom controls to inspect screen flex ribbon and chips
          </div>
        </div>
      )}

    </div>
  );
};
