import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Package, 
  ShieldAlert, TrendingUp, Trash2, Eye,
  FileText, Download, ShoppingCart, Filter, X, RotateCcw,
  Boxes, DollarSign, Truck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ColumnDef } from '@tanstack/react-table';

import { useSettings } from '../context/SettingsContext';
import { playSound } from '../utils/sound';
import { toast } from 'sonner';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { DataTable } from '../components/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import Modal from '../components/Modal';
import { exportCSV, exportPDF, addPdfHeader } from '../lib/export-utils';
import { computeTrend } from '../lib/trend-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose, SheetDescription } from '../components/ui/sheet';

interface Item {
  id: number;
  name: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  companyName: string;
  purchaseUnit: string;
  baseUnit: string;
  unitsPerPack: number;
  totalPackQuantity: number;
  totalBaseQuantity: number;
  packPurchasePrice: number;
  basePurchasePrice: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  allowSellByBaseUnit: number;
  allowSellByPackUnit: number;
  expiryDate: string;
  qualityGrade: string;
  notes: string;
  isCredit: number;
  supplierPhone: string;
  supplierId: number;
  supplierName: string;
  lastPurchaseDate: string;
  lastPurchasePrice: number;
  reorderPoint?: number;
  reorderQty?: number;
  autoReorder?: number;
  totalPurchasedQuantity?: number;
  lastPurchaseOrderRef?: string;
  lastPurchaseOrderDate?: string;
}

const Inventory: React.FC = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [searchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [poItems, setPOItems] = useState<(Item & { orderQty: number })[]>([]);
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemBrand, setCustomItemBrand] = useState('');
  const [customItemSupplier, setCustomItemSupplier] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showCreditOnly, setShowCreditOnly] = useState(false);
  const [restockItem, setRestockItem] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [expiryEnabled, setExpiryEnabled] = useState(false);

  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '', categoryId: 'none', companyName: '', purchaseUnit: t('inventory.box'), baseUnit: t('inventory.piece'),
    unitsPerPack: '1', totalPackQuantity: '0', totalBaseQuantity: '0',
    packPurchasePrice: '0', basePurchasePrice: '0', baseSellingPrice: '', packSellingPrice: '0',
    allowSellByBaseUnit: true, allowSellByPackUnit: false,
    expiryDate: '', qualityGrade: '', notes: '', isCredit: false,
    supplierPhone: '', supplierId: '',
    reorderPoint: '10', reorderQty: '0', autoReorder: false
  });

  useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);

  // Sync Base Quantity based on Pack Quantity and Units per Pack
  useEffect(() => {
    const packs = parseFloat(formData.totalPackQuantity) || 0;
    const upp = parseFloat(formData.unitsPerPack) || 1;
    setFormData(prev => ({
      ...prev,
      totalBaseQuantity: String(packs * upp)
    }));
  }, [formData.totalPackQuantity, formData.unitsPerPack]);

  const loadData = async () => {
    const [itemsData, catsData, suppData] = await Promise.all([
      window.api?.getItems({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
      window.api?.getCategories() || Promise.resolve([]),
      window.api?.getSuppliers({ limit: 500 }) || Promise.resolve({ rows: [] })
    ]);
    setItems(Array.isArray(itemsData) ? itemsData : []);
    setCategories(Array.isArray(catsData) ? catsData : []);
    setSuppliers(suppData?.rows || []);
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.totalBaseQuantity * item.basePurchasePrice), 0);
    const lowStock = items.filter(i => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length;
    const outOfStock = items.filter(i => i.totalBaseQuantity <= 0).length;

    const valueTrend = computeTrend(items, 'createdAt', i => i.totalBaseQuantity * i.basePurchasePrice);
    const lowTrend = computeTrend(items, 'createdAt', i => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10 ? 1 : 0);
    const depletTrend = computeTrend(items, 'createdAt', i => i.totalBaseQuantity <= 0 ? 1 : 0);
    const skuTrend = computeTrend(items, 'createdAt', () => 1);

    return [
      { 
        title: t('inventory.value'), 
        value: `${t('common.etb')} ${totalValue.toLocaleString()}`, 
        ...valueTrend,
        footerTitle: t('inventory.value_inc'),
        footerSub: t('customers.last_30')
      },
      { 
        title: t('inventory.low'), 
        value: lowStock, 
        ...lowTrend,
        footerTitle: t('inventory.refill_needed'),
        footerSub: t('inventory.critical_priority')
      },
      { 
        title: t('inventory.depleted'), 
        value: outOfStock, 
        ...depletTrend,
        footerTitle: t('inventory.immediate_action'),
        footerSub: t('inventory.lost_sales')
      },
      { 
        title: t('inventory.total_skus'), 
        value: items.length, 
        ...skuTrend,
        footerTitle: t('inventory.catalog_growth'),
        footerSub: t('inventory.new_items')
      },
    ];
  }, [items]);

  const displayItems = useMemo(() => {
    return showCreditOnly ? items.filter(i => i.isCredit === 1) : items;
  }, [items, showCreditOnly]);

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "name",
      header: t('inventory.product_details'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold">{row.original.name}</span>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
              {row.original.categoryName || t('inventory.general')} • {row.original.companyName || t('inventory.no_brand')}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "totalBaseQuantity",
      header: t('inventory.stock_ledger'),
      cell: ({ row }) => {
        const baseQty = row.original.totalBaseQuantity;
        const packQty = row.original.totalPackQuantity;
        const fmt = (n: number | null | undefined) => n == null ? '0' : parseFloat(n.toFixed(2)).toString();
        const statusKey = baseQty <= 0 ? 'inventory.depleted' : baseQty < 10 ? 'inventory.low' : 'inventory.healthy';
        const status = t(statusKey);
        return (
          <div className="flex flex-col gap-1 w-40">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span>{fmt(baseQty)} {row.original.baseUnit} / {fmt(packQty)} {row.original.purchaseUnit}</span>
              <span className={statusKey === 'inventory.depleted' ? 'text-destructive' : statusKey === 'inventory.low' ? 'text-yellow-500' : 'text-green-500'}>
                {status}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${statusKey === 'inventory.depleted' ? 'bg-destructive' : statusKey === 'inventory.low' ? 'bg-yellow-500' : 'bg-primary'}`} 
                style={{ width: `${Math.min(100, (baseQty / 50) * 100)}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "supplierName",
      header: t('suppliers.col_supplier'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.supplierName || '-'}</span>
          {row.original.supplierName && (
            <span className="text-xs text-muted-foreground">{t('inventory.supplier_lifecycle')}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: "baseSellingPrice",
      header: () => <div className="text-right">{t('inventory.valuation')}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-bold text-sm">{t('common.etb')} {row.original.baseSellingPrice.toLocaleString()} <span className="text-xs text-muted-foreground">/ {row.original.baseUnit}</span></div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            {t('inventory.margin')}: {row.original.baseSellingPrice > 0 ? (((Number(row.original.baseSellingPrice || 0) - Number(row.original.basePurchasePrice || 0)) / Number(row.original.baseSellingPrice || 0)) * 100).toFixed(0) : 0}%
          </div>
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setViewingItem(row.original); setShowDetailsModal(true); }} title={t('common.view')}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} title={t('common.edit')}>{t('common.edit')}</Button>
          <Button variant="ghost" size="sm" onClick={() => { setRestockItem(row.original); setRestockQty(''); }} title={t('inventory.restock', 'Restock')}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10" 
            onClick={() => setDeleteConfirmId(row.original.id)}
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const resetForm = () => {
    setFormData({
      name: '', categoryId: 'none', companyName: '', purchaseUnit: t('inventory.box'), baseUnit: t('inventory.piece'),
      unitsPerPack: '1', totalPackQuantity: '0', totalBaseQuantity: '0',
      packPurchasePrice: '0', basePurchasePrice: '0', baseSellingPrice: '', packSellingPrice: '0',
      allowSellByBaseUnit: true, allowSellByPackUnit: false,
      expiryDate: '', qualityGrade: '', notes: '', isCredit: false,
      supplierPhone: '', supplierId: '',
      reorderPoint: '10', reorderQty: '0', autoReorder: false
    });
    setIsNewCategory(false);
    setNewCategoryName('');
    setExpiryEnabled(false);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId ? String(item.categoryId) : 'none',
      companyName: item.companyName || '',
      purchaseUnit: item.purchaseUnit || t('inventory.box'),
      baseUnit: item.baseUnit || t('inventory.piece'),
      unitsPerPack: String(item.unitsPerPack || 1),
      totalPackQuantity: String(item.totalPackQuantity || 0),
      totalBaseQuantity: String(item.totalBaseQuantity || 0),
      packPurchasePrice: String(item.packPurchasePrice || 0),
      basePurchasePrice: String(item.basePurchasePrice || 0),
      baseSellingPrice: String(item.baseSellingPrice || 0),
      packSellingPrice: String(item.packSellingPrice || 0),
      allowSellByBaseUnit: !!item.allowSellByBaseUnit,
      allowSellByPackUnit: !!item.allowSellByPackUnit,
      expiryDate: item.expiryDate || '',
      qualityGrade: item.qualityGrade || '',
      notes: item.notes || '',
      isCredit: !!item.isCredit,
      supplierPhone: item.supplierPhone || '',
      supplierId: item.supplierId ? String(item.supplierId) : '',
      reorderPoint: String(item.reorderPoint ?? 10),
      reorderQty: String(item.reorderQty ?? 0),
      autoReorder: !!item.autoReorder
    });
    setExpiryEnabled(!!item.expiryDate);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error(t('inventory.product_name_required', 'Product name is required')); return; }
    const basePrice = parseFloat(formData.baseSellingPrice) || 0;
    if (basePrice <= 0 && parseFloat(formData.packSellingPrice) <= 0) { toast.error(t('inventory.selling_price_required', 'At least one selling price is required')); return; }
    const baseCost = parseFloat(formData.basePurchasePrice) || 0;
    const packPrice = parseFloat(formData.packSellingPrice) || 0;
    const packCost = parseFloat(formData.packPurchasePrice) || 0;

    let finalCategoryId = (formData.categoryId && formData.categoryId !== 'none' && !isNaN(parseInt(formData.categoryId))) ? parseInt(formData.categoryId) : null;

    if (isNewCategory && newCategoryName.trim()) {
      const newCatId = await window.api?.insertCategory(newCategoryName.trim());
      if (newCatId) {
        finalCategoryId = newCatId;
      }
    }

    const item = {
      ...formData,
      categoryId: finalCategoryId,
      unitsPerPack: parseFloat(formData.unitsPerPack) || 1,
      totalPackQuantity: parseFloat(formData.totalPackQuantity) || 0,
      totalBaseQuantity: parseFloat(formData.totalBaseQuantity) || 0,
      packPurchasePrice: packCost,
      basePurchasePrice: baseCost,
      baseSellingPrice: basePrice,
      packSellingPrice: packPrice,
      allowSellByBaseUnit: formData.allowSellByBaseUnit ? 1 : 0,
      allowSellByPackUnit: formData.allowSellByPackUnit ? 1 : 0,
      isCredit: formData.isCredit ? 1 : 0,
      supplierId: formData.supplierId ? parseInt(formData.supplierId) : null
    };

    if (editingItem) {
      await window.api?.updateItem(editingItem.id, item);
    } else {
      await window.api?.insertItem(item);
    }

    playSound('nice');
    setShowModal(false);
    setEditingItem(null);
    resetForm();
    loadData();
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await window.api?.deleteItem(deleteConfirmId);
      setDeleteConfirmId(null);
      loadData();
    }
  };

  const handleRestock = async () => {
    if (!restockItem || !restockQty || parseInt(restockQty) <= 0) return;
    await window.api?.restockItem(restockItem.id, parseInt(restockQty));
    setRestockItem(null);
    setRestockQty('');
    loadData();
  };

  const baseProfit = (parseFloat(formData.baseSellingPrice) || 0) - (parseFloat(formData.basePurchasePrice) || 0);
  const packProfit = (parseFloat(formData.packSellingPrice) || 0) - (parseFloat(formData.packPurchasePrice) || 0);
  const baseMargin = (parseFloat(formData.baseSellingPrice) || 0) > 0 
    ? ((baseProfit / parseFloat(formData.baseSellingPrice)) * 100).toFixed(1) 
    : '0';
  const packMargin = (parseFloat(formData.packSellingPrice) || 0) > 0 
    ? ((packProfit / parseFloat(formData.packSellingPrice)) * 100).toFixed(1) 
    : '0';
 
  const openPOCreator = () => {
    const lowStockItems = items.filter(i => i.totalBaseQuantity < 10);
    setPOItems(lowStockItems.map(i => ({
      ...i,
      orderQty: i.unitsPerPack * 5
    })));
    setPoSearchQuery('');
    setShowPOModal(true);
  };

  const addToPO = (item: Item) => {
    setPOItems(prev => {
      if (prev.find(p => p.id === item.id)) return prev;
      return [...prev, { ...item, orderQty: item.unitsPerPack * 5 }];
    });
  };

  const addCustomItemToPO = () => {
    if (!customItemName.trim()) return;
    const supplierMatch = suppliers.find(
      s => s.supplierName?.toLowerCase() === customItemSupplier.trim().toLowerCase()
    );
    const fakeItem: Item & { orderQty: number } = {
      id: -Date.now(),
      name: customItemName.trim(),
      createdAt: new Date().toISOString(),
      categoryId: 0,
      categoryName: '',
      companyName: customItemBrand.trim(),
      purchaseUnit: 'pack',
      baseUnit: 'unit',
      unitsPerPack: 1,
      totalPackQuantity: 0,
      totalBaseQuantity: 0,
      packPurchasePrice: 0,
      basePurchasePrice: 0,
      baseSellingPrice: 0,
      packSellingPrice: 0,
      allowSellByBaseUnit: 1,
      allowSellByPackUnit: 0,
      expiryDate: '',
      qualityGrade: '',
      notes: '',
      isCredit: 0,
      supplierPhone: '',
      supplierId: supplierMatch ? supplierMatch.id : 0,
      supplierName: customItemSupplier.trim(),
      lastPurchaseDate: '',
      lastPurchasePrice: 0,
      orderQty: parseInt(customItemQty) || 1,
    };
    setPOItems(prev => [...prev, fakeItem]);
    setCustomItemName('');
    setCustomItemQty('1');
    setCustomItemBrand('');
  };

  const updatePOSupplier = (id: number, supplierName: string) => {
    const trimmed = supplierName.trim();
    const match = suppliers.find(s => s.supplierName?.toLowerCase() === trimmed.toLowerCase());
    setPOItems(prev => prev.map(item =>
      item.id === id ? { ...item, supplierName: trimmed, supplierId: match ? match.id : 0 } : item
    ));
  };

  const updatePOBrand = (id: number, brand: string) => {
    setPOItems(prev => prev.map(item => item.id === id ? { ...item, companyName: brand } : item));
  };

  const updatePOQty = (id: number, qty: number) => {
    setPOItems(prev => prev.map(item => 
      item.id === id ? { ...item, orderQty: Math.max(0, qty) } : item
    ));
  };

  const removeFromPO = (id: number) => {
    setPOItems(prev => prev.filter(item => item.id !== id));
  };

  const generatePOPDF = () => {
    const doc = new jsPDF();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(new Date());
    let y = y0 + 4;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('inventory.po_title', 'PURCHASE ORDER'), 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('inventory.po_date_label', 'Date')}: ${date}`, 190, y, { align: 'right' });
    y += 4;

    const tableData = poItems.map((item, index) => [
      index + 1,
      item.name,
      item.companyName || t('common.not_available'),
      item.supplierName || t('common.not_available'),
      `${item.orderQty} ${item.baseUnit}`
    ]);

    const totalCost = poItems.reduce((sum, item) => sum + (item.orderQty * item.basePurchasePrice), 0);

    autoTable(doc, {
      startY: y,
      head: [[t('inventory.po_col_hash', '#'), t('inventory.po_col_product', 'Product'), t('inventory.po_col_brand', 'Brand'), t('inventory.po_col_supplier', 'Supplier'), t('inventory.po_col_quantity', 'Quantity')]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? y + (poItems.length * 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`${t('inventory.po_total_cost', 'TOTAL COST')}: ${t('common.etb')} ${totalCost.toLocaleString()}`, 190, finalY + 8, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(t('inventory.po_auto_generated', 'This is an automatically generated purchase order by Shega Retail POS.'), 105, 280, { align: 'center' });

    doc.save(`${t('inventory.po_filename', 'Purchase_Order')}_${date.replace(/\//g, '-')}.pdf`);
  };

  const exportInventoryCSV = () => {
    const h = [t('common.name', 'Name'), t('common.category'), t('inventory.base_qty', 'Base Qty'), t('inventory.base_unit'), t('inventory.selling_price', 'Selling Price'), t('inventory.purchase_price', 'Purchase Price')];
    const r = items.map(i => [i.name, i.categoryName || '', i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, i.basePurchasePrice]);
    exportCSV(h, r, 'inventory');
  };

  const exportInventoryPDF = () => {
    const h = [t('common.name', 'Name'), t('common.category'), t('inventory.base_qty', 'Base Qty'), t('inventory.base_unit'), t('inventory.selling_price', 'Selling Price'), t('inventory.purchase_price', 'Purchase Price')];
    const r = items.map(i => [i.name, i.categoryName || '', String(i.totalBaseQuantity), i.baseUnit, String(i.baseSellingPrice), String(i.basePurchasePrice)]);
    exportPDF(t('data_transfer.inventory_report'), h, r, 'inventory', undefined, undefined, currentBusiness);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <SectionCards cards={kpiCards} />

      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
             <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.terminal')}</h4>
             <h3 className="text-2xl font-black tracking-tighter uppercase">{t('inventory.header')}</h3>
          </div>
          <div className="flex gap-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className={`h-8 px-3 transition-all ${filterCategory !== 'All' || filterStartDate || filterEndDate ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                  <Filter className="mr-1.5 h-3.5 w-3.5" /> 
                  {t('inventory.filters')} {(filterCategory !== 'All' || filterStartDate || filterEndDate) && <Badge className="ml-1.5 h-4 px-1 text-xs rounded-full">{t('inventory.active')}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
                <SheetHeader className="border-b border-border/50 p-6">
                  <SheetTitle className="text-2xl font-black uppercase tracking-tight">{t('inventory.data_filters')}</SheetTitle>
                  <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.refine_view')}</SheetDescription>
                </SheetHeader>
                
                <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.classification')}</h4>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                        <SelectValue placeholder={t('inventory.all_categories')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="All">{t('inventory.all_categories')}</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.timeframe')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.start_date')}</label>
                        <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.end_date')}</label>
                        <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-1 leading-tight">{t('inventory.date_filter_note')}</p>
                  </div>

                  {/* Credit Purchase Filter */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.credit_filter') || 'Credit'}</h4>
                    <div className="flex items-center gap-2 p-3 rounded-xl border bg-muted/30">
                      <Switch id="credit-filter" checked={showCreditOnly} onCheckedChange={setShowCreditOnly} />
                      <Label htmlFor="credit-filter" className="text-xs font-black uppercase tracking-widest">{t('on_credit.title')}</Label>
                    </div>
                  </div>
                </div>

                <SheetFooter className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
                  <div className="flex gap-4 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl"
                      onClick={() => {
                        setFilterCategory('All');
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                    >
                      {t('inventory.reset_all')}
                    </Button>
                    <SheetClose asChild>
                      <Button className="flex-1 py-3 tracking-widest rounded-xl shadow-xl">
                        {t('inventory.apply_filters')}
                      </Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="sm" onClick={openPOCreator} className="border-primary/20 text-primary hover:bg-primary/5 h-8 px-3">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> {t('inventory.create_po')}
            </Button>
            <Button data-tutorial-section="add-item-btn" size="sm" onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }} className="h-8 px-4 shadow-md shadow-primary/20">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('inventory.add_product')}
            </Button>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={displayItems} 
          title={t('inventory.header')}
        />
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" size="sm" onClick={exportInventoryCSV} className="h-7 text-xs font-bold tracking-widest px-2.5"><FileText size={11} className="mr-1" /> {t('common.csv')}</Button>
          <Button variant="outline" size="sm" onClick={exportInventoryPDF} className="h-7 text-xs font-bold tracking-widest px-2.5"><FileText size={11} className="mr-1" /> {t('common.pdf')}</Button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? t('inventory.refine_ledger') : t('inventory.register_new')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Primary Identity */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/50">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('inventory.primary_identity')}</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.product_narrative')} *</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('inventory.placeholder_product')} className="h-11 text-sm font-semibold rounded-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.brand')}</label>
                <Input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder={t('inventory.placeholder_brand')} className="h-11 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.quality')}</label>
                <Input value={formData.qualityGrade} onChange={e => setFormData({...formData, qualityGrade: e.target.value})} placeholder={t('inventory.placeholder_quality')} className="h-11 text-sm rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.reorder_point')}</label>
                <Input type="number" min="0" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: e.target.value})} className="h-11 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.reorder_qty')}</label>
                <Input type="number" min="0" value={formData.reorderQty} onChange={e => setFormData({...formData, reorderQty: e.target.value})} className="h-11 text-sm rounded-xl" />
              </div>
              <div className="space-y-2 flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" checked={formData.autoReorder} onChange={e => setFormData({...formData, autoReorder: e.target.checked})} className="h-4 w-4 rounded border-input" />
                  {t('inventory.auto_reorder')}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.category')}</label>
              {isNewCategory ? (
                <div className="flex gap-3">
                  <Input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={t('inventory.placeholder_category')} className="h-11 text-sm rounded-xl flex-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={() => { setIsNewCategory(false); setNewCategoryName(''); }}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select value={formData.categoryId} onValueChange={val => setFormData({...formData, categoryId: val})}>
                      <SelectTrigger className="h-11 text-sm rounded-xl w-full">
                        <SelectValue placeholder={t('inventory.classification')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">{t('inventory.uncategorized')}</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCategory(true)} title={t('common.add')} className="h-11 w-11 shrink-0 rounded-xl">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Logistics & Unit Packaging */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/50">
              <Boxes className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('tabs.logistics')} & {t('inventory.stock_ledger')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.base_unit')} (Individual)</label>
                <Input value={formData.baseUnit} onChange={e => setFormData({...formData, baseUnit: e.target.value})} placeholder={t('inventory.placeholder_base_unit', 'Piece/Kg')} className="h-11 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.purchase_unit')} (Pack/Bulk)</label>
                <Input value={formData.purchaseUnit} onChange={e => setFormData({...formData, purchaseUnit: e.target.value})} placeholder={t('inventory.placeholder_purchase_unit', 'Box/Crate')} className="h-11 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.qty_per_pack')}</label>
                <Input type="number" value={formData.unitsPerPack} onChange={e => setFormData({...formData, unitsPerPack: e.target.value})} className="h-11 text-sm font-bold rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.stock_packs')}</label>
                <Input type="number" value={formData.totalPackQuantity} onChange={e => setFormData({...formData, totalPackQuantity: e.target.value})} className="h-11 text-sm font-bold rounded-xl" />
              </div>
            </div>
          </div>

          {/* Section 3: Fiscal Configuration & Pricing */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/50">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('inventory.fiscal_config')}</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Base Unit Pricing Block */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">Base Unit ({formData.baseUnit || 'Unit'})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Sell Base</span>
                    <Switch checked={formData.allowSellByBaseUnit} onCheckedChange={c => setFormData({...formData, allowSellByBaseUnit: c})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.base_cost')}</label>
                    <Input type="number" value={formData.basePurchasePrice} onChange={e => setFormData({...formData, basePurchasePrice: e.target.value})} className="h-10 text-sm font-semibold rounded-xl bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.base_price')}</label>
                    <Input type="number" value={formData.baseSellingPrice} onChange={e => setFormData({...formData, baseSellingPrice: e.target.value})} className="h-10 text-sm font-semibold rounded-xl bg-background" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex justify-between items-center text-xs">
                  <span className="font-bold text-green-700 dark:text-green-400">{t('inventory.base_profit')}: {t('common.etb')} {baseProfit.toLocaleString()}</span>
                  <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400 text-xs font-bold">{baseMargin}%</Badge>
                </div>
              </div>

              {/* Pack Unit Pricing Block */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">Pack Unit ({formData.purchaseUnit || 'Pack'})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Sell Pack</span>
                    <Switch checked={formData.allowSellByPackUnit} onCheckedChange={c => setFormData({...formData, allowSellByPackUnit: c})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.pack_cost')}</label>
                    <Input type="number" value={formData.packPurchasePrice} onChange={e => setFormData({...formData, packPurchasePrice: e.target.value})} disabled={!formData.allowSellByPackUnit} className="h-10 text-sm font-semibold rounded-xl bg-background disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.pack_price')}</label>
                    <Input type="number" value={formData.packSellingPrice} onChange={e => setFormData({...formData, packSellingPrice: e.target.value})} disabled={!formData.allowSellByPackUnit} className="h-10 text-sm font-semibold rounded-xl bg-background disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                </div>
                <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${formData.allowSellByPackUnit ? 'bg-blue-500/10 border-blue-500/20' : 'bg-muted/30 border-border/40 opacity-50'}`}>
                  <span className={`font-bold ${formData.allowSellByPackUnit ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>{t('inventory.pack_profit')}: {t('common.etb')} {packProfit.toLocaleString()}</span>
                  <Badge variant="outline" className={`text-xs font-bold ${formData.allowSellByPackUnit ? 'bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>{packMargin}%</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Supplier & Expiry */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/50">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('inventory.supplier_lifecycle')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('suppliers.field_name')}</label>
                <Select value={formData.supplierId ? String(formData.supplierId) : ''} onValueChange={v => setFormData({...formData, supplierId: v})}>
                  <SelectTrigger className="h-11 text-sm rounded-xl w-full"><SelectValue placeholder={t('suppliers.select_supplier')} /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.supplierName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.expiry_date')}</label>
                  <Switch checked={expiryEnabled} onCheckedChange={on => {
                    setExpiryEnabled(on);
                    if (!on) setFormData({...formData, expiryDate: ''});
                  }} />
                </div>
                {expiryEnabled && (
                  <DatePicker value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e})} className="h-11 text-sm rounded-xl" />
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{t('inventory.credit_purchase')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Mark this product stock as acquired under supplier credit terms</p>
                </div>
              </div>
              <Switch checked={formData.isCredit} onCheckedChange={c => setFormData({...formData, isCredit: c})} />
            </div>
          </div>

          {/* Section 5: Operational Notes */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.operational_notes')}</label>
            <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder={t('common.notes_placeholder')} className="h-24 text-sm rounded-xl resize-none" />
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 -mx-6 -mb-6 p-6 bg-background/95 backdrop-blur-md border-t border-border/50 flex gap-4 z-20">
            <Button type="submit" className="flex-1 h-12 text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20">{t('inventory.commit_ledger')}</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-12 px-8 text-sm font-semibold rounded-xl">{t('common.abort')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={t('inventory.specifications')} size="lg">
        {viewingItem && (
          <div className="space-y-6 pb-2">
            <div className="flex items-center gap-6 p-5 rounded-2xl bg-muted/30 border border-border/50">
              <div className="h-16 w-16 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm shrink-0">
                <Package className="h-8 w-8 text-primary/40" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold tracking-tight truncate">{viewingItem.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate">{viewingItem.categoryName || t('inventory.general')} • {viewingItem.companyName || t('inventory.no_brand')}</p>
              </div>
              <Badge variant="outline" className="py-0.5 px-2.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0">{viewingItem.qualityGrade || t('inventory.standard')}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.base_unit')}</p>
                <p className="text-sm font-bold">{viewingItem.baseUnit}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.purchase_unit')}</p>
                <p className="text-sm font-bold">{viewingItem.purchaseUnit}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.qty_per_pack')}</p>
                <p className="text-sm font-bold">{viewingItem.unitsPerPack}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.expiry_date')}</p>
                <p className="text-sm font-bold">{viewingItem.expiryDate || t('common.not_available')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5">{t('inventory.stock_inventory')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-xs font-semibold uppercase tracking-wider">{t('inventory.individual_stock')}</span>
                  <span className="text-base font-bold">{viewingItem.totalBaseQuantity != null ? parseFloat(viewingItem.totalBaseQuantity.toFixed(2)) : 0} {viewingItem.baseUnit}</span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-muted/50 border border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider">{t('inventory.bulk_stock')}</span>
                  <span className="text-base font-bold">{viewingItem.totalPackQuantity != null ? parseFloat(viewingItem.totalPackQuantity.toFixed(2)) : 0} {viewingItem.purchaseUnit}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5">{t('inventory.valuation')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.individual_price')}</p>
                  <p className="text-lg font-bold text-primary">{t('common.etb')} {viewingItem.baseSellingPrice.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventory.bulk_price')}</p>
                  <p className="text-lg font-bold text-primary">{t('common.etb')} {viewingItem.packSellingPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5">{t('inventory.supplier_lifecycle')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('suppliers.col_supplier')}</p>
                  <p className="text-sm font-bold">{viewingItem.supplierName || t('common.not_available')}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.last_purchase_date')}</p>
                  <p className="text-sm font-bold">{viewingItem.lastPurchaseDate || t('common.not_available')}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.last_cost_price')}</p>
                  <p className="text-sm font-bold">{t('common.etb')} {(viewingItem.lastPurchasePrice || 0).toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/40 bg-card/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.total_purchased')}</p>
                  <p className="text-sm font-bold">{viewingItem.totalPurchasedQuantity || 0}</p>
                </div>
              </div>
              {viewingItem.lastPurchaseOrderRef && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('inventory.last_po_ref')}</p>
                  <p className="text-sm font-bold font-mono">{viewingItem.lastPurchaseOrderRef} {viewingItem.lastPurchaseOrderDate ? `(${formatDate(viewingItem.lastPurchaseOrderDate)})` : ''}</p>
                </div>
              )}
              {(viewingItem.supplierId) && (
                <Button variant="outline" size="sm" className="w-full h-10 rounded-xl text-xs font-bold tracking-widest" onClick={() => { setShowDetailsModal(false); }}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> {t('inventory.create_po')}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5">{t('common.operational_notes')}</h4>
              <p className="text-xs text-muted-foreground italic leading-relaxed">{viewingItem.notes || t('inventory.no_notes')}</p>
            </div>

            <Button onClick={() => setShowDetailsModal(false)} className="w-full h-9 rounded-xl font-bold tracking-widest mt-2 text-xs">{t('inventory.close_specs')}</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPOModal} onClose={() => setShowPOModal(false)} title={t('inventory.po_draft')} size="xl">
        <div className="space-y-6 pb-4">
          <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t('inventory.replenishment')}</h3>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('common.in_session')} {poItems.length} SKUs</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('inventory.est_total_cost')}</p>
              <p className="text-2xl font-black">{t('common.etb')} {poItems.reduce((sum, item) => sum + (item.orderQty * item.basePurchasePrice), 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="border rounded-[24px] overflow-hidden bg-card/40">
            <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b sticky top-0 z-10">
                  <th className="p-4 text-xs font-black uppercase tracking-widest bg-muted">{t('inventory.product')}</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest bg-muted">{t('inventory.po_col_brand')}</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest bg-muted">{t('suppliers.col_supplier')}</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest bg-muted">{t('inventory.order_qty')}</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-right bg-muted">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {poItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm">{item.name}</p>
                    </td>
                    <td className="p-4">
                      <Input
                        className="w-36 h-9 text-xs font-medium"
                        placeholder={t('inventory.placeholder_brand', 'Brand')}
                        value={item.companyName || ''}
                        onChange={(e) => updatePOBrand(item.id, e.target.value)}
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        className="w-40 h-9 text-xs font-medium"
                        list="po-supplier-options"
                        placeholder={t('inventory.po_supplier_placeholder', 'Supplier')}
                        value={item.supplierName || ''}
                        onChange={(e) => updatePOSupplier(item.id, e.target.value)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          className="w-24 h-9 font-bold text-center" 
                          value={item.orderQty} 
                          onChange={(e) => updatePOQty(item.id, parseInt(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold uppercase text-muted-foreground">{item.baseUnit}s</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeFromPO(item.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {poItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <p className="font-bold uppercase tracking-widest text-xs">{t('inventory.no_draft_items')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <datalist id="po-supplier-options">
              {suppliers.map(s => (
                <option key={s.id} value={s.supplierName} />
              ))}
            </datalist>
            </div>
          </div>

          {/* Browse products section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                data-tutorial-section="po-search"
                placeholder={t('inventory.search_placeholder') || 'Search products...'}
                value={poSearchQuery}
                onChange={e => setPoSearchQuery(e.target.value)}
                className="flex-1 h-10"
              />
            </div>
            {poSearchQuery && (
              <div className="border rounded-[24px] overflow-hidden bg-card/40 max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-3 text-xs font-black uppercase tracking-widest">{t('inventory.product')}</th>
                      <th className="p-3 text-xs font-black uppercase tracking-widest">{t('inventory.po_col_brand')}</th>
                      <th className="p-3 text-xs font-black uppercase tracking-widest text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items
                      .filter(i => i.name.toLowerCase().includes(poSearchQuery.toLowerCase()) && !poItems.find(p => p.id === i.id))
                      .slice(0, 10)
                      .map(item => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{item.companyName || t('inventory.no_brand')}</p>
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="outline" size="sm" onClick={() => addToPO(item)} className="text-xs font-bold">
                              + Add
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {items.filter(i => i.name.toLowerCase().includes(poSearchQuery.toLowerCase()) && !poItems.find(p => p.id === i.id)).length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-6 text-center text-muted-foreground">
                          <p className="font-bold uppercase tracking-widest text-xs">{t('inventory.no_results') || 'No results'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Custom item */}
            <div className="p-5 rounded-2xl border border-border/50 bg-muted/20 space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Custom Line Item</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder={t('inventory.custom_item_name', 'Custom item name...')} value={customItemName} onChange={e => setCustomItemName(e.target.value)} className="h-10 text-sm rounded-xl" />
                <Input placeholder={t('inventory.placeholder_brand', 'Brand')} value={customItemBrand} onChange={e => setCustomItemBrand(e.target.value)} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Input
                  value={customItemSupplier}
                  onChange={e => setCustomItemSupplier(e.target.value)}
                  list="po-supplier-options"
                  placeholder={t('inventory.po_supplier_placeholder', 'Search supplier or type new')}
                  className="flex-1 h-10 text-sm rounded-xl w-full"
                />
                <Input type="number" placeholder={t('inventory.placeholder_qty', 'Qty')} value={customItemQty} onChange={e => setCustomItemQty(e.target.value)} className="w-full sm:w-28 h-10 text-sm font-bold rounded-xl" />
                <Button variant="outline" size="sm" onClick={addCustomItemToPO} disabled={!customItemName.trim()} className="w-full sm:w-auto h-10 px-5 text-xs font-bold uppercase tracking-wider rounded-xl shrink-0">
                  + {t('inventory.add') || 'Add'}
                </Button>
              </div>
              <span className="block text-xs text-muted-foreground">{t('inventory.po_supplier_hint', 'Pick an existing supplier or type a new one — it will be created with the order.')}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
            <Button 
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest shadow-none" 
              disabled={poItems.length === 0}
              onClick={async () => {
                if (poItems.length === 0) return;
                const missing = poItems.filter(it => !it.supplierName || !it.supplierName.trim());
                if (missing.length > 0) {
                  alert(t('inventory.po_supplier_required', 'Each item needs a supplier. Set a supplier for every line before placing the order.'));
                  return;
                }
                const groupedBySupplier: Record<string, { supplierName: string; supplierId: number; items: typeof poItems }> = {};
                for (const item of poItems) {
                  const key = item.supplierName.trim().toLowerCase();
                  if (!groupedBySupplier[key]) {
                    groupedBySupplier[key] = { supplierName: item.supplierName.trim(), supplierId: item.supplierId || 0, items: [] };
                  }
                  groupedBySupplier[key].items.push(item);
                }
                for (const group of Object.values(groupedBySupplier)) {
                  const itemsPayload = group.items.map(it => ({
                    itemId: it.id && it.id > 0 ? it.id : null,
                    itemName: it.name,
                    quantity: it.orderQty,
                    unit: it.baseUnit,
                    unitPrice: it.basePurchasePrice || 0,
                  }));
                  const totalAmount = itemsPayload.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                  try {
                    await window.api?.insertSupplierPurchase({
                      supplierId: group.supplierId,
                      supplierName: group.supplierName,
                      purchaseDate: new Date().toISOString().split('T')[0],
                      totalAmount,
                      items: itemsPayload
                    });
                  } catch (err: any) {
                    console.error('Failed to save purchase:', err);
                  }
                }
                setShowPOModal(false);
                loadData();
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> {t('suppliers.col_purchases')}
            </Button>
            <Button 
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest shadow-sm shadow-primary/20"
              disabled={poItems.length === 0}
              onClick={generatePOPDF}
            >
              <Download className="mr-2 h-4 w-4" /> {t('inventory.gen_pdf')}
            </Button>
            <Button variant="ghost" onClick={() => setShowPOModal(false)} className="py-2.5 px-3 text-xs border-none shadow-none">{t('inventory.dismiss')}</Button>
          </div>
        </div>
      </Modal>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-[32px] border-border bg-background shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight uppercase">{t('inventory.confirm_deletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inventory.delete_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted font-bold py-2.5">{t('common.abort')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold py-2.5"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!restockItem} onOpenChange={(open) => { if (!open) { setRestockItem(null); setRestockQty(''); } }}>
        <AlertDialogContent className="rounded-[32px] border-border bg-background shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight uppercase">{t('inventory.restock_title') || 'Restock'}</AlertDialogTitle>
            <AlertDialogDescription>
              {restockItem ? `${restockItem.name} — ${t('inventory.restock_description') || 'Enter quantity to add to current stock'}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Input
              type="number"
              min="1"
              placeholder={t('inventory.restock_quantity_placeholder') || 'Quantity'}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="text-lg font-bold h-12"
            />
          </div>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted font-bold py-2.5">{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestock}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold py-2.5"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> {t('inventory.restock_confirm') || 'Restock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
