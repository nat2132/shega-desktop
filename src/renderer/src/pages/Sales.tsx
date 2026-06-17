import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, CreditCard, User, Phone,
  Search, TrendingUp, DollarSign, 
  ShoppingBag, CheckCircle, FileText, Trash2, Edit, Eye, Printer, ShoppingCart, X, Filter, Undo2
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useSettings } from '../context/SettingsContext';
import { playSound } from '../utils/sound';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { DataTable } from '../components/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import Modal from '../components/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { exportCSV, exportPDF } from '../lib/export-utils';
import { computeTrend } from '../lib/trend-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose, SheetDescription } from '../components/ui/sheet';
import SaleSuccessModal from '../components/SaleSuccessModal';

interface Sale {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  discount: number;
  vat: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  dueDate: string;
  paidAmount: number;
  createdAt: string;
  basePurchasePrice?: number;
  unitsPerPack?: number;
  status?: string;
}

interface Item {
  id: number;
  name: string;
  baseUnit: string;
  purchaseUnit: string;
  unitsPerPack: number;
  totalBaseQuantity: number;
  totalPackQuantity: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  allowSellByBaseUnit: number;
  allowSellByPackUnit: number;
  basePurchasePrice: number;
}

const Sales: React.FC = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '1',
    unitType: 'base' as 'base' | 'pack',
    discount: '0',
    vat: '0',
    paymentMethod: t('sales.cash'),
    paymentStatus: t('sales.paid'),
    customerName: '',
    customerPhone: '',
    dueDate: ''
  });

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paymentInfo, setPaymentInfo] = useState({ method: t('sales.cash'), status: t('sales.paid'), dueDate: '', isDebt: false });
  const [globalDiscount, setGlobalDiscount] = useState('0');
  const [globalVAT, setGlobalVAT] = useState('0');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnRefund, setReturnRefund] = useState('');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);

  const loadData = async () => {
    const [salesData, itemsData, catsData] = await Promise.all([
      window.api?.getSales({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
      window.api?.getItems({}) || Promise.resolve([]),
      window.api?.getCategories() || Promise.resolve([])
    ]);
    setSales(salesData);
    setItems(itemsData);
    setCategories(Array.isArray(catsData) ? catsData : []);
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const profit = sales.reduce((sum, s) => {
      const cost = (s.basePurchasePrice || 0) * (s.unitType === 'pack' ? (s.quantity * (s.unitsPerPack || 1)) : s.quantity);
      return sum + (s.totalPrice - cost);
    }, 0);

    const outDebt = sales.filter(s => s.paymentStatus === 'Debt' || s.paymentStatus === t('sales.debt'));
    const totalOutstanding = outDebt.reduce((sum, s) => sum + (s.totalPrice - s.paidAmount), 0);

    const revenueTrend = computeTrend(sales, 'createdAt', s => s.totalPrice);
    const profitTrend = computeTrend(sales, 'createdAt', s => {
      const cost = (s.basePurchasePrice || 0) * (s.unitType === 'pack' ? (s.quantity * (s.unitsPerPack || 1)) : s.quantity);
      return s.totalPrice - cost;
    });
    const txTrend = computeTrend(sales, 'createdAt', () => 1);
    const outTrend = computeTrend(outDebt, 'createdAt', s => s.totalPrice - s.paidAmount);

    return [
      { 
        title: t('sales.revenue'), 
        value: `${t('common.etb')} ${total.toLocaleString()}`, 
        ...revenueTrend,
        footerTitle: t('sales.transactions'),
        footerSub: t('customers.last_30')
      },
      { 
        title: t('sales.profit'), 
        value: `${t('common.etb')} ${profit.toLocaleString()}`, 
        ...profitTrend,
        footerTitle: t('inventory.margin'),
        footerSub: t('sales.healthy_growth')
      },
      { 
        title: t('sales.transactions'), 
        value: sales.length, 
        ...txTrend,
        footerTitle: t('sales.order_freq'),
        footerSub: t('sales.high_activity')
      },
      { 
        title: t('sales.outstanding'), 
        value: `${t('common.etb')} ${totalOutstanding.toLocaleString()}`, 
        ...outTrend,
        footerTitle: t('sales.debt'),
        footerSub: t('customers.active_ledgers')
      },
    ];
  }, [sales]);

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "itemName",
      header: t('sales.transaction_details'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold">{row.original.itemName}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {formatDate(row.original.createdAt)} • {row.original.quantity} {row.original.unit}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "customerName",
      header: t('sales.customer'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-sm">{row.original.customerName || t('sales.walk_in')}</span>
        </div>
      )
    },
    {
      accessorKey: "totalPrice",
      header: () => <div className="text-right">{t('common.total')}</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold">
          {t('common.etb')} {row.original.totalPrice.toLocaleString()}
        </div>
      )
    },
    {
      accessorKey: "paymentStatus",
      header: t('sales.payment_status'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.original.paymentStatus === 'Paid' || row.original.paymentStatus === t('sales.paid') ? 'default' : 'destructive'} className="uppercase text-[9px] font-bold">
            {row.original.paymentStatus === 'Paid' || row.original.paymentStatus === t('sales.paid') ? t('sales.paid') : t('sales.debt')}
          </Badge>
          {row.original.status === 'Voided' && (
            <Badge variant="destructive" className="text-[8px] font-black uppercase">Voided</Badge>
          )}
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setViewingSale(row.original); setShowReceiptModal(true); }} title={t('common.view')}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => generateReceipt(row.original)} title={t('common.print')}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)} title={t('common.edit')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-amber-500 hover:bg-amber-500/10" onClick={() => openReturn(row.original)} title="Return">
            <Undo2 className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" title={t('common.delete')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('sales.revoke_title')}</AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {t('sales.revoke_desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDelete(row.original.id)}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest"
                >
                  {t('common.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  const addToCart = (itemId: string) => {
    const item = items.find(i => i.id === parseInt(itemId));
    if (!item) return;

    const existing = cart.find(c => c.itemId === item.id);
    const unitType = existing ? existing.unitType : (item.allowSellByBaseUnit ? 'base' : 'pack');
    const maxQty = unitType === 'pack' ? item.totalPackQuantity : item.totalBaseQuantity;
    
    if (existing) {
      if (existing.quantity + 1 > maxQty) return;
      updateCartItem(item.id, { quantity: existing.quantity + 1 });
      return;
    }

    if (1 > maxQty) return;

    const newItem = {
      itemId: item.id,
      name: item.name,
      quantity: 1,
      unitType: item.allowSellByBaseUnit ? 'base' : 'pack',
      unit: item.allowSellByBaseUnit ? item.baseUnit : item.purchaseUnit,
      price: item.allowSellByBaseUnit ? item.baseSellingPrice : item.packSellingPrice,
      discount: 0,
      vat: 0,
      total: item.allowSellByBaseUnit ? item.baseSellingPrice : item.packSellingPrice
    };
    setCart([...cart, newItem]);
  };

  const updateCartItem = (itemId: number, updates: any) => {
    setCart(cart.map(c => {
      if (c.itemId === itemId) {
        const item = items.find(i => i.id === itemId);
        const updated = { ...c, ...updates };
        
        if (item) {
          const maxQty = updated.unitType === 'pack' ? item.totalPackQuantity : item.totalBaseQuantity;
          if (updated.quantity > maxQty) {
            updated.quantity = maxQty;
          }
        }

        const price = updated.unitType === 'pack' ? item?.packSellingPrice : item?.baseSellingPrice;
        updated.price = price || 0;
        updated.unit = updated.unitType === 'pack' ? item?.purchaseUnit : item?.baseUnit;
        updated.total = (updated.quantity * updated.price) - updated.discount + updated.vat;
        return updated;
      }
      return c;
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, c) => sum + (c.quantity * c.price), 0);
    const itemDiscounts = cart.reduce((sum, c) => sum + (parseFloat(c.discount as any) || 0), 0);
    const totalDiscount = subtotal > 0 ? (itemDiscounts + (parseFloat(globalDiscount) || 0)) : 0;
    
    // VAT as percentage
    const vatRate = parseFloat(globalVAT) || 0;
    const totalVAT = (subtotal - totalDiscount) * (vatRate / 100);
    
    const finalTotal = subtotal - totalDiscount + totalVAT;
    return { subtotal, totalDiscount, totalVAT, finalTotal };
  }, [cart, globalDiscount, globalVAT]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const salesToInsert = cart.map(c => ({
      itemId: c.itemId,
      quantity: c.quantity,
      unit: c.unit,
      unitType: c.unitType,
      discount: c.discount + (parseFloat(globalDiscount) / cart.length),
      vat: c.vat + (parseFloat(globalVAT) / cart.length),
      totalPrice: (c.quantity * c.price) - c.discount + c.vat - (parseFloat(globalDiscount) / cart.length) + (parseFloat(globalVAT) / cart.length),
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.isDebt ? 'Debt' : 'Paid',
      customerName: customerInfo.name?.trim() || null,
      customerPhone: customerInfo.phone?.trim() || null,
      dueDate: paymentInfo.isDebt ? paymentInfo.dueDate : null,
      paidAmount: paymentInfo.isDebt ? 0 : ((c.quantity * c.price) - c.discount + c.vat - (parseFloat(globalDiscount) / cart.length) + (parseFloat(globalVAT) / cart.length))
    }));

    await window.api?.insertSalesBatch(salesToInsert);
    playSound('nice');
    setShowModal(false);
    resetForm();
    loadData();
    setLastSale(salesToInsert[0]);
    setShowSuccessModal(true);
  };

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    const item = items.find(i => i.id === sale.itemId);
    if (item) {
      setCart([{
        itemId: item.id,
        name: item.name,
        quantity: sale.quantity,
        unitType: sale.unitType,
        unit: sale.unit,
        price: sale.unitType === 'pack' ? item.packSellingPrice : item.baseSellingPrice,
        discount: sale.discount,
        vat: sale.vat,
        total: sale.totalPrice
      }]);
      setCustomerInfo({ name: sale.customerName || '', phone: sale.customerPhone || '' });
      setPaymentInfo({ 
        method: sale.paymentMethod, 
        status: sale.paymentStatus, 
        dueDate: sale.dueDate || '', 
        isDebt: sale.paymentStatus === 'Debt' || sale.paymentStatus === t('sales.debt') 
      });
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    await window.api?.deleteSale(id);
    loadData();
  };

  const resetForm = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '' });
    setPaymentInfo({ method: t('sales.cash'), status: t('sales.paid'), dueDate: '', isDebt: false });
    setGlobalDiscount('0');
    setGlobalVAT('0');
    setEditingId(null);
    setCurrentStep(1);
    setItemSearchQuery('');
  };

  const generateReceipt = (sale: Sale) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
    const pageWidth = 80;
    let y = 5;

    if (currentBusiness?.businessName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(currentBusiness.businessName, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RECEIPT', pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`#REC-${sale.id}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`, 3, y);
    y += 4;
    doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 3, y);
    y += 4;
    if (sale.customerPhone) {
      doc.text(`Phone: ${sale.customerPhone}`, 3, y);
      y += 4;
    }
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 3, y);
    doc.text('Qty', 40, y);
    doc.text('Price', 55, y);
    doc.text('Total', 68, y, { align: 'right' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const unitPrice = sale.totalPrice / sale.quantity;
    doc.text(sale.itemName, 3, y);
    doc.text(String(sale.quantity), 40, y);
    doc.text(unitPrice.toFixed(2), 55, y);
    doc.text(sale.totalPrice.toFixed(2), 68, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Total: ETB ${sale.totalPrice.toFixed(2)}`, 3, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Payment: ${sale.paymentMethod}`, 3, y);
    y += 4;
    doc.text(`Paid: ETB ${(sale.paidAmount || sale.totalPrice).toFixed(2)}`, 3, y);
    y += 4;
    if (sale.paymentStatus === 'Debt') {
      doc.text(`Due: ETB ${(sale.totalPrice - (sale.paidAmount || 0)).toFixed(2)}`, 3, y);
      y += 4;
    }
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
    doc.save(`receipt-${sale.id}.pdf`);
  };

  const openReturn = (sale: Sale) => {
    setReturnSale(sale);
    setReturnQty(String(sale.quantity));
    setReturnRefund('0');
    setReturnReason('');
    setShowReturnModal(true);
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSale) return;
    const result = await window.api?.createReturn({
      saleId: returnSale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason: returnReason
    });
    if (result?.success) {
      toast.success('Return processed successfully');
      setShowReturnModal(false);
      loadData();
    } else {
      toast.error(result?.error || 'Return failed');
    }
  };

  const loadDrafts = async () => {
    const data = await window.api?.getDraftSales() || [];
    setDrafts(data);
    setShowDraftsModal(true);
  };

  const resumeDraft = async (id: number) => {
    const draft = await window.api?.getDraftSale(id);
    if (!draft) return;
    resetForm();
    const parsedItems = typeof draft.items === 'string' ? JSON.parse(draft.items) : (draft.items || []);
    setCart(parsedItems);
    setCustomerInfo({ name: draft.customerName || '', phone: '' });
    setGlobalDiscount(String(draft.discount || '0'));
    setGlobalVAT(String(draft.vat || '0'));
    setShowDraftsModal(false);
    setShowModal(true);
  };

  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    await window.api?.saveDraftSale({
      items: cart,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      discount: parseFloat(globalDiscount) || 0,
      vat: parseFloat(globalVAT) || 0
    });
    toast.success('Draft saved');
    setShowModal(false);
    resetForm();
  };

  const deleteDraft = async (id: number) => {
    await window.api?.deleteDraftSale(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const exportSalesCSV = () => {
    exportCSV(
      ['ID', 'Item', 'Qty', 'Unit', 'Total', 'Payment', 'Status', 'Customer', 'Date'],
      sales.map(s => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || 'Walk-in', s.createdAt]),
      'sales-report'
    );
  };

  const exportSalesPDF = () => {
    exportPDF(
      'Sales Report',
      ['ID', 'Item', 'Qty', 'Unit', 'Total', 'Payment', 'Status', 'Customer', 'Date'],
      sales.map(s => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || 'Walk-in', s.createdAt]),
      'sales-report',
      ['', '', '', '', sales.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString(), '', '', '', '']
    );
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <SectionCards cards={kpiCards} />

      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-4">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className={`h-8 px-3 transition-all ${filterCategory !== 'All' && filterCategory !== t('common.all') || filterStartDate || filterEndDate ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                <Filter className="mr-1.5 h-3.5 w-3.5" /> 
                {t('common.filters')} {(filterCategory !== 'All' || filterStartDate || filterEndDate) && <Badge className="ml-1.5 h-4 px-1 text-[9px] rounded-full">{t('inventory.active')}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">{t('common.filters')}</SheetTitle>
                <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('sales.filter_desc')}</SheetDescription>
              </SheetHeader>
              
              <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                {/* Category Filter */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('sales.classification')}</h4>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                      <SelectValue placeholder={t('sales.all_categories')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="All">{t('sales.all_categories')}</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('sales.timeframe')}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('sales.start_date')}</label>
                      <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('sales.end_date')}</label>
                      <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground italic mt-1 leading-tight">{t('sales.date_desc')}</p>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
                <div className="flex gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl"
                    onClick={() => {
                      setFilterCategory(t('common.all'));
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                  >
                    {t('common.reset')}
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl">
                      {t('common.apply')}
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={loadDrafts} className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> {t('sales.drafts') || 'Drafts'}
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('sales.new_btn')}
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={sales} 
          title={t('sales.header')}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => exportSalesCSV()} className="h-7 text-[10px] font-bold uppercase tracking-widest px-2.5">
            <FileText size={11} className="mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportSalesPDF()} className="h-7 text-[10px] font-bold uppercase tracking-widest px-2.5">
            <FileText size={11} className="mr-1" /> PDF
          </Button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('sales.modify_transaction') : t('sales.new_session')} size="xl">
        <div className="flex flex-col min-h-[60vh]">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 py-6 px-12 shrink-0 border-b border-border/40 bg-muted/5">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black transition-all duration-300 ${
                    currentStep === s ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 
                    currentStep > s ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === s ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s === 1 ? t('common.selection') : s === 2 ? t('common.review') : t('common.settlement')}
                  </span>
                </div>
                {s < 3 && <div className={`h-0.5 w-16 transition-colors duration-500 ${currentStep > s ? 'bg-green-500' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {currentStep === 1 && (
              <div className="flex-1 p-8 space-y-6 flex flex-col items-center">
                <div className="w-full max-w-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t('sales.discovery')}</h4>
                    <Badge variant="outline" className="font-black text-[9px] h-5">{cart.length} {t('common.in_session')}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder={t('common.search_placeholder')} 
                      className="h-14 pl-12 bg-card rounded-2xl border-border shadow-sm text-lg"
                      value={itemSearchQuery}
                      onChange={e => setItemSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 w-full max-w-xl rounded-3xl border border-border bg-muted/10 overflow-hidden flex flex-col">
                  {itemSearchQuery ? (
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {items.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => { addToCart(String(item.id)); setItemSearchQuery(''); }}
                          className="w-full text-left p-4 rounded-xl hover:bg-card hover:shadow-sm transition-all border border-transparent hover:border-border group flex justify-between items-center"
                        >
                          <span className="font-bold text-sm group-hover:text-primary">{item.name}</span>
                          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                      {items.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).length === 0 && (
                        <div className="p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.no_match')}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-card shadow-inner flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-primary/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('sales.quick_selection')}</p>
                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium">{t('sales.search_instantly')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-xl pt-4 flex gap-3">
                  <Button 
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg rounded-xl" 
                    disabled={cart.length === 0}
                    onClick={() => setCurrentStep(2)}
                  >
                    {t('sales.review_ledger')} ({cart.length})
                  </Button>
                  <Button 
                    variant="outline"
                    className="py-3 text-[10px] font-black uppercase tracking-widest rounded-xl" 
                    disabled={cart.length === 0}
                    onClick={handleSaveDraft}
                  >
                    {t('sales.save_draft') || 'Draft'}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex-1 p-8 space-y-6 flex flex-col items-center overflow-hidden">
                <div className="w-full max-w-4xl flex items-center justify-between shrink-0">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t('sales.ledger')}</h4>
                  <p className="text-xs font-black text-primary uppercase tracking-widest">{t('sales.subtotal')}: {t('common.etb')} {totals.subtotal.toLocaleString()}</p>
                </div>

                <div className="w-full max-w-5xl flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                  {cart.map(item => (
                    <div key={item.itemId} className="group p-2 px-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all flex items-center gap-4">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary/30" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-bold text-[11px] leading-tight whitespace-nowrap overflow-visible">{item.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('common.etb')} {item.price} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-border/40 rounded-lg bg-muted/20 overflow-hidden h-7">
                          <button onClick={() => updateCartItem(item.itemId, { quantity: Math.max(1, item.quantity - 1) })} className="px-2 hover:bg-muted text-[10px] font-bold">-</button>
                          <Input 
                            type="number" 
                            className="w-10 h-full text-center text-[10px] font-black bg-transparent border-none focus-visible:ring-0 px-0" 
                            value={item.quantity} 
                            onChange={e => updateCartItem(item.itemId, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                          <button onClick={() => updateCartItem(item.itemId, { quantity: item.quantity + 1 })} className="px-2 hover:bg-muted text-[10px] font-bold">+</button>
                        </div>
                        <Select 
                          value={item.unitType} 
                          onValueChange={val => updateCartItem(item.itemId, { unitType: val })}
                        >
                          <SelectTrigger className="h-7 w-20 text-[9px] font-black uppercase tracking-widest rounded-lg border-border/40 bg-card px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base" className="text-[9px] uppercase font-bold">{t('sales.individual')}</SelectItem>
                            <SelectItem value="pack" className="text-[9px] uppercase font-bold">{t('sales.pack')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 text-right shrink-0">
                        <p className="font-black text-[11px] whitespace-nowrap">{t('common.etb')} {item.total.toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.itemId)} className="text-destructive/30 hover:text-destructive h-6 w-6 p-0 rounded-lg">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-4xl pt-4 flex gap-3 shrink-0">
                  <Button variant="outline" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest border-2 rounded-xl" onClick={() => setCurrentStep(1)}>
                    {t('sales.add_more')}
                  </Button>
                  <Button variant="secondary" className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl" onClick={handleSaveDraft}>
                    {t('sales.save_draft') || 'Draft'}
                  </Button>
                  <Button className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg rounded-xl" onClick={() => setCurrentStep(3)}>
                    {t('sales.proceed_settlement')}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6">
                  {/* Phase 1: Context & Inputs in Rows */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.financial_adjustments')}</h4>
                      <div className="flex items-center gap-6 p-4 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('sales.discount_flat')}</label>
                          <Input className="h-10 bg-muted/10 font-bold border-none" placeholder="0.00" type="number" value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('sales.vat_percent')}</label>
                          <Input className="h-10 bg-muted/10 font-bold border-none" placeholder="15" type="number" value={globalVAT} onChange={e => setGlobalVAT(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.customer_identity')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder={t('sales.customer_name')} className="h-10 pl-10 text-xs font-bold bg-card rounded-xl" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder={t('sales.phone_number')} className="h-10 pl-10 text-xs font-bold bg-card rounded-xl" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                        </div>
                        <div className="flex bg-muted p-1 rounded-xl w-full md:col-span-2">
                          <Button variant={!paymentInfo.isDebt ? "default" : "ghost"} size="sm" onClick={() => setPaymentInfo({...paymentInfo, isDebt: false})} className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg">{t('sales.settled')}</Button>
                          <Button variant={paymentInfo.isDebt ? "destructive" : "ghost"} size="sm" onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 5);
                            setPaymentInfo({...paymentInfo, isDebt: true, dueDate: paymentInfo.dueDate || d.toISOString().split('T')[0]});
                          }} className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg">{t('sales.debt')}</Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.payment_logistics')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                        <Select value={paymentInfo.method} onValueChange={val => setPaymentInfo({...paymentInfo, method: val})}>
                          <SelectTrigger className="h-10 bg-card text-xs font-bold rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value={t('sales.cash')}>{t('sales.cash')}</SelectItem>
                            <SelectItem value={t('sales.bank_transfer')}>{t('sales.bank_transfer')}</SelectItem>
                            <SelectItem value={t('sales.check')}>{t('sales.check')}</SelectItem>
                            <SelectItem value={t('sales.other')}>{t('sales.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {paymentInfo.isDebt && (
                          <div className="relative">
                            <DatePicker className="h-10 bg-card border-destructive/20 rounded-xl text-xs" value={paymentInfo.dueDate} onChange={e => setPaymentInfo({...paymentInfo, dueDate: e})} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phase 2: Compact Summary Overview */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between gap-6 p-6 rounded-[28px] bg-primary text-primary-foreground shadow-xl border border-primary-foreground/10">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-foreground/60">{t('sales.subtotal')}</span>
                        <p className="text-lg font-bold opacity-80">{t('common.etb')} {totals.subtotal.toLocaleString()}</p>
                      </div>
                      <div className="h-10 w-px bg-primary-foreground/20" />
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-foreground/60">{t('sales.total_settlement')}</span>
                        <p className="text-3xl font-black tracking-tight">{t('common.etb')} {totals.finalTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-1.5">
                    <Button onClick={handleSubmit} className="w-full h-10 text-xs font-black uppercase tracking-[0.2em] shadow-lg rounded-xl" disabled={cart.length === 0 || (paymentInfo.isDebt && (!customerInfo.name || !customerInfo.phone || !paymentInfo.dueDate))}>
                      {t('sales.authorize')}
                    </Button>
                    <Button variant="outline" onClick={handleSaveDraft} className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl" disabled={cart.length === 0}>
                      {t('sales.save_draft') || 'Save as Draft'}
                    </Button>
                    <Button variant="ghost" onClick={() => setCurrentStep(2)} className="w-full text-[9px] font-bold uppercase tracking-widest opacity-40 hover:bg-transparent h-7">
                      {t('sales.back_to_cart')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title={t('sales.transaction_receipt')} size="md">
        {viewingSale && (
          <div className="space-y-6">
            <div className="text-center space-y-1 border-b border-dashed border-border pb-6">
              <h2 className="text-2xl font-black tracking-tight uppercase">{t('sales.receipt_header')}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID: #REC-{viewingSale.id}</p>
              <p className="text-xs text-muted-foreground">{new Date(viewingSale.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-border/50 pb-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('sales.item_details')}</p>
                  <p className="font-bold text-sm">{viewingSale.itemName}</p>
                </div>
                <p className="font-black text-lg">{t('common.etb')} {viewingSale.totalPrice.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-3 rounded-xl bg-card border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.customer')}</p>
                  <p>{viewingSale.customerName || t('sales.walk_in')}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/50 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.payment')}</p>
                  <p>{viewingSale.paymentMethod} • {viewingSale.paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => generateReceipt(viewingSale)} className="flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> {t('common.print')}
              </Button>
              <Button variant="ghost" onClick={() => setShowReceiptModal(false)} className="py-2.5 font-bold uppercase tracking-widest text-xs">{t('common.done')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Process Return" size="sm">
        {returnSale && (
          <form onSubmit={handleReturn} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 text-sm space-y-1">
              <p className="font-bold">{returnSale.itemName}</p>
              <p className="text-xs text-muted-foreground">Sale #{returnSale.id} &middot; {returnSale.customerName || 'Walk-in'}</p>
              <p className="text-xs">Original qty: {returnSale.quantity} &middot; Total: {t('common.etb')} {returnSale.totalPrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Quantity to Return *
              </label>
              <Input required type="number" min="1" max={returnSale.quantity}
                value={returnQty} onChange={e => setReturnQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Refund Amount ({t('common.etb')})
              </label>
              <Input type="number" min="0"
                value={returnRefund} onChange={e => setReturnRefund(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Set to 0 for no refund (exchange only)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Reason
              </label>
              <Input value={returnReason} onChange={e => setReturnReason(e.target.value)}
                placeholder="Defective, wrong item, customer request..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest" onClick={() => setShowReturnModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest" disabled={!returnQty || parseFloat(returnQty) < 1}>
                Process Return
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Drafts Modal */}
      <Modal isOpen={showDraftsModal} onClose={() => setShowDraftsModal(false)} title={t('sales.draft_sales') || 'Draft Sales'} size="lg">
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="font-bold uppercase tracking-widest text-xs">{t('sales.no_drafts') || 'No draft sales'}</p>
            </div>
          ) : (
            drafts.map(draft => {
              const items = draft.items || [];
              const subtotal = items.reduce((sum: number, c: any) => sum + (c.quantity * c.price), 0);
              const totalDiscount = subtotal > 0 ? (parseFloat(draft.discount) || 0) : 0;
              const vatRate = parseFloat(draft.vat) || 0;
              const totalVAT = (subtotal - totalDiscount) * (vatRate / 100);
              const total = subtotal - totalDiscount + totalVAT;

              return (
                <div key={draft.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{draft.customerName || t('sales.walk_in')}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                      {items.length} {t('common.items') || 'items'} &middot; {t('common.etb')} {total.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(draft.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => resumeDraft(draft.id)} className="h-7 text-[9px] font-bold uppercase tracking-widest px-2">
                      {t('sales.resume') || 'Resume'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteDraft(draft.id)} className="h-7 w-7 p-0">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
      <SaleSuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} sale={lastSale} />
    </div>
  );
};

export default Sales;
