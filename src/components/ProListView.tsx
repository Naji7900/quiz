import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Smartphone, 
  Battery, 
  Layers, 
  Zap, 
  Plus, 
  AlertCircle,
  Cpu,
  Calculator,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Upload,
  RotateCcw,
  CheckCircle2,
  CloudUpload,
  Sparkles,
  Pencil,
  Trash2,
  FolderSync,
  ArrowRightLeft,
  CheckSquare,
  Square,
  Check,
  Filter,
  TrendingDown,
  TrendingUp,
  PackagePlus,
  BarChart3,
  ArrowRight,
  Building2,
  Plane,
  Ship
} from 'lucide-react';
import { 
  SparePartItem, 
  CompatItem, 
  PriceChangeRecord, 
  PART_CATEGORY_GROUPS, 
  calculatePricing,
  PRESET_COMPANY_NAMES,
  RegisteredCompany,
  generateSmartPartId,
  AUTHENTIC_GOOGLE_SHEET_CATEGORIES,
  getNextSequentialDxId,
  detectOriginFromCompany
} from '../data/initialData';
import { sound } from '../services/soundService';

interface ProListViewProps {
  parts: SparePartItem[];
  compatList: CompatItem[];
  priceChanges?: PriceChangeRecord[];
  companies?: RegisteredCompany[];
  rejectedCompanies?: RegisteredCompany[];
  deletedCompanyNames?: string[];
  companyFilter?: string;
  onClearCompanyFilter?: () => void;
  onSetCompanyFilter?: (company: string) => void;
  onRegisterNewCompany?: (companyName: string) => void;
  onDeleteCompanyName?: (companyName: string) => void;
  onBulkAssignCompany?: (companyName: string, partIds: string[]) => void;
  onAddPart: (part: SparePartItem | (Omit<SparePartItem, 'id'> & { id?: string })) => void;
  onUpdatePart?: (id: string, updatedFields: Partial<SparePartItem>) => void;
  onDeletePart?: (id: string) => void;
  onMovePartCategory?: (id: string, newCategory: string) => void;
  onBulkDeleteParts?: (ids: string[]) => void;
  onBulkMoveCategory?: (ids: string[], newCategory: string) => void;
  onOpenDbModal?: () => void;
  onRestoreDefault?: () => void;
  onNavigateToPriceTracker?: (filter: 'all' | 'increase' | 'decrease' | 'new', openModal?: 'change' | 'new_product' | null) => void;
  yuanRate?: number;
  onUpdateYuanRate?: (rate: number) => void;
  expenseRate?: number;
  onUpdateExpenseRate?: (rate: number, applyToAll?: boolean) => void;
  airCargoRate?: number;
  onUpdateAirCargoRate?: (rate: number) => void;
  seaCargoRate?: number;
  onUpdateSeaCargoRate?: (rate: number) => void;
  onOpenUpload11Modal?: () => void;
  onOpenFormatAllModal?: () => void;
  onBackupCompleteSuite?: () => void;
  isBackingUpSuite?: boolean;
}

export const ProListView: React.FC<ProListViewProps> = ({
  parts,
  compatList,
  priceChanges = [],
  companies = [],
  rejectedCompanies = [],
  deletedCompanyNames = [],
  companyFilter = '__all__',
  onClearCompanyFilter,
  onSetCompanyFilter,
  onRegisterNewCompany,
  onDeleteCompanyName,
  onBulkAssignCompany,
  onAddPart,
  onUpdatePart,
  onDeletePart,
  onMovePartCategory,
  onBulkDeleteParts,
  onBulkMoveCategory,
  onOpenDbModal,
  onRestoreDefault,
  onNavigateToPriceTracker,
  onOpenUpload11Modal,
  onOpenFormatAllModal,
  onBackupCompleteSuite,
  isBackingUpSuite = false,
  yuanRate = 7.23,
  onUpdateYuanRate,
  expenseRate = 0,
  onUpdateExpenseRate,
  airCargoRate = 0.65,
  onUpdateAirCargoRate,
  seaCargoRate = 0.2,
  onUpdateSeaCargoRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulaBar, setShowFormulaBar] = useState(false);
  const [showAllCatalog, setShowAllCatalog] = useState(false);
  const [recentlyAddedPart, setRecentlyAddedPart] = useState<SparePartItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('__all__');

  // Manual Yuan-to-USD Exchange Rate state (Requirement 1)
  const currentYuanRate = yuanRate && !isNaN(yuanRate) && yuanRate > 0 ? yuanRate : 7.23;
  const [tempYuanRate, setTempYuanRate] = useState<string>(() => String(currentYuanRate));

  // Saved Optional Expense $ (Shipping / Customs) Rate state (User Requirement 1)
  const currentExpenseRate = typeof expenseRate === 'number' && !isNaN(expenseRate) && expenseRate >= 0 ? expenseRate : 0;
  const [tempExpenseRate, setTempExpenseRate] = useState<string>(() => String(currentExpenseRate));

  // Saved Default Cargo & Shipping Rates (By Air = $0.65, By Sea = $0.20)
  const currentAirRate = typeof airCargoRate === 'number' && !isNaN(airCargoRate) && airCargoRate >= 0 ? airCargoRate : 0.65;
  const currentSeaRate = typeof seaCargoRate === 'number' && !isNaN(seaCargoRate) && seaCargoRate >= 0 ? seaCargoRate : 0.2;
  const [tempAirCargoRate, setTempAirCargoRate] = useState<string>(() => String(currentAirRate));
  const [tempSeaCargoRate, setTempSeaCargoRate] = useState<string>(() => String(currentSeaRate));

  // Keep tempYuanRate synchronized if external yuanRate changes
  React.useEffect(() => {
    setTempYuanRate(String(currentYuanRate));
  }, [currentYuanRate]);

  // Keep tempExpenseRate synchronized if external expenseRate changes
  React.useEffect(() => {
    setTempExpenseRate(String(currentExpenseRate));
  }, [currentExpenseRate]);

  React.useEffect(() => {
    setTempAirCargoRate(String(currentAirRate));
  }, [currentAirRate]);

  React.useEffect(() => {
    setTempSeaCargoRate(String(currentSeaRate));
  }, [currentSeaRate]);

  // New Part Form State
  const [newPartId, setNewPartId] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartCat, setNewPartCat] = useState('IPhone / LCD');
  const [customCatInput, setCustomCatInput] = useState('');
  const [newPartCompany, setNewPartCompany] = useState('');
  const [customCompanyInput, setCustomCompanyInput] = useState('');
  const [newPartChangeType, setNewPartChangeType] = useState<'New Product' | 'Price Decrease' | 'Price Increase'>('New Product');
  const [newPartD, setNewPartD] = useState('');
  const [newPartYuan, setNewPartYuan] = useState('');
  const [newPartUsd, setNewPartUsd] = useState('');
  const [newPartSalesPrice, setNewPartSalesPrice] = useState('');
  const [newPartExpense, setNewPartExpense] = useState(() => String(currentAirRate));
  const [newPartShippingMethod, setNewPartShippingMethod] = useState<'air' | 'sea'>('air');
  const [newPartOrigin, setNewPartOrigin] = useState<'Dubai' | 'China'>('Dubai');
  const [idError, setIdError] = useState<string | null>(null);

  // Multi-select state for bulk actions
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());

  // Edit Product Modal State
  const [editingPart, setEditingPart] = useState<SparePartItem | null>(null);
  const [editPartId, setEditPartId] = useState('');
  const [editName, setEditName] = useState('');
  const [editCat, setEditCat] = useState('');
  const [customEditCat, setCustomEditCat] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [customEditCompany, setCustomEditCompany] = useState('');
  const [editChangeType, setEditChangeType] = useState<'New Product' | 'Price Decrease' | 'Price Increase'>('Price Increase');
  const [editD, setEditD] = useState('');
  const [editYuan, setEditYuan] = useState('');
  const [editUsd, setEditUsd] = useState('');
  const [editSalesPrice, setEditSalesPrice] = useState('');
  const [editExpense, setEditExpense] = useState('0');
  const [editShippingMethod, setEditShippingMethod] = useState<'air' | 'sea'>('air');
  const [editOrigin, setEditOrigin] = useState<'Dubai' | 'China'>('Dubai');

  // Move Product Modal State (single or bulk)
  const [movingPart, setMovingPart] = useState<SparePartItem | null>(null);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [targetMoveCat, setTargetMoveCat] = useState('IPhone / LCD');
  const [customMoveCat, setCustomMoveCat] = useState('');

  // Delete Confirmation Modal State (single or bulk)
  const [deletingPart, setDeletingPart] = useState<SparePartItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Quick Bulk Company Assignment Modal State
  const [isBulkCompanyOpen, setIsBulkCompanyOpen] = useState(false);
  const [bulkCompanyScope, setBulkCompanyScope] = useState<'selected' | 'filtered'>('filtered');
  const [bulkCompanyInput, setBulkCompanyInput] = useState('');
  const [showManageCompaniesAdd, setShowManageCompaniesAdd] = useState(false);
  const [showManageCompaniesEdit, setShowManageCompaniesEdit] = useState(false);
  const [pendingDeleteCompany, setPendingDeleteCompany] = useState<{ name: string; context?: 'add' | 'edit' } | null>(null);
  const [pendingOpenDeleteListAdd, setPendingOpenDeleteListAdd] = useState(false);

  // Quick Action Notification Toast
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Categories list directly synchronized with Google Sheet column "Category (Brand _Part Type)"
  const categories = useMemo(() => {
    const set = new Set<string>(AUTHENTIC_GOOGLE_SHEET_CATEGORIES);
    parts.forEach(p => {
      if (p.cat && p.cat.trim()) set.add(p.cat.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parts]);

  // Live Price Changes Stats directly synchronized with Price Tracker page
  const priceStats = useMemo(() => {
    const list = priceChanges || [];
    const increases = list.filter(c => c.type === 'increase');
    const decreases = list.filter(c => c.type === 'decrease');
    const newItems = list.filter(c => c.type === 'new');
    const totalSavedAED = decreases.reduce((acc, c) => acc + Math.abs(c.deltaD), 0);
    const totalIncreasedAED = increases.reduce((acc, c) => acc + Math.abs(c.deltaD), 0);
    return {
      total: list.length,
      increasesCount: increases.length,
      decreasesCount: decreases.length,
      newItemsCount: newItems.length,
      totalSavedAED: Math.round(totalSavedAED * 10) / 10,
      totalIncreasedAED: Math.round(totalIncreasedAED * 10) / 10
    };
  }, [priceChanges]);

  const formatNum = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    return rounded === 0 && val !== 0 ? val.toFixed(2) : rounded.toFixed(1);
  };

  // Registered company pool (from Company Register)
  const registeredCompanyPool = useMemo(() => {
    return (companies && companies.length > 0) ? companies : (rejectedCompanies || []);
  }, [companies, rejectedCompanies]);

  const findRegisteredCompany = (companyName?: string) => {
    const clean = String(companyName || '').trim().toLowerCase();
    if (!clean || clean === '__custom__') return undefined;
    return registeredCompanyPool.find(c => c.name.trim().toLowerCase() === clean);
  };

  // Available Company / Vendor options (Combined from Register Company, Catalog parts, and presets, excluding deleted names)
  const availableCompanies = useMemo(() => {
    const deletedSet = new Set((deletedCompanyNames || []).map(c => c.trim().toLowerCase()));
    const set = new Set<string>();
    const addIfAllowed = (val?: string) => {
      const cleaned = String(val || '').trim();
      if (!cleaned) return;
      if (deletedSet.has(cleaned.toLowerCase())) return;
      set.add(cleaned);
    };
    PRESET_COMPANY_NAMES.forEach(addIfAllowed);
    registeredCompanyPool.forEach(rc => addIfAllowed(rc.name));
    parts.forEach(p => addIfAllowed(p.companyName));
    return Array.from(set).sort();
  }, [parts, registeredCompanyPool, deletedCompanyNames]);

  const isProfileMode = searchTerm.trim().length >= 2;

  // Device Profile Breakdown when user searches a specific phone model
  const profileData = useMemo(() => {
    if (!isProfileMode) return null;
    const kw = searchTerm.trim().toLowerCase();

    const groups: Record<string, { label: string; iconKey: string; items: SparePartItem[] }> = {};
    
    parts.forEach(part => {
      if (part.name.toLowerCase().includes(kw)) {
        const config = PART_CATEGORY_GROUPS[part.cat] || { label: part.cat, iconKey: 'screen' };
        const groupKey = config.label;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            label: config.label,
            iconKey: config.iconKey,
            items: []
          };
        }
        groups[groupKey].items.push(part);
      }
    });

    const matchingCompat = compatList.filter(c => 
      c.lcd.toLowerCase().includes(kw) || c.fits.toLowerCase().includes(kw)
    );

    const standardComponents = [
      "LCD Screen",
      "Battery",
      "Flex Charger Port",
      "Cover / Housing",
      "Back Glass",
      "SIM Tray",
      "Sensor & Earpiece Speaker"
    ];
    const presentLabels = new Set(Object.keys(groups));
    const missing = standardComponents.filter(c => !presentLabels.has(c));

    return {
      groups: Object.values(groups),
      compat: matchingCompat,
      missing,
      totalFound: Object.values(groups).reduce((acc, g) => acc + g.items.length, 0)
    };
  }, [parts, compatList, searchTerm, isProfileMode]);

  const [internalCompanyFilter, setInternalCompanyFilter] = useState<string>('__all__');
  const activeCompanyFilter = companyFilter && companyFilter !== '__all__' ? companyFilter : internalCompanyFilter;

  const handleSetCompanyFilter = (comp: string) => {
    sound.playTick();
    setInternalCompanyFilter(comp);
    onSetCompanyFilter?.(comp);
  };

  // Real-time instant search filter across all parts with category and company filter
  const filteredParts = useMemo(() => {
    let result = [...parts];

    if (activeCompanyFilter && activeCompanyFilter !== '__all__') {
      result = result.filter(p => p.companyName?.toLowerCase() === activeCompanyFilter.toLowerCase());
    }

    if (selectedCategoryFilter !== '__all__') {
      result = result.filter(p => p.cat.toLowerCase() === selectedCategoryFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.cat.toLowerCase().includes(q) ||
        (p.companyName && p.companyName.toLowerCase().includes(q))
      );
    }

    if (tableSearchTerm.trim()) {
      const q2 = tableSearchTerm.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q2) ||
        p.id.toLowerCase().includes(q2) ||
        p.cat.toLowerCase().includes(q2) ||
        (p.companyName && p.companyName.toLowerCase().includes(q2))
      );
    }

    return result;
  }, [parts, searchTerm, tableSearchTerm, selectedCategoryFilter, activeCompanyFilter]);

  const getDefaultCargoForMethod = (method: 'air' | 'sea') => {
    return method === 'sea' ? currentSeaRate : currentAirRate;
  };

  const recalculateAddUsdWithCargo = (nextExp: number, prevExp: number) => {
    const d = parseFloat(newPartD);
    const y = parseFloat(newPartYuan);
    const u = parseFloat(newPartUsd);
    if (!isNaN(d) && d > 0) {
      const costUsd = Number(((d / 3.67) + nextExp).toFixed(2));
      setNewPartUsd(String(costUsd));
      setNewPartSalesPrice(String(costUsd));
    } else if (!isNaN(y) && y > 0) {
      const baseUsd = y / currentYuanRate;
      const costUsd = Number((baseUsd + nextExp).toFixed(2));
      setNewPartUsd(String(costUsd));
      setNewPartSalesPrice(String(costUsd));
    } else if (!isNaN(u) && u > 0) {
      const adjusted = Number(Math.max(0, (u - prevExp) + nextExp).toFixed(2));
      setNewPartUsd(String(adjusted));
      setNewPartSalesPrice(String(adjusted));
    }
  };

  const hasCurrencyInput = (val: string) => {
    const t = val.trim();
    if (!t) return false;
    const n = parseFloat(t);
    return (!isNaN(n) && n > 0) || t === '0.';
  };

  const activeAddCompanyName = newPartCompany === '__custom__' ? customCompanyInput : newPartCompany;
  const addCompanyOrigin = detectOriginFromCompany(registeredCompanyPool, activeAddCompanyName);
  const addHasD = hasCurrencyInput(newPartD);
  const addHasY = hasCurrencyInput(newPartYuan);
  const isAddDirhamDisabled =
    addCompanyOrigin === 'China' ||
    (addCompanyOrigin !== 'Dubai' && (newPartOrigin === 'China' || (addHasY && !addHasD)));
  const isAddYuanDisabled =
    addCompanyOrigin === 'Dubai' ||
    (addCompanyOrigin !== 'China' && (newPartOrigin === 'Dubai' || (addHasD && !addHasY)));

  const activeEditCompanyName = editCompany === '__custom__' ? customEditCompany : editCompany;
  const editCompanyOrigin = detectOriginFromCompany(registeredCompanyPool, activeEditCompanyName);
  const editHasD = hasCurrencyInput(editD);
  const editHasY = hasCurrencyInput(editYuan);
  const isEditDirhamDisabled =
    editCompanyOrigin === 'China' ||
    (editCompanyOrigin !== 'Dubai' && (editOrigin === 'China' || (editHasY && !editHasD)));
  const isEditYuanDisabled =
    editCompanyOrigin === 'Dubai' ||
    (editCompanyOrigin !== 'China' && (editOrigin === 'Dubai' || (editHasD && !editHasY)));

  const handleSelectNewOrigin = (origin: 'Dubai' | 'China') => {
    sound.playTick();
    setNewPartOrigin(origin);
    const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
    if (origin === 'China') {
      setNewPartD('');
      const y = parseFloat(newPartYuan);
      if (!isNaN(y) && y > 0) {
        const costUsd = Number(((y / currentYuanRate) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else if (hasCurrencyInput(newPartD)) {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    } else {
      setNewPartYuan('');
      const d = parseFloat(newPartD);
      if (!isNaN(d) && d > 0) {
        const costUsd = Number(((d / 3.67) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else if (hasCurrencyInput(newPartYuan)) {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    }
  };

  const handleSelectEditOrigin = (origin: 'Dubai' | 'China') => {
    sound.playTick();
    setEditOrigin(origin);
    const exp = parseFloat(editExpense) || 0;
    if (origin === 'China') {
      setEditD('');
      const y = parseFloat(editYuan);
      if (!isNaN(y) && y > 0) {
        setEditUsd(String(Number(((y / currentYuanRate) + exp).toFixed(2))));
      } else if (hasCurrencyInput(editD)) {
        setEditUsd('');
      }
    } else {
      setEditYuan('');
      const d = parseFloat(editD);
      if (!isNaN(d) && d > 0) {
        setEditUsd(String(Number(((d / 3.67) + exp).toFixed(2))));
      } else if (hasCurrencyInput(editYuan)) {
        setEditUsd('');
      }
    }
  };

  const applyAddCompanyAutoOrigin = (companyName: string) => {
    const autoOrigin = detectOriginFromCompany(registeredCompanyPool, companyName);
    if (autoOrigin === 'China') {
      setNewPartOrigin('China');
      setNewPartD('');
      const y = parseFloat(newPartYuan);
      const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
      if (!isNaN(y) && y > 0) {
        const costUsd = Number(((y / currentYuanRate) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else if (hasCurrencyInput(newPartD)) {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    } else if (autoOrigin === 'Dubai') {
      setNewPartOrigin('Dubai');
      setNewPartYuan('');
      const d = parseFloat(newPartD);
      const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
      if (!isNaN(d) && d > 0) {
        const costUsd = Number(((d / 3.67) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else if (hasCurrencyInput(newPartYuan)) {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    }
  };

  const applyEditCompanyAutoOrigin = (companyName: string) => {
    const autoOrigin = detectOriginFromCompany(registeredCompanyPool, companyName);
    if (autoOrigin === 'China') {
      setEditOrigin('China');
      setEditD('');
      const y = parseFloat(editYuan);
      const exp = parseFloat(editExpense) || 0;
      if (!isNaN(y) && y > 0) {
        setEditUsd(String(Number(((y / currentYuanRate) + exp).toFixed(2))));
      } else if (hasCurrencyInput(editD)) {
        setEditUsd('');
      }
    } else if (autoOrigin === 'Dubai') {
      setEditOrigin('Dubai');
      setEditYuan('');
      const d = parseFloat(editD);
      const exp = parseFloat(editExpense) || 0;
      if (!isNaN(d) && d > 0) {
        setEditUsd(String(Number(((d / 3.67) + exp).toFixed(2))));
      } else if (hasCurrencyInput(editYuan)) {
        setEditUsd('');
      }
    }
  };

  const handleOpenAddPartModal = () => {
    const method: 'air' | 'sea' = newPartShippingMethod || 'air';
    const defaultExp = getDefaultCargoForMethod(method);
    setNewPartShippingMethod(method);
    setNewPartExpense(String(defaultExp));
    const activeCompName = newPartCompany === '__custom__' ? customCompanyInput : newPartCompany;
    applyAddCompanyAutoOrigin(activeCompName);
    setIdError(null);
    setShowAddModal(true);
  };

  const handleNewPartCompanyChange = (val: string) => {
    setNewPartCompany(val);
    if (val && val !== '__custom__') {
      applyAddCompanyAutoOrigin(val);
    } else if (val === '__custom__' && customCompanyInput.trim()) {
      applyAddCompanyAutoOrigin(customCompanyInput);
    }
  };

  const handleCustomNewCompanyChange = (val: string) => {
    setCustomCompanyInput(val);
    applyAddCompanyAutoOrigin(val);
  };

  const handleEditCompanyChange = (val: string) => {
    setEditCompany(val);
    if (val && val !== '__custom__') {
      applyEditCompanyAutoOrigin(val);
    } else if (val === '__custom__' && customEditCompany.trim()) {
      applyEditCompanyAutoOrigin(customEditCompany);
    }
  };

  const handleCustomEditCompanyChange = (val: string) => {
    setCustomEditCompany(val);
    applyEditCompanyAutoOrigin(val);
  };

  const handleSelectNewShippingMethod = (method: 'air' | 'sea') => {
    sound.playTick();
    const prevExp = newPartExpense.trim() !== ''
      ? (parseFloat(newPartExpense) || 0)
      : getDefaultCargoForMethod(newPartShippingMethod);
    const nextExp = getDefaultCargoForMethod(method);
    setNewPartShippingMethod(method);
    setNewPartExpense(String(nextExp));
    recalculateAddUsdWithCargo(nextExp, prevExp);
  };

  const handleDefaultAirRateChange = (val: string) => {
    setTempAirCargoRate(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateAirCargoRate?.(parsed);
      if (newPartShippingMethod === 'air') {
        const prevExp = parseFloat(newPartExpense) || 0;
        setNewPartExpense(val);
        recalculateAddUsdWithCargo(parsed, prevExp);
      }
    }
  };

  const handleDefaultSeaRateChange = (val: string) => {
    setTempSeaCargoRate(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateSeaCargoRate?.(parsed);
      if (newPartShippingMethod === 'sea') {
        const prevExp = parseFloat(newPartExpense) || 0;
        setNewPartExpense(val);
        recalculateAddUsdWithCargo(parsed, prevExp);
      }
    }
  };

  // Convert Dirham to USD only (1 / 3.67 = 0.27 USD). DO NOT convert Dirham to Yuan!
  const handleDirhamChange = (val: string) => {
    setNewPartD(val);
    const d = parseFloat(val);
    if (!isNaN(d) && d > 0) {
      const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
      const costUsd = Number(((d / 3.67) + exp).toFixed(2));
      setNewPartUsd(String(costUsd));
      setNewPartSalesPrice(String(costUsd));
      // Do NOT touch newPartYuan - keep Dirham and Yuan completely independent!
    } else if (!val.trim() || (!isNaN(d) && d === 0)) {
      const y = parseFloat(newPartYuan);
      if (!isNaN(y) && y > 0) {
        const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
        const costUsd = Number(((y / currentYuanRate) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    }
  };

  // Convert Yuan to USD only (Yuan / currentYuanRate). DO NOT convert Yuan to Dirham!
  const handleYuanChange = (val: string) => {
    setNewPartYuan(val);
    const y = parseFloat(val);
    if (!isNaN(y) && y > 0) {
      const baseUsd = y / currentYuanRate;
      const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
      const costUsd = Number((baseUsd + exp).toFixed(2));
      setNewPartUsd(String(costUsd));
      setNewPartSalesPrice(String(costUsd));
      // Do NOT touch newPartD - keep Dirham and Yuan completely independent!
    } else if (!val.trim() || (!isNaN(y) && y === 0)) {
      const d = parseFloat(newPartD);
      if (!isNaN(d) && d > 0) {
        const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);
        const costUsd = Number(((d / 3.67) + exp).toFixed(2));
        setNewPartUsd(String(costUsd));
        setNewPartSalesPrice(String(costUsd));
      } else {
        setNewPartUsd('');
        setNewPartSalesPrice('');
      }
    }
  };

  // Synchronize when user types USD+
  const handleUsdChange = (val: string) => {
    setNewPartUsd(val);
    const u = parseFloat(val);
    if (!isNaN(u) && u >= 0) {
      // User directly enters USD - update sales price suggestion without overriding entered D or Yuan
      setNewPartSalesPrice(String(u));
    }
  };

  const handleSalesPriceChange = (val: string) => {
    setNewPartSalesPrice(val);
  };

  const handleExpenseChange = (expVal: string) => {
    const prevExp = parseFloat(newPartExpense) || 0;
    setNewPartExpense(expVal);
    const exp = expVal.trim() !== '' ? (parseFloat(expVal) || 0) : 0;
    recalculateAddUsdWithCargo(exp, prevExp);
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    const finalCat = newPartCat === '__custom__' && customCatInput.trim()
      ? customCatInput.trim()
      : newPartCat;

    const dirham = newPartD.trim() ? (parseFloat(newPartD) || 0) : 0;
    const yuan = newPartYuan.trim() ? (parseFloat(newPartYuan) || 0) : 0;
    const exp = newPartExpense.trim() !== '' ? (parseFloat(newPartExpense) || 0) : getDefaultCargoForMethod(newPartShippingMethod);

    let computedUsd = 0;
    if (newPartUsd.trim()) {
      computedUsd = parseFloat(newPartUsd) || 0;
    } else if (dirham > 0) {
      computedUsd = Number(((dirham / 3.67) + exp).toFixed(2));
    } else if (yuan > 0) {
      computedUsd = Number(((yuan / currentYuanRate) + exp).toFixed(2));
    }

    const salesPrice = newPartSalesPrice.trim()
      ? (parseFloat(newPartSalesPrice) || computedUsd)
      : computedUsd;

    const finalCompany = newPartCompany === '__custom__' && customCompanyInput.trim()
      ? customCompanyInput.trim()
      : (newPartCompany.trim() || 'NAJI HASSAN');

    if (finalCompany) {
      onRegisterNewCompany?.(finalCompany);
    }

    const normKey = (v?: string) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const normShip = (v?: string) => (String(v || '').trim().toLowerCase().includes('sea') ? 'by sea' : 'by air');
    const finalShip = newPartShippingMethod || 'air';
    const targetProdKey = normKey(newPartName);
    const targetCompKey = normKey(finalCompany);
    const targetShipKey = normShip(finalShip);
    const smartMatches = parts.filter(
      p =>
        normKey(p.name) === targetProdKey &&
        normKey(p.companyName) === targetCompKey &&
        normShip(p.shippingMethod) === targetShipKey
    );

    let partId = newPartId.trim() || getNextSequentialDxId(parts, 'DX-000001');
    if (smartMatches.length >= 1) {
      // Same Product + Same Company + Same Cargo/Shipping -> ONLY UPDATE existing ID (never duplicate)
      partId = smartMatches[0].id;
    } else {
      const existingWithSameId = parts.find(p => p.id.trim().toLowerCase() === partId.trim().toLowerCase());
      if (existingWithSameId) {
        if (normKey(existingWithSameId.name) === targetProdKey) {
          // Same Product + Different Company OR Different Cargo/Shipping -> generate guaranteed unique ID for new row
          partId = getNextSequentialDxId(parts, 'DX-000001');
        } else if (newPartId.trim()) {
          sound.playWrong();
          setIdError(`⚠️ You already Have it: ID "${partId}" is already used by "${existingWithSameId.name}"!`);
          return;
        } else {
          partId = getNextSequentialDxId(parts, 'DX-000001');
        }
      }
    }
    setIdError(null);

    // Keep Dirham and Yuan independent (do not exchange Dirham to Yuan or Yuan to Dirham)
    const finalDirham = dirham;
    const finalYuan = yuan;
    const finalSalesPrice = salesPrice > 0 ? salesPrice : computedUsd;
    const finalOrigin = newPartOrigin || (finalCat.includes('LCD') ? 'China' : 'Dubai');
    const todayStr = smartMatches.length >= 1 && smartMatches[0].purchaseDate
      ? smartMatches[0].purchaseDate
      : new Date().toISOString().split('T')[0];

    const createdPart: SparePartItem = {
      id: partId,
      name: newPartName.trim(),
      cat: finalCat,
      d: finalDirham,
      usd: computedUsd,
      yuan: finalYuan,
      salesPrice: finalSalesPrice,
      salesPriceD: finalDirham > 0 ? finalDirham : Number((finalSalesPrice * 3.67).toFixed(1)),
      expense: exp,
      isCustom: true,
      changeType: newPartChangeType,
      companyName: finalCompany,
      shippingMethod: finalShip,
      origin: finalOrigin,
      purchaseDate: todayStr
    };

    onAddPart(createdPart);

    sound.playVictory();
    setRecentlyAddedPart(createdPart);
    setShowAllCatalog(true);
    setSearchTerm('');
    setNewPartId('');
    setNewPartName('');
    setNewPartCompany('');
    setCustomCompanyInput('');
    setNewPartShippingMethod('air');
    setNewPartOrigin('Dubai');
    setNewPartD('');
    setNewPartYuan('');
    setNewPartUsd('');
    setNewPartSalesPrice('');
    setNewPartExpense(String(currentAirRate));
    setCustomCatInput('');
    setNewPartChangeType('New Product');
    setShowAddModal(false);
  };

  // Quick Action Notification Toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  // Selection toggles
  const toggleSelect = (id: string) => {
    setSelectedPartIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPartIds.size === filteredParts.length && filteredParts.length > 0) {
      setSelectedPartIds(new Set());
    } else {
      setSelectedPartIds(new Set(filteredParts.map(p => p.id)));
    }
  };

  // Edit Handlers
  const handleOpenEdit = (part: SparePartItem) => {
    setEditingPart(part);
    setEditPartId(part.id);
    setEditName(part.name);
    setEditCat(part.cat);
    setCustomEditCat('');
    setEditCompany(part.companyName || '');
    setCustomEditCompany('');
    setEditChangeType(part.changeType || 'Price Increase');
    setEditD(String(part.d));
    setEditYuan(String(part.yuan ?? 0));
    setEditUsd(String(part.usd));
    setEditSalesPrice(String(part.salesPrice));
    setEditExpense(String(part.expense ?? 0));
    setEditShippingMethod((part.shippingMethod as any) || 'air');
    setEditOrigin((part.origin as any) || detectOriginFromCompany(registeredCompanyPool, part.companyName) || (part.cat && part.cat.includes('LCD') ? 'China' : 'Dubai'));
  };

  const handleEditDirhamChange = (val: string) => {
    setEditD(val);
    const d = parseFloat(val);
    if (!isNaN(d) && d > 0) {
      const exp = parseFloat(editExpense) || 0;
      const costUsd = Number(((d / 3.67) + exp).toFixed(2));
      setEditUsd(String(costUsd));
      // Do NOT touch editYuan - keep Dirham and Yuan completely independent!
    } else if (!val.trim() || (!isNaN(d) && d === 0)) {
      const y = parseFloat(editYuan);
      if (!isNaN(y) && y > 0) {
        const exp = parseFloat(editExpense) || 0;
        const costUsd = Number(((y / currentYuanRate) + exp).toFixed(2));
        setEditUsd(String(costUsd));
      } else if (!val.trim()) {
        setEditUsd('');
      }
    }
  };

  const handleEditYuanChange = (val: string) => {
    setEditYuan(val);
    const y = parseFloat(val);
    if (!isNaN(y) && y > 0) {
      const baseUsd = y / currentYuanRate;
      const exp = parseFloat(editExpense) || 0;
      const costUsd = Number((baseUsd + exp).toFixed(2));
      setEditUsd(String(costUsd));
      // Do NOT touch editD - keep Dirham and Yuan completely independent!
    } else if (!val.trim() || (!isNaN(y) && y === 0)) {
      const d = parseFloat(editD);
      if (!isNaN(d) && d > 0) {
        const exp = parseFloat(editExpense) || 0;
        const costUsd = Number(((d / 3.67) + exp).toFixed(2));
        setEditUsd(String(costUsd));
      } else if (!val.trim()) {
        setEditUsd('');
      }
    }
  };

  const handleEditUsdChange = (val: string) => {
    setEditUsd(val);
    // User directly edits USD - keep editD and editYuan independent
  };

  const handleEditExpenseChange = (expVal: string) => {
    setEditExpense(expVal);
    const exp = parseFloat(expVal) || 0;
    const d = parseFloat(editD);
    const y = parseFloat(editYuan);
    if (!isNaN(d) && d > 0) {
      const costUsd = Number(((d / 3.67) + exp).toFixed(2));
      setEditUsd(String(costUsd));
    } else if (!isNaN(y) && y > 0) {
      const baseUsd = y / currentYuanRate;
      const costUsd = Number((baseUsd + exp).toFixed(2));
      setEditUsd(String(costUsd));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart || !editName.trim()) return;

    const finalCat = editCat === '__custom__' && customEditCat.trim()
      ? customEditCat.trim()
      : editCat;

    const dirham = editD.trim() ? (parseFloat(editD) || 0) : 0;
    const yuan = editYuan.trim() ? (parseFloat(editYuan) || 0) : 0;
    const exp = parseFloat(editExpense) || 0;

    let computedUsd = 0;
    if (editUsd.trim()) {
      computedUsd = parseFloat(editUsd) || 0;
    } else if (dirham > 0) {
      computedUsd = Number(((dirham / 3.67) + exp).toFixed(2));
    } else if (yuan > 0) {
      computedUsd = Number(((yuan / currentYuanRate) + exp).toFixed(2));
    }

    const salesPrice = editSalesPrice.trim()
      ? (parseFloat(editSalesPrice) || computedUsd)
      : computedUsd;

    const finalCompany = editCompany === '__custom__' && customEditCompany.trim()
      ? customEditCompany.trim()
      : (editCompany.trim() || undefined);

    if (finalCompany) {
      onRegisterNewCompany?.(finalCompany);
    }

    const updatedId = editPartId.trim() || editingPart.id;

    onUpdatePart?.(editingPart.id, {
      id: updatedId,
      name: editName.trim(),
      cat: finalCat,
      d: dirham,
      usd: computedUsd,
      yuan: yuan,
      salesPrice,
      salesPriceD: dirham > 0 ? dirham : Number((salesPrice * 3.67).toFixed(1)),
      expense: exp,
      changeType: editChangeType,
      companyName: finalCompany,
      shippingMethod: editShippingMethod,
      origin: editOrigin
    });

    sound.playVictory();
    showToast(`✅ Updated "${editName.trim()}" (${dirham} D / $${salesPrice}) & Synced to Google Sheet "ALL PRODUCT"!`);
    setEditingPart(null);
  };

  // Move Handlers
  const handleOpenMove = (part: SparePartItem) => {
    setMovingPart(part);
    setTargetMoveCat(part.cat);
    setCustomMoveCat('');
  };

  const handleConfirmMove = () => {
    if (!movingPart) return;
    const finalCat = targetMoveCat === '__custom__' && customMoveCat.trim()
      ? customMoveCat.trim()
      : targetMoveCat;

    if (!finalCat.trim()) return;

    onMovePartCategory?.(movingPart.id, finalCat);
    sound.playVictory();
    showToast(`Moved "${movingPart.name}" to category "${finalCat}"!`);
    setMovingPart(null);
  };

  const handleConfirmBulkMove = () => {
    if (selectedPartIds.size === 0) return;
    const finalCat = targetMoveCat === '__custom__' && customMoveCat.trim()
      ? customMoveCat.trim()
      : targetMoveCat;

    if (!finalCat.trim()) return;

    onBulkMoveCategory?.(Array.from(selectedPartIds), finalCat);
    sound.playVictory();
    showToast(`Moved ${selectedPartIds.size} products to category "${finalCat}"!`);
    setSelectedPartIds(new Set());
    setIsBulkMoveOpen(false);
  };

  // Delete Handlers
  const handleOpenDelete = (part: SparePartItem) => {
    setDeletingPart(part);
  };

  const handleConfirmDelete = () => {
    if (!deletingPart) return;
    onDeletePart?.(deletingPart.id);
    sound.playTick();
    showToast(`Deleted "${deletingPart.name}" from database.`);
    setDeletingPart(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedPartIds.size === 0) return;
    const count = selectedPartIds.size;
    onBulkDeleteParts?.(Array.from(selectedPartIds));
    sound.playTick();
    showToast(`Deleted ${count} products from database.`);
    setSelectedPartIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  // Ask for confirmation before deleting a Company Name from the Company dropdown options
  const handleDeleteCompanyOption = (targetName: string, context?: 'add' | 'edit') => {
    const trimmed = targetName.trim();
    if (!trimmed || trimmed === '__custom__') return;
    sound.playTick();
    setPendingDeleteCompany({ name: trimmed, context });
  };

  // Execute Company Name deletion after user confirms warning dialog
  const handleConfirmDeleteCompanyOption = () => {
    if (!pendingDeleteCompany) return;
    const { name: trimmed, context } = pendingDeleteCompany;
    onDeleteCompanyName?.(trimmed);
    if (context === 'add' && newPartCompany.trim().toLowerCase() === trimmed.toLowerCase()) {
      setNewPartCompany('');
    }
    if (context === 'edit' && editCompany.trim().toLowerCase() === trimmed.toLowerCase()) {
      setEditCompany('');
    }
    if (bulkCompanyInput.trim().toLowerCase() === trimmed.toLowerCase()) {
      setBulkCompanyInput('');
    }
    sound.playTick();
    showToast(`🗑️ Deleted company "${trimmed}" from dropdown list.`, 'info');
    setPendingDeleteCompany(null);
  };

  // Open Quick Bulk Company modal
  const handleOpenBulkCompany = (defaultScope?: 'selected' | 'filtered') => {
    sound.playTick();
    const scope = defaultScope || (selectedPartIds.size > 0 ? 'selected' : 'filtered');
    setBulkCompanyScope(scope);
    setBulkCompanyInput(availableCompanies[0] || '');
    setIsBulkCompanyOpen(true);
  };

  // Apply Company Name to selected or all filtered products at once
  const handleConfirmBulkCompany = (companyOverride?: string) => {
    const targetCompany = (companyOverride !== undefined ? companyOverride : bulkCompanyInput).trim();
    if (!targetCompany) return;

    const targetIds = bulkCompanyScope === 'selected' && selectedPartIds.size > 0
      ? Array.from(selectedPartIds)
      : filteredParts.map(p => p.id);

    if (targetIds.length === 0) return;

    const detectedOrigin = detectOriginFromCompany(registeredCompanyPool, targetCompany);

    if (onBulkAssignCompany) {
      onBulkAssignCompany(targetCompany, targetIds);
    } else if (onUpdatePart) {
      onRegisterNewCompany?.(targetCompany);
      targetIds.forEach(id => {
        onUpdatePart(id, {
          companyName: targetCompany,
          ...(detectedOrigin ? { origin: detectedOrigin } : {})
        });
      });
    }

    sound.playVictory();
    const originInfo = detectedOrigin ? ` (Origin: ${detectedOrigin === 'China' ? '🇨🇳 China' : '🇦🇪 Dubai'})` : '';
    showToast(`🏢 Assigned "${targetCompany}"${originInfo} to ${targetIds.length} product${targetIds.length === 1 ? '' : 's'}!`);
    setSelectedPartIds(new Set());
    setIsBulkCompanyOpen(false);
  };

  const getIconForGroup = (iconKey: string) => {
    switch (iconKey) {
      case 'screen': return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'battery': return <Battery className="w-5 h-5 text-emerald-400" />;
      case 'glass': return <Layers className="w-5 h-5 text-purple-400" />;
      case 'port': return <Zap className="w-5 h-5 text-amber-400" />;
      default: return <Tag className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      
      {/* Action Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-sm font-semibold animate-in slide-in-from-top-2 duration-150 ${
          notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
            : notification.type === 'info'
            ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200'
            : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Search Header Bar - Only Search Bar & Key Actions, No Popular Chips */}
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Clean Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spare part or phone model (e.g. 13 Pro Max, A12, Note 13, Battery)..."
              className="w-full bg-[#070c18] border-2 border-slate-700/80 focus:border-cyan-400 rounded-2xl pl-13 pr-10 py-3.5 text-base sm:text-lg text-white font-medium placeholder-slate-400 outline-none transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Formulas, Add Part */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:w-auto sm:items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowFormulaBar(!showFormulaBar);
              }}
              className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                showFormulaBar
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Formulas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTick();
                handleOpenAddPartModal();
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Part</span>
            </button>
          </div>
        </div>

        {/* Category Finder & Filter Bar - Makes finding any category fast and easy */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Category:</span>
            </div>

          </div>

          {/* Full Category Dropdown Picker */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 hidden sm:inline">Select:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                sound.playTick();
                setSelectedCategoryFilter(e.target.value);
              }}
              className="bg-[#070c18] border border-slate-700 hover:border-cyan-500/60 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer max-w-full"
            >
              <option value="__all__">All Categories ({parts.length})</option>
              {categories.map(cat => {
                const count = parts.filter(p => p.cat === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
            {selectedCategoryFilter !== '__all__' && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  setSelectedCategoryFilter('__all__');
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Expandable Formula Explanation */}
        {showFormulaBar && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-cyan-500/40 text-xs sm:text-sm text-slate-300 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="font-bold text-cyan-300 flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="w-4 h-4" />
              <span>Official Price Formulas & Conversions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">USD+ (Cost in USD):</span>
                <span className="text-emerald-400 font-bold text-sm sm:text-base">
                  Price D / 3.67 + Expense
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Exact rate: 1 USD = 3.67 AED (1 AED = 0.27 USD) + saved shipping/customs expense.
                </span>
              </div>

              {/* Default Cargo & Shipping Rates (By Air & By Sea) */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300 font-sans font-bold">
                    Default Cargo &amp; Shipping ($):
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    Air &amp; Sea
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-emerald-300 font-sans font-semibold mb-1">
                      ✈️ Default By Air ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempAirCargoRate}
                      onChange={(e) => handleDefaultAirRateChange(e.target.value)}
                      placeholder="0.65"
                      className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-lg px-2 py-1 text-sm font-mono font-bold text-emerald-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-300 font-sans font-semibold mb-1">
                      🚢 Default By Sea ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSeaCargoRate}
                      onChange={(e) => handleDefaultSeaRateChange(e.target.value)}
                      placeholder="0.20"
                      className="w-full bg-slate-950 border border-blue-500/60 focus:border-blue-400 rounded-lg px-2 py-1 text-sm font-mono font-bold text-blue-300 focus:outline-none"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block font-sans pt-1 border-t border-slate-800">
                  Added automatically to USD+ when selecting By Air (+${currentAirRate.toFixed(2)}) or By Sea (+${currentSeaRate.toFixed(2)})
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-sans font-bold">
                    Yuan ¥ (Manual Exchange Rate):
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Manual Input
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-300">1 USD =</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempYuanRate}
                    onChange={(e) => setTempYuanRate(e.target.value)}
                    onBlur={() => {
                      const val = parseFloat(tempYuanRate);
                      if (!isNaN(val) && val > 0 && onUpdateYuanRate) {
                        onUpdateYuanRate(val);
                        showToast(`Updated Yuan Exchange Rate: 1 USD = ${val} RMB (All product prices updated)`);
                      }
                    }}
                    placeholder="7.23"
                    className="w-20 bg-slate-950 border border-amber-500/60 focus:border-amber-400 rounded-lg px-2 py-1 text-sm font-mono font-bold text-amber-300 focus:outline-none"
                  />
                  <span className="text-xs font-mono text-amber-400 font-bold">RMB</span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(tempYuanRate);
                      if (!isNaN(val) && val > 0 && onUpdateYuanRate) {
                        onUpdateYuanRate(val);
                        sound.playVictory();
                        showToast(`✅ Saved Yuan Exchange Rate: 1 USD = ${val} RMB! All product prices recalculated.`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Save Rate
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block font-sans font-normal">
                  Conversion: Yuan ¥ = (Price D / 3.67) * {currentYuanRate} · USD = Yuan / {currentYuanRate}
                </span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans font-medium">Sales $ (Origin Price):</span>
                <span className="text-violet-300 font-bold text-sm sm:text-base">
                  Direct Google Sheet Price $ (No 1.3 Markup)
                </span>
                <span className="text-[11px] text-slate-400 block font-sans font-normal mt-0.5">
                  Follows exact original spreadsheet price $.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECENTLY ADDED ITEM CONFIRMATION BANNER */}
      {recentlyAddedPart && (
        <div className="bg-[#0b1626] border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saved to Database (Row #1)
                  </span>
                  <span className="text-xs text-slate-400">
                    Persisted in Local Storage & App Catalog
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <span>{recentlyAddedPart.name}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {recentlyAddedPart.cat}
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  setSearchTerm(recentlyAddedPart.name);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search This Part</span>
              </button>
              {onOpenDbModal && (
                <button
                  type="button"
                  onClick={() => onOpenDbModal()}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700 text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Google Sheets DB</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setRecentlyAddedPart(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Confirmation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Dirham (AED)</span>
              <span className="text-cyan-300 font-bold text-sm sm:text-base">{formatNum(recentlyAddedPart.d)} D</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Guangzhou Yuan (¥)</span>
              <span className="text-amber-300 font-bold text-sm sm:text-base">¥{formatNum(recentlyAddedPart.yuan ?? 0)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">USD+ Cost</span>
              <span className="text-emerald-400 font-bold text-sm sm:text-base">${formatNum(recentlyAddedPart.usd)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-sans text-slate-400 block">Customer Sales Price</span>
              <span className="text-violet-300 font-bold text-sm sm:text-base">${formatNum(recentlyAddedPart.salesPrice)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            ✓ Available immediately below in the catalog table (Row #1), in the Quiz Practice pool, and auto-synced or backed up in the Google Sheets database.
          </p>
        </div>
      )}

      {/* DEVICE PROFILE DRILLDOWN (When user types a model) */}
      {isProfileMode && profileData && (
        <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Device Profile: "{searchTerm}"
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
                Showing all compatible replacement parts for this phone model.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-800/60">
                {profileData.totalFound} Parts Found
              </span>
              {filteredParts.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenBulkCompany('filtered')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/60 text-xs text-cyan-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Give Company ({filteredParts.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
              >
                Back to Full Catalog
              </button>
            </div>
          </div>

          {profileData.totalFound === 0 ? (
            <div className="py-12 text-center text-slate-400 font-normal">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">No spare parts found matching "{searchTerm}".</p>
              <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">Try a shorter model search such as "A12", "13 Pro", or "Note 13".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {profileData.groups.map((group) => (
                <div key={group.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                        {getIconForGroup(group.iconKey)}
                        <span>{group.label}</span>
                      </div>
                      <span className="text-xs text-cyan-400 font-mono font-medium bg-cyan-950/40 px-2 py-0.5 rounded-md">
                        {group.items.length} parts
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
                      {group.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-start justify-between text-xs sm:text-sm gap-3 group">
                          <div className="flex-1">
                            <span className="text-white font-semibold leading-snug block">{item.name}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                                {item.id}
                              </span>
                              {item.companyName && (
                                <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.5 rounded">
                                  {item.companyName}
                                </span>
                              )}
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                item.shippingMethod === 'sea'
                                  ? 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60'
                                  : 'text-sky-300 bg-sky-950/60 border-sky-800/60'
                              }`}>
                                {item.shippingMethod === 'sea' ? 'By Sea' : 'By Air'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenMove(item)}
                                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                              >
                                <FolderSync className="w-3 h-3 text-indigo-400" />
                                <span>Move</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3 h-3 text-amber-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(item)}
                                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span className="font-bold text-cyan-300 text-sm block">
                              {formatNum(item.d)} D
                            </span>
                            <span className="font-bold text-emerald-400 text-xs block">
                              USD+ ${formatNum(item.usd)}
                            </span>
                            <span className="font-medium text-violet-300 text-[11px] block">
                              Sales ${formatNum(item.salesPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Cross-model compatibility */}
              {profileData.compat.length > 0 && (
                <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 md:col-span-2 lg:col-span-3 shadow-xl">
                  <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm sm:text-base mb-3 pb-2 border-b border-slate-800">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span>Cross-Model Screen Compatibility (Fits Other Phones)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                    {profileData.compat.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-1.5">
                        <span className="text-white font-semibold">{c.lcd}</span>
                        <span className="text-cyan-300 font-mono text-xs font-medium bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-900/50">
                          Fits: {c.fits}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ZERO PARTS / FORMATTED STATE (Clean Slate ready for new upload) */}
      {!isProfileMode && !searchTerm.trim() && parts.length === 0 && (
        <div className="bg-[#0b111e] border-2 border-dashed border-cyan-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-5 animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-300">
            <Database className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Database is Formatted (0 Products)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              The database has been cleared to a clean blank slate. You can now connect your Google Sheet or upload a CSV file to populate your custom catalog!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenDbModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onOpenDbModal();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Google Sheet / CSV</span>
              </button>
            )}

            {onRestoreDefault && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onRestoreDefault();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Restore Demo Catalog (480 Parts)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS HUB DIV - PRICE INCREASE, PRICE DECREASE & ADD NEW PRODUCT (Directly connected to Price Tracker) */}
      {!isProfileMode && !searchTerm.trim() && !showAllCatalog && selectedCategoryFilter === '__all__' && (!activeCompanyFilter || activeCompanyFilter === '__all__') && parts.length > 0 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Catalog Search & Browse Box */}
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Search className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Spare Parts Catalog Search
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                Type any phone model (e.g. 13 Pro Max, A12, Note 13) or spare part name in the search bar above to look up prices, Guangzhou Yuan rates, and USD profit margins.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  setShowAllCatalog(true);
                }}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <span>Browse All {parts.length} Spare Parts</span>
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* FULL-PAGE CATALOG BROWSER TABLE (Active when user types in search, picks a category/company, or chooses to browse all) */}
      {!isProfileMode && (searchTerm.trim() !== '' || showAllCatalog || selectedCategoryFilter !== '__all__' || (activeCompanyFilter && activeCompanyFilter !== '__all__')) && (
        <div className="space-y-4 w-full animate-in fade-in duration-150">

          {/* Quick Price Tracker & New Product Link Bar */}
          <div className="bg-[#0b111e]/90 border border-slate-800 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Price Tracker Quick Links:</span>
              <span className="text-slate-400 hidden sm:inline">Jump directly to filtered price changes or add new items</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onNavigateToPriceTracker?.('increase');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Price Increase ({priceStats.increasesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  onNavigateToPriceTracker?.('decrease');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Price Decrease ({priceStats.decreasesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  handleOpenAddPartModal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Add New Product</span>
              </button>
            </div>
          </div>

          {/* Active Company Filter Banner if active */}
          {activeCompanyFilter && activeCompanyFilter !== '__all__' && (
            <div className="bg-cyan-950/60 border border-cyan-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span className="text-xs sm:text-sm text-slate-200">
                  Showing spare parts sourced from: <strong className="text-cyan-300 font-bold">{activeCompanyFilter}</strong>
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-900/80 text-white font-bold">
                  {filteredParts.length} parts
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  setInternalCompanyFilter('__all__');
                  onClearCompanyFilter?.();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Show All Companies
              </button>
            </div>
          )}
          
          {/* Bulk Selection Actions Bar */}
          {selectedPartIds.size > 0 && (
            <div className="bg-[#0e1726] border-2 border-cyan-500/60 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-xs font-mono">
                  {selectedPartIds.size}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white">
                  products selected
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {filteredParts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenBulkCompany(selectedPartIds.size > 0 ? 'selected' : 'filtered')}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/60 text-cyan-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {selectedPartIds.size > 0
                        ? `Give Company (${selectedPartIds.size} Selected)`
                        : `Give Company (${filteredParts.length})`}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setTargetMoveCat(categories[0] || 'iPhone LCD');
                    setCustomMoveCat('');
                    setIsBulkMoveOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderSync className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Move Selected ({selectedPartIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setIsBulkDeleteOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Selected ({selectedPartIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPartIds(new Set())}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Full Page Width Product Table */}
          <div className="bg-[#0b111e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white font-mono text-base">{filteredParts.length}</span>
                <span className="font-medium text-slate-300">items found</span>
                {selectedCategoryFilter !== '__all__' && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-semibold">
                    {selectedCategoryFilter}
                  </span>
                )}
                {searchTerm && (
                  <span className="text-xs text-cyan-400 font-medium ml-1">
                    matching "{searchTerm}"
                  </span>
                )}
              </div>

              {/* Inline Table Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                  placeholder="Search inside list (model, ID, company)..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-colors"
                />
                {tableSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setTableSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    title="Clear table search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {filteredParts.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        toggleSelectAll();
                      }}
                      className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {selectedPartIds.size === filteredParts.length ? 'Unselect All' : `Select All (${filteredParts.length})`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBulkCompany(selectedPartIds.size > 0 ? 'selected' : 'filtered')}
                      className="text-xs font-bold text-cyan-200 hover:text-white px-3.5 py-1.5 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/45 border border-cyan-500/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {selectedPartIds.size > 0
                          ? `Give Company (${selectedPartIds.size})`
                          : `Give Company (${filteredParts.length})`}
                      </span>
                    </button>
                  </>
                )}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                {showAllCatalog && !searchTerm && (
                  <button
                    type="button"
                    onClick={() => setShowAllCatalog(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Hide Catalog</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table - Order: Checkbox, #, ID / SKU, Product Name, Category, Price D, Yuan ¥, USD+, Sales $, Actions */}
            <div className="hidden md:block overflow-x-auto max-h-[750px] rounded-2xl border border-slate-700/80 shadow-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-[#070c18] text-slate-300 uppercase text-xs font-semibold tracking-wider z-10 border-b-2 border-slate-700">
                  <tr className="border-b border-slate-700/90">
                    <th className="py-4 px-3 w-10 text-center border-b border-slate-700">
                      <input 
                        type="checkbox" 
                        checked={filteredParts.length > 0 && selectedPartIds.size === filteredParts.length}
                        onChange={toggleSelectAll}
                        title="Select All Products"
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-3 w-12 text-center text-slate-500 font-medium border-b border-slate-700">#</th>
                    <th className="py-4 px-3.5 font-mono text-cyan-300 font-semibold border-b border-slate-700 whitespace-nowrap">ID / SKU</th>
                    <th className="py-4 px-5 font-semibold border-b border-slate-700">Product Name</th>
                    <th className="py-4 px-4 font-semibold border-b border-slate-700">Category (Brand _Part Type)</th>
                    <th className="py-4 px-5 text-right font-mono text-cyan-400 font-semibold border-b border-slate-700">Price D</th>
                    <th className="py-4 px-5 text-right font-mono text-amber-300 font-semibold border-b border-slate-700">Yuan ¥</th>
                    <th className="py-4 px-5 text-right font-mono text-emerald-400 font-semibold border-b border-slate-700">USD+</th>
                    <th className="py-4 px-5 text-right font-mono text-violet-400 font-semibold border-b border-slate-700">Sales $</th>
                    <th className="py-4 px-5 text-center font-semibold text-slate-300 w-36 border-b border-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/80 bg-[#090e1a]/60 font-medium">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 font-normal text-base border-b border-slate-700/80">
                        No spare parts match your search query "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((item, idx) => {
                      const isRecentlyAdded = recentlyAddedPart && (item.id === recentlyAddedPart.id || (idx === 0 && item.name === recentlyAddedPart.name));
                      const isSelected = selectedPartIds.has(item.id);
                      return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors cursor-pointer group border-b border-slate-700/80 hover:border-slate-600 ${
                          isSelected
                            ? 'bg-cyan-950/30 ring-1 ring-cyan-500/40'
                            : isRecentlyAdded 
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-l-4 border-l-emerald-400' 
                            : 'hover:bg-slate-800/60'
                        }`}
                        onClick={() => {
                          sound.playTick();
                          setSearchTerm(item.name);
                        }}
                      >
                        <td className="py-3.5 px-3 text-center border-b border-slate-700/80" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-normal tabular-nums border-b border-slate-700/80">
                          {isRecentlyAdded ? (
                            <span className="font-bold text-emerald-400">1 ★</span>
                          ) : (
                            <span className="text-slate-500">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 border-b border-slate-700/80" onClick={(e) => e.stopPropagation()}>
                          <span 
                            title={`Unique ID: ${item.id} (Prevents duplicate overwrite on Google Sheets)`}
                            className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-700/60 px-2 py-1 rounded tracking-wide inline-flex items-center gap-1 select-all transition-colors shadow-sm"
                          >
                            {item.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 border-b border-slate-700/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold transition-colors text-base ${isRecentlyAdded ? 'text-emerald-200 group-hover:text-white' : 'text-white group-hover:text-cyan-300'}`}>
                              {item.name}
                            </span>
                            {isRecentlyAdded && (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> JUST ADDED
                              </span>
                            )}
                            {item.isCustom && !isRecentlyAdded && (
                              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 inline-flex items-center gap-1">
                              {item.shippingMethod === 'sea' ? '🚢 Sea' : '✈️ Air'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 inline-flex items-center gap-1">
                              {item.origin === 'China' ? '🇨🇳 CHN' : '🇦🇪 DXB'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 border-b border-slate-700/80">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 whitespace-nowrap">
                              {item.cat}
                            </span>
                            {item.companyName ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCompanyFilter(item.companyName!);
                                }}
                                title="Click to filter catalog by this supplier"
                                className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 px-2 py-0.5 rounded-md border border-cyan-800/50 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1"
                              >
                                🏢 {item.companyName}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(item);
                                }}
                                title="Click to assign supplier for this item"
                                className="text-[9px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60 transition-colors cursor-pointer"
                              >
                                + Set Supplier
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-cyan-300 font-bold text-base tabular-nums border-b border-slate-700/80">
                          {formatNum(item.d)} D
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-amber-300 font-bold text-base tabular-nums border-b border-slate-700/80">
                          ¥{formatNum(item.yuan !== undefined ? item.yuan : (item.isCustom ? 0 : ((item.d / 3.67) * currentYuanRate)))}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-emerald-400 font-bold text-base tabular-nums border-b border-slate-700/80">
                          ${formatNum(item.usd)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-violet-300 font-bold text-base tabular-nums border-b border-slate-700/80">
                          ${formatNum(item.salesPrice)}
                        </td>
                        <td className="py-3.5 px-5 text-center border-b border-slate-700/80" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              title="Move to another Category"
                              onClick={() => handleOpenMove(item)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <FolderSync className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="hidden xl:inline">Move</span>
                            </button>
                            <button
                              type="button"
                              title="Edit Product"
                              onClick={() => handleOpenEdit(item)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden xl:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              title="Delete Product"
                              onClick={() => handleOpenDelete(item)}
                              className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 border border-rose-800/50 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span className="hidden xl:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );})
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Optimized for Small Screens & Touch) */}
            <div className="md:hidden divide-y divide-slate-800/70 max-h-[750px] overflow-y-auto rounded-2xl border border-slate-800 bg-[#070c18]/80">
              {filteredParts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-normal">
                  No spare parts found matching "{searchTerm}".
                </div>
              ) : (
                filteredParts.map((item, idx) => {
                  const isRecentlyAdded = recentlyAddedPart && (item.id === recentlyAddedPart.id || (idx === 0 && item.name === recentlyAddedPart.name));
                  const isSelected = selectedPartIds.has(item.id);
                  return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playTick();
                      setSearchTerm(item.name);
                    }}
                    className={`p-4 transition-colors active:bg-slate-800 ${
                      isSelected
                        ? 'bg-cyan-950/30 ring-1 ring-cyan-500/40'
                        : isRecentlyAdded
                        ? 'bg-emerald-950/30 border-l-4 border-l-emerald-400'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Top Meta Bar: Index, Unique ID, Cargo Shipment, Origin */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500 font-mono text-[11px] font-medium">#{idx + 1}</span>
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-700/60 px-2 py-0.5 rounded text-[11px] tracking-wide shadow-sm">
                          {item.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {item.shippingMethod === 'sea' ? '🚢 Sea' : '✈️ Air'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {item.origin === 'China' ? '🇨🇳 CHN' : '🇦🇪 DXB'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-base leading-tight">
                          {item.name}
                        </span>
                        {isRecentlyAdded && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> JUST ADDED
                          </span>
                        )}
                        {item.isCustom && !isRecentlyAdded && (
                          <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                          {item.cat}
                        </span>
                        {item.companyName ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetCompanyFilter(item.companyName!);
                            }}
                            title="Click to filter catalog by this supplier"
                            className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-800/50 shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                          >
                            🏢 {item.companyName}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            title="Click to assign supplier for this item"
                            className="text-[9px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60 transition-colors cursor-pointer"
                          >
                            + Set Supplier
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs mt-2 font-medium">
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Price D</span>
                        <span className="text-cyan-300 font-bold text-sm">{formatNum(item.d)} D</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Yuan ¥</span>
                        <span className="text-amber-300 font-bold text-sm">¥{formatNum(item.yuan !== undefined ? item.yuan : (item.isCustom ? 0 : ((item.d / 3.67) * currentYuanRate)))}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">USD+</span>
                        <span className="text-emerald-400 font-bold text-sm">${formatNum(item.usd)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">Sales $</span>
                        <span className="text-violet-300 font-bold text-sm">${formatNum(item.salesPrice)}</span>
                      </div>
                    </div>

                    {/* Action Bar on Mobile Card */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-400 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span>Select</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenMove(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <FolderSync className="w-3 h-3 text-indigo-400" />
                          <span>Move</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-xs font-semibold text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Del</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal - 500 Medium labels/inputs, 600 SemiBold buttons, 700 Bold headings */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Add New Spare Part</h3>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-backs up to Google Sheet ("ALL PRODUCT") directly on save</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="space-y-4">
              {idError && (
                <div className="p-3 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl flex items-center justify-between gap-2.5 text-xs text-amber-200 animate-in fade-in shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span className="font-bold">{idError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setNewPartId(getNextSequentialDxId(parts, 'DX-000001'));
                      setIdError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow"
                  >
                    Generate Next ID
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. LCD IPHONE 16 PRO MAX"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-colors"
                />
              </div>

              {/* Product ID / SKU Field with Auto-Generate Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Product ID / SKU</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(Unique Key in Google Sheet)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setNewPartId(getNextSequentialDxId(parts, 'DX-000001'));
                      setIdError(null);
                    }}
                    className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto-Generate ID (DX-000001)</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newPartId}
                  onChange={(e) => {
                    setNewPartId(e.target.value);
                    setIdError(null);
                  }}
                  placeholder={`e.g. ${getNextSequentialDxId(parts, 'DX-000001')} (Row 3 format)`}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-cyan-300 font-mono font-bold outline-none transition-colors"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick ID Format:</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setNewPartId(getNextSequentialDxId(parts, 'DX-000001'));
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-bold cursor-pointer transition-colors"
                  >
                    ⭐ {getNextSequentialDxId(parts, 'DX-000001')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setNewPartId(getNextSequentialDxId(parts, 'DX0001'));
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
                  >
                    {getNextSequentialDxId(parts, 'DX0001')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const slug = newPartName ? newPartName.replace(/\s+/g, '-').toUpperCase() : 'ITEM';
                      setNewPartId(`DX-AIR-${slug}`);
                      handleSelectNewShippingMethod('air');
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 cursor-pointer transition-colors"
                  >
                    ✈️ DX-AIR-
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const slug = newPartName ? newPartName.replace(/\s+/g, '-').toUpperCase() : 'ITEM';
                      setNewPartId(`DX-SEA-${slug}`);
                      handleSelectNewShippingMethod('sea');
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/80 cursor-pointer transition-colors"
                  >
                    🚢 DX-SEA-
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      const slug = newPartName ? newPartName.replace(/\s+/g, '-').toUpperCase() : 'ITEM';
                      setNewPartId(`ROYAL-${slug}`);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 cursor-pointer transition-colors"
                  >
                    👑 ROYAL-
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      const slug = newPartName ? newPartName.replace(/\s+/g, '-').toUpperCase() : 'ITEM';
                      setNewPartId(`DUBAI-VX-${slug}`);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 cursor-pointer transition-colors"
                  >
                    🇦🇪 DUBAI-VX-
                  </button>
                </div>
              </div>

              {/* Select Category & Select Company Name (Side by Side Grid - Exactly as requested in user screenshot) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Column 1: Select Category */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1 tracking-wider flex items-center justify-between">
                    <span>Category (Brand _Part Type) *</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">GOOGLE SHEET</span>
                  </label>
                  <select
                    value={newPartCat}
                    onChange={(e) => setNewPartCat(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-3 text-xs text-white font-medium outline-none transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Create New Category...</option>
                  </select>

                  {newPartCat === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="Type custom category name..."
                      className="mt-2 w-full bg-[#070c18] border border-cyan-500/70 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white font-medium outline-none animate-in fade-in"
                    />
                  )}
                </div>

                {/* Column 2: Select Company Name (Linked with Register Company) */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1 tracking-wider flex items-center justify-between gap-1">
                    <span>Select Company Name</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (showManageCompaniesAdd) {
                          setShowManageCompaniesAdd(false);
                        } else {
                          sound.playTick();
                          setPendingOpenDeleteListAdd(true);
                        }
                      }}
                      className="text-[10px] text-rose-300 hover:text-rose-200 font-mono font-bold underline cursor-pointer"
                    >
                      {showManageCompaniesAdd ? 'Hide Delete' : `Delete List (${availableCompanies.length})`}
                    </button>
                  </label>
                  <select
                    value={newPartCompany}
                    onChange={(e) => handleNewPartCompanyChange(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-3 text-xs text-white font-medium outline-none transition-colors"
                  >
                    <option value="">
                      {availableCompanies.length === 0 ? "-- No Companies Yet (Select Register below) --" : "-- Select Company (Register Company) --"}
                    </option>
                    {availableCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Register New Company...</option>
                  </select>

                  {newPartCompany && newPartCompany !== '__custom__' && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 truncate">
                        Selected: <strong className="text-cyan-300">{newPartCompany}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanyOption(newPartCompany, 'add')}
                        className="px-2 py-0.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/90 border border-rose-700/60 text-rose-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title={`Delete "${newPartCompany}" from Company Name options`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete "{newPartCompany}"</span>
                      </button>
                    </div>
                  )}

                  {showManageCompaniesAdd && availableCompanies.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#070c18] border border-rose-500/40 space-y-1.5 animate-in fade-in">
                      <span className="block text-[10px] font-bold text-rose-300 uppercase">
                        Click a company name to delete it:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {availableCompanies.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDeleteCompanyOption(c, 'add')}
                            className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-800/80 border border-rose-700/50 text-rose-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{c}</span>
                            <X className="w-3 h-3 text-rose-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {newPartCompany === '__custom__' && (
                    <div className="mt-2 space-y-1 animate-in fade-in">
                      <input
                        type="text"
                        required
                        value={customCompanyInput}
                        onChange={(e) => handleCustomNewCompanyChange(e.target.value)}
                        placeholder="Type company name to register..."
                        className="w-full bg-[#070c18] border border-cyan-500/70 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white font-medium outline-none"
                      />
                      <p className="text-[10px] text-cyan-400 font-medium">
                        ✓ Will be automatically registered in "Register Company" directory
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sourced Origin (Dubai / China) & Cargo Shipment (By Air / By Sea) */}
              <div className="p-3.5 rounded-2xl bg-[#070c18] border border-cyan-500/40 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Shipping Method & Origin</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(Air / Sea · Dubai / China)</span>
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60">
                    VISIBLE IN QUIZ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* By Air / By Sea Toggle */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                      <span>Cargo / Shipping:</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        {newPartShippingMethod === 'air'
                          ? `✈️ BY AIR (+$${currentAirRate.toFixed(2)})`
                          : `🚢 BY SEA (+$${currentSeaRate.toFixed(2)})`}
                      </span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectNewShippingMethod('air')}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          newPartShippingMethod === 'air'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold ring-2 ring-emerald-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Plane className={`w-3.5 h-3.5 ${newPartShippingMethod === 'air' ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="text-xs">✈️ By Air</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">+${currentAirRate.toFixed(2)} USD</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNewShippingMethod('sea')}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          newPartShippingMethod === 'sea'
                            ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold ring-2 ring-blue-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Ship className={`w-3.5 h-3.5 ${newPartShippingMethod === 'sea' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-xs">🚢 By Sea</span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-300 font-bold">+${currentSeaRate.toFixed(2)} USD</span>
                      </button>
                    </div>
                  </div>

                  {/* Dubai / China Sourced Origin Toggle */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <span>Sourced From (Origin):</span>
                        <span className="text-[10px] text-cyan-400 font-bold font-mono">
                          {newPartOrigin === 'Dubai' ? '🇦🇪 DUBAI' : '🇨🇳 CHINA'}
                        </span>
                      </span>
                      {(() => {
                        const activeComp = newPartCompany === '__custom__' ? customCompanyInput : newPartCompany;
                        const matchedComp = findRegisteredCompany(activeComp);
                        const autoOrig = detectOriginFromCompany(registeredCompanyPool, activeComp);
                        if (!autoOrig) return null;
                        return (
                          <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded-md truncate max-w-[160px]" title={matchedComp?.location || autoOrig}>
                            Auto: {matchedComp?.location || autoOrig}
                          </span>
                        );
                      })()}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectNewOrigin('Dubai')}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newPartOrigin === 'Dubai'
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold ring-2 ring-cyan-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-semibold">🇦🇪 Dubai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNewOrigin('China')}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newPartOrigin === 'China'
                            ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold ring-2 ring-amber-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-semibold">🇨🇳 China</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Default Cargo & Shipping Inputs (By Air & By Sea) */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-300 uppercase mb-1">
                      Default Cargo By Air ($)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono font-bold text-emerald-400 pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempAirCargoRate}
                        onChange={(e) => handleDefaultAirRateChange(e.target.value)}
                        placeholder="0.65"
                        className="w-full bg-slate-900 border border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-6 pr-10 py-1.5 text-xs text-emerald-200 font-mono font-bold outline-none"
                      />
                      <span className="absolute right-2.5 text-[10px] font-mono text-slate-400 pointer-events-none">AIR</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-blue-300 uppercase mb-1">
                      Default Cargo By Sea ($)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono font-bold text-blue-400 pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempSeaCargoRate}
                        onChange={(e) => handleDefaultSeaRateChange(e.target.value)}
                        placeholder="0.20"
                        className="w-full bg-slate-900 border border-blue-500/50 focus:border-blue-400 rounded-xl pl-6 pr-10 py-1.5 text-xs text-blue-200 font-mono font-bold outline-none"
                      />
                      <span className="absolute right-2.5 text-[10px] font-mono text-slate-400 pointer-events-none">SEA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Change Type (Required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Product Change Type *</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">REQUIRED</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'New Product', label: 'New Product', desc: 'Newly registered', color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                    { id: 'Price Decrease', label: 'Price Decrease', desc: 'Price drop / down', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
                    { id: 'Price Increase', label: 'Price Increase', desc: 'Price hike / up', color: 'border-amber-500/50 bg-amber-950/40 text-amber-300' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setNewPartChangeType(opt.id as any);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        newPartChangeType === opt.id
                          ? `${opt.color} ring-2 ring-cyan-400 font-bold shadow-md scale-[1.02]`
                          : 'bg-[#070c18] border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <span className="block text-xs font-bold">{opt.label}</span>
                      <span className="block text-[10px] opacity-75">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Currency Options: Dirham, Yuan, USD+, Sales Price MUST */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1 flex items-center justify-between gap-1">
                    <span>Dirham Option (Price D)</span>
                    <span className={`text-[10px] font-normal lowercase tracking-normal ${isAddDirhamDisabled ? 'text-rose-400 font-semibold' : 'text-cyan-300/80'}`}>
                      {isAddDirhamDisabled
                        ? (addCompanyOrigin === 'China' ? 'disabled (china company)' : newPartOrigin === 'China' ? 'disabled (origin china)' : 'disabled (yuan active)')
                        : '→ converts to USD'}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      disabled={isAddDirhamDisabled}
                      value={newPartD}
                      onChange={(e) => handleDirhamChange(e.target.value)}
                      placeholder={isAddDirhamDisabled ? 'Disabled' : 'e.g. 1.0'}
                      className={`w-full h-11 sm:h-12 border rounded-xl pl-3.5 pr-14 text-sm sm:text-base font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                        isAddDirhamDisabled
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#070c18] border-slate-700 focus:border-cyan-400 text-white'
                      }`}
                    />
                    <span className={`absolute right-3.5 text-xs font-bold font-mono pointer-events-none ${isAddDirhamDisabled ? 'text-slate-600' : 'text-cyan-400'}`}>
                      AED
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 flex items-center justify-between gap-1">
                    <span>Yuan Option (¥)</span>
                    <span className={`text-[10px] font-normal lowercase tracking-normal ${isAddYuanDisabled ? 'text-rose-400 font-semibold' : 'text-amber-300/80'}`}>
                      {isAddYuanDisabled
                        ? (addCompanyOrigin === 'Dubai' ? 'disabled (dubai company)' : newPartOrigin === 'Dubai' ? 'disabled (origin dubai)' : 'disabled (dirham active)')
                        : '→ converts to USD'}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      disabled={isAddYuanDisabled}
                      value={newPartYuan}
                      onChange={(e) => handleYuanChange(e.target.value)}
                      placeholder={isAddYuanDisabled ? 'Disabled' : 'e.g. 1.97'}
                      className={`w-full h-11 sm:h-12 border rounded-xl pl-3.5 pr-14 text-sm sm:text-base font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                        isAddYuanDisabled
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#070c18] border-slate-700 focus:border-amber-400 text-white'
                      }`}
                    />
                    <span className={`absolute right-3.5 text-xs font-bold font-mono pointer-events-none ${isAddYuanDisabled ? 'text-slate-600' : 'text-amber-400'}`}>
                      RMB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1 flex items-center justify-between">
                    <span>USD+ Option (Cost)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={newPartUsd}
                      onChange={(e) => handleUsdChange(e.target.value)}
                      placeholder="e.g. 0.27"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-slate-700 focus:border-emerald-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-emerald-400 font-mono pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                      Sales $ (Manual)
                    </label>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                      MANUAL
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={newPartSalesPrice}
                      onChange={(e) => handleSalesPriceChange(e.target.value)}
                      placeholder="0.0"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-emerald-500/60 focus:border-emerald-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none leading-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-emerald-400 font-mono pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo & Shipping Expense $ - Always added to USD+ (By Air default $0.65, By Sea default $0.20) */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Cargo &amp; Shipping Expense $ ({newPartShippingMethod === 'air' ? '✈️ By Air' : '🚢 By Sea'}):
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Always added to USD+: USD+ = (D / 3.67) + Cargo (${newPartExpense || (newPartShippingMethod === 'sea' ? currentSeaRate : currentAirRate)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-400 font-mono font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newPartExpense}
                      onChange={(e) => handleExpenseChange(e.target.value)}
                      placeholder={String(getDefaultCargoForMethod(newPartShippingMethod))}
                      className="w-24 bg-[#070c18] border border-cyan-500/60 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono font-bold text-right outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">
                    Defaults — Air: <span className="text-emerald-400 font-bold font-mono">+${currentAirRate.toFixed(2)}</span> · Sea: <span className="text-blue-400 font-bold font-mono">+${currentSeaRate.toFixed(2)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(newPartExpense);
                      const rateToSave = !isNaN(val) && val >= 0 ? val : 0;
                      if (newPartShippingMethod === 'sea') {
                        onUpdateSeaCargoRate?.(rateToSave);
                        setTempSeaCargoRate(String(rateToSave));
                        showToast(`Saved +$${rateToSave.toFixed(2)} as default By Sea cargo rate!`);
                      } else {
                        onUpdateAirCargoRate?.(rateToSave);
                        setTempAirCargoRate(String(rateToSave));
                        showToast(`Saved +$${rateToSave.toFixed(2)} as default By Air cargo rate!`);
                      }
                      sound.playVictory();
                    }}
                    className="text-[11px] text-cyan-300 hover:text-white font-semibold underline cursor-pointer"
                  >
                    Save as Default {newPartShippingMethod === 'sea' ? 'By Sea' : 'By Air'} Rate
                  </button>
                </div>
              </div>

              {/* Google Sheets Backup Status */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Google Sheet Backup:</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  Auto-Sync Enabled
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Save & Auto-Backup to Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingPart && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Spare Part</h3>
                  <p className="text-xs text-slate-400">Update pricing, name, and category in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPart(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. iPhone 13 Pro Max OLED"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white font-medium outline-none"
                />
              </div>

              {/* Product ID / SKU Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Product ID / SKU</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(Col A on Sheet)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      const finalCompany = editCompany === '__custom__' ? customEditCompany : editCompany;
                      const genId = generateSmartPartId(
                        editName.trim() || 'PART',
                        finalCompany,
                        editShippingMethod,
                        editOrigin,
                        new Set(parts.filter(p => p.id !== editingPart?.id).map(p => p.id))
                      );
                      setEditPartId(genId);
                    }}
                    className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Regenerate ID</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editPartId}
                  onChange={(e) => setEditPartId(e.target.value)}
                  placeholder="Product ID"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-300 font-mono font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 tracking-wider flex items-center justify-between">
                    <span>Category (Brand _Part Type) *</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">GOOGLE SHEET</span>
                  </label>
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                    <option value="__custom__" className="bg-slate-900 text-amber-300 font-semibold">
                      + Create Custom Category...
                    </option>
                  </select>

                  {editCat === '__custom__' && (
                    <div className="mt-2 animate-in fade-in duration-100">
                      <input
                        type="text"
                        required
                        value={customEditCat}
                        onChange={(e) => setCustomEditCat(e.target.value)}
                        placeholder="Type custom category name..."
                        className="w-full bg-[#070c18] border-2 border-amber-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-medium outline-none placeholder-slate-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 tracking-wider flex items-center justify-between gap-1">
                    <span>Company Name</span>
                    <button
                      type="button"
                      onClick={() => setShowManageCompaniesEdit(prev => !prev)}
                      className="text-[10px] text-rose-300 hover:text-rose-200 font-mono font-bold underline cursor-pointer"
                    >
                      {showManageCompaniesEdit ? 'Hide Delete' : `Delete List (${availableCompanies.length})`}
                    </button>
                  </label>
                  <select
                    value={editCompany}
                    onChange={(e) => handleEditCompanyChange(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium outline-none"
                  >
                    <option value="">-- No Company Specified --</option>
                    {availableCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Register New Company...</option>
                  </select>

                  {editCompany && editCompany !== '__custom__' && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 truncate">
                        Selected: <strong className="text-amber-300">{editCompany}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanyOption(editCompany, 'edit')}
                        className="px-2 py-0.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/90 border border-rose-700/60 text-rose-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title={`Delete "${editCompany}" from Company Name options`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete "{editCompany}"</span>
                      </button>
                    </div>
                  )}

                  {showManageCompaniesEdit && availableCompanies.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#070c18] border border-rose-500/40 space-y-1.5 animate-in fade-in">
                      <span className="block text-[10px] font-bold text-rose-300 uppercase">
                        Click a company name to delete it:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {availableCompanies.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDeleteCompanyOption(c, 'edit')}
                            className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-800/80 border border-rose-700/50 text-rose-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{c}</span>
                            <X className="w-3 h-3 text-rose-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {editCompany === '__custom__' && (
                    <div className="mt-2 space-y-1 animate-in fade-in duration-100">
                      <input
                        type="text"
                        required
                        value={customEditCompany}
                        onChange={(e) => handleCustomEditCompanyChange(e.target.value)}
                        placeholder="Type company name to register..."
                        className="w-full bg-[#070c18] border-2 border-amber-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-medium outline-none placeholder-slate-500"
                      />
                      <p className="text-[10px] text-cyan-400 font-medium">
                        ✓ Will be automatically registered in "Register Company" directory
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sourced Origin (Dubai / China) & Cargo Shipment (By Air / By Sea) */}
              <div className="p-3.5 rounded-2xl bg-[#070c18] border border-amber-500/40 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Shipping Method & Origin</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(Air / Sea · Dubai / China)</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                    VISIBLE IN QUIZ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* By Air / By Sea Toggle */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                      <span>Cargo / Shipping:</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        {editShippingMethod === 'air' ? '✈️ BY AIR' : '🚢 BY SEA'}
                      </span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setEditShippingMethod('air');
                          const nextExp = currentAirRate;
                          setEditExpense(String(nextExp));
                          const d = parseFloat(editD);
                          const y = parseFloat(editYuan);
                          if (!isNaN(d) && d > 0) {
                            setEditUsd(String(Number(((d / 3.67) + nextExp).toFixed(2))));
                          } else if (!isNaN(y) && y > 0) {
                            setEditUsd(String(Number(((y / currentYuanRate) + nextExp).toFixed(2))));
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          editShippingMethod === 'air'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold ring-2 ring-emerald-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Plane className={`w-3.5 h-3.5 ${editShippingMethod === 'air' ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="text-xs">✈️ By Air</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">+${currentAirRate.toFixed(2)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setEditShippingMethod('sea');
                          const nextExp = currentSeaRate;
                          setEditExpense(String(nextExp));
                          const d = parseFloat(editD);
                          const y = parseFloat(editYuan);
                          if (!isNaN(d) && d > 0) {
                            setEditUsd(String(Number(((d / 3.67) + nextExp).toFixed(2))));
                          } else if (!isNaN(y) && y > 0) {
                            setEditUsd(String(Number(((y / currentYuanRate) + nextExp).toFixed(2))));
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          editShippingMethod === 'sea'
                            ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold ring-2 ring-blue-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Ship className={`w-3.5 h-3.5 ${editShippingMethod === 'sea' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-xs">🚢 By Sea</span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-300 font-bold">+${currentSeaRate.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dubai / China Sourced Origin Toggle */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <span>Sourced From (Origin):</span>
                        <span className="text-[10px] text-amber-400 font-bold font-mono">
                          {editOrigin === 'Dubai' ? '🇦🇪 DUBAI' : '🇨🇳 CHINA'}
                        </span>
                      </span>
                      {(() => {
                        const activeComp = editCompany === '__custom__' ? customEditCompany : editCompany;
                        const matchedComp = findRegisteredCompany(activeComp);
                        const autoOrig = detectOriginFromCompany(registeredCompanyPool, activeComp);
                        if (!autoOrig) return null;
                        return (
                          <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded-md truncate max-w-[160px]" title={matchedComp?.location || autoOrig}>
                            Auto: {matchedComp?.location || autoOrig}
                          </span>
                        );
                      })()}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectEditOrigin('Dubai')}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editOrigin === 'Dubai'
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold ring-2 ring-cyan-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-semibold">🇦🇪 Dubai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectEditOrigin('China')}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editOrigin === 'China'
                            ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold ring-2 ring-amber-400/60 shadow-lg scale-[1.02]'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-semibold">🇨🇳 China</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Change Type (Required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Product Change Type *</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">REQUIRED</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'New Product', label: 'New Product', desc: 'Newly registered', color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                    { id: 'Price Decrease', label: 'Price Decrease', desc: 'Price drop / down', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
                    { id: 'Price Increase', label: 'Price Increase', desc: 'Price hike / up', color: 'border-amber-500/50 bg-amber-950/40 text-amber-300' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setEditChangeType(opt.id as any);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        editChangeType === opt.id
                          ? `${opt.color} ring-2 ring-amber-400 font-bold shadow-md scale-[1.02]`
                          : 'bg-[#070c18] border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <span className="block text-xs font-bold">{opt.label}</span>
                      <span className="block text-[10px] opacity-75">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Options: Dirham, Yuan, USD+, Sales Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1 flex items-center justify-between gap-1">
                    <span>Dirham Option (Price D)</span>
                    {isEditDirhamDisabled && (
                      <span className="text-[10px] text-rose-400 font-semibold lowercase tracking-normal">
                        {editCompanyOrigin === 'China' ? 'disabled (china company)' : editOrigin === 'China' ? 'disabled (origin china)' : 'disabled (yuan active)'}
                      </span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      disabled={isEditDirhamDisabled}
                      value={editD}
                      onChange={(e) => handleEditDirhamChange(e.target.value)}
                      placeholder={isEditDirhamDisabled ? 'Disabled' : '0.0'}
                      className={`w-full h-11 sm:h-12 border rounded-xl pl-3.5 pr-14 text-sm sm:text-base font-mono font-bold outline-none transition-colors ${
                        isEditDirhamDisabled
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#070c18] border-slate-700 focus:border-cyan-400 text-white'
                      }`}
                    />
                    <span className={`absolute right-3.5 text-xs font-bold font-mono pointer-events-none ${isEditDirhamDisabled ? 'text-slate-600' : 'text-cyan-400'}`}>
                      AED
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 flex items-center justify-between gap-1">
                    <span>Yuan Option (¥)</span>
                    {isEditYuanDisabled && (
                      <span className="text-[10px] text-rose-400 font-semibold lowercase tracking-normal">
                        {editCompanyOrigin === 'Dubai' ? 'disabled (dubai company)' : editOrigin === 'Dubai' ? 'disabled (origin dubai)' : 'disabled (dirham active)'}
                      </span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      disabled={isEditYuanDisabled}
                      value={editYuan}
                      onChange={(e) => handleEditYuanChange(e.target.value)}
                      placeholder={isEditYuanDisabled ? 'Disabled' : '0.0'}
                      className={`w-full h-11 sm:h-12 border rounded-xl pl-3.5 pr-14 text-sm sm:text-base font-mono font-bold outline-none transition-colors ${
                        isEditYuanDisabled
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#070c18] border-slate-700 focus:border-amber-400 text-white'
                      }`}
                    />
                    <span className={`absolute right-3.5 text-xs font-bold font-mono pointer-events-none ${isEditYuanDisabled ? 'text-slate-600' : 'text-amber-400'}`}>
                      RMB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">
                    USD+ Option (Cost)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={editUsd}
                      onChange={(e) => handleEditUsdChange(e.target.value)}
                      placeholder="0.0"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-slate-700 focus:border-emerald-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-emerald-400 font-mono pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                      Sales $ (Manual)
                    </label>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                      MANUAL
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={editSalesPrice}
                      onChange={(e) => setEditSalesPrice(e.target.value)}
                      placeholder="0.0"
                      className="w-full h-11 sm:h-12 bg-[#070c18] border border-emerald-500/60 focus:border-emerald-400 rounded-xl pl-3.5 pr-14 text-sm sm:text-base text-white font-mono font-bold outline-none transition-colors"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-emerald-400 font-mono pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Option */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">Optional Expense $ (Shipping / Customs):</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Always added to USD+: USD+ = (D / 3.67) + Expense
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-400 font-mono font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editExpense}
                      onChange={(e) => handleEditExpenseChange(e.target.value)}
                      placeholder="0.0"
                      className="w-24 bg-[#070c18] border border-cyan-500/60 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono font-bold text-right outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    Saved Default Rate: <span className="text-cyan-400 font-bold font-mono">+${currentExpenseRate.toFixed(2)} USD</span>
                  </span>
                  {onUpdateExpenseRate && (
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(editExpense);
                        const rateToSave = !isNaN(val) && val >= 0 ? val : 0;
                        onUpdateExpenseRate(rateToSave, false);
                        sound.playVictory();
                        showToast(`Saved +$${rateToSave.toFixed(2)} as your default expense rate!`);
                      }}
                      className="text-[11px] text-cyan-300 hover:text-white font-semibold underline cursor-pointer"
                    >
                      Save as Default Rate
                    </button>
                  )}
                </div>
              </div>

              {/* Google Sheet Direct Sync Indicator */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-800/50 text-xs flex items-center justify-between">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Spare Parts Price Quiz & Inventory Suite:</span>
                </span>
                <span className="text-cyan-300 font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Tab: ALL PRODUCT (Auto-Sync)</span>
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPart(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Product Category Modal */}
      {(movingPart || isBulkMoveOpen) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border-2 border-indigo-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <FolderSync className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Move to Category</h3>
                  <p className="text-xs text-slate-400">
                    {isBulkMoveOpen 
                      ? `Moving ${selectedPartIds.size} selected products` 
                      : `Moving "${movingPart?.name}"`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMovingPart(null);
                  setIsBulkMoveOpen(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!isBulkMoveOpen && movingPart && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">Current Category:</span>
                  <span className="font-semibold text-cyan-300 font-mono text-sm">{movingPart.cat}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-indigo-300 uppercase mb-1 tracking-wider flex items-center justify-between">
                  <span>Destination Category (Brand _Part Type) *</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">GOOGLE SHEET</span>
                </label>
                <select
                  value={targetMoveCat}
                  onChange={(e) => setTargetMoveCat(e.target.value)}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white font-medium outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                  <option value="__custom__" className="bg-slate-900 text-indigo-300 font-semibold">
                    + Move into New Category...
                  </option>
                </select>

                {targetMoveCat === '__custom__' && (
                  <div className="mt-2 animate-in fade-in duration-100">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={customMoveCat}
                      onChange={(e) => setCustomMoveCat(e.target.value)}
                      placeholder="Type new category name..."
                      className="w-full bg-[#070c18] border-2 border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-medium outline-none placeholder-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMovingPart(null);
                    setIsBulkMoveOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isBulkMoveOpen ? handleConfirmBulkMove : handleConfirmMove}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 cursor-pointer transition-all"
                >
                  {isBulkMoveOpen ? `Move ${selectedPartIds.size} Products` : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {(deletingPart || isBulkDeleteOpen) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border-2 border-rose-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Product</h3>
                  <p className="text-xs text-rose-400/90 font-medium">Permanent removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeletingPart(null);
                  setIsBulkDeleteOpen(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {isBulkDeleteOpen ? (
                  <>
                    Are you sure you want to delete <strong className="text-rose-400 font-bold">{selectedPartIds.size} selected products</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to delete <strong className="text-white font-bold">"{deletingPart?.name}"</strong> ({deletingPart?.cat})?
                  </>
                )}
              </p>
              
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
                ⚠️ This item will be permanently removed from your catalog table, local database, and Quiz practice pool.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingPart(null);
                    setIsBulkDeleteOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isBulkDeleteOpen ? handleConfirmBulkDelete : handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleteOpen ? `Delete ${selectedPartIds.size} Products` : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Bulk Assign Company Name Modal */}
      {isBulkCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Give Company Name (Quick Bulk)</h3>
                  <p className="text-xs text-slate-400">
                    Assign one company to multiple products at once
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkCompanyOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Target Scope Selector */}
              {selectedPartIds.size > 0 && filteredParts.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setBulkCompanyScope('selected');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      bulkCompanyScope === 'selected'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Checked Items ({selectedPartIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setBulkCompanyScope('filtered');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      bulkCompanyScope === 'filtered'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Filtered Items ({filteredParts.length})
                  </button>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#070c18] border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Products to update:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {bulkCompanyScope === 'selected' && selectedPartIds.size > 0
                    ? `${selectedPartIds.size} selected products`
                    : `${filteredParts.length} filtered products`}
                </span>
              </div>

              {/* Quick 1-Click Supplier Chips */}
              {availableCompanies.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    1-Click Pick Existing Company:
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {availableCompanies.map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setBulkCompanyInput(comp);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          bulkCompanyInput.trim().toLowerCase() === comp.toLowerCase()
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-500/60 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{comp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Or Type Any Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Or Type Company Name *
                </label>
                <input
                  type="text"
                  value={bulkCompanyInput}
                  onChange={(e) => setBulkCompanyInput(e.target.value)}
                  placeholder="e.g. Samsung Direct, Dubai VX, NAJI HASSAN..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none"
                />
                {(() => {
                  const matchedComp = findRegisteredCompany(bulkCompanyInput);
                  const autoOrig = detectOriginFromCompany(registeredCompanyPool, bulkCompanyInput);
                  if (!autoOrig) return null;
                  return (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/50 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                      <span>
                        Origin from Company Register: <strong>{autoOrig === 'China' ? '🇨🇳 China' : '🇦🇪 Dubai'}</strong>
                      </span>
                      {matchedComp?.location && (
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                          {matchedComp.location}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkCompanyOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bulkCompanyInput.trim()}
                  onClick={() => handleConfirmBulkCompany()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Apply to {bulkCompanyScope === 'selected' && selectedPartIds.size > 0 ? selectedPartIds.size : filteredParts.length} Products
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Dialog for Company Delete Buttons */}
      {(pendingDeleteCompany || pendingOpenDeleteListAdd) && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b111e] border-2 border-rose-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {pendingDeleteCompany ? 'Warning: Delete Company' : 'Warning: Delete Company List'}
                  </h3>
                  <p className="text-xs text-rose-400/90 font-medium">Confirmation required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteCompany(null);
                  setPendingOpenDeleteListAdd(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {pendingDeleteCompany ? (
                  <>
                    Are you sure you want to delete <strong className="text-white font-bold">"{pendingDeleteCompany.name}"</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to open the <strong className="text-white font-bold">Delete Company List</strong>?
                  </>
                )}
              </p>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
                {pendingDeleteCompany
                  ? `⚠️ Deleting "${pendingDeleteCompany.name}" will remove it from your Company Name dropdown and clear it from products assigned to this company.`
                  : '⚠️ Opening this list lets you delete company names from your dropdown list.'}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingDeleteCompany(null);
                    setPendingOpenDeleteListAdd(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingDeleteCompany) {
                      handleConfirmDeleteCompanyOption();
                    } else {
                      sound.playTick();
                      setPendingOpenDeleteListAdd(false);
                      setShowManageCompaniesAdd(true);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {pendingDeleteCompany
                      ? `Yes, Delete "${pendingDeleteCompany.name}"`
                      : 'Yes, Open Delete List'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
