import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Download, TrendingUp,
  Package, DollarSign, Receipt, PiggyBank, BarChart3,
  Loader2, AlertCircle, RefreshCw, Trash2,
  Calendar, Boxes, CreditCard, AlertTriangle, Banknote, Truck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useSettings } from '../context/SettingsContext';
import { useDataChangedRefresh } from '../hooks/useDataChangedRefresh';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DatePicker } from '../components/DatePicker';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { exportCSV, exportPDF, addPdfHeader } from '../lib/export-utils';

interface SalesData {
  date: string;
  revenue: number;
  units: number;
  profit: number;
}

interface AnalyticsData {
  salesData: SalesData[];
  topItems: { name: string; totalQty: number; totalRevenue: number }[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    netProfit: number;
  };
}

interface Item {
  id: number;
  name: string;
  categoryName: string;
  companyName: string;
  totalBaseQuantity: number;
  totalPackQuantity: number;
  basePurchasePrice: number;
  baseSellingPrice: number;
  baseUnit: string;
  purchaseUnit: string;
  supplierName: string;
  supplierId: number;
  unitsPerPack: number;
}

const Reports: React.FC = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const [lowStockItems, setLowStockItems] = useState<(Item & { orderQty: number })[]>([]);
  const [lowStockFetched, setLowStockFetched] = useState(false);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  const [supplierSummary, setSupplierSummary] = useState<any[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<any[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<any[]>([]);

  const currentRange = useMemo(() => {
    if (period === 'custom') return dateRange;
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = end;
    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
    } else if (period === 'year') {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split('T')[0];
    }
    return { start, end };
  }, [period, dateRange]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = currentRange;
      switch (activeTab) {
        case 'sales': {
          const anData = await window.api.getAnalytics(period, range);
          setAnalytics(anData);
          break;
        }
        case 'valuation': {
          const itemsData = await window.api.getItems({});
          setItems(Array.isArray(itemsData) ? itemsData : []);
          break;
        }
        case 'pnl': {
          const anData = await window.api.getAnalytics(period, range);
          setAnalytics(anData);
          break;
        }
        case 'catalog': {
          const itemsData = await window.api.getItems({});
          setItems(Array.isArray(itemsData) ? itemsData : []);
          break;
        }
        case 'supplier_summary': {
          const data = await window.api.getSupplierReportSummary();
          setSupplierSummary(Array.isArray(data) ? data : []);
          break;
        }
        case 'supplier_transactions': {
          const data = await window.api.getSupplierTransactionReport({});
          setSupplierTransactions(Array.isArray(data.rows) ? data.rows : []);
          setSupplierPayments(Array.isArray(data.payments) ? data.payments : []);
          break;
        }
      }
      setReportGenerated(true);
    } catch (e: any) {
      setError(e.message || t('reports.gen_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (dateRange.start && dateRange.end)) {
      setReportGenerated(false);
    }
  }, [activeTab, period, dateRange]);

  // Live sync: re-query when P2P/Yjs sync lands new data in SQLite.
  useDataChangedRefresh(() => { fetchLowStock(); });

  const fetchLowStock = async () => {
    setLowStockLoading(true);
    setError(null);
    try {
      const data = await window.api.getReorderSuggestions();
      const list = Array.isArray(data) ? data : [];
      setLowStockItems(list.map((i: any) => ({
        ...i,
        orderQty: Math.max(1, Number(i.suggestedQty) || (i.unitsPerPack || 1) * 3)
      })));
      setLowStockFetched(true);
    } catch (e: any) {
      setError(e.message || t('reports.low_stock_failed'));
    } finally {
      setLowStockLoading(false);
    }
  };

  const updateLowStockQty = (id: number, qty: number) => {
    setLowStockItems(prev => prev.map(i =>
      i.id === id ? { ...i, orderQty: Math.max(1, qty) } : i
    ));
  };

  const removeLowStockItem = (id: number) => {
    setLowStockItems(prev => prev.filter(i => i.id !== id));
  };

  const generateOrderPDF = () => {
    const doc = new jsPDF();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(new Date());
    let y = y0 + 4;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('reports.reorder_request') || 'REORDER REQUEST', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('common.date')}: ${date}`, 190, y, { align: 'right' });

    const tableData = lowStockItems.map((item, index) => [
      index + 1,
      item.name,
      item.supplierName || '—',
      `${item.totalBaseQuantity} ${item.baseUnit}`,
      String(item.orderQty),
      `${(item.basePurchasePrice || 0).toLocaleString()}`,
      `${(item.orderQty * (item.basePurchasePrice || 0)).toLocaleString()}`
    ]);

    const totalCost = lowStockItems.reduce((sum, item) => sum + (item.orderQty * (item.basePurchasePrice || 0)), 0);

    autoTable(doc, {
      startY: y + 4,
      head: [['#', t('reports.item_name'), t('suppliers.supplier'), t('reports.qty'), t('inventory.order_qty'), t('inventory.unit_cost'), t('inventory.subtotal')]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0] },
      foot: [['', '', '', '', '', t('reports.total'), `${totalCost.toLocaleString()}`]],
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`ReOrder_${date.replace(/\//g, '-')}.pdf`);
  };

  const exportSalesCSV = () => {
    if (!analytics) return;
    const headers = [t('reports.header_date'), t('reports.header_revenue'), t('reports.header_units_sold'), t('reports.header_profit')];
    const rows = analytics.salesData.map(s => [s.date, s.revenue, s.units, s.profit]);
    exportCSV(headers, rows, 'sales-performance');
  };

  const exportSalesPDF = () => {
    if (!analytics) return;
    const headers = [t('reports.header_date'), t('reports.header_revenue'), t('reports.header_units_sold'), t('reports.header_profit')];
    const rows = analytics.salesData.map(s => [s.date, String(s.revenue), String(s.units), String(s.profit)]);
    const totalUnits = analytics.salesData.reduce((a, s) => a + s.units, 0);
    exportPDF(t('reports.report_sales_performance'), headers, rows, 'sales-performance', ['', t('common.total'), String(totalUnits), String(analytics.summary.totalProfit)], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportValuationCSV = () => {
    const headers = [t('reports.header_product'), t('reports.header_category'), t('reports.header_base_qty'), t('reports.header_unit'), t('reports.header_unit_cost'), t('reports.header_total_value')];
    const rows = items.map(i => [i.name, i.categoryName || '', i.totalBaseQuantity, i.baseUnit, i.basePurchasePrice, (i.totalBaseQuantity * i.basePurchasePrice).toLocaleString()]);
    exportCSV(headers, rows, 'stock-valuation');
  };

  const exportValuationPDF = () => {
    const headers = [t('reports.header_product'), t('reports.header_category'), t('reports.header_base_qty'), t('reports.header_unit'), t('reports.header_unit_cost'), t('reports.header_total_value')];
    const rows = items.map(i => [i.name, i.categoryName || '', String(i.totalBaseQuantity), i.baseUnit, String(i.basePurchasePrice), String(i.totalBaseQuantity * i.basePurchasePrice)]);
    const total = items.reduce((s, i) => s + (i.totalBaseQuantity * i.basePurchasePrice), 0);
    exportPDF(t('reports.report_stock_valuation'), headers, rows, 'stock-valuation', ['', '', '', '', t('reports.header_total_value'), String(total)], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportPNLCSV = () => {
    if (!analytics) return;
    const headers = [t('reports.col_metric'), t('reports.col_value')];
    const rows = [
      [t('reports.col_total_revenue'), analytics.summary.totalRevenue],
      [t('reports.col_gross_profit'), analytics.summary.totalProfit],
      [t('reports.col_net_profit'), analytics.summary.netProfit],
    ];
    exportCSV(headers, rows, 'profit-loss');
  };

  const exportPNLPDF = () => {
    if (!analytics) return;
    const headers = [t('reports.col_metric'), t('reports.col_value')];
    const rows = [
      [t('reports.col_total_revenue'), String(analytics.summary.totalRevenue)],
      [t('reports.col_gross_profit'), String(analytics.summary.totalProfit)],
      [t('reports.col_net_profit'), String(analytics.summary.netProfit)],
    ];
    exportPDF(t('reports.report_pnl'), headers, rows, 'profit-loss', undefined, undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportCatalogCSV = () => {
    const headers = [t('reports.header_product'), t('reports.header_category'), t('reports.header_brand'), t('reports.header_base_qty'), t('reports.header_unit'), t('reports.header_selling_price'), t('reports.header_purchase_price')];
    const rows = items.map(i => [i.name, i.categoryName || '', i.companyName || '', i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, i.basePurchasePrice]);
    exportCSV(headers, rows, 'product-catalog');
  };

  const exportCatalogPDF = () => {
    const headers = [t('reports.header_product'), t('reports.header_category'), t('reports.header_brand'), t('reports.header_base_qty'), t('reports.header_unit'), t('reports.header_selling_price'), t('reports.header_purchase_price')];
    const rows = items.map(i => [i.name, i.categoryName || '', i.companyName || '', String(i.totalBaseQuantity), i.baseUnit, String(i.baseSellingPrice), String(i.basePurchasePrice)]);
    exportPDF(t('reports.report_catalog'), headers, rows, 'product-catalog', undefined, undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportSupplierSummaryCSV = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_total_purchases'), t('reports.header_total_payments'), t('reports.header_outstanding_balance')];
    const rows = supplierSummary.map((r: any) => [r.supplierName, r.totalPurchases, r.totalPayments, r.outstandingBalance]);
    exportCSV(headers, rows, 'supplier-summary');
  };

  const exportSupplierSummaryPDF = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_total_purchases'), t('reports.header_total_payments'), t('reports.header_outstanding_balance')];
    const rows = supplierSummary.map((r: any) => [r.supplierName, String(r.totalPurchases), String(r.totalPayments), String(r.outstandingBalance)]);
    const totalPurchases = supplierSummary.reduce((s: number, r: any) => s + (r.totalPurchases || 0), 0);
    const totalPayments = supplierSummary.reduce((s: number, r: any) => s + (r.totalPayments || 0), 0);
    const totalOutstanding = supplierSummary.reduce((s: number, r: any) => s + (r.outstandingBalance || 0), 0);
    exportPDF(t('reports.report_supplier_summary'), headers, rows, 'supplier-summary', [t('common.total'), String(totalPurchases), String(totalPayments), String(totalOutstanding)], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportSupplierTransactionsCSV = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_order_num'), t('reports.header_date'), t('reports.header_total_amount'), t('reports.header_paid_amount'), t('reports.header_balance'), t('reports.header_status')];
    const rows = supplierTransactions.map((r: any) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, r.totalAmount, r.paidAmount, r.remainingBalance, r.status]);
    exportCSV(headers, rows, 'supplier-transactions');
  };

  const exportSupplierTransactionsPDF = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_order_num'), t('reports.header_date'), t('reports.header_total_amount'), t('reports.header_paid_amount'), t('reports.header_balance'), t('reports.header_status')];
    const rows = supplierTransactions.map((r: any) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, String(r.totalAmount), String(r.paidAmount), String(r.remainingBalance), r.status]);
    exportPDF(t('reports.report_supplier_transactions'), headers, rows, 'supplier-transactions', [], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const formattedRange = useMemo(() => {
    if (!currentRange.start) return '';
    if (currentRange.start === currentRange.end) return formatDate(currentRange.start);
    return `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`;
  }, [currentRange, formatDate]);

  const handleCustomSearch = () => {
    if (dateRange.start && dateRange.end) {
      generateReport();
    }
  };

  const totalValue = useMemo(() =>
    items.reduce((s, i) => s + (i.totalBaseQuantity * i.basePurchasePrice), 0),
    [items]
  );

  const renderKPIs = () => {
    switch (activeTab) {
      case 'sales':
        if (!analytics) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(analytics.summary.totalRevenue || 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><TrendingUp size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.profit')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(analytics.summary.totalProfit || 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><PiggyBank size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.net')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.net_cashflow')}</p>
                <h3 className={`text-2xl font-black tracking-tight ${(analytics.summary.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {t('common.etb')} {(analytics.summary.netProfit || 0).toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'valuation':
        if (items.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Boxes size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total_skus')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_skus')}</p>
                <h3 className="text-2xl font-black tracking-tight">{items.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Banknote size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.inventory_value')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.inventory_value')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {totalValue.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.avg_value')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.avg_value')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(items.length > 0 ? (totalValue / items.length) : 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'pnl':
        if (!analytics) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(analytics.summary.totalRevenue || 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><TrendingUp size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.gross_profit')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.gross_profit')}</p>
                <h3 className={`text-2xl font-black tracking-tight ${(analytics.summary.totalProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {t('common.etb')} {(analytics.summary.totalProfit || 0).toLocaleString()}
                </h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><PiggyBank size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.margin')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.net_margin')}</p>
                <h3 className={`text-2xl font-black tracking-tight ${(analytics.summary.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.summary.totalRevenue > 0 ? `${((analytics.summary.netProfit / analytics.summary.totalRevenue) * 100).toFixed(1)}%` : '0%'}
                </h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'supplier_summary':
        if (supplierSummary.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Truck size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.title')}</p>
                <h3 className="text-2xl font-black tracking-tight">{supplierSummary.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.stat_total')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {supplierSummary.reduce((s: number, r: any) => s + (r.totalPurchases || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><CreditCard size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.stat_paid')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {supplierSummary.reduce((s: number, r: any) => s + (r.totalPayments || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><AlertTriangle size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.outstanding_badge')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.stat_outstanding')}</p>
                <h3 className="text-2xl font-black tracking-tight text-red-600">{t('common.etb')} {supplierSummary.reduce((s: number, r: any) => s + (r.outstandingBalance || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'supplier_transactions':
        if (supplierTransactions.length === 0 && supplierPayments.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Receipt size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{supplierTransactions.length}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.section_purchases')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {supplierTransactions.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{supplierPayments.length}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.section_payments')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {supplierPayments.reduce((s: number, r: any) => s + (r.amount || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'catalog':
        if (items.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Boxes size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total_skus')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_skus')}</p>
                <h3 className="text-2xl font-black tracking-tight">{items.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Package size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.categories')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.categories')}</p>
                <h3 className="text-2xl font-black tracking-tight">{new Set(items.map(i => i.categoryName).filter(Boolean)).size}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Banknote size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.inventory_value')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.inventory_value')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {totalValue.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><AlertTriangle size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.low_stock')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.low_stock')}</p>
                <h3 className="text-2xl font-black tracking-tight text-amber-500">{items.filter(i => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length}</h3>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDataTable = () => {
    switch (activeTab) {
      case 'sales':
        if (!analytics || analytics.salesData.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.sales_data')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.date')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.revenue')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.units')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.profit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.salesData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{formatDate(row.date)}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {row.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.units}</TableCell>
                      <TableCell className={`text-right font-bold ${row.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {t('common.etb')} {row.profit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'valuation':
        if (items.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.valuation_table')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.as_of_date')} {formatDate(new Date())}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('common.category')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.qty')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.unit_cost')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.total_value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName || '-'}</TableCell>
                      <TableCell className="text-right">{item.totalBaseQuantity} {item.baseUnit}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {item.basePurchasePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">{t('common.etb')} {(item.totalBaseQuantity * item.basePurchasePrice).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'pnl':
        if (!analytics) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.pnl_statement')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.metric')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{t('summary.total_sales')}</TableCell>
                    <TableCell className="text-right font-bold">{t('common.etb')} {(analytics.summary.totalRevenue || 0).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-green-500">{t('reports.gross_profit')}</TableCell>
                    <TableCell className="text-right font-bold text-green-500">{t('common.etb')} {(analytics.summary.totalProfit || 0).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-black text-base">{t('summary.net_cashflow')}</TableCell>
                    <TableCell className={`text-right font-black text-base ${(analytics.summary.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {t('common.etb')} {(analytics.summary.netProfit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {analytics.summary.totalRevenue > 0 && (
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">{t('reports.margin')}</TableCell>
                      <TableCell className="text-right font-bold text-muted-foreground">
                        {((analytics.summary.netProfit / analytics.summary.totalRevenue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'catalog':
        if (items.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.catalog_data')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.as_of_date')} {formatDate(new Date())}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('common.category')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.brand')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.stock')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.selling_price')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.purchase_price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.companyName || '-'}</TableCell>
                      <TableCell className="text-right">{item.totalBaseQuantity} {item.baseUnit}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {item.baseSellingPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {item.basePurchasePrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'supplier_summary':
        if (supplierSummary.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.supplier_summary_card')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.as_of_date')} {formatDate(new Date())}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_supplier')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.stat_total')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.stat_paid')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.stat_outstanding')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierSummary.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.supplierName}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {(row.totalPurchases || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">{t('common.etb')} {(row.totalPayments || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold" style={{ color: (row.outstandingBalance || 0) > 0 ? 'var(--destructive)' : 'var(--green-600)' }}>
                        {t('common.etb')} {(row.outstandingBalance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'supplier_transactions':
        if (supplierTransactions.length === 0 && supplierPayments.length === 0) return null;
        return (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.purchase_transactions_card')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_supplier')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_purchase_no')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_date')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.col_total')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.col_paid')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.col_balance')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierTransactions.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.supplierName}</TableCell>
                        <TableCell className="font-mono text-xs">{row.purchaseNumber || `#${row.id}`}</TableCell>
                        <TableCell>{formatDate(row.purchaseDate)}</TableCell>
                        <TableCell className="text-right">{t('common.etb')} {(row.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">{t('common.etb')} {(row.paidAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: (row.remainingBalance || 0) > 0 ? 'var(--destructive)' : 'var(--green-600)' }}>
                          {t('common.etb')} {(row.remainingBalance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell><Badge variant={row.status === 'received' ? 'default' : 'secondary'} className="text-xs">{row.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.payment_transactions_card')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_supplier')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_date')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('suppliers.col_amount')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_method')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_reference')}</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_purchase_no')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPayments.map((row: any, i: number) => (
                      <TableRow key={row.id || i}>
                        <TableCell className="font-medium">{row.supplierName}</TableCell>
                        <TableCell>{formatDate(row.paymentDate)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{t('common.etb')} {(row.amount || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{row.paymentMethod}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{row.referenceNumber || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{row.purchaseNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderExportButtons = () => {
    let showCSV = false;
    let showPDF = false;
    let csvHandler = () => {};
    let pdfHandler = () => {};

    switch (activeTab) {
      case 'sales':
        showCSV = showPDF = !!analytics;
        csvHandler = exportSalesCSV;
        pdfHandler = exportSalesPDF;
        break;
      case 'valuation':
        showCSV = showPDF = items.length > 0;
        csvHandler = exportValuationCSV;
        pdfHandler = exportValuationPDF;
        break;
      case 'pnl':
        showCSV = showPDF = !!analytics;
        csvHandler = exportPNLCSV;
        pdfHandler = exportPNLPDF;
        break;
      case 'catalog':
        showCSV = showPDF = items.length > 0;
        csvHandler = exportCatalogCSV;
        pdfHandler = exportCatalogPDF;
        break;
      case 'supplier_summary':
        showCSV = showPDF = supplierSummary.length > 0;
        csvHandler = exportSupplierSummaryCSV;
        pdfHandler = exportSupplierSummaryPDF;
        break;
      case 'supplier_transactions':
        showCSV = showPDF = supplierTransactions.length > 0;
        csvHandler = exportSupplierTransactionsCSV;
        pdfHandler = exportSupplierTransactionsPDF;
        break;
    }

    if (!showCSV && !showPDF) return null;

    return (
      <div className="flex gap-2 justify-end">
        {showCSV && (
          <Button variant="outline" size="sm" onClick={csvHandler} className="text-xs font-bold uppercase tracking-widest">
            <FileText size={14} className="mr-1" /> {t('reports.csv')}
          </Button>
        )}
        {showPDF && (
          <Button variant="outline" size="sm" onClick={pdfHandler} className="text-xs font-bold uppercase tracking-widest">
            <Download size={14} className="mr-1" /> {t('reports.pdf')}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 fade-in">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">{t('reports.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('reports.subtitle')}</p>
      </div>

      {/* Report Controls */}
      <div className="px-4 lg:px-6 space-y-4">
        {/* Report Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setReportGenerated(false); }}>
          <TabsList className="bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger value="sales" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              {t('reports.sales')}
            </TabsTrigger>
            <TabsTrigger value="valuation" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              {t('reports.valuation')}
            </TabsTrigger>
            <TabsTrigger value="pnl" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              {t('reports.pnl')}
            </TabsTrigger>
            <TabsTrigger value="catalog" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              {t('reports.catalog')}
            </TabsTrigger>
            <TabsTrigger value="supplier_summary" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <Truck className="h-3 w-3 mr-1" />{t('reports.tab_suppliers')}
            </TabsTrigger>
            <TabsTrigger value="supplier_transactions" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <Receipt className="h-3 w-3 mr-1" />{t('reports.tab_transactions')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period & Generate Controls */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-3 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                {(['today', 'week', 'month', 'year', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      period === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(`analytics.${p}`)}
                  </button>
                ))}
              </div>

              {period === 'custom' && (
                <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('analytics.start_date')}</Label>
                    <DatePicker
                      value={dateRange.start}
                      onChange={(v) => setDateRange(prev => ({ ...prev, start: v }))}
                      className="w-auto bg-background border-none text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('analytics.end_date')}</Label>
                    <DatePicker
                      value={dateRange.end}
                      onChange={(v) => setDateRange(prev => ({ ...prev, end: v }))}
                      className="w-auto bg-background border-none text-xs font-bold"
                    />
                  </div>
                  <button
                    onClick={handleCustomSearch}
                    className="self-end p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Calendar size={14} />
                  </button>
                </div>
              )}
            </div>

            <Button onClick={generateReport} disabled={loading} className="h-9 px-6 text-xs font-bold uppercase tracking-widest shadow-xs">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <BarChart3 size={14} className="mr-1" />}
              {t('reports.generate')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 lg:px-6">
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setError(null)} className="ml-auto shrink-0">
                <RefreshCw className="h-4 w-4 mr-1" /> {t('common.dismiss')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportGenerated ? (
        <div className="px-4 lg:px-6 space-y-6">
          {renderKPIs()}
          {renderDataTable()}
          {renderExportButtons()}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t('reports.select_params')}</p>
          <p className="text-xs font-bold uppercase tracking-widest mt-1">{t('reports.click_generate')}</p>
        </div>
      )}

      {/* Low Stock Order Builder Section */}
      <div className="px-4 lg:px-6">
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">{t('reports.low_stock_builder')}</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{t('reports.order_builder_desc')}</p>
            </div>
            <Button onClick={fetchLowStock} disabled={lowStockLoading} variant="outline" size="sm" className="text-xs font-bold uppercase tracking-widest">
              {lowStockLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertTriangle size={14} className="mr-1" />}
              {t('reports.fetch_low')}
            </Button>
          </div>

          {lowStockFetched && lowStockItems.length === 0 && (
            <Card className="rounded-3xl border-border">
              <CardContent className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">{t('reports.no_low_stock')}</p>
              </CardContent>
            </Card>
          )}

          {lowStockItems.length > 0 && (
            <>
              <Card className="rounded-3xl border-border overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.po_col_brand')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_supplier')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.order_qty')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.amount')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <p className="font-bold text-sm">{item.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{item.companyName || '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{item.supplierName || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                className="w-20 h-8 font-bold text-center text-xs"
                                value={item.orderQty}
                                onChange={(e) => updateLowStockQty(item.id, parseInt(e.target.value) || 1)}
                                min={1}
                              />
                              <span className="text-xs font-bold uppercase text-muted-foreground">{item.baseUnit}s</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {t('common.etb')} {(item.orderQty * (item.basePurchasePrice || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => removeLowStockItem(item.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.total_items')}: {lowStockItems.length}</p>
                  <p className="text-sm font-black">
                    {t('inventory.est_total_cost')}: {t('common.etb')} {lowStockItems.reduce((sum, item) => sum + (item.orderQty * (item.basePurchasePrice || 0)), 0).toLocaleString()}
                  </p>
                </div>
                <Button onClick={generateOrderPDF} className="text-xs font-bold uppercase tracking-widest shadow-xs">
                  <FileText size={14} className="mr-1" /> {t('reports.gen_order_pdf')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
