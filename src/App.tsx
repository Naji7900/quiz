/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WifiOff, Download, Database, BookOpen, Layers } from 'lucide-react';
import { TopNav, AppTab } from './components/TopNav';
import { ProListView } from './components/ProListView';
import { QuizView } from './components/QuizView';
import { PhotosView } from './components/PhotosView';
import { CompatView } from './components/CompatView';
import { PriceTrackerView } from './components/PriceTrackerView';
import { SheetsDatabaseView } from './components/SheetsDatabaseView';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { InstallModal } from './components/InstallModal';
import { 
  INITIAL_DATA, 
  INITIAL_COMPAT, 
  INITIAL_CHANGES, 
  INITIAL_PHOTOS,
  INITIAL_PRICE_CHANGES,
  INITIAL_COMPARE_ITEMS,
  getAllFlattenedParts, 
  SparePartItem, 
  CompatItem, 
  PhotoItem,
  PriceChangeRecord,
  CompareItem, 
  ChangeItem 
} from './data/initialData';
import { GoogleSheetsService } from './services/googleSheetsService';
import { sound } from './services/soundService';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const STORAGE_KEY_PHOTOS = 'spareparts_photos_v2';
const STORAGE_KEY_COMPAT = 'spareparts_compat_v2';
const STORAGE_KEY_PRICE_CHANGES = 'spareparts_price_changes_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('prolist');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => sound.getMuted());
  const [currentStreak, setCurrentStreak] = useState(0);

  const isOnline = useOnlineStatus();

  // 1. Catalog Parts State
  const [parts, setParts] = useState<SparePartItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) {
      return [];
    }
    const custom = GoogleSheetsService.getCustomParts();
    return custom.length > 0 ? custom : getAllFlattenedParts(INITIAL_DATA);
  });

  // 2. Compatible LCDs State
  const [compatList, setCompatList] = useState<CompatItem[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPAT);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_COMPAT;
  });

  // 3. Photos State (Image upload, name, link, short description)
  const [photosList, setPhotosList] = useState<PhotoItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PHOTOS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_PHOTOS;
  });

  // 4. Product Price Changes State (Price Decrease & Price Increase)
  const [priceChanges, setPriceChanges] = useState<PriceChangeRecord[]>(() => {
    if (GoogleSheetsService.isFormattedEmpty()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRICE_CHANGES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_PRICE_CHANGES;
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

  // Add new catalog part & auto-send to Google Sheets if connected
  const handleAddPart = (newPartData: Omit<SparePartItem, 'id'>) => {
    const newPart: SparePartItem = {
      ...newPartData,
      id: `custom-${Date.now()}`
    };
    const updated = [newPart, ...parts];
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);

    // If connected to a Google Sheets Web App endpoint, automatically create new sheet and append row!
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && (config.sheetUrl.includes('/exec') || config.sheetUrl.includes('script.google.com'))) {
      GoogleSheetsService.appendToGoogleSheet(config.sheetUrl, newPart).then(res => {
        if (res.success) {
          console.log(res.message);
        }
      });
    }
  };

  // Compatible LCDs Handlers
  const handleAddCompat = (itemData: Omit<CompatItem, 'id'>) => {
    const newItem: CompatItem = {
      ...itemData,
      id: `compat-${Date.now()}`
    };
    const updated = [newItem, ...compatList];
    setCompatList(updated);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(updated));
  };

  const handleUpdateCompat = (id: string, updated: Partial<CompatItem>) => {
    const next = compatList.map(item => item.id === id ? { ...item, ...updated } : item);
    setCompatList(next);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(next));
  };

  const handleDeleteCompat = (id: string) => {
    const next = compatList.filter(item => item.id !== id);
    setCompatList(next);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(next));
  };

  // Photos Handlers
  const handleAddPhoto = (photoData: Omit<PhotoItem, 'id' | 'createdAt'>) => {
    const newPhoto: PhotoItem = {
      ...photoData,
      id: `photo-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newPhoto, ...photosList];
    setPhotosList(updated);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(updated));
  };

  const handleUpdatePhoto = (id: string, updated: Partial<PhotoItem>) => {
    const next = photosList.map(p => p.id === id ? { ...p, ...updated } : p);
    setPhotosList(next);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(next));
  };

  const handleDeletePhoto = (id: string) => {
    const next = photosList.filter(p => p.id !== id);
    setPhotosList(next);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(next));
  };

  // Price Changes Handlers
  const handleAddPriceChange = (recordData: Omit<PriceChangeRecord, 'id'>) => {
    const newRec: PriceChangeRecord = {
      ...recordData,
      id: `pc-${Date.now()}`
    };
    const updated = [newRec, ...priceChanges];
    setPriceChanges(updated);
    localStorage.setItem(STORAGE_KEY_PRICE_CHANGES, JSON.stringify(updated));
  };

  const handleDeletePriceChange = (id: string) => {
    const next = priceChanges.filter(p => p.id !== id);
    setPriceChanges(next);
    localStorage.setItem(STORAGE_KEY_PRICE_CHANGES, JSON.stringify(next));
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
    setPriceChanges([]);
    setCompareItems([]);
    setLastSyncedAt(null);
    localStorage.removeItem(STORAGE_KEY_COMPAT);
    localStorage.removeItem(STORAGE_KEY_PRICE_CHANGES);
    GoogleSheetsService.formatAllData();
  };

  // Reset database back to factory snapshot
  const handleResetToDefault = () => {
    const base = getAllFlattenedParts(INITIAL_DATA);
    setParts(base);
    setCompatList(INITIAL_COMPAT);
    setChangesList(INITIAL_CHANGES);
    setPhotosList(INITIAL_PHOTOS);
    setPriceChanges(INITIAL_PRICE_CHANGES);
    setCompareItems(INITIAL_COMPARE_ITEMS);
    setLastSyncedAt(null);
    localStorage.removeItem(STORAGE_KEY_COMPAT);
    localStorage.removeItem(STORAGE_KEY_PHOTOS);
    localStorage.removeItem(STORAGE_KEY_PRICE_CHANGES);
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
        
        {/* 1. Catalog Tab */}
        {activeTab === 'prolist' && (
          <ProListView
            parts={parts}
            compatList={compatList}
            onAddPart={handleAddPart}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onRestoreDefault={handleResetToDefault}
          />
        )}

        {/* 2. Quiz Tab with Green Category Product Viewer */}
        {activeTab === 'quiz' && (
          <QuizView
            parts={parts}
            compatList={compatList}
            changesList={changesList}
            onStreakUpdate={setCurrentStreak}
          />
        )}

        {/* 3. Photos Tab (Upload photo, name, link, short description, Add button) */}
        {activeTab === 'photos' && (
          <PhotosView
            photos={photosList}
            onAddPhoto={handleAddPhoto}
            onUpdatePhoto={handleUpdatePhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {/* 4. Compatible LCDs Tab (Add & Edit compatible LCD names) */}
        {activeTab === 'compat' && (
          <CompatView
            compatList={compatList}
            onAddCompat={handleAddCompat}
            onUpdateCompat={handleUpdateCompat}
            onDeleteCompat={handleDeleteCompat}
          />
        )}

        {/* 5. Product Price Changes Tracker Tab (Price Decrease & Price Increase) */}
        {activeTab === 'pricetracker' && (
          <PriceTrackerView
            priceChanges={priceChanges}
            parts={parts}
            onAddPriceChange={handleAddPriceChange}
            onDeletePriceChange={handleDeletePriceChange}
          />
        )}

        {/* 6. Google Sheets Database Tab */}
        {activeTab === 'sheetdb' && (
          <SheetsDatabaseView
            parts={parts}
            compatList={compatList}
            compareList={compareItems}
            onDataSynced={handleDataSynced}
            onResetToDefault={handleResetToDefault}
            onFormatDatabase={handleFormatDatabase}
            lastSyncedAt={lastSyncedAt}
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
            <span className="font-bold text-white tracking-wide uppercase">Do or Die</span>
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
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download App (Mobile & Laptop)</span>
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('sheetdb')}
              className="hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Google Sheets Database
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('quiz')}
              className="hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Quiz Practice
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('photos')}
              className="hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Photos Hub
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('compat')}
              className="hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Compatible LCDs
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button" 
              onClick={() => setActiveTab('pricetracker')}
              className="hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Price Tracker
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
