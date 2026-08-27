import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Download, TrendingUp,
  Package, DollarSign, Receipt, PiggyBank, BarChart3,
  Loader2, AlertCircle, RefreshCw, Trash2,
  Calendar, Boxes, CreditCard, AlertTriangle, Banknote, Truck, Ban, RotateCcw, BookOpen, Scale
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useSettings } from '../context/SettingsContext';
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
  expenseData: { date: string; amount: number }[];
  topItems: { name: string; totalQty: number; totalRevenue: number }[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalExpenses: number;
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

interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const [lowStockItems, setLowStockItems] = useState<(Item & { orderQty: number })[]>([]);
  const [lowStockFetched, setLowStockFetched] = useState(false);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  const [supplierSummary, setSupplierSummary] = useState<any[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<any[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<any[]>([]);
  const [inventoryBySupplier, setInventoryBySupplier] = useState<any[]>([]);
  const [voidedSales, setVoidedSales] = useState<any[]>([]);
  const [reversalData, setReversalData] = useState<any[]>([]);
  const [vatReport, setVatReport] = useState<any>(null);
  const [drilldowns, setDrilldowns] = useState<any>(null);
  const [glJournal, setGlJournal] = useState<any>(null);

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
        case 'expenses': {
          const [expData, anData] = await Promise.all([
            window.api.getExpenses({ startDate: range.start, endDate: range.end }),
            window.api.getAnalytics(period, range)
          ]);
          setExpenses(Array.isArray(expData) ? expData : []);
          setAnalytics(anData);
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
        case 'inventory_by_supplier': {
          const data = await window.api.getInventoryBySupplierReport();
          setInventoryBySupplier(Array.isArray(data) ? data : []);
          break;
        }
        case 'voided_sales': {
          const vs = await window.api.getVoidedSales({ startDate: range.start, endDate: range.end });
          setVoidedSales(Array.isArray(vs) ? vs : []);
          break;
        }
        case 'reversals': {
          const dp = await window.api.getAuditLogs({ action: 'reverse_payment' });
          const sa = await window.api.getAuditLogs({ action: 'reverse_adjustment' });
          setReversalData([...(Array.isArray(dp) ? dp : []), ...(Array.isArray(sa) ? sa : [])]);
          break;
        }
        case 'vat': {
          const data = await window.api.getVatReport(range);
          setVatReport(data);
          break;
        }
        case 'drilldowns': {
          const data = await window.api.getReportDrilldowns(range);
          setDrilldowns(data);
          break;
        }
        case 'gl': {
          const data = await window.api.getGlJournal(range);
          setGlJournal(data);
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

  const exportExpenseCSV = () => {
    const headers = [t('reports.header_date'), t('reports.header_name'), t('reports.header_category'), t('reports.header_amount')];
    const rows = expenses.map(e => [e.date, e.name, e.category, e.amount]);
    exportCSV(headers, rows, 'expense-report');
  };

  const exportExpensePDF = () => {
    const headers = [t('reports.header_date'), t('reports.header_name'), t('reports.header_category'), t('reports.header_amount')];
    const rows = expenses.map(e => [e.date, e.name, e.category, String(e.amount)]);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    exportPDF(t('reports.report_expense'), headers, rows, 'expense-report', ['', '', t('common.total'), String(total)], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportPNLCSV = () => {
    if (!analytics) return;
    const headers = [t('reports.col_metric'), t('reports.col_value')];
    const rows = [
      [t('reports.col_total_revenue'), analytics.summary.totalRevenue],
      [t('reports.col_total_expenses'), analytics.summary.totalExpenses],
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
      [t('reports.col_total_expenses'), String(analytics.summary.totalExpenses)],
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

  const exportInventoryBySupplierCSV = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_product_count'), t('reports.header_stock_quantity'), t('reports.header_inventory_value'), t('reports.header_last_supply')];
    const rows = inventoryBySupplier.map((r: any) => [r.supplierName, r.productCount, r.totalStockQuantity, r.inventoryValue, r.lastSupplyDate || '']);
    exportCSV(headers, rows, 'inventory-by-supplier');
  };

  const exportInventoryBySupplierPDF = () => {
    const headers = [t('reports.header_supplier'), t('reports.header_product_count'), t('reports.header_stock_quantity'), t('reports.header_inventory_value'), t('reports.header_last_supply')];
    const rows = inventoryBySupplier.map((r: any) => [r.supplierName, String(r.productCount), String(r.totalStockQuantity), String(r.inventoryValue), r.lastSupplyDate || '']);
    exportPDF(t('reports.report_inventory_supplier'), headers, rows, 'inventory-by-supplier', [], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportVoidedSalesCSV = () => {
    const headers = [t('reports.header_sale_num'), t('reports.header_product'), t('reports.header_amount'), t('reports.header_reason'), t('reports.header_voided_by'), t('reports.header_date')];
    const rows = voidedSales.map((r: any) => [r.id, r.name || `Item #${r.itemId}`, r.totalPrice, r.voidReason || '', r.voidedBy || '', r.voidedAt || '']);
    exportCSV(headers, rows, 'voided-sales');
  };

  const exportVoidedSalesPDF = () => {
    const headers = [t('reports.header_sale_num'), t('reports.header_product'), t('reports.header_amount'), t('reports.header_reason'), t('reports.header_voided_by'), t('reports.header_date')];
    const rows = voidedSales.map((r: any) => [String(r.id), r.name || `Item #${r.itemId}`, String(r.totalPrice), r.voidReason || '', r.voidedBy || '', r.voidedAt || '']);
    exportPDF(t('reports.report_voided_sales'), headers, rows, 'voided-sales', [], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportReversalsCSV = () => {
    const headers = [t('reports.header_action'), t('reports.header_entity'), t('reports.header_entity_id'), t('reports.header_description'), t('reports.header_changed_by'), t('reports.header_date')];
    const rows = reversalData.map((r: any) => [r.action, r.entityType || '', String(r.entityId || ''), r.description || '', r.changedBy || '', r.createdAt || '']);
    exportCSV(headers, rows, 'reversals');
  };

  const exportReversalsPDF = () => {
    const headers = [t('reports.header_action'), t('reports.header_entity'), t('reports.header_entity_id'), t('reports.header_description'), t('reports.header_changed_by'), t('reports.header_date')];
    const rows = reversalData.map((r: any) => [r.action, r.entityType || '', String(r.entityId || ''), r.description || '', r.changedBy || '', r.createdAt || '']);
    exportPDF(t('reports.report_reversals'), headers, rows, 'reversals', [], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportVatCSV = () => {
    const headers = [t('reports.vat_rate'), t('reports.vat_invoices'), t('reports.vat_taxable_sales'), t('reports.vat_output')];
    const rows = (vatReport?.buckets || []).map((r: any) => [r.rate, r.count, r.taxable, r.vat]);
    exportCSV(headers, rows, 'vat-report');
  };

  const exportVatPDF = () => {
    const headers = [t('reports.vat_rate'), t('reports.vat_invoices'), t('reports.vat_taxable_sales'), t('reports.vat_output')];
    const rows = (vatReport?.buckets || []).map((r: any) => [String(r.rate), String(r.count), String(r.taxable), String(r.vat)]);
    exportPDF(t('reports.report_vat'), headers, rows, 'vat-report', [], undefined, currentBusiness);
    toast.success(t('reports.report_exported'));
  };

  const exportDrilldownsCSV = () => {
    const all: string[][] = [];
    const pushTable = (title: string, headers: string[], rows: any[][]) => {
      all.push([title]);
      all.push(headers);
      rows.forEach((r) => all.push(r));
      all.push([]);
    };
    if (drilldowns?.byCashier?.length) pushTable(
      t('reports.sales_by_cashier'),
      [t('reports.cashier'), t('reports.invoices'), t('common.revenue'), t('reports.vat_output'), t('common.profit')],
      drilldowns.byCashier.map((r: any) => [r.cashier, r.saleCount, r.revenue, r.vat, r.profit])
    );
    if (drilldowns?.byHour?.length) pushTable(
      t('reports.sales_by_hour'),
      [t('reports.hour'), t('reports.invoices'), t('common.revenue')],
      drilldowns.byHour.map((r: any) => [`${String(r.hour).padStart(2, '0')}:00`, r.saleCount, r.revenue])
    );
    if (drilldowns?.marginByItem?.length) pushTable(
      t('reports.margin_by_item'),
      [t('inventory.product'), t('reports.category'), t('reports.units'), t('common.revenue'), t('reports.cogs'), t('common.profit')],
      drilldowns.marginByItem.map((r: any) => [r.name, r.categoryName, r.units, r.revenue, r.cogs, r.profit])
    );
    if (drilldowns?.debtAging?.length) pushTable(
      t('reports.debt_aging'),
      [t('reports.customer'), t('common.phone'), t('reports.outstanding'), t('reports.days_overdue')],
      drilldowns.debtAging.map((r: any) => [r.customerName || '', r.customerPhone || '', r.outstanding, r.daysOverdue])
    );
    if (drilldowns?.movers?.length) pushTable(
      t('reports.movers'),
      [t('inventory.product'), t('reports.units_sold'), t('common.revenue'), t('reports.sales'), t('reports.days_since_sale')],
      drilldowns.movers.map((r: any) => [r.name, r.unitsSold, r.revenue, r.saleCount, r.daysSinceLastSale ?? ''])
    );
    if (drilldowns?.valuationByWarehouse?.length) pushTable(
      t('reports.valuation_by_warehouse'),
      [t('reports.warehouse'), t('reports.units'), t('reports.products'), t('reports.value')],
      drilldowns.valuationByWarehouse.map((r: any) => [r.warehouse, r.units, r.productCount, r.value])
    );
    exportCSV(all, 'drilldowns-report');
  };

  const exportDrilldownsPDF = () => {
    const sections: { title: string; headers: string[]; rows: any[][] }[] = [];
    if (drilldowns?.byCashier?.length) sections.push({
      title: t('reports.sales_by_cashier'),
      headers: [t('reports.cashier'), t('reports.invoices'), t('common.revenue'), t('reports.vat_output'), t('common.profit')],
      rows: drilldowns.byCashier.map((r: any) => [r.cashier, r.saleCount, r.revenue, r.vat, r.profit])
    });
    if (drilldowns?.byHour?.length) sections.push({
      title: t('reports.sales_by_hour'),
      headers: [t('reports.hour'), t('reports.invoices'), t('common.revenue')],
      rows: drilldowns.byHour.map((r: any) => [`${String(r.hour).padStart(2, '0')}:00`, r.saleCount, r.revenue])
    });
    if (drilldowns?.marginByItem?.length) sections.push({
      title: t('reports.margin_by_item'),
      headers: [t('inventory.product'), t('reports.category'), t('reports.units'), t('common.revenue'), t('reports.cogs'), t('common.profit')],
      rows: drilldowns.marginByItem.map((r: any) => [r.name, r.categoryName, r.units, r.revenue, r.cogs, r.profit])
    });
    if (drilldowns?.debtAging?.length) sections.push({
      title: t('reports.debt_aging'),
      headers: [t('reports.customer'), t('common.phone'), t('reports.outstanding'), t('reports.days_overdue')],
      rows: drilldowns.debtAging.map((r: any) => [r.customerName || '', r.customerPhone || '', r.outstanding, r.daysOverdue])
    });
    if (drilldowns?.movers?.length) sections.push({
      title: t('reports.movers'),
      headers: [t('inventory.product'), t('reports.units_sold'), t('common.revenue'), t('reports.sales'), t('reports.days_since_sale')],
      rows: drilldowns.movers.map((r: any) => [r.name, r.unitsSold, r.revenue, r.saleCount, r.daysSinceLastSale ?? ''])
    });
    if (drilldowns?.valuationByWarehouse?.length) sections.push({
      title: t('reports.valuation_by_warehouse'),
      headers: [t('reports.warehouse'), t('reports.units'), t('reports.products'), t('reports.value')],
      rows: drilldowns.valuationByWarehouse.map((r: any) => [r.warehouse, r.units, r.productCount, r.value])
    });
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const lang = 'en';
    let startY = addPdfHeader(doc, currentBusiness ?? null, 8) + 4;
    sections.forEach((section, idx) => {
      if (idx > 0) startY += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, pageWidth / 2, startY, { align: 'center' });
      startY += 6;
      const body = section.rows.map(r => r.map(c => String(c ?? '')));
      autoTable(doc, {
        startY,
        head: [section.headers],
        body,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
        styles: { fontSize: 7 },
      });
      startY = (doc as any).lastAutoTable.finalY + 8;
    });
    doc.save(`drilldowns-report-${Date.now()}.pdf`);
    toast.success(t('reports.report_exported'));
  };

  const exportGlCSV = () => {
    const headers = [t('reports.date'), t('reports.account'), t('reports.reference'), t('reports.debit'), t('reports.credit'), t('reports.memo')];
    const rows = (glJournal?.lines || []).map((l: any) => [l.date, l.account, l.ref, l.debit || 0, l.credit || 0, l.memo || '']);
    exportCSV(headers, rows, 'gl-journal');
  };

  const exportGlPDF = () => {
    const headers = [t('reports.date'), t('reports.account'), t('reports.reference'), t('reports.debit'), t('reports.credit'), t('reports.memo')];
    const rows = (glJournal?.lines || []).map((l: any) => [l.date, l.account, l.ref, l.debit || 0, l.credit || 0, l.memo || '']);
    exportPDF(t('reports.report_gl'), headers, rows, 'gl-journal', [], undefined, currentBusiness);
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
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Receipt size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.expenses')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_expenses')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(analytics.summary.totalExpenses || 0).toLocaleString()}</h3>
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

      case 'expenses':
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Receipt size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_expenses')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><BarChart3 size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.count')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.entries')}</p>
                <h3 className="text-2xl font-black tracking-tight">{expenses.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><CreditCard size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.categories')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.categories')}</p>
                <h3 className="text-2xl font-black tracking-tight">{new Set(expenses.map(e => e.category)).size}</h3>
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
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Receipt size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.expenses')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('summary.total_expenses')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(analytics.summary.totalExpenses || 0).toLocaleString()}</h3>
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

      case 'inventory_by_supplier':
        if (inventoryBySupplier.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Truck size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{inventoryBySupplier.length}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('suppliers.title')}</p>
                <h3 className="text-2xl font-black tracking-tight">{inventoryBySupplier.filter((r: any) => r.productCount > 0).length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Package size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('inventory.total')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_skus')}</p>
                <h3 className="text-2xl font-black tracking-tight">{inventoryBySupplier.reduce((s: number, r: any) => s + (r.productCount || 0), 0)}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Boxes size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('inventory.qty')}</Badge>
                </div>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_stock_badge')}</p>
                <h3 className="text-2xl font-black tracking-tight">{Math.round(inventoryBySupplier.reduce((s: number, r: any) => s + (r.totalStockQuantity || 0), 0)).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.value_badge')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('inventory.total_value')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {Math.round(inventoryBySupplier.reduce((s: number, r: any) => s + (r.inventoryValue || 0), 0)).toLocaleString()}</h3>
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

      case 'voided_sales':
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Ban size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.voided_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight text-destructive">{voidedSales.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total_amount')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_amount')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {voidedSales.reduce((s: number, v: any) => s + (v.totalPrice || 0), 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Ban size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.unique_voiders')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.unique_voiders')}</p>
                <h3 className="text-2xl font-black tracking-tight">{new Set(voidedSales.map((v: any) => v.voidedBy).filter(Boolean)).size}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'reversals':
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><RotateCcw size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.total_reversals')}</p>
                <h3 className="text-2xl font-black tracking-tight">{reversalData.length}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Ban size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.types')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.types')}</p>
                <h3 className="text-lg font-black tracking-tight">
                  {t('reports.payments_label', { count: reversalData.filter((r: any) => r.action === 'reverse_payment').length })} / 
                  {t('reports.adjustments_label', { count: reversalData.filter((r: any) => r.action === 'reverse_adjustment').length })}
                </h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'vat':
        if (!vatReport) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Receipt size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.vat_taxable_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {vatReport.summary.totalTaxable.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><DollarSign size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.vat_output')}</p>
                <h3 className="text-2xl font-black tracking-tight text-amber-500">{t('common.etb')} {vatReport.summary.totalVAT.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><FileText size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.transactions')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.vat_invoices')}</p>
                <h3 className="text-2xl font-black tracking-tight">{vatReport.summary.totalCount.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><BarChart3 size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.total_amount')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.gross_sales')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {vatReport.summary.totalSales.toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'drilldowns':
        if (!drilldowns) return null;
        const topCashier = (drilldowns.byCashier || [])[0];
        const peakHour = (drilldowns.byHour || []).slice().sort((a: any, b: any) => b.revenue - a.revenue)[0];
        const topMargin = (drilldowns.marginByItem || [])[0];
        const totalWhValue = (drilldowns.valuationByWarehouse || []).reduce((s: number, r: any) => s + (r.value || 0), 0);
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Banknote size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.top_cashier')}</p>
                <h3 className="text-2xl font-black tracking-tight truncate">{topCashier?.cashier || '-'}</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1">{t('common.etb')} {(topCashier?.revenue || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><TrendingUp size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.peak_hour')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.busiest_hour')}</p>
                <h3 className="text-2xl font-black tracking-tight">{peakHour ? `${String(peakHour.hour).padStart(2, '0')}:00` : '-'}</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1">{t('common.etb')} {(peakHour?.revenue || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><TrendingUp size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.top_margin')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.highest_margin_item')}</p>
                <h3 className="text-2xl font-black tracking-tight truncate">{topMargin?.name || '-'}</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1">{t('common.etb')} {(topMargin?.profit || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Package size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.warehouse_value')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.inventory_valuation')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {totalWhValue.toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        );

      case 'gl':
        if (!glJournal) return null;
        return (
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-4">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><BookOpen size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{formattedRange}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.entries')}</p>
                <h3 className="text-2xl font-black tracking-tight">{(glJournal.lines || []).length.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Banknote size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.totals_debit')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.debit_total')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(glJournal.totals?.debit || 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Banknote size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.totals_credit')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.credit_total')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {(glJournal.totals?.credit || 0).toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground"><Scale size={20} /></div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{t('reports.balance')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">{t('reports.debit_minus_credit')}</p>
                <h3 className="text-2xl font-black tracking-tight">{t('common.etb')} {((glJournal.totals?.debit || 0) - (glJournal.totals?.credit || 0)).toLocaleString()}</h3>
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

      case 'expenses':
        if (expenses.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.expense_data')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.date')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('common.name')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('common.category')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{formatDate(exp.date)}</TableCell>
                      <TableCell>{exp.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs font-black uppercase tracking-widest">{exp.category}</Badge></TableCell>
                      <TableCell className="text-right font-bold">{t('common.etb')} {exp.amount.toLocaleString()}</TableCell>
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
                    <TableCell className="font-medium">{t('summary.total_expenses')}</TableCell>
                    <TableCell className="text-right text-red-500 font-bold">{t('common.etb')} -{(analytics.summary.totalExpenses || 0).toLocaleString()}</TableCell>
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

      case 'inventory_by_supplier':
        if (inventoryBySupplier.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.inventory_supplier_card')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.as_of_date')} {formatDate(new Date())}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_supplier')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.total_skus')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.stock')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('inventory.total_value')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('suppliers.col_last_date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryBySupplier.map((row: any) => (
                    <TableRow key={row.supplierId}>
                      <TableCell className="font-medium">{row.supplierName}</TableCell>
                      <TableCell className="text-right">{row.productCount || 0}</TableCell>
                      <TableCell className="text-right">{Math.round(row.totalStockQuantity || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">{t('common.etb')} {Math.round(row.inventoryValue || 0).toLocaleString()}</TableCell>
                      <TableCell>{row.lastSupplyDate ? formatDate(row.lastSupplyDate) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'voided_sales':
        if (voidedSales.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.voided_sales')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">#</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.amount')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.void_reason')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.voided_by')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voidedSales.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.name || `Item #${row.itemId}`}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">{t('common.etb')} {(row.totalPrice || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{row.voidReason || '-'}</TableCell>
                      <TableCell>{row.voidedBy || '-'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{row.voidedAt ? formatDate(row.voidedAt) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'reversals':
        if (reversalData.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.reversals')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.action')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.entity')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.id_header')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.description')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('audit_logs.by')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reversalData.map((row: any, i: number) => (
                    <TableRow key={row.id || i}>
                      <TableCell>
                        <Badge variant={row.action === 'reverse_payment' ? 'default' : 'secondary'} className="text-xs font-black uppercase">
                          {row.action === 'reverse_payment' ? t('reports.badge_payment') : t('reports.badge_adjustment')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{row.entityType || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{row.entityId || '-'}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">{row.description || '-'}</TableCell>
                      <TableCell className="text-xs">{row.changedBy || '-'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{row.createdAt ? formatDate(row.createdAt) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'vat':
        if (!vatReport || !vatReport.buckets || vatReport.buckets.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.vat_breakdown')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.vat_rate')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.vat_invoices')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.vat_taxable_sales')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.vat_output')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vatReport.buckets.map((row: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-bold">{row.rate}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{t('common.etb')} {row.taxable.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-amber-500">{t('common.etb')} {row.vat.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'drilldowns':
        if (!drilldowns) return null;
        const dd = drilldowns;
        return (
          <>
            {(dd.byCashier || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.sales_by_cashier')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.cashier')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.invoices')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.revenue')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.vat_output')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.profit')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.byCashier.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{r.cashier}</TableCell>
                          <TableCell className="text-right">{r.saleCount}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.vat.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-500">{t('common.etb')} {r.profit.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(dd.byHour || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.sales_by_hour')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.hour')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.invoices')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.revenue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.byHour.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{String(r.hour).padStart(2, '0')}:00</TableCell>
                          <TableCell className="text-right">{r.saleCount}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(dd.marginByItem || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.margin_by_item')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.category')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.units')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.revenue')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.cogs')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.profit')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.marginByItem.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">{r.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.categoryName}</TableCell>
                          <TableCell className="text-right">{r.units}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.cogs.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-500">{t('common.etb')} {r.profit.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(dd.debtAging || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.debt_aging')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.customer_debt')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.customer')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('common.phone')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.outstanding')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.days_overdue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.debtAging.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{r.customerName || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.customerPhone || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-amber-500">{t('common.etb')} {r.outstanding.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.max(0, r.daysOverdue || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(dd.movers || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.movers')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('inventory.product')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.units_sold')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.revenue')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.sales')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.days_since_sale')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.movers.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">{r.name}</TableCell>
                          <TableCell className="text-right">{r.unitsSold}</TableCell>
                          <TableCell className="text-right">{t('common.etb')} {r.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{r.saleCount}</TableCell>
                          <TableCell className="text-right">{r.daysSinceLastSale == null ? '—' : r.daysSinceLastSale}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(dd.valuationByWarehouse || []).length > 0 && (
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.valuation_by_warehouse')}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.inventory_valuation')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.warehouse')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.units')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.products')}</TableHead>
                        <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.value')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dd.valuationByWarehouse.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{r.warehouse || '-'}</TableCell>
                          <TableCell className="text-right">{r.units}</TableCell>
                          <TableCell className="text-right">{r.productCount}</TableCell>
                          <TableCell className="text-right font-bold">{t('common.etb')} {r.value.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        );

      case 'gl':
        if (!glJournal || !glJournal.lines || glJournal.lines.length === 0) return null;
        return (
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('reports.gl_journal')}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formattedRange}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.date')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.account')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.reference')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.debit')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('reports.credit')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('reports.memo')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glJournal.lines.map((l: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(l.date)}</TableCell>
                      <TableCell className="font-bold">{l.account}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{l.ref}</TableCell>
                      <TableCell className="text-right">{l.debit ? `${t('common.etb')} ${l.debit.toLocaleString()}` : ''}</TableCell>
                      <TableCell className="text-right">{l.credit ? `${t('common.etb')} ${l.credit.toLocaleString()}` : ''}</TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate text-muted-foreground">{l.memo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
      case 'expenses':
        showCSV = showPDF = expenses.length > 0;
        csvHandler = exportExpenseCSV;
        pdfHandler = exportExpensePDF;
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
      case 'inventory_by_supplier':
        showCSV = showPDF = inventoryBySupplier.length > 0;
        csvHandler = exportInventoryBySupplierCSV;
        pdfHandler = exportInventoryBySupplierPDF;
        break;
      case 'voided_sales':
        showCSV = showPDF = voidedSales.length > 0;
        csvHandler = exportVoidedSalesCSV;
        pdfHandler = exportVoidedSalesPDF;
        break;
      case 'reversals':
        showCSV = showPDF = reversalData.length > 0;
        csvHandler = exportReversalsCSV;
        pdfHandler = exportReversalsPDF;
        break;
      case 'vat':
        showCSV = showPDF = !!vatReport && (vatReport.buckets || []).length > 0;
        csvHandler = exportVatCSV;
        pdfHandler = exportVatPDF;
        break;
      case 'drilldowns':
        showCSV = showPDF = !!drilldowns && ((drilldowns.byCashier || []).length > 0 || (drilldowns.marginByItem || []).length > 0 || (drilldowns.byHour || []).length > 0);
        csvHandler = exportDrilldownsCSV;
        pdfHandler = exportDrilldownsPDF;
        break;
      case 'gl':
        showCSV = showPDF = !!glJournal && (glJournal.lines || []).length > 0;
        csvHandler = exportGlCSV;
        pdfHandler = exportGlPDF;
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
            <TabsTrigger value="expenses" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              {t('reports.expenses')}
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
            <TabsTrigger value="inventory_by_supplier" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <Package className="h-3 w-3 mr-1" />{t('reports.tab_by_supplier')}
            </TabsTrigger>
            <TabsTrigger value="voided_sales" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <Ban className="h-3 w-3 mr-1" />{t('reports.voided_sales')}
            </TabsTrigger>
            <TabsTrigger value="reversals" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <RotateCcw className="h-3 w-3 mr-1" />{t('reports.reversals')}
            </TabsTrigger>
            <TabsTrigger value="vat" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <Receipt className="h-3 w-3 mr-1" />{t('reports.tab_vat')}
            </TabsTrigger>
            <TabsTrigger value="drilldowns" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <BarChart3 className="h-3 w-3 mr-1" />{t('reports.tab_drilldowns')}
            </TabsTrigger>
            <TabsTrigger value="gl" className="text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg">
              <BookOpen className="h-3 w-3 mr-1" />{t('reports.tab_gl')}
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
                      className="h-7 w-32 bg-background border-none text-xs font-bold grow"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('analytics.end_date')}</Label>
                    <DatePicker
                      value={dateRange.end}
                      onChange={(v) => setDateRange(prev => ({ ...prev, end: v }))}
                      className="h-7 w-32 bg-background border-none text-xs font-bold grow"
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
