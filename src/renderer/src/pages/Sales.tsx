import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, User, Phone,
  Search, 
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
import { RETURN_REASONS, OVERRIDE_REASONS, getDiscountCap } from '@shega/shared';
import { useAuth } from '../context/AuthContext';
import { exportCSV, exportPDF } from '../lib/export-utils';
import { computeTrend } from '../lib/trend-utils';
import { toast } from 'sonner';
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
import { startBarcodeWedge, stopBarcodeWedge } from '../services/barcode';

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
  const { t, formatDate, formatDateTime, currentBusiness } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
  const [returnCustomReason, setReturnCustomReason] = useState('');
  const [returnRefund, setReturnRefund] = useState('');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { currentAdmin } = useAuth();
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);

  // Barcode wedge: a scanner types the code then Enter; resolve and add to cart.
  useEffect(() => {
    startBarcodeWedge();
    const onScan = (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      if (!code) return;
      window.api?.getItemByBarcode(code).then((item: any) => {
        if (!item) {
          toast.error(`Barcode ${code} not found`);
          return;
        }
        addToCart(String(item.id));
      });
    };
    window.addEventListener('shega:barcode-scan', onScan as EventListener);
    return () => {
      stopBarcodeWedge();
      window.removeEventListener('shega:barcode-scan', onScan as EventListener);
    };
  }, [cart, items]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, itemsData, catsData] = await Promise.all([
        window.api?.getSales({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
        window.api?.getItems({}) || Promise.resolve([]),
        window.api?.getCategories() || Promise.resolve([])
      ]);
      setSales(salesData);
      setItems(itemsData);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const profit = sales.reduce((sum, s) => {
      const cost = s.costAtTimeOfSale || ((s.basePurchasePrice || 0) * (s.unitType === 'pack' ? (s.quantity * (s.unitsPerPack || 1)) : s.quantity));
      return sum + ((s.totalPrice - (s.discount || 0) - (s.vat || 0)) - cost);
    }, 0);

    const outDebt = sales.filter(s => s.paymentStatus === 'Debt' || s.paymentStatus === t('sales.debt'));
    const totalOutstanding = outDebt.reduce((sum, s) => sum + (s.totalPrice - s.paidAmount), 0);

    const revenueTrend = computeTrend(sales, 'createdAt', s => s.totalPrice);
    const profitTrend = computeTrend(sales, 'createdAt', s => {
      const cost = s.costAtTimeOfSale || ((s.basePurchasePrice || 0) * (s.unitType === 'pack' ? (s.quantity * (s.unitsPerPack || 1)) : s.quantity));
      return (s.totalPrice - (s.discount || 0) - (s.vat || 0)) - cost;
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
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
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
          <Badge variant={row.original.paymentStatus === 'Paid' || row.original.paymentStatus === t('sales.paid') ? 'default' : 'destructive'} className="uppercase text-xs font-bold">
            {row.original.paymentStatus === 'Paid' || row.original.paymentStatus === t('sales.paid') ? t('sales.paid') : t('sales.debt')}
          </Badge>
          {row.original.status === 'Voided' && (
            <Badge variant="destructive" className="text-xs font-black uppercase">{t('sales.voided_badge', 'Voided')}</Badge>
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
          <Button variant="ghost" size="sm" className="text-amber-500 hover:bg-amber-500/10" onClick={() => openReturn(row.original)} title={t('common.return')}>
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
                <AlertDialogCancel className="rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDelete(row.original.id)}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest"
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
      baseSellingPrice: item.baseSellingPrice,
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

  const isApprover = ['Owner', 'Administrator', 'Manager', 'super_admin', 'admin'].includes(currentAdmin?.role || '');
  const discountCap = isApprover ? null : getDiscountCap((currentAdmin?.role || '').toLowerCase());
  const overCapLines = useMemo(() => {
    if (discountCap === null) return [];
    const cartSub = cart.reduce((sum, c) => sum + (c.quantity * c.price - c.discount + c.vat), 0);
    const globalDisc = parseFloat(globalDiscount) || 0;
    return cart
      .map((c) => {
        const itemSubtotal = c.quantity * c.price - c.discount + c.vat;
        const ratio = cartSub > 0 ? itemSubtotal / cartSub : 0;
        const effDisc = (parseFloat(c.discount as any) || 0) + ratio * globalDisc;
        const basePrice = c.baseSellingPrice || c.price;
        const pct = basePrice > 0 ? (effDisc / (c.quantity * basePrice)) * 100 : 0;
        return { itemId: c.itemId, name: c.name, pct, disc: effDisc };
      })
      .filter((l) => l.disc > 0 && l.pct > discountCap);
  }, [cart, globalDiscount, discountCap]);
  const overCapRequired = overCapLines.length > 0;
  const overCapMaxPct = overCapLines.reduce((max, l) => Math.max(max, l.pct), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const cartSubtotal = cart.reduce((sum, c) => sum + (c.quantity * c.price - c.discount + c.vat), 0);
    const globalDiscVal = parseFloat(globalDiscount) || 0;
    const globalVATVal = parseFloat(globalVAT) || 0;

    const salesToInsert = cart.map(c => {
      const itemSubtotal = c.quantity * c.price - c.discount + c.vat;
      const ratio = cartSubtotal > 0 ? itemSubtotal / cartSubtotal : 0;
      const propDiscount = ratio * globalDiscVal;
      const propVAT = ratio * globalVATVal;
      return {
        itemId: c.itemId,
        quantity: c.quantity,
        unit: c.unit,
        unitType: c.unitType,
        discount: c.discount + propDiscount,
        vat: c.vat + propVAT,
        totalPrice: itemSubtotal - propDiscount + propVAT,
        paymentMethod: paymentInfo.method,
        paymentStatus: paymentInfo.isDebt ? 'Debt' : 'Paid',
        customerName: customerInfo.name?.trim() || null,
        customerPhone: customerInfo.phone?.trim() || null,
        dueDate: paymentInfo.isDebt ? paymentInfo.dueDate : null,
        paidAmount: paymentInfo.isDebt ? 0 : (itemSubtotal - propDiscount + propVAT),
        overrideReason: overCapRequired ? (overrideReason || 'Over-limit discount') : undefined
      };
    });

    const insertedIds = await window.api?.insertSalesBatch(salesToInsert);
    playSound('nice');
    setShowModal(false);
    resetForm();
    loadData();
    const totalPrice = salesToInsert.reduce((sum, s) => sum + s.totalPrice, 0);
    const itemCount = salesToInsert.reduce((sum, s) => sum + s.quantity, 0);
    setLastSale({
      id: insertedIds?.[0] || Date.now(),
      totalPrice,
      itemCount,
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.isDebt ? 'Debt' : 'Paid',
      paidAmount: paymentInfo.isDebt ? 0 : totalPrice,
      customerName: customerInfo.name?.trim() || t('summary.walk_in'),
      items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
    });
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
    setOverrideReason('');
    setEditingId(null);
    setCurrentStep(1);
    setItemSearchQuery('');
  };

  const handleModalClose = () => {
    if (cart.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      setShowModal(false);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    resetForm();
    setShowModal(false);
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
    doc.text(t('pdf.receipt', 'RECEIPT'), pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(t('pdf.receipt_id', '#REC-{id}', { id: sale.id }), pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(t('pdf.date', 'Date: {date}', { date: formatDateTime(sale.createdAt) }), 3, y);
    y += 4;
    doc.text(t('pdf.customer', 'Customer: {name}', { name: sale.customerName || t('sales.walk_in') }), 3, y);
    y += 4;
    if (sale.customerPhone) {
      doc.text(t('pdf.phone', 'Phone: {phone}', { phone: sale.customerPhone }), 3, y);
      y += 4;
    }
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(t('pdf.item', 'Item'), 3, y);
    doc.text(t('pdf.qty', 'Qty'), 40, y);
    doc.text(t('pdf.price', 'Price'), 55, y);
    doc.text(t('pdf.total', 'Total'), 68, y, { align: 'right' });
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
    doc.text(t('pdf.total_label', 'Total: {currency} {amount}', { currency: t('common.etb'), amount: sale.totalPrice.toFixed(2) }), 3, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(t('pdf.payment', 'Payment: {method}', { method: sale.paymentMethod }), 3, y);
    y += 4;
    doc.text(t('pdf.paid', 'Paid: {currency} {amount}', { currency: t('common.etb'), amount: (sale.paidAmount || sale.totalPrice).toFixed(2) }), 3, y);
    y += 4;
    if (sale.paymentStatus === 'Debt') {
      doc.text(t('pdf.due', 'Due: {currency} {amount}', { currency: t('common.etb'), amount: (sale.totalPrice - (sale.paidAmount || 0)).toFixed(2) }), 3, y);
      y += 4;
    }
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(t('pdf.thanks', 'Thank you for your business!'), pageWidth / 2, y, { align: 'center' });
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
    const reason = returnReason === 'other' && returnCustomReason.trim()
      ? returnCustomReason.trim()
      : returnReason;
    if (!reason) {
      toast.error(t('sales.return_reason_required', 'A reason is required for a return'));
      return;
    }
    const result = await window.api?.createReturn({
      saleId: returnSale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason
    });
    if (result?.success) {
      toast.success(t('sales.return_success', 'Return processed successfully'));
      setShowReturnModal(false);
      loadData();
    } else {
      toast.error(result?.error || t('sales.return_failed', 'Return failed'));
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
    let parsedItems: any[] = [];
    try {
      parsedItems = typeof draft.items === 'string' ? JSON.parse(draft.items) : (draft.items || []);
    } catch {
      console.error('Failed to parse draft items, draft may be corrupted');
      toast.error('Failed to load draft sale');
      return;
    }
    if (!Array.isArray(parsedItems)) {
      console.error('Parsed draft items is not an array');
      toast.error('Failed to load draft sale');
      return;
    }
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
    toast.success(t('sales.draft_saved', 'Draft saved'));
    setShowModal(false);
    resetForm();
  };

  const deleteDraft = async (id: number) => {
    await window.api?.deleteDraftSale(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const exportSalesCSV = () => {
    exportCSV(
      [t('common.id'), t('common.item', 'Item'), t('inventory.qty'), t('inventory.unit'), t('common.total'), t('sales.payment'), t('common.status'), t('sales.customer'), t('common.date')],
      sales.map(s => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || t('sales.walk_in'), s.createdAt]),
      'sales-report'
    );
  };

  const exportSalesPDF = () => {
    exportPDF(
      t('data_transfer.sales_report'),
      [t('common.id'), t('common.item', 'Item'), t('inventory.qty'), t('inventory.unit'), t('common.total'), t('sales.payment'), t('common.status'), t('sales.customer'), t('common.date')],
      sales.map(s => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || t('sales.walk_in'), s.createdAt]),
      'sales-report',
      ['', '', '', '', sales.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString(), '', '', '', '']
    );
    toast.success(t('sales.export_success', 'Report exported successfully'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <SectionCards cards={kpiCards} />

      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-4">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className={`h-8 px-3 transition-all ${filterCategory !== 'All' && filterCategory !== t('common.all') || filterStartDate || filterEndDate ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                <Filter className="mr-1.5 h-3.5 w-3.5" /> 
                {t('common.filters')} {(filterCategory !== 'All' || filterStartDate || filterEndDate) && <Badge className="ml-1.5 h-4 px-1 text-xs rounded-full">{t('inventory.active')}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">{t('common.filters')}</SheetTitle>
                <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('sales.filter_desc')}</SheetDescription>
              </SheetHeader>
              
              <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                {/* Category Filter */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('sales.classification')}</h4>
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
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('sales.timeframe')}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.start_date')}</label>
                      <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.end_date')}</label>
                      <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-1 leading-tight">{t('sales.date_desc')}</p>
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
                    <Button className="flex-1 py-3 tracking-widest rounded-xl shadow-xl">
                      {t('common.apply')}
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={loadDrafts} className="h-8 text-xs font-bold tracking-widest px-3">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> {t('sales.drafts')}
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="h-8 text-xs font-bold tracking-widest px-3">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('sales.new_btn')}
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={sales} 
          title={t('sales.header')}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => exportSalesCSV()} className="h-7 text-xs font-bold tracking-widest px-2.5">
            <FileText size={11} className="mr-1" /> {t('reports.csv')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportSalesPDF()} className="h-7 text-xs font-bold tracking-widest px-2.5">
            <FileText size={11} className="mr-1" /> {t('reports.pdf')}
          </Button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingId ? t('sales.modify_transaction') : t('sales.new_session')} size="xl">
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
                  <span className={`text-xs font-black uppercase tracking-widest ${currentStep === s ? 'text-primary' : 'text-muted-foreground'}`}>
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
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{t('sales.discovery')}</h4>
                    <Badge variant="outline" className="font-black text-xs h-5">{cart.length} {t('common.in_session')}</Badge>
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
                      {items.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).map(item => {
                        const isOutOfStock = item.totalBaseQuantity === 0 && item.totalPackQuantity === 0;
                        return (
                        <button 
                          key={item.id} 
                          onClick={() => { if (!isOutOfStock) { addToCart(String(item.id)); setItemSearchQuery(''); } }}
                          className={`w-full text-left p-4 rounded-xl transition-all border flex justify-between items-center ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-card hover:shadow-sm border-transparent hover:border-border group'}`}
                          disabled={isOutOfStock}
                        >
                          <span className={`font-bold text-sm ${isOutOfStock ? 'text-muted-foreground' : 'group-hover:text-primary'}`}>{item.name}</span>
                          {isOutOfStock ? (
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.out_of_stock', 'Out of Stock')}</span>
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      )})}
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
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('sales.quick_selection')}</p>
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
                    className="py-3 text-xs font-black uppercase tracking-widest rounded-xl" 
                    disabled={cart.length === 0}
                    onClick={handleSaveDraft}
                  >
                    {t('sales.save_draft')}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex-1 p-8 space-y-6 flex flex-col items-center overflow-hidden">
                <div className="w-full max-w-4xl flex items-center justify-between shrink-0">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{t('sales.ledger')}</h4>
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
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('common.etb')} {item.price} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-border/40 rounded-lg bg-muted/20 overflow-hidden h-7">
                          <button onClick={() => updateCartItem(item.itemId, { quantity: Math.max(1, item.quantity - 1) })} className="px-2 hover:bg-muted text-xs font-bold">-</button>
                          <Input 
                            type="number" 
                            className="w-10 h-full text-center text-xs font-black bg-transparent border-none focus-visible:ring-0 px-0" 
                            value={item.quantity} 
                            onChange={e => updateCartItem(item.itemId, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                          <button onClick={() => updateCartItem(item.itemId, { quantity: item.quantity + 1 })} className="px-2 hover:bg-muted text-xs font-bold">+</button>
                        </div>
                        <Select 
                          value={item.unitType} 
                          onValueChange={val => updateCartItem(item.itemId, { unitType: val })}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs font-black uppercase tracking-widest rounded-lg border-border/40 bg-card px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base" className="text-xs uppercase font-bold">{t('sales.individual')}</SelectItem>
                            <SelectItem value="pack" className="text-xs uppercase font-bold">{t('sales.pack')}</SelectItem>
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
                  <Button variant="outline" className="flex-1 h-10 text-xs tracking-widest border-2 rounded-xl" onClick={() => setCurrentStep(1)}>
                    {t('sales.add_more')}
                  </Button>
                  <Button variant="secondary" className="h-10 text-xs tracking-widest rounded-xl" onClick={handleSaveDraft}>
                    {t('sales.save_draft')}
                  </Button>
                  <Button className="flex-1 h-10 text-xs tracking-widest shadow-lg rounded-xl" onClick={() => setCurrentStep(3)}>
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
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.financial_adjustments')}</h4>
                      <div className="flex items-center gap-6 p-4 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('sales.discount_flat')}</label>
                          <Input className="h-10 bg-muted/10 font-bold border-none" placeholder="0.00" type="number" value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('sales.vat_percent')}</label>
                          <Input className="h-10 bg-muted/10 font-bold border-none" placeholder="15" type="number" value={globalVAT} onChange={e => setGlobalVAT(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.customer_identity')}</h4>
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
                          <Button variant={!paymentInfo.isDebt ? "default" : "ghost"} size="sm" onClick={() => setPaymentInfo({...paymentInfo, isDebt: false})} className="flex-1 h-8 text-xs tracking-widest rounded-lg">{t('sales.settled')}</Button>
                          <Button variant={paymentInfo.isDebt ? "destructive" : "ghost"} size="sm" onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 5);
                            setPaymentInfo({...paymentInfo, isDebt: true, dueDate: paymentInfo.dueDate || d.toISOString().split('T')[0]});
                          }} className="flex-1 h-8 text-xs font-black uppercase tracking-widest rounded-lg">{t('sales.debt')}</Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('sales.payment_logistics')}</h4>
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
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/60">{t('sales.subtotal')}</span>
                        <p className="text-lg font-bold opacity-80">{t('common.etb')} {totals.subtotal.toLocaleString()}</p>
                      </div>
                      <div className="h-10 w-px bg-primary-foreground/20" />
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/60">{t('sales.total_settlement')}</span>
                        <p className="text-3xl font-black tracking-tight">{t('common.etb')} {totals.finalTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    {overCapRequired && (
                      <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xl leading-none">&#9888;</span>
                          <div className="text-[11px] leading-relaxed text-amber-700">
                            <p className="font-black uppercase tracking-widest">{t('sales.discount_limit_title', 'Discount Above Limit')}</p>
                            <p>{t('sales.discount_limit_desc', 'Your discount of {pct}% exceeds the {cap}% limit for your role. Manager approval will be required at checkout.', { pct: Math.round(overCapMaxPct), cap: discountCap })}</p>
                          </div>
                        </div>
                        <Select value={overrideReason || (OVERRIDE_REASONS[0].value)} onValueChange={setOverrideReason}>
                          <SelectTrigger className="w-full h-9 bg-card text-xs rounded-xl border-amber-500/40">
                            <SelectValue placeholder={t('sales.override_reason_placeholder', 'Select override reason…')} />
                          </SelectTrigger>
                          <SelectContent>
                            {OVERRIDE_REASONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-1.5">
                    <Button onClick={handleSubmit} className="w-full h-10 text-xs tracking-[0.2em] shadow-lg rounded-xl" disabled={cart.length === 0 || (paymentInfo.isDebt && (!customerInfo.name || !customerInfo.phone || !paymentInfo.dueDate))}>
                      {t('sales.authorize')}
                    </Button>
                    <Button variant="outline" onClick={handleSaveDraft} className="w-full h-9 text-xs tracking-widest rounded-xl" disabled={cart.length === 0}>
                      {t('sales.save_draft')}
                    </Button>
                    <Button variant="ghost" onClick={() => setCurrentStep(2)} className="w-full text-xs font-bold tracking-widest opacity-40 hover:bg-transparent h-7">
                      {t('sales.back_to_cart')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('sales.discard_title', 'Discard Sale?')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t('sales.discard_desc', 'You have items in your cart. Are you sure you want to discard this sale?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest"
            >
              {t('common.discard', 'Discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title={t('sales.transaction_receipt')} size="md">
        {viewingSale && (
          <div className="space-y-6">
            <div className="text-center space-y-1 border-b border-dashed border-border pb-6">
              <h2 className="text-2xl font-black tracking-tight uppercase">{t('sales.receipt_header')}</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.receipt_id_label', 'ID: #REC-{id}', { id: viewingSale.id })}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(viewingSale.createdAt)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-border/50 pb-2">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.item_details')}</p>
                  <p className="font-bold text-sm">{viewingSale.itemName}</p>
                </div>
                <p className="font-black text-lg">{t('common.etb')} {viewingSale.totalPrice.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-3 rounded-xl bg-card border border-border/50">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.customer')}</p>
                  <p>{viewingSale.customerName || t('sales.walk_in')}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/50 text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.payment')}</p>
                  <p>{viewingSale.paymentMethod} • {viewingSale.paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => generateReceipt(viewingSale)} className="flex-1 py-2.5 rounded-xl font-bold tracking-widest text-xs">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> {t('common.print')}
              </Button>
              <Button variant="ghost" onClick={() => setShowReceiptModal(false)} className="py-2.5 font-bold tracking-widest text-xs">{t('common.done')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={t('sales.process_return', 'Process Return')} size="sm">
        {returnSale && (
          <form onSubmit={handleReturn} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 text-sm space-y-1">
              <p className="font-bold">{returnSale.itemName}</p>
              <p className="text-xs text-muted-foreground">{t('sales.return_sale_info', 'Sale #{id} · {customer}', { id: returnSale.id, customer: returnSale.customerName || t('sales.walk_in') })}</p>
              <p className="text-xs">{t('sales.original_qty_total', 'Original qty: {qty} · Total: {total}', { qty: returnSale.quantity, total: `${t('common.etb')} ${returnSale.totalPrice.toLocaleString()}` })}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('sales.quantity_to_return', 'Quantity to Return')} *
              </label>
              <Input required type="number" min="1" max={returnSale.quantity}
                value={returnQty} onChange={e => setReturnQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('sales.refund_amount')}
              </label>
              <Input type="number" min="0"
                value={returnRefund} onChange={e => setReturnRefund(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t('sales.return_refund_hint', 'Set to 0 for no refund (exchange only)')}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('sales.return_reason_label', 'Reason')} *
              </label>
              <Select value={returnReason} onValueChange={(v) => { setReturnReason(v); if (v !== 'other') setReturnCustomReason(''); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('sales.return_reason_placeholder', 'Select a reason…')} />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {returnReason === 'other' && (
                <Input value={returnCustomReason} onChange={e => setReturnCustomReason(e.target.value)}
                  placeholder={t('sales.return_reason_other', 'Describe the reason…')} />
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-9 text-xs font-bold tracking-widest" onClick={() => setShowReturnModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-9 text-xs font-bold tracking-widest" disabled={!returnQty || parseFloat(returnQty) < 1 || !returnReason || (returnReason === 'other' && !returnCustomReason.trim())}>
                {t('sales.process_return', 'Process Return')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Drafts Modal */}
      <Modal isOpen={showDraftsModal} onClose={() => setShowDraftsModal(false)} title={t('sales.draft_sales')} size="lg">
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="font-bold uppercase tracking-widest text-xs">{t('sales.no_drafts')}</p>
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
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                      {items.length} {t('common.items')} &middot; {t('common.etb')} {total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(draft.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => resumeDraft(draft.id)} className="h-7 text-xs font-bold tracking-widest px-2">
                      {t('sales.resume')}
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
