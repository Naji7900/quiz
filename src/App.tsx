/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WifiOff, Download, Database, BookOpen, Layers } from 'lucide-react';
import { TopNav } from './components/TopNav';
import { ProListView } from './components/ProListView';
import { QuizView } from './components/QuizView';
import { CompareView } from './components/CompareView';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { InstallModal } from './components/InstallModal';
import { 
  INITIAL_DATA, 
  INITIAL_COMPAT, 
  INITIAL_CHANGES, 
  INITIAL_COMPARE_ITEMS, 
  getAllFlattenedParts, 
  SparePartItem, 
  CompatItem, 
  CompareItem, 
  ChangeItem 
} from './data/initialData';
import { GoogleSheetsService } from './services/googleSheetsService';
import { sound } from './services/soundService';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState<'prolist' | 'quiz' | 'compare'>('prolist');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => sound.getMuted());
  const [currentStreak, setCurrentStreak] = useState(0);

  const isOnline = useOnlineStatus();

  // Database State
  const [parts, setParts] = useState<SparePartItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) {
      return [];
    }
    const custom = GoogleSheetsService.getCustomParts();
    return custom.length > 0 ? custom : getAllFlattenedParts(INITIAL_DATA);
  });

  const [compatList, setCompatList] = useState<CompatItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) return [];
    return INITIAL_COMPAT;
  });
  const [changesList, setChangesList] = useState<ChangeItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) return [];
    return INITIAL_CHANGES;
  });
  const [compareItems, setCompareItems] = useState<CompareItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) return [];
    const config = GoogleSheetsService.getSavedConfig();
    return config.liveCompareItems.length > 0 ? config.liveCompareItems : INITIAL_COMPARE_ITEMS;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return GoogleSheetsService.getSavedConfig().lastSyncedAt;
  });

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setSoundMuted(next);
  };

  // Add new part locally
  const handleAddPart = (newPartData: Omit<SparePartItem, 'id'>) => {
    const newPart: SparePartItem = {
      ...newPartData,
      id: `custom-${Date.now()}`
    };
    const updated = [newPart, ...parts];
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);
  };

  // Handle Google Sheet live sync completion
  const handleDataSynced = (newParts: SparePartItem[], newCompare?: CompareItem[]) => {
    setParts(newParts);
    if (newCompare && newCompare.length) {
      setCompareItems(newCompare);
    }
    const syncedTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    setLastSyncedAt(syncedTime);
    GoogleSheetsService.saveCustomParts(newParts);
    GoogleSheetsService.saveConfig({
      lastSyncedAt: syncedTime,
      liveCompareItems: newCompare || [],
      isFormattedEmpty: false
    });
  };

  // Format database completely (clean slate 0 products for new upload)
  const handleFormatDatabase = () => {
    setParts([]);
    setCompatList([]);
    setChangesList([]);
    setCompareItems([]);
    setLastSyncedAt(null);
    GoogleSheetsService.formatAllData();
  };

  // Reset database back to factory snapshot
  const handleResetToDefault = () => {
    const base = getAllFlattenedParts(INITIAL_DATA);
    setParts(base);
    setCompatList(INITIAL_COMPAT);
    setChangesList(INITIAL_CHANGES);
    setCompareItems(INITIAL_COMPARE_ITEMS);
    setLastSyncedAt(null);
    GoogleSheetsService.restoreDefaultData();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 w-full overflow-x-hidden">
      
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalProductsCount={parts.length}
        lastSyncedAt={lastSyncedAt}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        currentStreak={currentStreak}
      />

      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="bg-amber-600/95 text-white py-2.5 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md w-full">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — All spare parts, prices, and quizzes are running locally on your device with no internet needed!</span>
        </div>
      )}

      {/* Full Page Content Area - Expands on PC for maximum clarity */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-5 sm:py-7">
        {activeTab === 'prolist' && (
          <ProListView
            parts={parts}
            compatList={compatList}
            onAddPart={handleAddPart}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onRestoreDefault={handleResetToDefault}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            parts={parts}
            compatList={compatList}
            changesList={changesList}
            onStreakUpdate={setCurrentStreak}
          />
        )}

        {activeTab === 'compare' && (
          <CompareView
            items={compareItems}
          />
        )}
      </main>

      {/* Google Sheet Database Modal */}
      <GoogleSheetModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        parts={parts}
        compatList={compatList}
        compareList={compareItems}
        onDataSynced={handleDataSynced}
        onResetToDefault={handleResetToDefault}
        onFormatDatabase={handleFormatDatabase}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Install Modal (Android & Windows) */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Clean, quiet full-width footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-6 text-center text-xs text-slate-500 w-full mt-auto">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Reer Hassan</span>
            <span aria-hidden="true">·</span>
            <span className="font-normal text-slate-400">Spare Parts Mastery Suite</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400 font-medium">{parts.length} Spare Parts</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400 font-medium">1 USD = 3.67 AED</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap justify-center">
            <button 
              type="button" 
              onClick={() => setIsInstallModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install on Android / Windows</span>
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setIsDbModalOpen(true)}
              className="hover:text-white transition-colors font-semibold"
            >
              1-Sheet Google Sheet Database
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('quiz')}
              className="hover:text-white transition-colors font-semibold"
            >
              Quiz Practice
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('compare')}
              className="hover:text-white transition-colors font-semibold"
            >
              Compare Screens
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
