import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  FileDown, 
  Check, 
  Copy, 
  X, 
  ExternalLink,
  Calendar,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  MessageCircle,
  Printer,
  Filter,
  RotateCcw,
  CheckSquare,
  Square,
  Smartphone,
  Cloud,
  CloudUpload,
  Database,
  Table
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RegisteredCompany, SparePartItem, AUTHENTIC_GOOGLE_SHEET_CATEGORIES } from '../data/initialData';
import { sound } from '../services/soundService';
import { extractPhoneModel, detectBrand } from '../utils/productUtils';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface RegisterCompanyViewProps {
  companies: RegisteredCompany[];
  parts: SparePartItem[];
  onAddCompany: (company: Omit<RegisteredCompany, 'id'>) => void;
  onUpdateCompany: (id: string, updated: Partial<RegisteredCompany>) => void;
  onDeleteCompany: (id: string) => void;
  onSelectCompanyForCatalog?: (companyName: string) => void;
  onClearAllCompanies?: () => void;
  onAssignCompanyToParts?: (companyName: string, partIds: string[]) => void;
}

const fmt = (n: number | undefined) => {
  if (n === undefined || isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const RegisterCompanyView: React.FC<RegisterCompanyViewProps> = ({
  companies,
  parts,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onSelectCompanyForCatalog,
  onClearAllCompanies,
  onAssignCompanyToParts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [copiedWhatsAppId, setCopiedWhatsAppId] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Sync to Google Spreadsheet tab "REGISTERED COMPANIES"
  const handleSyncToGoogleSpreadsheet = async () => {
    sound.playTick();
    const config = GoogleSheetsService.getSavedConfig();
    if (!config.sheetUrl) {
      alert("No Google Sheet connected yet. Please click 'Google Sheets DB' in the top bar to connect your Google Web App or Spreadsheet URL.");
      return;
    }
    setIsSyncingSheet(true);
    setSyncMessage(null);
    try {
      const res = await GoogleSheetsService.syncAllCompaniesToGoogleSheet(config.sheetUrl, companies);
      if (res.success) {
        sound.playVictory();
        setSyncMessage(`☁️ Successfully synced ${companies.length} companies to Google Spreadsheet tab "REGISTERED COMPANIES"!`);
        setTimeout(() => setSyncMessage(null), 6000);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to sync with Google Sheet');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleExportCompaniesXls = () => {
    sound.playVictory();
    GoogleSheetsService.exportCompaniesSpreadsheet(companies, parts);
  };

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<RegisteredCompany | null>(null);

  // Requirement 4C: Company Product History Drilldown State
  const [viewingCompanyProducts, setViewingCompanyProducts] = useState<RegisteredCompany | null>(null);

  // Requirement: Assign LCDs to Supplier State ("Ogoon halka aan ka keenay LCD kasta")
  const [assigningCompany, setAssigningCompany] = useState<RegisteredCompany | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignCatFilter, setAssignCatFilter] = useState('ALL_LCD');
  const [assignSelectedIds, setAssignSelectedIds] = useState<Set<string>>(new Set());

  // Company Products Filter States (for Drilldown)
  const [productSearch, setProductSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [partTypeFilter, setPartTypeFilter] = useState('ALL');
  const [purchaseDateFilter, setPurchaseDateFilter] = useState('ALL');

  // Add Form State
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addWhatsApp, setAddWhatsApp] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addCategory, setAddCategory] = useState('All LCD Screens (Multi-Brand)');
  const [addCustomCategory, setAddCustomCategory] = useState('');
  const [addContactPerson, setAddContactPerson] = useState('');
  const [addStatus, setAddStatus] = useState<'preferred' | 'active' | 'verified'>('preferred');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsApp, setEditWhatsApp] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editStatus, setEditStatus] = useState<'preferred' | 'active' | 'verified'>('active');

  // Extract ALL actual categories existing across the catalog and Google Sheet in the app
  const allAppCategories = useMemo(() => {
    const set = new Set<string>(AUTHENTIC_GOOGLE_SHEET_CATEGORIES);
    parts.forEach(p => {
      if (p.cat && p.cat.trim()) set.add(p.cat.trim());
    });
    return Array.from(set).sort();
  }, [parts]);

  // Grouped category subsets for quick navigation
  const lcdCategories = useMemo(() => {
    return allAppCategories.filter(c => 
      c.toUpperCase().includes('LCD') || 
      c.toUpperCase().includes('SCREEN') || 
      c.toUpperCase().includes('OLED')
    );
  }, [allAppCategories]);

  const batteryCategories = useMemo(() => {
    return allAppCategories.filter(c => 
      c.toUpperCase().includes('BATTERY') || 
      c.toUpperCase().includes('BATT')
    );
  }, [allAppCategories]);

  const flexCategories = useMemo(() => {
    return allAppCategories.filter(c => 
      c.toUpperCase().includes('FLEX') || 
      c.toUpperCase().includes('CHARGER') || 
      c.toUpperCase().includes('CABLE') || 
      c.toUpperCase().includes('PORT')
    );
  }, [allAppCategories]);

  const otherCategories = useMemo(() => {
    return allAppCategories.filter(c => 
      !lcdCategories.includes(c) && 
      !batteryCategories.includes(c) && 
      !flexCategories.includes(c)
    );
  }, [allAppCategories, lcdCategories, batteryCategories, flexCategories]);

  // Count products sourced from each company
  const sourcedCounts = useMemo(() => {
    const map: Record<string, number> = {};
    parts.forEach(p => {
      if (p.companyName) {
        const key = p.companyName.trim().toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [parts]);

  // Count specifically LCD products sourced from each company
  const lcdSourcedCounts = useMemo(() => {
    const map: Record<string, number> = {};
    parts.forEach(p => {
      if (p.companyName && (p.cat.toUpperCase().includes('LCD') || p.cat.toUpperCase().includes('OLED'))) {
        const key = p.companyName.trim().toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [parts]);

  // Total products with company assignment
  const totalSourcedParts = useMemo(() => {
    return parts.filter(p => p.companyName && p.companyName.trim()).length;
  }, [parts]);

  // Total LCD products across catalog
  const totalLcdPartsCount = useMemo(() => {
    return parts.filter(p => p.cat.toUpperCase().includes('LCD') || p.cat.toUpperCase().includes('OLED')).length;
  }, [parts]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) ||
        c.phoneNo.toLowerCase().includes(q) ||
        (c.whatsappNo && c.whatsappNo.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q) ||
        c.note.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q));

      const matchesCategory = selectedCategoryFilter === 'ALL' || 
        (selectedCategoryFilter === 'LCD' && (c.category?.toUpperCase().includes('LCD') || c.category?.toUpperCase().includes('SCREEN'))) ||
        c.category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [companies, searchTerm, selectedCategoryFilter]);

  // Copy phone handler
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    sound.playTick();
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Copy WhatsApp handler
  const handleCopyWhatsApp = (wa: string, id: string) => {
    navigator.clipboard.writeText(wa);
    setCopiedWhatsAppId(id);
    sound.playTick();
    setTimeout(() => setCopiedWhatsAppId(null), 2000);
  };

  // Add submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPhone.trim()) return;

    const finalCategory = addCategory === '__custom__' && addCustomCategory.trim()
      ? addCustomCategory.trim()
      : (addCategory || 'All LCD Screens (Multi-Brand)');

    onAddCompany({
      name: addName.trim(),
      phoneNo: addPhone.trim(),
      whatsappNo: addWhatsApp.trim() || addPhone.trim(),
      location: addLocation.trim() || 'Dubai / China Market',
      note: addNote.trim() || 'Direct parts supplier.',
      category: finalCategory,
      contactPerson: addContactPerson.trim() || 'Sales Representative',
      status: addStatus,
      createdAt: new Date().toISOString().split('T')[0]
    });

    sound.playVictory();
    setAddName('');
    setAddPhone('');
    setAddWhatsApp('');
    setAddLocation('');
    setAddNote('');
    setAddContactPerson('');
    setAddCategory('All LCD Screens (Multi-Brand)');
    setAddCustomCategory('');
    setShowAddModal(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (comp: RegisteredCompany) => {
    setEditingCompany(comp);
    setEditName(comp.name);
    setEditPhone(comp.phoneNo);
    setEditWhatsApp(comp.whatsappNo || comp.phoneNo);
    setEditLocation(comp.location);
    setEditNote(comp.note);
    setEditCategory(comp.category || 'All LCD Screens (Multi-Brand)');
    setEditCustomCategory('');
    setEditContactPerson(comp.contactPerson || '');
    setEditStatus(comp.status || 'active');
  };

  // Edit submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editName.trim()) return;

    const finalCategory = editCategory === '__custom__' && editCustomCategory.trim()
      ? editCustomCategory.trim()
      : (editCategory || 'All LCD Screens (Multi-Brand)');

    onUpdateCompany(editingCompany.id, {
      name: editName.trim(),
      phoneNo: editPhone.trim(),
      whatsappNo: editWhatsApp.trim() || editPhone.trim(),
      location: editLocation.trim(),
      note: editNote.trim(),
      category: finalCategory,
      contactPerson: editContactPerson.trim(),
      status: editStatus
    });

    sound.playVictory();
    setEditingCompany(null);
  };

  // =========================================================================
  // ASSIGN LCDs / PRODUCTS TO SUPPLIER HANDLERS
  // =========================================================================
  const handleOpenAssignModal = (comp: RegisteredCompany) => {
    sound.playTick();
    setAssigningCompany(comp);
    setAssignSearch('');
    setAssignCatFilter('ALL_LCD');

    // Pre-select items currently assigned to this company
    const current = new Set<string>();
    parts.forEach(p => {
      if (p.companyName && p.companyName.trim().toLowerCase() === comp.name.trim().toLowerCase()) {
        current.add(p.id);
      }
    });
    setAssignSelectedIds(current);
  };

  // Filtered parts candidate list inside Assign Modal
  const assignCandidateParts = useMemo(() => {
    if (!assigningCompany) return [];
    return parts.filter(p => {
      // Category filter inside modal
      const isLcd = p.cat.toUpperCase().includes('LCD') || p.cat.toUpperCase().includes('OLED');
      const matchesCategory = 
        assignCatFilter === 'ALL' ? true :
        assignCatFilter === 'ALL_LCD' ? isLcd :
        p.cat === assignCatFilter;

      if (!matchesCategory) return false;

      if (!assignSearch.trim()) return true;
      const q = assignSearch.trim().toLowerCase();
      return p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [parts, assigningCompany, assignCatFilter, assignSearch]);

  const handleBulkSelectCategory = (catName: string) => {
    sound.playTick();
    const next = new Set(assignSelectedIds);
    parts.forEach(p => {
      const isMatch = catName === 'ALL_LCD'
        ? (p.cat.toUpperCase().includes('LCD') || p.cat.toUpperCase().includes('OLED'))
        : p.cat === catName;
      if (isMatch) next.add(p.id);
    });
    setAssignSelectedIds(next);
  };

  const handleSaveAssignments = () => {
    if (!assigningCompany) return;
    sound.playVictory();
    onAssignCompanyToParts?.(assigningCompany.name, Array.from(assignSelectedIds));
    setAssigningCompany(null);
  };

  // Products belonging to the currently selected company in "View Products"
  const rawCompanyProducts = useMemo(() => {
    if (!viewingCompanyProducts) return [];
    const targetCompName = viewingCompanyProducts.name.trim().toLowerCase();
    return parts.filter(p => p.companyName && p.companyName.trim().toLowerCase() === targetCompName);
  }, [viewingCompanyProducts, parts]);

  // Derived options for filters
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    rawCompanyProducts.forEach(p => {
      const b = p.brand || detectBrand(p.name, p.cat);
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [rawCompanyProducts]);

  const availableModels = useMemo(() => {
    const set = new Set<string>();
    rawCompanyProducts.forEach(p => {
      const m = p.model || extractPhoneModel(p.name);
      if (m) set.add(m);
    });
    return Array.from(set).sort();
  }, [rawCompanyProducts]);

  const availablePartTypes = useMemo(() => {
    const set = new Set<string>();
    rawCompanyProducts.forEach(p => {
      if (p.cat) set.add(p.cat);
    });
    return Array.from(set).sort();
  }, [rawCompanyProducts]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    rawCompanyProducts.forEach(p => {
      if (p.purchaseDate) set.add(p.purchaseDate);
    });
    return Array.from(set).sort().reverse();
  }, [rawCompanyProducts]);

  // Filtered company products based on search & dropdowns
  const filteredCompanyProducts = useMemo(() => {
    return rawCompanyProducts.filter(p => {
      const q = productSearch.trim().toLowerCase();
      const brand = p.brand || detectBrand(p.name, p.cat);
      const model = p.model || extractPhoneModel(p.name);

      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        brand.toLowerCase().includes(q) || 
        model.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchesBrand = brandFilter === 'ALL' || brand === brandFilter;
      const matchesModel = modelFilter === 'ALL' || model === modelFilter;
      const matchesPartType = partTypeFilter === 'ALL' || p.cat === partTypeFilter;
      const matchesDate = purchaseDateFilter === 'ALL' || (p.purchaseDate && p.purchaseDate === purchaseDateFilter);

      return matchesSearch && matchesBrand && matchesModel && matchesPartType && matchesDate;
    });
  }, [rawCompanyProducts, productSearch, brandFilter, modelFilter, partTypeFilter, purchaseDateFilter]);

  // Totals for filtered products
  const companyProductsTotalQuantity = useMemo(() => {
    return filteredCompanyProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
  }, [filteredCompanyProducts]);

  const companyProductsTotalValueAED = useMemo(() => {
    return filteredCompanyProducts.reduce((sum, p) => sum + (p.d * (p.quantity || 1)), 0);
  }, [filteredCompanyProducts]);

  const companyProductsTotalValueUSD = useMemo(() => {
    return filteredCompanyProducts.reduce((sum, p) => sum + (p.usd * (p.quantity || 1)), 0);
  }, [filteredCompanyProducts]);

  const hasActiveProductFilters = productSearch !== '' || brandFilter !== 'ALL' || modelFilter !== 'ALL' || partTypeFilter !== 'ALL' || purchaseDateFilter !== 'ALL';

  const resetProductFilters = () => {
    setProductSearch('');
    setBrandFilter('ALL');
    setModelFilter('ALL');
    setPartTypeFilter('ALL');
    setPurchaseDateFilter('ALL');
    sound.playTick();
  };

  // Requirement 4E: PDF Export for Company Products
  const handleExportCompanyProductsPdf = () => {
    if (!viewingCompanyProducts) return;
    sound.playTick();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Top Header Banner
    doc.setFillColor(11, 17, 30);
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Accent line
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 75, pageWidth, 4, 'F');

    // Brand and Report Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`DO OR DIE PRO — COMPANY PRODUCT SOURCING REPORT`, 40, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official procurement history & product inventory sourced from ${viewingCompanyProducts.name}`, 40, 54);

    // Company Information Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(40, 95, pageWidth - 80, 52, 6, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`COMPANY: ${viewingCompanyProducts.name.toUpperCase()}`, 55, 114);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const contactLine = `Contact: ${viewingCompanyProducts.contactPerson || 'Sales Team'} | Phone: ${viewingCompanyProducts.phoneNo} | WhatsApp: ${viewingCompanyProducts.whatsappNo || viewingCompanyProducts.phoneNo} | Location: ${viewingCompanyProducts.location}`;
    doc.text(contactLine, 55, 130);

    const metaLine = `Report Date: ${currentDate} | Total Product Records: ${filteredCompanyProducts.length} | Total Units Purchased: ${companyProductsTotalQuantity} | Total Sourced Value: ${fmt(companyProductsTotalValueAED)} D ($${fmt(companyProductsTotalValueUSD)})`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text(metaLine, 55, 142);

    // Table Content
    const tableRows = filteredCompanyProducts.map((p, idx) => {
      const brand = p.brand || detectBrand(p.name, p.cat);
      const model = p.model || extractPhoneModel(p.name);
      const qty = p.quantity || 1;
      const date = p.purchaseDate || '2026-11-01';

      return [
        String(idx + 1),
        p.id,
        p.name,
        brand,
        model,
        p.cat,
        `${fmt(p.d)} D`,
        `$${fmt(p.usd)}`,
        'AED & USD',
        String(qty),
        date
      ];
    });

    autoTable(doc, {
      startY: 160,
      head: [['#', 'Product ID', 'Product Name', 'Brand', 'Model', 'Part Type', 'Price (D)', 'Price (USD+)', 'Currency', 'Qty', 'Purchase Date']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 70, fontStyle: 'italic' },
        2: { cellWidth: 160, fontStyle: 'bold' },
        3: { cellWidth: 75 },
        4: { cellWidth: 80 },
        5: { cellWidth: 85 },
        6: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 60, halign: 'right' },
        8: { cellWidth: 55, halign: 'center' },
        9: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        10: { cellWidth: 65, halign: 'center' }
      },
      margin: { left: 40, right: 40 }
    });

    // Final Summary Box at end
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < pageHeight - 60) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, finalY, pageWidth - 80, 32, 6, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `SUMMARY TOTALS:  ${filteredCompanyProducts.length} Product Models  ·  ${companyProductsTotalQuantity} Total Units  ·  Total Investment: ${fmt(companyProductsTotalValueAED)} D  ($${fmt(companyProductsTotalValueUSD)})`,
        55, finalY + 20
      );
    }

    // Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DO OR DIE PRO · Supplier Sourcing Report: ${viewingCompanyProducts.name} · Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    doc.save(`Company_${viewingCompanyProducts.name.replace(/\s+/g, '_')}_Products_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Requirement 4F: Print Report
  const handlePrintCompanyProducts = () => {
    sound.playTick();
    window.print();
  };

  // Save All Companies Directory to PDF
  const handleSaveAllToPdf = () => {
    sound.playTick();
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Header Background Banner
    doc.setFillColor(11, 17, 30);
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Cyan/emerald accent stripe
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 75, pageWidth, 4, 'F');

    // Title & Brand
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DO OR DIE PRO — REGISTERED COMPANIES & SUPPLIERS DIRECTORY', 40, 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official Spare Parts Procurement Directory · Total Registered: ${companies.length} Companies · Exported: ${currentDate}`, 40, 56);

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(40, 95, pageWidth - 80, 42, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(14, 116, 144);
    doc.text('SUPPLIER DIRECTORY & INVENTORY LINK:', 55, 114);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Verified smartphone spare parts companies and vendors. Linked directly with catalog inventory items and product purchase records.',
      285, 114, { maxWidth: pageWidth - 340 }
    );

    // Table Content
    const tableData = companies.map((c, idx) => {
      const sourcedCount = sourcedCounts[c.name.trim().toLowerCase()] || 0;
      const lcdCount = lcdSourcedCounts[c.name.trim().toLowerCase()] || 0;
      return [
        String(idx + 1),
        c.name,
        c.contactPerson || 'N/A',
        c.phoneNo,
        c.whatsappNo || c.phoneNo,
        c.location,
        c.category || 'All LCD Screens',
        `${sourcedCount} Parts (${lcdCount} LCDs)`,
        c.note,
        c.createdAt || 'N/A'
      ];
    });

    autoTable(doc, {
      startY: 150,
      head: [['#', 'Company Name', 'Contact', 'Phone Number', 'WhatsApp', 'Location / Market', 'Category Supplied', 'Sourced', 'Notes / Terms', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 110, fontStyle: 'bold' },
        2: { cellWidth: 70 },
        3: { cellWidth: 85 },
        4: { cellWidth: 85 },
        5: { cellWidth: 95 },
        6: { cellWidth: 80 },
        7: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
        8: { cellWidth: 120 },
        9: { cellWidth: 55, halign: 'center' }
      },
      margin: { left: 40, right: 40 }
    });

    // Footer with Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DO OR DIE PRO Inventory Suite · Page ${i} of ${pageCount} · Direct Supplier Sourcing Directory`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    doc.save(`Registered_Companies_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Save Single Company Slip to PDF
  const handleSaveCompanyPdf = (company: RegisteredCompany) => {
    sound.playTick();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a5'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sourcedCount = sourcedCounts[company.name.trim().toLowerCase()] || 0;
    const lcdCount = lcdSourcedCounts[company.name.trim().toLowerCase()] || 0;

    // Cyan/indigo banner
    doc.setFillColor(14, 116, 144);
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REGISTERED COMPANY PROFILE', 25, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('DO OR DIE PRO · SPARE PARTS SOURCING REGISTRY', 25, 42);

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(25, 75, pageWidth - 50, pageHeight - 110, 8, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(25, 75, pageWidth - 50, pageHeight - 110, 8, 8, 'S');

    let y = 105;
    const addField = (label: string, value: string, isHighlight = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), 40, y);
      y += 15;

      doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
      doc.setFontSize(11);
      doc.setTextColor(isHighlight ? 14 : 15, isHighlight ? 116 : 23, isHighlight ? 144 : 42);
      const lines = doc.splitTextToSize(value, pageWidth - 90);
      doc.text(lines, 40, y);
      y += (lines.length * 14) + 12;
    };

    addField('Company / Supplier Name', company.name, true);
    addField('Contact Person / Rep', company.contactPerson || 'Sales Team');
    addField('Phone Number', company.phoneNo);
    addField('WhatsApp Number', company.whatsappNo || company.phoneNo);
    addField('Location / Address', company.location);
    addField('Category Supplied', company.category || 'All LCD Screens');
    addField('Sourcing Inventory Records', `${sourcedCount} Total Spare Parts (${lcdCount} LCDs) sourced from this company`);
    addField('Notes & Payment Terms', company.note);
    addField('Date Registered', company.createdAt || 'N/A');

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Company ID: ${company.id} · Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

    doc.save(`Company_${company.name.replace(/\s+/g, '_')}_Profile.pdf`);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner Card */}
      <div className="bg-[#0b111e] border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Register Company
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> DIRECT SUPPLIERS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Diwaan gali shirkadaha aad ka soo qaadato alaabta & LCD kasta (Suppliers where you source each LCD and spare part).
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isSyncingSheet}
              onClick={handleSyncToGoogleSpreadsheet}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-950/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Sync registered companies into Google Spreadsheet tab 'REGISTERED COMPANIES'"
            >
              <Cloud className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Syncing...' : 'Sync Google Sheet'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCompaniesXls}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
              title="Download Excel / Google Sheet (.xls) for registered companies and supplied parts"
            >
              <Table className="w-4 h-4" />
              <span>Export Sheet (.xls)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllToPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
              title="Download suppliers directory as PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Save PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950/60 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Register Company</span>
            </button>

            {onClearAllCompanies && companies.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playTick();
                  if (window.confirm('Remove all registered companies? You can then add new companies with new names.')) {
                    onClearAllCompanies();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/50 text-xs font-semibold transition-colors cursor-pointer"
                title="Remove all registered companies"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove All</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Success / Progress Banner */}
        {syncMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5 relative z-10">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-sans text-slate-400 block font-medium">Registered Companies</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-0.5 block">
              {companies.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-sans text-slate-400 block font-medium">LCD Screens Sourced</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {Object.values(lcdSourcedCounts).reduce((a, b) => a + b, 0)} / {totalLcdPartsCount} LCDs
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-sans text-slate-400 block font-medium">All Parts Sourced</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5 block">
              {totalSourcedParts} / {parts.length} items
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-sans text-slate-400 block font-medium">Google Spreadsheet</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300 mt-1.5 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              Tab: "REGISTERED COMPANIES"
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name, contact person, phone no, WhatsApp, location, or notes..."
            className="w-full bg-[#0b111e] border border-slate-800 focus:border-cyan-500/70 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills with App Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Companies' },
            { id: 'LCD', label: '📱 LCD Suppliers' },
            { id: 'Batteries & Flex Cables', label: '🔋 Batteries' },
            { id: 'Tools & IC Chips', label: '🔧 Tools & IC' }
          ].map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                sound.playTick();
                setSelectedCategoryFilter(tag.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === tag.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <div className="p-12 text-center bg-[#0b111e] border border-slate-800 rounded-3xl space-y-4">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-white">
            {companies.length === 0 ? 'No Companies Registered Yet' : 'No companies match your search'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {companies.length === 0 
              ? 'Diwaan gali shirkadaha aad ka soo qaadato alaabta & LCD kasta. Click "+ Register Company" below to add your first supplier.' 
              : 'Try adjusting your search terms or category filter.'}
          </p>
          <div className="pt-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
            >
              + Register New Company
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200 font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const isCopiedPhone = copiedPhoneId === company.id;
            const isCopiedWA = copiedWhatsAppId === company.id;
            const sourcedCount = sourcedCounts[company.name.trim().toLowerCase()] || 0;
            const lcdCount = lcdSourcedCounts[company.name.trim().toLowerCase()] || 0;
            const waNumber = company.whatsappNo || company.phoneNo;
            const cleanWa = waNumber.replace(/[^0-9]/g, '');

            return (
              <div
                key={company.id}
                className="bg-[#0b111e] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all group"
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {company.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Registered {company.createdAt || 'Recent'}</span>
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                      {company.status || 'VERIFIED'}
                    </span>
                  </div>

                  {/* Phone & WhatsApp & Location Rows */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                    
                    {/* Category Supplied Badge */}
                    <div className="flex items-center justify-between gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/40">
                      <span className="text-[11px] text-slate-400 font-medium">Category Supplied:</span>
                      <span className="text-[11px] font-bold text-cyan-300 truncate max-w-[170px]" title={company.category}>
                        {company.category || 'All LCD Screens'}
                      </span>
                    </div>

                    {/* Contact Person */}
                    {company.contactPerson && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-slate-300 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-400 text-[11px]">Contact:</span>
                        <span className="font-semibold text-white">{company.contactPerson}</span>
                      </div>
                    )}

                    {/* Phone Row */}
                    <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono font-medium">{company.phoneNo}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(company.phoneNo, company.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy Phone Number"
                        >
                          {isCopiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`tel:${company.phoneNo.replace(/\s+/g, '')}`}
                          className="p-1 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          title="Call Number"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* WhatsApp Row */}
                    <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-emerald-900/40">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono font-medium">{waNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyWhatsApp(waNumber, company.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy WhatsApp"
                        >
                          {isCopiedWA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {cleanWa && (
                          <a
                            href={`https://wa.me/${cleanWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                            title="Open WhatsApp Chat"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Location Row */}
                    <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </div>

                    {/* Sourced LCDs & Parts Badge */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                        <div className="flex items-center gap-1 text-emerald-300 text-[11px] font-medium">
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                          <span>LCDs:</span>
                        </div>
                        <span className="font-mono font-bold text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-[10px]">
                          {lcdCount} LCDs
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs">
                        <div className="flex items-center gap-1 text-cyan-300 text-[11px] font-medium">
                          <Package className="w-3 h-3 text-cyan-400" />
                          <span>All Parts:</span>
                        </div>
                        <span className="font-mono font-bold text-white bg-cyan-900/60 px-1.5 py-0.5 rounded text-[10px]">
                          {sourcedCount}
                        </span>
                      </div>
                    </div>

                    {/* Note Box */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-300 text-xs leading-relaxed">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Supplier Notes & Terms:
                      </span>
                      <p className="line-clamp-2">{company.note}</p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* View Products Button */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setViewingCompanyProducts(company);
                        resetProductFilters();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-950/60 transition-all cursor-pointer active:scale-95"
                      title="View all products sourced from this company"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View ({sourcedCount})</span>
                    </button>

                    {/* Assign LCDs Button (Direct answer to "Waxaan rabaa in aan ogaado halka aan ka keenay LCD kasta") */}
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(company)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-800/50 transition-colors cursor-pointer"
                      title="Assign LCD screens & parts sourced from this supplier"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assign LCDs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCompanyPdf(company)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      title="Export company profile PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PDF</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(company)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Edit Company Details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        onDeleteCompany(company.id);
                      }}
                      className="p-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete Company Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REQUIREMENT: ASSIGN LCDs / PRODUCTS TO SUPPLIER MODAL                     */}
      {/* ========================================================================= */}
      {assigningCompany && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-emerald-500/50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Assign LCDs Sourced from {assigningCompany.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Dooro LCD-yada aad shirkadaan ka keentay si aad u ogaato halka LCD kasta ka yimid ({assignSelectedIds.size} LCDs selected).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssigningCompany(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Quick Category Buttons */}
            <div className="py-3 border-b border-slate-800 space-y-2 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ⚡ 1-Click Bulk Assign by Category:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleBulkSelectCategory('ALL_LCD')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  + Select All LCDs ({totalLcdPartsCount})
                </button>
                {lcdCategories.map(cat => {
                  const count = parts.filter(p => p.cat === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleBulkSelectCategory(cat)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer transition-colors"
                    >
                      + {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search LCD model name (e.g. 13 Pro Max, A12, Note 12)..."
                  className="w-full bg-[#070c18] border border-slate-800 focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <select
                value={assignCatFilter}
                onChange={(e) => setAssignCatFilter(e.target.value)}
                className="bg-[#070c18] border border-slate-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="ALL_LCD">All LCD Categories ({lcdCategories.length})</option>
                <option value="ALL">All Categories in App ({allAppCategories.length})</option>
                {allAppCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(assignSelectedIds);
                    assignCandidateParts.forEach(p => next.add(p.id));
                    setAssignSelectedIds(next);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold cursor-pointer"
                >
                  Select Filtered ({assignCandidateParts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignSelectedIds(new Set())}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Candidate Products List */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-[#070c18] p-2 space-y-1.5">
              {assignCandidateParts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No LCDs match your search or filter.
                </div>
              ) : (
                assignCandidateParts.map(p => {
                  const isSelected = assignSelectedIds.has(p.id);
                  const currentCompany = p.companyName;
                  const isCurrentThisComp = currentCompany?.trim().toLowerCase() === assigningCompany.name.trim().toLowerCase();

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        sound.playTick();
                        const next = new Set(assignSelectedIds);
                        if (isSelected) next.delete(p.id);
                        else next.add(p.id);
                        setAssignSelectedIds(next);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-500 text-white' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className="font-semibold text-xs truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({p.cat})</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {currentCompany ? (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isCurrentThisComp 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            🏢 {currentCompany}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            No Supplier Yet
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-cyan-300">
                          {p.d} D
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                <strong className="text-emerald-400">{assignSelectedIds.size}</strong> LCDs selected to be sourced from <strong>{assigningCompany.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningCompany(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 cursor-pointer"
                >
                  Save Supplier Assignment ({assignSelectedIds.size})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REQUIREMENT 4C, 4D, 4E, 4F: VIEW COMPANY PRODUCTS & HISTORY MODAL        */}
      {/* ========================================================================= */}
      {viewingCompanyProducts && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-6xl w-full p-4 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 my-auto max-h-[94vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Products Sourced from {viewingCompanyProducts.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40">
                      {filteredCompanyProducts.length} Products ({companyProductsTotalQuantity} Units)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Contact: <strong className="text-white">{viewingCompanyProducts.contactPerson || 'Sales Team'}</strong> · Phone: <span className="font-mono text-cyan-300">{viewingCompanyProducts.phoneNo}</span> · WhatsApp: <span className="font-mono text-emerald-300">{viewingCompanyProducts.whatsappNo || viewingCompanyProducts.phoneNo}</span> · Location: {viewingCompanyProducts.location}
                  </p>
                </div>
              </div>

              {/* Action Buttons: PDF Export, Print Report, Close */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCompanyProductsPdf}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer active:scale-95"
                  title="Export filtered product list as PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCompanyProducts}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer active:scale-95"
                  title="Print product report directly"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setViewingCompanyProducts(null);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 border-b border-slate-800/80 shrink-0">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 uppercase font-bold block">Product Models</span>
                <span className="text-lg font-bold font-mono text-cyan-400">{filteredCompanyProducts.length} models</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 uppercase font-bold block">Total Units</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{companyProductsTotalQuantity} units</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 uppercase font-bold block">Total Sourced Value (AED)</span>
                <span className="text-lg font-bold font-mono text-amber-400">{fmt(companyProductsTotalValueAED)} D</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 uppercase font-bold block">Total Sourced Value (USD)</span>
                <span className="text-lg font-bold font-mono text-indigo-300">${fmt(companyProductsTotalValueUSD)}</span>
              </div>
            </div>

            {/* Requirement 4D: Filters (Search, Brand, Model, Part Type, Purchase Date) */}
            <div className="py-3.5 space-y-2.5 shrink-0">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                {/* Search Product Name / Model */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name, model, category, or ID..."
                    className="w-full bg-[#070c18] border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Brand Filter */}
                  <select
                    value={brandFilter}
                    onChange={(e) => {
                      sound.playTick();
                      setBrandFilter(e.target.value);
                    }}
                    className="bg-[#070c18] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Brands ({availableBrands.length})</option>
                    {availableBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  {/* Model Filter */}
                  <select
                    value={modelFilter}
                    onChange={(e) => {
                      sound.playTick();
                      setModelFilter(e.target.value);
                    }}
                    className="bg-[#070c18] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Models ({availableModels.length})</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  {/* Part Type / Category Filter */}
                  <select
                    value={partTypeFilter}
                    onChange={(e) => {
                      sound.playTick();
                      setPartTypeFilter(e.target.value);
                    }}
                    className="bg-[#070c18] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Categories ({availablePartTypes.length})</option>
                    {availablePartTypes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Purchase Date Filter */}
                  <select
                    value={purchaseDateFilter}
                    onChange={(e) => {
                      sound.playTick();
                      setPurchaseDateFilter(e.target.value);
                    }}
                    className="bg-[#070c18] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Dates ({availableDates.length})</option>
                    {availableDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {hasActiveProductFilters && (
                  <button
                    type="button"
                    onClick={resetProductFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table of Products */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-[#070c18] shadow-inner">
              {filteredCompanyProducts.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-white">No products found matching the criteria</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing filters or search to see all items assigned to {viewingCompanyProducts.name}.
                  </p>
                  {hasActiveProductFilters && (
                    <button
                      type="button"
                      onClick={resetProductFilters}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-200 font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">Brand</th>
                      <th className="py-3 px-3">Model</th>
                      <th className="py-3 px-3">Part Type</th>
                      <th className="py-3 px-3 text-right">Price (D)</th>
                      <th className="py-3 px-3 text-right">Price (USD+)</th>
                      <th className="py-3 px-3 text-center">Currency</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3 text-center">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredCompanyProducts.map((p, idx) => {
                      const brand = p.brand || detectBrand(p.name, p.cat);
                      const model = p.model || extractPhoneModel(p.name);
                      const qty = p.quantity || 1;
                      const date = p.purchaseDate || '2026-11-01';

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-sans text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {p.id}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] font-semibold">
                              {brand}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-300 text-xs font-medium">
                            {model}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="text-xs text-indigo-300 font-medium">
                              {p.cat}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-cyan-300 text-xs">
                            {fmt(p.d)} D
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-300 text-xs">
                            ${fmt(p.usd)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className="text-[10px] text-slate-400 font-mono">AED & USD</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800/50 text-cyan-300 font-bold text-xs">
                              {qty}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans text-slate-400 text-xs">
                            {date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Showing {filteredCompanyProducts.length} of {rawCompanyProducts.length} sourced products</span>
              <button
                type="button"
                onClick={() => setViewingCompanyProducts(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD COMPANY MODAL (TARGETED CSS SELECTOR)                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-cyan-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Register Company</h3>
                  <p className="text-xs text-slate-400">Diwaan gali shirkad alaabta laga soo qaado (Supplier Sourcing Registry)</p>
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

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Al-Burooj LCDs, Dubai Parts Wholesale"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={addContactPerson}
                    onChange={(e) => setAddContactPerson(e.target.value)}
                    placeholder="e.g. Sales Manager, Ahmad"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={addWhatsApp}
                    onChange={(e) => setAddWhatsApp(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Location / Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="e.g. Deira Dubai / Shenzhen China"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                  />
                </div>
              </div>

              {/* FOCUSED ELEMENT: ALL APP CATEGORIES SHOWN HERE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Categories App Ku Jiro (All App Categories) *
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">
                    {allAppCategories.length} Categories ({totalLcdPartsCount} LCDs)
                  </span>
                </div>
                <select
                  value={addCategory}
                  onChange={(e) => {
                    setAddCategory(e.target.value);
                    if (e.target.value !== '__custom__') setAddCustomCategory('');
                  }}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs text-white font-medium outline-none transition-colors"
                >
                  <optgroup label="🌟 MULTI-CATEGORY / GENERAL SUPPLIER">
                    <option value="All LCD Screens (Multi-Brand)">📱 All LCD Screens (Multi-Brand)</option>
                    <option value="All App Categories (General Supplier)">🌟 All App Categories (General Supplier)</option>
                  </optgroup>

                  {lcdCategories.length > 0 && (
                    <optgroup label="📱 LCD DISPLAY CATEGORIES IN APP">
                      {lcdCategories.map(cat => {
                        const count = parts.filter(p => p.cat === cat).length;
                        return (
                          <option key={cat} value={cat}>
                            📱 {cat} ({count} LCDs in Catalog)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {batteryCategories.length > 0 && (
                    <optgroup label="🔋 BATTERY CATEGORIES IN APP">
                      {batteryCategories.map(cat => {
                        const count = parts.filter(p => p.cat === cat).length;
                        return (
                          <option key={cat} value={cat}>
                            🔋 {cat} ({count} Batteries)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {flexCategories.length > 0 && (
                    <optgroup label="⚡ FLEX CHARGER & CABLES IN APP">
                      {flexCategories.map(cat => {
                        const count = parts.filter(p => p.cat === cat).length;
                        return (
                          <option key={cat} value={cat}>
                            ⚡ {cat} ({count} Items)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {otherCategories.length > 0 && (
                    <optgroup label="🔧 OTHER SPARE PARTS IN APP">
                      {otherCategories.map(cat => {
                        const count = parts.filter(p => p.cat === cat).length;
                        return (
                          <option key={cat} value={cat}>
                            🔧 {cat} ({count} Items)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  <option value="__custom__">+ Custom Category Name...</option>
                </select>

                {addCategory === '__custom__' && (
                  <div className="mt-2 space-y-1 animate-in fade-in">
                    <input
                      type="text"
                      required
                      value={addCustomCategory}
                      onChange={(e) => setAddCustomCategory(e.target.value)}
                      placeholder="Type custom category name..."
                      className="w-full bg-[#070c18] border border-cyan-500/70 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Supplier Notes & Terms *
                </label>
                <textarea
                  required
                  rows={3}
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Notes about quality, warranty duration, delivery time, return conditions, or special prices..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-xs sm:text-sm text-white font-normal outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CloudUpload className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto-backs up to Google Sheet ("REGISTERED COMPANIES") on save</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 cursor-pointer transition-all active:scale-95"
                  >
                    <CloudUpload className="w-4 h-4" />
                    Save & Auto-Backup to Sheet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b111e] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Company Details</h3>
                  <p className="text-xs text-slate-400">Update supplier contact, phone, WhatsApp, location, category, and notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editWhatsApp}
                    onChange={(e) => setEditWhatsApp(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                    Location / Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none"
                  />
                </div>
              </div>

              {/* EDIT CATEGORY SELECTOR WITH ALL APP CATEGORIES */}
              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 tracking-wider">
                  Parts Category Supplied (All App Categories)
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => {
                    setEditCategory(e.target.value);
                    if (e.target.value !== '__custom__') setEditCustomCategory('');
                  }}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium outline-none"
                >
                  <optgroup label="🌟 MULTI-CATEGORY / GENERAL SUPPLIER">
                    <option value="All LCD Screens (Multi-Brand)">📱 All LCD Screens (Multi-Brand)</option>
                    <option value="All App Categories (General Supplier)">🌟 All App Categories (General Supplier)</option>
                  </optgroup>

                  {lcdCategories.length > 0 && (
                    <optgroup label="📱 LCD DISPLAY CATEGORIES IN APP">
                      {lcdCategories.map(cat => (
                        <option key={cat} value={cat}>
                          📱 {cat} ({parts.filter(p => p.cat === cat).length} LCDs)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {batteryCategories.length > 0 && (
                    <optgroup label="🔋 BATTERY CATEGORIES IN APP">
                      {batteryCategories.map(cat => (
                        <option key={cat} value={cat}>
                          🔋 {cat} ({parts.filter(p => p.cat === cat).length} Batteries)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {flexCategories.length > 0 && (
                    <optgroup label="⚡ FLEX CHARGER & CABLES IN APP">
                      {flexCategories.map(cat => (
                        <option key={cat} value={cat}>
                          ⚡ {cat} ({parts.filter(p => p.cat === cat).length} Items)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {otherCategories.length > 0 && (
                    <optgroup label="🔧 OTHER SPARE PARTS IN APP">
                      {otherCategories.map(cat => (
                        <option key={cat} value={cat}>
                          🔧 {cat} ({parts.filter(p => p.cat === cat).length} Items)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__custom__">+ Custom Category Name...</option>
                </select>

                {editCategory === '__custom__' && (
                  <div className="mt-2 space-y-1 animate-in fade-in">
                    <input
                      type="text"
                      required
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      placeholder="Type custom category name..."
                      className="w-full bg-[#070c18] border border-amber-500/70 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 tracking-wider">
                  Supplier Notes & Terms *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs sm:text-sm text-white font-normal outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-lg shadow-amber-950/60 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
