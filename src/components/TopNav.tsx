import { Volume2, VolumeX, Database, Download, Flame, Sparkles } from 'lucide-react';
import { sound } from '../services/soundService';

export type AppTab = 'prolist' | 'quiz' | 'photos' | 'compat' | 'pricetracker' | 'sheetdb';

interface TopNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  totalProductsCount: number;
  lastSyncedAt: string | null;
  onOpenDbModal: () => void;
  onOpenInstallModal: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  currentStreak: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  totalProductsCount,
  onOpenDbModal,
  onOpenInstallModal,
  soundMuted,
  onToggleSound,
  currentStreak
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800 w-full shadow-2xl">
      {/* Top Header Row */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        
        {/* Brand */}
        <div 
          onClick={() => { sound.playTick(); setActiveTab('prolist'); }}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-900/50 shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase font-sans">
                DO OR DIE
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[9px] sm:text-[10px] font-semibold border border-cyan-500/40">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300 font-normal">
              <span className="font-mono text-cyan-400 font-medium">{totalProductsCount} Parts</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium font-mono">1$ = 3.67 D</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Visible on lg+) */}
        <nav className="hidden lg:flex items-center gap-1 p-1.5 bg-[#0e1424] rounded-2xl border border-slate-700/80 shadow-inner overflow-x-auto">
          {[
            { id: 'prolist', label: 'Catalog' },
            { id: 'quiz', label: 'Quiz' },
            { id: 'photos', label: 'Photos' },
            { id: 'compat', label: 'Compatible LCDs' },
            { id: 'pricetracker', label: 'Price Tracker' },
            { id: 'sheetdb', label: 'Google Sheets DB' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { sound.playTick(); setActiveTab(tab.id as AppTab); }}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  {tab.id === 'quiz' && currentStreak > 2 && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-slate-950" />
                      <span>{currentStreak}</span>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Install Button */}
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md transition-all whitespace-nowrap border border-emerald-400/40 cursor-pointer"
            title="Download App on Mobile & Laptop"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Download App</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundMuted ? 'Muted' : 'Sound On'}
            title={soundMuted ? 'Muted' : 'Sound On'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

        </div>

      </div>

      {/* Sub-header Navigation Bar (Visible on mobile & tablets < lg) */}
      <div className="lg:hidden px-2.5 pb-2 pt-0.5 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 p-1 bg-[#0b101e] rounded-xl border border-slate-800 w-max min-w-full">
          {[
            { id: 'prolist', label: 'Catalog' },
            { id: 'quiz', label: 'Quiz' },
            { id: 'photos', label: 'Photos' },
            { id: 'compat', label: 'Compatible LCDs' },
            { id: 'pricetracker', label: 'Price Tracker' },
            { id: 'sheetdb', label: 'Google Sheets DB' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { sound.playTick(); setActiveTab(tab.id as AppTab); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-900/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

