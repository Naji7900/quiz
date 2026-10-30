/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Download, Database, BookOpen, Layers, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';
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
    const sourceParts = custom.length > 0 ? custom : getAllFlattenedParts(INITIAL_DATA);
    return sourceParts.map(p => {
      const isOld13 = p.salesPrice && p.usd && Math.abs(p.salesPrice - Number((p.usd * 1.3).toFixed(2))) < 0.05;
      const salesPrice = isOld13 || !p.salesPrice ? p.usd : p.salesPrice;
      return {
        ...p,
        salesPrice,
        salesPriceD: Number((salesPrice * 3.67).toFixed(1))
      };
    });
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

  const [isSyncingFromSheet, setIsSyncingFromSheet] = useState(false);

  // Auto-sync on startup so Catalog and Quiz strictly reflect Google Sheet "ALL PRODUCT"
  useEffect(() => {
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl) {
      setIsSyncingFromSheet(true);
      GoogleSheetsService.syncFromSheet(config.sheetUrl)
        .then(({ parts: syncedParts, photos: syncedPhotos, compat: syncedCompat, compareItems: syncedCompare }) => {
          if (syncedParts.length > 0) {
            handleDataSynced(syncedParts, syncedCompare, syncedPhotos, syncedCompat);
            console.log(`Auto-synced ${syncedParts.length} parts from Google Sheet "ALL PRODUCT"`);
          }
        })
        .catch(err => {
          console.warn('Initial Google Sheet sync notice (using cached data):', err);
        })
        .finally(() => {
          setIsSyncingFromSheet(false);
        });
    }
  }, []);

  // Quick 1-click sync from Google Sheet "ALL PRODUCT"
  const handleQuickSync = async () => {
    const config = GoogleSheetsService.getSavedConfig();
    if (!config.sheetUrl) {
      setIsDbModalOpen(true);
      return;
    }
    setIsSyncingFromSheet(true);
    sound.playTick();
    try {
      const { parts: syncedParts, photos: syncedPhotos, compat: syncedCompat, compareItems: syncedCompare } = await GoogleSheetsService.syncFromSheet(config.sheetUrl);
      if (syncedParts.length > 0) {
        handleDataSynced(syncedParts, syncedCompare, syncedPhotos, syncedCompat);
        sound.playVictory();
      }
    } catch (e) {
      sound.playWrong();
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncingFromSheet(false);
    }
  };

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

    // Automatically record in Price Tracker as New Product Arrival (Cusub)
    const today = new Date().toISOString().split('T')[0];
    const newRec: PriceChangeRecord = {
      id: `pc-${Date.now()}`,
      name: newPart.name,
      cat: newPart.cat,
      oldD: 0,
      newD: newPart.d,
      oldUsd: 0,
      newUsd: newPart.usd || Number((newPart.d / 3.67).toFixed(2)),
      type: 'new',
      deltaD: newPart.d,
      percentage: 100,
      date: today,
      note: 'New product registered in Catalog (Cusub)'
    };
    setPriceChanges(prev => {
      const next = [newRec, ...prev];
      localStorage.setItem(STORAGE_KEY_PRICE_CHANGES, JSON.stringify(next));
      return next;
    });

    // If connected to Google Sheets, automatically append row to "ALL PRODUCT" sheet!
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl) {
      GoogleSheetsService.appendToGoogleSheet(config.sheetUrl, newPart, 'ALL PRODUCT').then(res => {
        if (res.success) {
          console.log(`Auto-added "${newPart.name}" directly to ALL PRODUCT in Google Sheet:`, res.message);
        }
      });
    }
  };

  // Update existing part (Edit Name, Cat, Prices, etc.) & auto-sync to Google Sheet & Price Tracker
  const handleUpdatePart = (id: string, updatedFields: Partial<SparePartItem>) => {
    const originalPart = parts.find(p => p.id === id);
    const updated = parts.map(p => {
      if (p.id === id) {
        return { ...p, ...updatedFields };
      }
      return p;
    });
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);

    // Automatically detect Price Up (Increase) or Price Down (Decrease) and record in Price Tracker!
    if (originalPart && updatedFields.d !== undefined && Math.abs(updatedFields.d - originalPart.d) >= 0.05) {
      const oldD = originalPart.d;
      const newD = updatedFields.d;
      const deltaD = Math.round((newD - oldD) * 100) / 100;
      const percentage = oldD > 0 ? Math.round(((newD - oldD) / oldD) * 1000) / 10 : 0;
      const type: 'increase' | 'decrease' = newD > oldD ? 'increase' : 'decrease';
      const today = new Date().toISOString().split('T')[0];
      const oldUsd = originalPart.usd || Number((oldD / 3.67).toFixed(2));
      const newUsd = updatedFields.usd || Number((newD / 3.67).toFixed(2));

      const newRec: PriceChangeRecord = {
        id: `pc-${Date.now()}`,
        name: updatedFields.name || originalPart.name,
        cat: updatedFields.cat || originalPart.cat,
        oldD,
        newD,
        oldUsd,
        newUsd,
        type,
        deltaD,
        percentage,
        date: today,
        note: type === 'increase' 
          ? 'Price increase recorded (Price Up / Kor u kacay)' 
          : 'Price decrease recorded (Price Down / Hoos u dhacay)'
      };
      setPriceChanges(prev => {
        const next = [newRec, ...prev];
        localStorage.setItem(STORAGE_KEY_PRICE_CHANGES, JSON.stringify(next));
        return next;
      });
    }

    // If connected to Google Sheets, automatically update row directly in Google Sheet!
    const config = GoogleSheetsService.getSavedConfig();
    const finalPart = updated.find(p => p.id === id);
    if (config.sheetUrl && originalPart && finalPart) {
      GoogleSheetsService.updateInGoogleSheet(config.sheetUrl, originalPart.name, finalPart).then(res => {
        if (res.success) {
          console.log(`Auto-updated "${finalPart.name}" directly in Google Sheet:`, res.message);
        }
      });
    }
  };

  // Delete part from catalog & auto-delete from Google Sheet if connected
  const handleDeletePart = (id: string) => {
    const partToDelete = parts.find(p => p.id === id);
    const updated = parts.filter(p => p.id !== id);
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);

    // If connected to Google Sheets Web App, automatically delete row from Google Sheet!
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && partToDelete) {
      GoogleSheetsService.deleteFromGoogleSheet(config.sheetUrl, partToDelete.name, partToDelete.cat).then(res => {
        if (res.success) {
          console.log(`Auto-deleted "${partToDelete.name}" from Google Sheet`);
        }
      });
    }
  };

  // Move product to new Category
  const handleMovePartCategory = (id: string, newCategory: string) => {
    handleUpdatePart(id, { cat: newCategory });
  };

  // Bulk delete multiple products & auto-delete from Google Sheet if connected
  const handleBulkDeleteParts = (ids: string[]) => {
    const idSet = new Set(ids);
    const partsToDelete = parts.filter(p => idSet.has(p.id));
    const updated = parts.filter(p => !idSet.has(p.id));
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);

    // If connected to Google Sheets Web App, automatically bulk delete from Google Sheet!
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && partsToDelete.length > 0) {
      const names = partsToDelete.map(p => p.name);
      GoogleSheetsService.bulkDeleteFromGoogleSheet(config.sheetUrl, names).then(res => {
        if (res.success) {
          console.log(`Auto-deleted ${names.length} products from Google Sheet`);
        }
      });
    }
  };

  // Bulk move multiple products to category
  const handleBulkMoveCategory = (ids: string[], newCategory: string) => {
    const idSet = new Set(ids);
    const updated = parts.map(p => idSet.has(p.id) ? { ...p, cat: newCategory } : p);
    setParts(updated);
    GoogleSheetsService.saveCustomParts(updated);
  };

  // Compatible LCDs Handlers
  // Compatible LCDs Handlers & auto-sync to Google Sheet
  const handleAddCompat = (itemData: Omit<CompatItem, 'id'>) => {
    const newItem: CompatItem = {
      ...itemData,
      id: `compat-${Date.now()}`
    };
    const updated = [newItem, ...compatList];
    setCompatList(updated);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(updated));

    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl) {
      GoogleSheetsService.syncCompatToGoogleSheet(config.sheetUrl, 'add', newItem);
    }
  };

  const handleUpdateCompat = (id: string, updated: Partial<CompatItem>) => {
    const original = compatList.find(c => c.id === id);
    const next = compatList.map(item => item.id === id ? { ...item, ...updated } : item);
    setCompatList(next);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(next));

    const finalItem = next.find(c => c.id === id);
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && finalItem) {
      GoogleSheetsService.syncCompatToGoogleSheet(config.sheetUrl, 'update', finalItem, original?.lcd);
    }
  };

  const handleDeleteCompat = (id: string) => {
    const toDelete = compatList.find(c => c.id === id);
    const next = compatList.filter(item => item.id !== id);
    setCompatList(next);
    localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(next));

    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && toDelete) {
      GoogleSheetsService.syncCompatToGoogleSheet(config.sheetUrl, 'delete', toDelete);
    }
  };

  // Photos Handlers & auto-sync to Google Sheet
  const handleAddPhoto = (photoData: Omit<PhotoItem, 'id' | 'createdAt'>) => {
    const newPhoto: PhotoItem = {
      ...photoData,
      id: `photo-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newPhoto, ...photosList];
    setPhotosList(updated);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(updated));

    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl) {
      GoogleSheetsService.syncPhotoToGoogleSheet(config.sheetUrl, 'add', newPhoto);
    }
  };

  const handleUpdatePhoto = (id: string, updated: Partial<PhotoItem>) => {
    const original = photosList.find(p => p.id === id);
    const next = photosList.map(p => p.id === id ? { ...p, ...updated } : p);
    setPhotosList(next);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(next));

    const finalPhoto = next.find(p => p.id === id);
    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && finalPhoto) {
      GoogleSheetsService.syncPhotoToGoogleSheet(config.sheetUrl, 'update', finalPhoto, original?.name);
    }
  };

  const handleDeletePhoto = (id: string) => {
    const toDelete = photosList.find(p => p.id === id);
    const next = photosList.filter(p => p.id !== id);
    setPhotosList(next);
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(next));

    const config = GoogleSheetsService.getSavedConfig();
    if (config.sheetUrl && toDelete) {
      GoogleSheetsService.syncPhotoToGoogleSheet(config.sheetUrl, 'delete', toDelete);
    }
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

  // Handle Google Sheet live sync completion (parts, compare, photos, compat)
  const handleDataSynced = (
    newParts: SparePartItem[], 
    newCompare?: CompareItem[],
    newPhotos?: PhotoItem[],
    newCompat?: CompatItem[]
  ) => {
    // Detect new products and price changes from Google Sheets sync
    if (parts.length > 0 && newParts.length > 0) {
      const existingMap = new Map<string, SparePartItem>();
      parts.forEach(p => existingMap.set(p.name.trim().toLowerCase(), p));

      const detectedRecords: PriceChangeRecord[] = [];
      const today = new Date().toISOString().split('T')[0];

      newParts.forEach(np => {
        const key = np.name.trim().toLowerCase();
        const existing = existingMap.get(key);
        if (!existing) {
          // New product from Sheet
          detectedRecords.push({
            id: `pc-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: np.name,
            cat: np.cat,
            oldD: 0,
            newD: np.d,
            oldUsd: 0,
            newUsd: np.usd || Number((np.d / 3.67).toFixed(2)),
            type: 'new',
            deltaD: np.d,
            percentage: 100,
            date: today,
            note: 'New product synced from Google Sheet (Cusub)'
          });
        } else if (Math.abs(existing.d - np.d) >= 0.05) {
          // Price change from Sheet
          const oldD = existing.d;
          const newD = np.d;
          const deltaD = Math.round((newD - oldD) * 100) / 100;
          const percentage = oldD > 0 ? Math.round(((newD - oldD) / oldD) * 1000) / 10 : 0;
          const type: 'increase' | 'decrease' = newD > oldD ? 'increase' : 'decrease';
          detectedRecords.push({
            id: `pc-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: np.name,
            cat: np.cat,
            oldD,
            newD,
            oldUsd: existing.usd || Number((oldD / 3.67).toFixed(2)),
            newUsd: np.usd || Number((newD / 3.67).toFixed(2)),
            type,
            deltaD,
            percentage,
            date: today,
            note: type === 'increase'
              ? 'Price increase from Google Sheet (Price Up / Kor u kacay)'
              : 'Price markdown from Google Sheet (Price Down / Hoos u dhacay)'
          });
        }
      });

      if (detectedRecords.length > 0) {
        setPriceChanges(prev => {
          const next = [...detectedRecords, ...prev];
          localStorage.setItem(STORAGE_KEY_PRICE_CHANGES, JSON.stringify(next));
          return next;
        });
      }
    }

    setParts(newParts);
    if (newCompare && newCompare.length) {
      setCompareItems(newCompare);
    }
    if (newPhotos && newPhotos.length > 0) {
      setPhotosList(newPhotos);
      localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(newPhotos));
    }
    if (newCompat && newCompat.length > 0) {
      setCompatList(newCompat);
      localStorage.setItem(STORAGE_KEY_COMPAT, JSON.stringify(newCompat));
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

      {/* Live Google Sheet "ALL PRODUCT" Sync & Status Bar */}
      <div className="bg-[#0b1324] border-b border-cyan-900/40 px-3 sm:px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-inner">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${GoogleSheetsService.getSavedConfig().sheetUrl ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${GoogleSheetsService.getSavedConfig().sheetUrl ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-300">
            Spreadsheet: <strong className="text-white font-bold">Spare Parts Price Quiz & Inventory Suite</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-800/80">
            Tab: ALL PRODUCT
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            ({parts.length} parts in Catalog & Quiz)
          </span>
          {lastSyncedAt && (
            <span className="text-emerald-400/90 font-mono text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Synced {lastSyncedAt}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleQuickSync}
            disabled={isSyncingFromSheet}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Pull latest live product prices from Google Sheet 'ALL PRODUCT'"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromSheet ? 'animate-spin' : ''}`} />
            <span>{isSyncingFromSheet ? 'Syncing...' : 'Sync "ALL PRODUCT" Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors cursor-pointer"
            title="Configure Google Sheet connection & view Apps Script"
          >
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span>Sheet Hub</span>
          </button>
        </div>
      </div>

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
            onUpdatePart={handleUpdatePart}
            onDeletePart={handleDeletePart}
            onMovePartCategory={handleMovePartCategory}
            onBulkDeleteParts={handleBulkDeleteParts}
            onBulkMoveCategory={handleBulkMoveCategory}
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
            onAddPart={handleAddPart}
            onUpdatePart={handleUpdatePart}
          />
        )}

        {/* 6. Google Sheets Database Tab */}
        {activeTab === 'sheetdb' && (
          <SheetsDatabaseView
            parts={parts}
            compatList={compatList}
            compareList={compareItems}
            photosList={photosList}
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
        photosList={photosList}
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
