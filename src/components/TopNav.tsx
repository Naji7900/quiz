import React from 'react';
import { Volume2, VolumeX, Database, Download, Flame, Sparkles } from 'lucide-react';
import { sound } from '../services/soundService';

interface TopNavProps {
  activeTab: 'prolist' | 'quiz' | 'compare';
  setActiveTab: (tab: 'prolist' | 'quiz' | 'compare') => void;
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
      <div className="w-full px-4 sm:px-8 xl:px-12 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-900/50 shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white uppercase font-sans">
                REER HASSAN
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/40">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-normal">
              <span className="font-mono text-cyan-400 font-medium">{totalProductsCount} Parts</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium font-mono">1$ = 3.67 D</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - 600 SemiBold */}
        <nav className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#0e1424] rounded-2xl border border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
          <button
            onClick={() => { sound.playTick(); setActiveTab('prolist'); }}
            className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm md:text-base font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'prolist'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Catalog
          </button>

          <button
            onClick={() => { sound.playTick(); setActiveTab('quiz'); }}
            className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm md:text-base font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 relative ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>Quiz</span>
              {currentStreak > 2 && (
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-md flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{currentStreak}</span>
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => { sound.playTick(); setActiveTab('compare'); }}
            className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm md:text-base font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'compare'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Photos
          </button>
        </nav>

        {/* Action Buttons - 600 SemiBold */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Install Button */}
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="flex items-center gap-2 px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-lg shadow-emerald-950/60 transition-all whitespace-nowrap border border-emerald-400/40"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Install</span>
          </button>

          {/* Sheet Sync Button */}
          <button
            type="button"
            onClick={onOpenDbModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all shadow-md whitespace-nowrap active:scale-95"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Sheet DB</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundMuted ? 'Muted' : 'Sound On'}
            title={soundMuted ? 'Muted' : 'Sound On'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors shrink-0"
          >
            {soundMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

        </div>

      </div>
    </header>
  );
};
