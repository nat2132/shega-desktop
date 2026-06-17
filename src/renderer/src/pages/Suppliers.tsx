import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Truck, Plus, Search, Phone, Mail, MapPin, Edit, Archive, RotateCcw,
  Trash2, Eye, Download, Printer, CreditCard,
  Building2, Package, X, ChevronRight, Sparkles,
  ChevronLeft, RefreshCw, Star, Filter, Upload, DollarSign,
  Calendar, TrendingUp, Users, AlertTriangle, CheckCircle,
  MoreHorizontal, Copy, Receipt, Clock, Heart, ShieldAlert,
  ChevronDown, ChevronUp, SlidersHorizontal, ListFilter, Bell, Ban
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { DatePicker } from '../components/DatePicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DataTable } from '../components/data-table';
import Modal from '../components/Modal';
import { addPdfHeader } from '../lib/export-utils';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'];
const ROWS_PER_PAGE = 50;

interface Supplier {
  id: number; supplierName: string; companyName?: string; contactPerson?: string;
  phone?: string; secondaryPhone?: string; email?: string; address?: string; city?: string;
  country?: string; taxNumber?: string; paymentTerms?: string; creditLimit?: number;
  notes?: string; status?: string; isActive?: number; createdAt?: string;
  totalPurchases?: number; totalPaid?: number; outstandingBalance?: number;
  avgPurchase?: number; productCount?: number; lastPurchaseDate?: string;
  purchaseCount?: number; isFavorite?: number; performanceScore?: number;
  lastActivityDate?: string;
}

interface Purchase {
  id: number; supplierId: number; supplierName?: string; purchaseNumber?: string;
  purchaseDate: string; totalAmount: number; paidAmount: number;
  remainingBalance?: number; productCount?: number; status: string; dueDate?: string;
}

interface Payment {
  id: number; supplierId: number; supplierName?: string; purchaseNumber?: string;
  paymentDate: string; referenceNumber?: string; amount: number;
  paymentMethod: string; notes?: string; purchaseId?: number;
  reversalId?: number | null;
}

interface SupplierActivity {
  id: number; action: string; description: string; entityType: string;
  entityId: number; createdBy: string; createdAt: string;
}

interface PriceCheck {
  id: number;
  supplierId: number;
  supplierName: string;
  itemId?: number;
  itemName?: string;
  frequency: string;
  lastCheckedDate?: string;
  nextCheckDate?: string;
  notes?: string;
  active: boolean;
  createdAt?: string;
}

type ViewMode = 'list' | 'detail' | 'form' | 'analytics';

const DEFAULT_FORM = {
  supplierName: '', companyName: '', contactPerson: '', phone: '',
  secondaryPhone: '', email: '', address: '', city: '', country: 'Ethiopia',
  taxNumber: '', paymentTerms: 'Net 30', creditLimit: 0, notes: '', status: 'active'
};

const Suppliers: React.FC = () => {
  const { t, formatDate, currency, currentBusiness } = useSettings();
  const { hasPermission } = useAuth();
  const [view, setView] = useState<ViewMode>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'volume' | 'recent'>('name');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '',
    amount: '', paymentMethod: 'cash', notes: '', purchaseId: ''
  });
  const [selectedSupplierPayments, setSelectedSupplierPayments] = useState<Payment[]>([]);
  const [selectedSupplierPurchases, setSelectedSupplierPurchases] = useState<Purchase[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showTestMenu, setShowTestMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [supplierActivity, setSupplierActivity] = useState<SupplierActivity[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [priceCheckForm, setPriceCheckForm] = useState({
    supplierId: 0, itemId: '', frequency: 'weekly', notes: '', active: true,
  });
  const cur = currency || 'ETB';
  const [reversePaymentTarget, setReversePaymentTarget] = useState<Payment | null>(null);
  const [reversePaymentReason, setReversePaymentReason] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.getSuppliers({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 10000, offset: 0,
      });
      let rows: Supplier[] = result.rows || [];
      if (balanceFilter === 'paid') rows = rows.filter(s => (s.outstandingBalance || 0) <= 0);
      if (balanceFilter === 'unpaid') rows = rows.filter(s => (s.outstandingBalance || 0) >= (s.totalPurchases || 0) && (s.totalPurchases || 0) > 0);
      if (balanceFilter === 'partial') rows = rows.filter(s => (s.outstandingBalance || 0) > 0 && (s.outstandingBalance || 0) < (s.totalPurchases || 0));
      if (sortBy === 'name') rows.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      if (sortBy === 'volume') rows.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));
      if (sortBy === 'recent') rows.sort((a, b) => (b.lastPurchaseDate || '').localeCompare(a.lastPurchaseDate || ''));
      setSuppliers(rows);
    } catch (e: any) {
      showToast(e.message || 'Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, balanceFilter, sortBy, showToast]);

  const loadDashboardStats = useCallback(async () => {
    try {
      const stats = await window.api.getSupplierDashboardStats();
      setDashboardStats(stats);
    } catch (_) {}
  }, []);

  const loadPriceChecks = useCallback(async (supplierId?: number) => {
    try {
      const data = await window.api.getSupplierPriceChecks(supplierId);
      setPriceChecks(data || []);
    } catch (_) {}
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const data = await window.api.getItems({ limit: 10000 });
      setItems(data || []);
    } catch (_) {}
  }, []);

  useEffect(() => { loadSuppliers(); loadDashboardStats(); }, [loadSuppliers, loadDashboardStats]);
  useEffect(() => { setPage(0); }, [search, statusFilter, balanceFilter, sortBy]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault(); searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && view !== 'list') { setView('list'); setSelected(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view]);

  const totalPages = Math.max(1, Math.ceil(suppliers.length / ROWS_PER_PAGE));
  const paged = useMemo(() => suppliers.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE), [suppliers, page]);

  const handleSave = async () => {
    if (!form.supplierName.trim()) { showToast(t('suppliers.field_name') + ' is required', 'error'); return; }
    try {
      if (editingId) {
        await window.api.updateSupplier(editingId, form);
        showToast(t('suppliers.toast_updated'));
      } else {
        await window.api.insertSupplier(form);
        showToast(t('suppliers.toast_created'));
      }
      setView('list'); setForm(DEFAULT_FORM); setEditingId(null);
      loadSuppliers(); loadDashboardStats();
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    }
  };

  const handleArchive = async (s: Supplier) => {
    if (!window.confirm(t('suppliers.confirm_archive'))) return;
    try {
      await window.api.archiveSupplier(s.id);
      showToast(t('suppliers.toast_archived'));
      loadSuppliers(); loadDashboardStats();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleRestore = async (s: Supplier) => {
    try {
      await window.api.restoreSupplier(s.id);
      showToast(t('suppliers.toast_restored'));
      loadSuppliers(); loadDashboardStats();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleDelete = async (s: Supplier) => {
    if (!window.confirm(t('suppliers.confirm_delete'))) return;
    try {
      await window.api.deleteSupplier(s.id);
      showToast(t('suppliers.toast_deleted'));
      loadSuppliers(); loadDashboardStats();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await window.api.toggleSupplierFavorite(id);
      loadSuppliers();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const openDetail = async (s: Supplier) => {
    try {
      const fresh = await window.api.getSupplier(s.id);
      if (!fresh) { showToast('Supplier not found', 'error'); return; }
      setSelected(fresh);
      const [purchases, payments, products, activity] = await Promise.all([
        window.api.getSupplierPurchases({ supplierId: s.id, limit: 1000, offset: 0 }),
        window.api.getSupplierPayments({ supplierId: s.id, limit: 1000, offset: 0 }),
        window.api.getSupplierProducts(s.id),
        window.api.getSupplierActivityLog(s.id, 20),
      ]);
      setSelectedSupplierPurchases(purchases.rows || []);
      setSelectedSupplierPayments(payments.rows || []);
      setSelectedProducts(products || []);
      setSupplierActivity(activity || []);
      loadPriceChecks(s.id);
      loadItems();
      setView('detail');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const openForm = (s?: Supplier) => {
    if (s) {
      setForm({
        supplierName: s.supplierName || '', companyName: s.companyName || '',
        contactPerson: s.contactPerson || '', phone: s.phone || '',
        secondaryPhone: s.secondaryPhone || '', email: s.email || '',
        address: s.address || '', city: s.city || '', country: s.country || 'Ethiopia',
        taxNumber: s.taxNumber || '', paymentTerms: s.paymentTerms || 'Net 30',
        creditLimit: s.creditLimit || 0, notes: s.notes || '', status: s.status || 'active',
      });
      setEditingId(s.id);
    } else {
      setForm(DEFAULT_FORM); setEditingId(null);
    }
    setView('form');
  };

  const handleSavePayment = async () => {
    if (!selected) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { showToast(t('common.amount') + ' is required', 'error'); return; }
    if (!paymentForm.paymentMethod) { showToast('Payment method is required', 'error'); return; }
    try {
      const payload = {
        supplierId: selected.id, purchaseId: paymentForm.purchaseId ? Number(paymentForm.purchaseId) : null,
        paymentDate: paymentForm.paymentDate, referenceNumber: paymentForm.referenceNumber,
        amount: Number(paymentForm.amount), paymentMethod: paymentForm.paymentMethod, notes: paymentForm.notes,
      };
      if (editingPayment) {
        await window.api.updateSupplierPayment(editingPayment.id, payload);
        showToast(t('suppliers.toast_payment_updated'));
      } else {
        await window.api.insertSupplierPayment(payload);
        showToast(t('suppliers.toast_payment_recorded'));
      }
      setShowPaymentModal(false); setEditingPayment(null);
      setPaymentForm({ paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '', amount: '', paymentMethod: 'cash', notes: '', purchaseId: '' });
      const fresh = await window.api.getSupplier(selected.id);
      setSelected(fresh);
      const [purchases, payments] = await Promise.all([
        window.api.getSupplierPurchases({ supplierId: selected.id, limit: 1000, offset: 0 }),
        window.api.getSupplierPayments({ supplierId: selected.id, limit: 1000, offset: 0 }),
      ]);
      setSelectedSupplierPurchases(purchases.rows || []);
      setSelectedSupplierPayments(payments.rows || []);
      loadSuppliers();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleDeletePayment = async (p: Payment) => {
    if (!window.confirm(t('suppliers.confirm_delete_payment'))) return;
    try {
      await window.api.deleteSupplierPayment(p.id);
      showToast(t('suppliers.toast_payment_deleted'));
      if (selected) {
        const fresh = await window.api.getSupplier(selected.id);
        setSelected(fresh);
        const payments = await window.api.getSupplierPayments({ supplierId: selected.id, limit: 1000, offset: 0 });
        setSelectedSupplierPayments(payments.rows || []);
      }
      loadSuppliers();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleReverseSupplierPayment = async () => {
    if (!reversePaymentTarget) return;
    try {
      await window.api.reverseSupplierPayment({ paymentId: reversePaymentTarget.id, reason: reversePaymentReason });
      showToast('Payment reversed successfully');
      setReversePaymentTarget(null);
      setReversePaymentReason('');
      if (selected) {
        const fresh = await window.api.getSupplier(selected.id);
        setSelected(fresh);
        const payments = await window.api.getSupplierPayments({ supplierId: selected.id, limit: 1000, offset: 0 });
        setSelectedSupplierPayments(payments.rows || []);
      }
      loadSuppliers();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleSavePriceCheck = async () => {
    try {
      const payload: any = {
        supplierId: priceCheckForm.supplierId,
        frequency: priceCheckForm.frequency,
        notes: priceCheckForm.notes,
        active: priceCheckForm.active,
      };
      if (priceCheckForm.itemId) payload.itemId = Number(priceCheckForm.itemId);
      const result = await window.api.saveSupplierPriceCheck(payload);
      if (result.success) {
        showToast('Price check scheduled');
        setShowPriceCheckModal(false);
        setPriceCheckForm({ supplierId: 0, itemId: '', frequency: 'weekly', notes: '', active: true });
        if (selected) loadPriceChecks(selected.id);
        else loadPriceChecks();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleDeletePriceCheck = async (id: number) => {
    if (!window.confirm('Delete this price check reminder?')) return;
    try {
      await window.api.deleteSupplierPriceCheck(id);
      showToast('Price check deleted');
      if (selected) loadPriceChecks(selected.id);
      else loadPriceChecks();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleTogglePriceCheckActive = async (pc: PriceCheck) => {
    try {
      await window.api.saveSupplierPriceCheck({ ...pc, active: !pc.active });
      if (selected) loadPriceChecks(selected.id);
      else loadPriceChecks();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    let y = y0 + 4;
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Suppliers Report', 14, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
    const headers = [['Name', 'Company', 'Phone', 'Total Purchases', 'Outstanding', 'Status']];
    const data = suppliers.map(s => [
      s.supplierName, s.companyName || '-', s.phone || '-',
      `${cur} ${(s.totalPurchases || 0).toLocaleString()}`,
      `${cur} ${(s.outstandingBalance || 0).toLocaleString()}`,
      s.isActive ? 'Active' : 'Inactive'
    ]);
    autoTable(doc, { head: headers, body: data, startY: y + 4, styles: { fontSize: 8 } });
    doc.save('suppliers-report.pdf');
    showToast('PDF exported');
  };

  const exportCSV = () => {
    const headers = ['Name', 'Company', 'Phone', 'Email', 'Total Purchases', 'Outstanding', 'Status'];
    const rows = suppliers.map(s => [
      s.supplierName, s.companyName || '', s.phone || '', s.email || '',
      s.totalPurchases || 0, s.outstandingBalance || 0, s.isActive ? 'Active' : 'Inactive'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'suppliers.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length) setSelectedIds([]);
    else setSelectedIds(paged.map(s => s.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── List View ──
  if (view === 'list') {
    const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
    const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);

    return (
      <div className="space-y-4 p-2 fade-in">
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />{t('suppliers.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('suppliers.subtitle')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-1" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Printer className="h-4 w-4 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { loadItems(); setPriceCheckForm({ supplierId: 0, itemId: '', frequency: 'weekly', notes: '', active: true }); setShowPriceCheckModal(true); }}>
              <Bell className="h-4 w-4 mr-1" />Price Checks
            </Button>
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="h-4 w-4 mr-1" />{t('suppliers.add_supplier')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />{t('suppliers.stat_total')}
            </div>
            <div className="text-2xl font-bold">{dashboardStats?.totalSuppliers || suppliers.length}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />{t('suppliers.stat_active')}
            </div>
            <div className="text-2xl font-bold text-green-600">{dashboardStats?.activeSuppliers || suppliers.filter(s => s.isActive).length}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-red-500" />{t('suppliers.stat_outstanding')}
            </div>
            <div className="text-2xl font-bold text-red-600">{cur} {totalOutstanding.toLocaleString()}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />{t('suppliers.stat_total')}
            </div>
            <div className="text-2xl font-bold">{cur} {totalPurchases.toLocaleString()}</div>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input ref={searchInputRef} className="pl-9" placeholder={t('common.search') + '...'}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border rounded px-2 py-1.5 bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">{t('suppliers.filter_all')}</option>
            <option value="active">{t('suppliers.filter_active')}</option>
            <option value="inactive">{t('suppliers.filter_inactive')}</option>
          </select>
          <select className="border rounded px-2 py-1.5 bg-background text-sm" value={balanceFilter} onChange={e => setBalanceFilter(e.target.value as any)}>
            <option value="all">{t('suppliers.filter_balance_all')}</option>
            <option value="paid">{t('suppliers.filter_paid')}</option>
            <option value="unpaid">{t('suppliers.filter_unpaid')}</option>
            <option value="partial">{t('suppliers.filter_partial')}</option>
          </select>
          <select className="border rounded px-2 py-1.5 bg-background text-sm" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="name">{t('suppliers.sort_name')}</option>
            <option value="volume">{t('suppliers.sort_volume')}</option>
            <option value="recent">{t('suppliers.sort_recent')}</option>
          </select>
          <Button variant="ghost" size="icon" onClick={() => loadSuppliers()}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Truck className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">{t('suppliers.empty_list')}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => openForm()}>
                  <Plus className="h-4 w-4 mr-1" />{t('suppliers.add_supplier')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 w-8"><input type="checkbox" checked={selectedIds.length === paged.length && paged.length > 0} onChange={toggleSelectAll} /></th>
                      <th className="text-left p-2">{t('suppliers.col_name')}</th>
                      <th className="text-left p-2 hidden md:table-cell">{t('suppliers.col_company')}</th>
                      <th className="text-left p-2 hidden lg:table-cell">{t('suppliers.col_phone')}</th>
                      <th className="text-right p-2">{t('suppliers.col_purchases')}</th>
                      <th className="text-right p-2">{t('suppliers.col_balance')}</th>
                      <th className="text-left p-2 hidden xl:table-cell">{t('suppliers.col_products')}</th>
                      <th className="text-left p-2 hidden xl:table-cell">{t('suppliers.col_last')}</th>
                      <th className="text-left p-2">{t('suppliers.col_status')}</th>
                      <th className="p-2">{t('suppliers.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(s => (
                      <tr key={s.id} className={`border-t hover:bg-muted/20 ${selectedIds.includes(s.id) ? 'bg-muted/30' : ''}`}>
                        <td className="p-2"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                        <td className="p-2">
                          <button className="font-medium text-left hover:underline cursor-pointer flex items-center gap-1" onClick={() => openDetail(s)}>
                            {s.isFavorite ? <Heart className="h-3 w-3 text-red-500 fill-red-500" /> : null}
                            {s.supplierName}
                          </button>
                        </td>
                        <td className="p-2 text-muted-foreground hidden md:table-cell">{s.companyName || '-'}</td>
                        <td className="p-2 text-muted-foreground hidden lg:table-cell">{s.phone || '-'}</td>
                        <td className="p-2 text-right">{cur} {(s.totalPurchases || 0).toLocaleString()}</td>
                        <td className={`p-2 text-right font-semibold ${(s.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {cur} {(s.outstandingBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-2 hidden xl:table-cell">{s.productCount || 0}</td>
                        <td className="p-2 text-xs hidden xl:table-cell">{s.lastPurchaseDate ? formatDate(s.lastPurchaseDate) : '-'}</td>
                        <td className="p-2">
                          <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-[10px]">
                            {s.isActive ? t('suppliers.status_active') : t('suppliers.status_inactive')}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openDetail(s)} title={t('common.view')}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openForm(s)} title={t('common.edit')}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleFavorite(s.id)} title={t('suppliers.toggle_favorite')}>
                              <Heart className={`h-3.5 w-3.5 ${s.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            {s.isActive ? (
                              <Button size="sm" variant="ghost" onClick={() => handleArchive(s)} title={t('suppliers.archive')}><Archive className="h-3.5 w-3.5" /></Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => handleRestore(s)} title={t('suppliers.restore')}><RotateCcw className="h-3.5 w-3.5 text-green-600" /></Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(s)} title={t('common.delete')}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {suppliers.length > ROWS_PER_PAGE && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{suppliers.length} {t('common.total')}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 4, totalPages - 10));
                const p = start + i;
                if (p >= totalPages) return null;
                return (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                    {p + 1}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ── Add/Edit Form View ──
  if (view === 'form') {
    return (
      <div className="space-y-4 p-2 max-w-2xl fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setView('list'); setForm(DEFAULT_FORM); setEditingId(null); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{editingId ? t('suppliers.edit_supplier') : t('suppliers.add_supplier')}</h1>
        </div>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_name')} *</label>
                <Input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_company')}</label>
                <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_contact')}</label>
                <Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_phone')} *</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+251..." />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_alt_phone')}</label>
                <Input value={form.secondaryPhone} onChange={e => setForm({ ...form, secondaryPhone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_email')}</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_tax')}</label>
                <Input value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_city')}</label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">{t('suppliers.field_address')}</label>
                <textarea className="w-full border rounded px-3 py-2 bg-background min-h-[60px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">{t('suppliers.field_notes')}</label>
                <textarea className="w-full border rounded px-3 py-2 bg-background min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setView('list'); setForm(DEFAULT_FORM); setEditingId(null); }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave}>{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Detail View ──
  if (view === 'detail' && selected) {
    const balance = (selected.outstanding || 0);
    const overduePurchases = selectedSupplierPurchases.filter(p => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < new Date() && (p.totalAmount - (p.paidAmount || 0)) > 0 && p.status !== 'cancelled';
    });
    const overdueTotal = overduePurchases.reduce((sum, p) => sum + (p.totalAmount - (p.paidAmount || 0)), 0);

    return (
      <div className="space-y-4 p-2 fade-in">
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setView('list')}><ChevronLeft className="h-5 w-5" /></Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />{selected.supplierName}
            </h1>
            {selected.isFavorite ? <Heart className="h-5 w-5 text-red-500 fill-red-500" /> : null}
            <Badge variant={selected.isActive ? 'default' : 'secondary'}>{selected.status || (selected.isActive ? 'Active' : 'Inactive')}</Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => openForm(selected)}><Edit className="h-4 w-4 mr-1" />{t('common.edit')}</Button>
            <Button variant="outline" size="sm" onClick={() => { setEditingPayment(null); setShowPaymentModal(true); }}>
              <CreditCard className="h-4 w-4 mr-1" />{t('suppliers.record_payment')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleToggleFavorite(selected.id)}>
              <Heart className={`h-4 w-4 mr-1 ${selected.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {selected.isFavorite ? t('suppliers.remove_favorite') : t('suppliers.add_favorite')}
            </Button>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" />{t('suppliers.section_info')}</h3>
            <div className="text-sm space-y-1.5">
              <div><span className="text-muted-foreground">{t('suppliers.field_company')}:</span> {selected.companyName || '-'}</div>
              <div><span className="text-muted-foreground">{t('suppliers.field_contact')}:</span> {selected.contactPerson || '-'}</div>
              <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {selected.phone || '-'}</div>
              {selected.secondaryPhone && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {selected.secondaryPhone}</div>}
              <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {selected.email || '-'}</div>
              <div className="flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" /> {[selected.address, selected.city, selected.country].filter(Boolean).join(', ') || '-'}</div>
              <div><span className="text-muted-foreground">{t('suppliers.field_tax')}:</span> {selected.taxNumber || '-'}</div>
              <div><span className="text-muted-foreground">{t('suppliers.field_terms')}:</span> {selected.paymentTerms || '-'}</div>
              <div><span className="text-muted-foreground">{t('suppliers.field_credit')}:</span> {cur} {(selected.creditLimit || 0).toLocaleString()}</div>
              {selected.notes && <div className="pt-2 border-t text-muted-foreground italic">{selected.notes}</div>}
            </div>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_total')}</div>
              <div className="text-xl font-bold">{cur} {(selected.totalPurchases || 0).toLocaleString()}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_paid')}</div>
              <div className="text-xl font-bold text-green-600">{cur} {(selected.totalPaid || 0).toLocaleString()}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_outstanding')}</div>
              <div className="text-xl font-bold text-red-600">{cur} {balance.toLocaleString()}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_avg')}</div>
              <div className="text-lg font-bold">{cur} {Math.round(selected.avgPurchase || 0).toLocaleString()}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_products')}</div>
              <div className="text-lg font-bold">{selected.productCount || 0}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">{t('suppliers.stat_last')}</div>
              <div className="text-lg font-bold text-sm">{selected.lastPurchaseDate ? formatDate(selected.lastPurchaseDate) : '-'}</div></Card>
          </div>
        </div>

        {/* Debt Management */}
        {balance > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-red-500" />{t('suppliers.debt_management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                  <div className="text-xs text-muted-foreground">{t('suppliers.current_balance')}</div>
                  <div className="text-lg font-bold text-red-600">{cur} {balance.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded">
                  <div className="text-xs text-muted-foreground">{t('suppliers.overdue_amount')}</div>
                  <div className="text-lg font-bold text-amber-600">{cur} {overdueTotal.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <div className="text-xs text-muted-foreground">{t('suppliers.upcoming_payments')}</div>
                  <div className="text-lg font-bold text-green-600">{selectedSupplierPurchases.filter(p => p.dueDate && new Date(p.dueDate) >= new Date() && (p.totalAmount - (p.paidAmount || 0)) > 0).length}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedSupplierPurchases.filter(p => (p.totalAmount - (p.paidAmount || 0)) > 0).slice(0, 3).map(p => (
                  <Button key={p.id} variant="outline" size="sm" onClick={() => { setPaymentForm({ ...paymentForm, purchaseId: String(p.id) }); setShowPaymentModal(true); }}>
                    {t('suppliers.pay')} {p.purchaseNumber || `#${p.id}`}: {cur} {((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchases */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('suppliers.section_purchases')} ({selectedSupplierPurchases.length})</CardTitle>
              <Button size="sm" onClick={async () => {
                if (!selected) return;
                if (selectedProducts.length === 0) {
                  alert(t('suppliers.empty_products'));
                  return;
                }
                const totalAmount = selectedProducts.reduce((s, p) => s + (p.lastPurchasePrice || 0) * 5, 0);
                try {
                  await window.api?.insertSupplierPurchase({
                    supplierId: selected.id,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    totalAmount,
                    items: selectedProducts.map(p => ({
                      itemId: p.productId,
                      itemName: p.itemName,
                      quantity: 5,
                      unit: 'pcs',
                      unitPrice: p.lastPurchasePrice || 0,
                    }))
                  });
                  showToast(t('suppliers.toast_created') || 'Purchase created', 'success');
                  openDetail(selected);
                } catch (err: any) {
                  showToast(err.message || 'Purchase failed', 'error');
                }
              }}>
                <Plus className="h-4 w-4 mr-1" />Purchase
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {selectedSupplierPurchases.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">{t('suppliers.empty_purchases')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-2">{t('suppliers.col_purchase_no')}</th>
                      <th className="text-left p-2">{t('suppliers.col_date')}</th>
                      <th className="text-right p-2">{t('suppliers.col_products')}</th>
                      <th className="text-right p-2">{t('suppliers.col_total')}</th>
                      <th className="text-right p-2">{t('suppliers.col_paid')}</th>
                      <th className="text-right p-2">{t('suppliers.col_balance')}</th>
                      <th className="text-left p-2">{t('suppliers.col_status')}</th>
                      <th className="text-left p-2">{t('suppliers.col_due')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupplierPurchases.map(p => (
                      <tr key={p.id} className="border-t hover:bg-muted/20">
                        <td className="p-2 font-mono text-xs">{p.purchaseNumber || `#${p.id}`}</td>
                        <td className="p-2">{formatDate(p.purchaseDate)}</td>
                        <td className="p-2 text-right">{p.productCount || 0}</td>
                        <td className="p-2 text-right">{cur} {(p.totalAmount || 0).toLocaleString()}</td>
                        <td className="p-2 text-right text-green-600">{cur} {(p.paidAmount || 0).toLocaleString()}</td>
                        <td className="p-2 text-right font-semibold" style={{ color: (p.totalAmount - (p.paidAmount || 0)) > 0 ? 'var(--destructive)' : 'var(--green-600)' }}>
                          {cur} {((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()}
                        </td>
                        <td className="p-2"><Badge variant={p.status === 'received' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge></td>
                        <td className="p-2 text-xs">{p.dueDate ? formatDate(p.dueDate) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('suppliers.section_payments')} ({selectedSupplierPayments.length})</CardTitle>
              <Button size="sm" onClick={() => { setEditingPayment(null); setShowPaymentModal(true); }}>
                <Plus className="h-4 w-4 mr-1" />{t('suppliers.record_payment')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {selectedSupplierPayments.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">{t('suppliers.empty_payments')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-2">{t('suppliers.col_date')}</th>
                      <th className="text-right p-2">{t('suppliers.col_amount')}</th>
                      <th className="text-left p-2">{t('suppliers.col_method')}</th>
                      <th className="text-left p-2">{t('suppliers.col_reference')}</th>
                      <th className="text-left p-2">{t('suppliers.col_purchase_no')}</th>
                      <th className="text-left p-2">{t('suppliers.field_notes')}</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupplierPayments.map(p => (
                      <tr key={p.id} className="border-t hover:bg-muted/20">
                        <td className="p-2">{formatDate(p.paymentDate)}</td>
                        <td className="p-2 text-right font-semibold text-green-600">{cur} {(p.amount || 0).toLocaleString()}</td>
                        <td className="p-2"><Badge variant="outline" className="text-[10px]">{p.paymentMethod}</Badge></td>
                        <td className="p-2 font-mono text-xs">{p.referenceNumber || '-'}</td>
                        <td className="p-2 font-mono text-xs">{p.purchaseNumber || '-'}</td>
                        <td className="p-2 text-xs text-muted-foreground">{p.notes || '-'}</td>
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPayment(p); setPaymentForm({ paymentDate: p.paymentDate, referenceNumber: p.referenceNumber || '', amount: String(p.amount), paymentMethod: p.paymentMethod, notes: p.notes || '', purchaseId: String(p.purchaseId || '') }); setShowPaymentModal(true); }}><Edit className="h-3 w-3" /></Button>
                          {!p.reversalId && hasPermission('payments.reverse') && (
                            <Button size="sm" variant="ghost" onClick={() => { setReversePaymentTarget(p); setReversePaymentReason(''); }}>
                              <Ban className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePayment(p)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('suppliers.section_products')} ({selectedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">{t('suppliers.empty_products')}</div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-2">{t('suppliers.col_item')}</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">{t('suppliers.col_stock')}</th>
                        <th className="text-right p-2">{t('suppliers.col_last_price')}</th>
                        <th className="text-right p-2">{t('suppliers.col_avg_price')}</th>
                        <th className="text-right p-2">{t('suppliers.col_total_purchased')}</th>
                        <th className="text-left p-2">{t('suppliers.col_last_date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((p, i) => (
                        <tr key={i} className="border-t hover:bg-muted/20">
                          <td className="p-2">{p.itemName}</td>
                          <td className="p-2 font-mono text-xs">{p.sku || '-'}</td>
                          <td className="p-2 text-right">{p.currentStock || 0}</td>
                          <td className="p-2 text-right">{cur} {(p.lastPurchasePrice || 0).toLocaleString()}</td>
                          <td className="p-2 text-right">{cur} {(p.avgPurchasePrice || p.lastPurchasePrice || 0).toLocaleString()}</td>
                          <td className="p-2 text-right">{p.totalPurchased || 0}</td>
                          <td className="p-2">{p.lastPurchaseDate ? formatDate(p.lastPurchaseDate) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Checks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" />Price Checks ({priceChecks.length})</CardTitle>
              <Button size="sm" onClick={() => { setPriceCheckForm({ supplierId: selected.id, itemId: '', frequency: 'weekly', notes: '', active: true }); setShowPriceCheckModal(true); }}>
                <Plus className="h-4 w-4 mr-1" />Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {priceChecks.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No price check reminders scheduled</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priceChecks.map(pc => (
                  <div key={pc.id} className="rounded-3xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{pc.itemName || 'All Items'}</h4>
                      <button onClick={() => handleTogglePriceCheckActive(pc)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pc.active ? 'bg-green-600' : 'bg-muted'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${pc.active ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                      <Calendar className="h-3 w-3" />{pc.frequency}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground uppercase tracking-widest">Last</span>
                        <p>{pc.lastCheckedDate ? formatDate(pc.lastCheckedDate) : 'Never'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase tracking-widest">Next</span>
                        <p>{pc.nextCheckDate ? formatDate(pc.nextCheckDate) : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{pc.supplierName}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePriceCheck(pc.id)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        {supplierActivity.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('suppliers.activity_timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {supplierActivity.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1">
                      {a.action === 'created' ? <Plus className="h-3 w-3 text-green-500" /> :
                       a.action === 'payment' ? <DollarSign className="h-3 w-3 text-blue-500" /> :
                       a.action === 'updated' ? <Edit className="h-3 w-3 text-amber-500" /> :
                       <Clock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{a.description || a.action}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <Modal isOpen={showPaymentModal} title={editingPayment ? t('suppliers.edit_payment') : t('suppliers.record_payment')} onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }}>
            <div className="p-4 space-y-3 min-w-[420px]">
              <h2 className="text-lg font-bold">{editingPayment ? t('suppliers.edit_payment') : t('suppliers.record_payment')}</h2>
              <div>
                <label className="text-sm font-medium">{t('suppliers.col_date')} *</label>
                <DatePicker value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.col_amount')} *</label>
                <Input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.col_purchase_no')}</label>
                <select className="w-full border rounded px-2 py-1.5 bg-background text-sm"
                  value={paymentForm.purchaseId}
                  onChange={e => setPaymentForm({ ...paymentForm, purchaseId: e.target.value })}>
                  <option value="">-- {t('suppliers.no_purchase')} --</option>
                  {selectedSupplierPurchases
                    .filter(p => (p.totalAmount - (p.paidAmount || 0)) > 0 || String(p.id) === paymentForm.purchaseId)
                    .map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.purchaseNumber || `#${p.id}`} — {cur} {((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()} {t('suppliers.stat_remaining')}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.col_method')} *</label>
                <select className="w-full border rounded px-2 py-1.5 bg-background text-sm" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.col_reference')}</label>
                <Input value={paymentForm.referenceNumber} onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('suppliers.field_notes')}</label>
                <textarea className="w-full border rounded px-2 py-1.5 bg-background min-h-[60px] text-sm" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }}>{t('common.cancel')}</Button>
                <Button onClick={handleSavePayment}>{t('common.save')}</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Price Check Schedule Modal */}
        {showPriceCheckModal && (
          <Modal isOpen={showPriceCheckModal} title="Schedule Price Check" onClose={() => setShowPriceCheckModal(false)}>
            <div className="space-y-4 min-w-[420px]">
              <div>
                <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Supplier</label>
                {selected ? (
                  <div className="border rounded px-3 py-2 bg-background text-sm mt-1">{selected.supplierName}</div>
                ) : (
                  <select className="w-full border rounded px-2 py-1.5 bg-background text-sm mt-1"
                    value={priceCheckForm.supplierId}
                    onChange={e => setPriceCheckForm({ ...priceCheckForm, supplierId: Number(e.target.value) })}>
                    <option value={0}>Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplierName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Item (optional)</label>
                <select className="w-full border rounded px-2 py-1.5 bg-background text-sm mt-1"
                  value={priceCheckForm.itemId}
                  onChange={e => setPriceCheckForm({ ...priceCheckForm, itemId: e.target.value })}>
                  <option value="">All items</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Frequency</label>
                <select className="w-full border rounded px-2 py-1.5 bg-background text-sm mt-1"
                  value={priceCheckForm.frequency}
                  onChange={e => setPriceCheckForm({ ...priceCheckForm, frequency: e.target.value })}>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Notes</label>
                <textarea className="w-full border rounded px-2 py-1.5 bg-background min-h-[60px] text-sm mt-1"
                  value={priceCheckForm.notes}
                  onChange={e => setPriceCheckForm({ ...priceCheckForm, notes: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pc-active" checked={priceCheckForm.active}
                  onChange={e => setPriceCheckForm({ ...priceCheckForm, active: e.target.checked })} />
                <label htmlFor="pc-active" className="text-sm">Active</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPriceCheckModal(false)}>Cancel</Button>
                <Button onClick={handleSavePriceCheck}>Save</Button>
              </div>
            </div>
          </Modal>
        )}

        <AlertDialog open={reversePaymentTarget !== null} onOpenChange={(open) => { if (!open) { setReversePaymentTarget(null); setReversePaymentReason(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reverse this payment of {cur} {reversePaymentTarget?.amount.toLocaleString()}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for reversal *</Label>
                <Textarea
                  required
                  value={reversePaymentReason}
                  onChange={(e) => setReversePaymentReason(e.target.value)}
                  className="bg-background resize-none"
                  placeholder="Reason for reversal..."
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!reversePaymentReason}
                onClick={handleReverseSupplierPayment}
              >
                <Ban size={14} className="mr-1" /> Reverse
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null;
};

export default Suppliers;
