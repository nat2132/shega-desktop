import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Truck, AlertCircle, RefreshCw,
  Loader2, ShoppingBag, Receipt, Sliders,
  DollarSign, AlertTriangle, Package, Ban,
  RotateCcw, ArrowLeftRight, TrendingUp, TrendingDown
} from 'lucide-react';
import {
  ColumnDef
} from '@tanstack/react-table';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { SectionCards, SectionCardData } from '../components/section-cards';
import DashboardAlerts from '../components/DashboardAlerts';
import { BusinessAssistant } from '../components/BusinessAssistant';
import TestDataGenerator from '../components/TestDataGenerator';
import { CategorySalesChart } from '../components/category-sales-chart';
import { DataTable } from '../components/data-table';
import Modal from '../components/Modal';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle
} from '../components/ui/card';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig
} from '../components/ui/chart';
import {
  ToggleGroup, ToggleGroupItem
} from '../components/ui/toggle-group';
import {
  toEthiopianDate, getEthiopianDayName, getEthiopianMonthName
} from '../utils/ethiopian-calendar';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.28, 0, 0.22, 1],
    },
  },
};

const Dashboard: React.FC = () => {
  const { t, formatDate, calendarType, language } = useSettings();
  const { currentAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [empStats, setEmpStats] = useState<any>(null);
  const [supplierStats, setSupplierStats] = useState<any>(null);
  const [supplierUnpaidOrders, setSupplierUnpaidOrders] = useState<any[]>([]);
  const [supplierPaymentAlerts, setSupplierPaymentAlerts] = useState<any[]>([]);
  const [supplierLowStock, setSupplierLowStock] = useState<any[]>([]);
  const [reversalStats, setReversalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revPeriod, setRevPeriod] = useState<'week' | 'month' | 'year'>('week');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'good_morning';
    if (hour < 17) return 'good_afternoon';
    return 'good_evening';
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.api?.getAnalytics(revPeriod === 'week' ? 'month' : revPeriod)
      .then(data => setAnalytics(data || { salesData: [] }));
  }, [revPeriod]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, anData, activity, employees, suppliers, unpaidOrders, paymentAlerts, lowStock, revStats] = await Promise.all([
        window.api?.getDashboardStats() || Promise.resolve({}),
        window.api?.getAnalytics('month') || Promise.resolve({ salesData: [], topItems: [] }),
        window.api?.getRecentActivity(5) || Promise.resolve([]),
        window.api?.getEmployeeStats() || Promise.resolve(null),
        window.api?.getSupplierDashboardStats() || Promise.resolve(null),
        window.api?.getSupplierUnpaidOrders() || Promise.resolve([]),
        window.api?.getSupplierPaymentDueAlerts() || Promise.resolve([]),
        window.api?.getSupplierLowStock() || Promise.resolve([]),
        window.api?.getReversalStats() || Promise.resolve(null)
      ]);
      setStats(statData);
      setAnalytics(anData);
      setRecentActivity(activity);
      setEmpStats(employees);
      setSupplierStats(suppliers);
      setSupplierUnpaidOrders(unpaidOrders);
      setSupplierPaymentAlerts(paymentAlerts);
      setSupplierLowStock(lowStock);
      setReversalStats(revStats);
    } catch (e: any) {
      setError(e.message || t('dashboard.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = useMemo(() => {
    if (!analytics?.salesData) return [];
    const salesData = analytics.salesData as { date: string; revenue: number; units: number }[];

    if (revPeriod === 'week') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay());
      sun.setHours(0, 0, 0, 0);

      const days: { label: string; revenue: number; isToday: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const sale = salesData.find(s => s.date === dateStr);

        let label: string;
        if (calendarType === 'ethiopian') {
          label = getEthiopianDayName(i, language as any);
        } else {
          const loc = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : language === 'ti' ? 'ti-ET' : 'en-US';
          label = d.toLocaleDateString(loc, { weekday: 'short' });
        }
        days.push({ label, revenue: sale?.revenue || 0, isToday: dateStr === todayStr });
      }
      return days;
    }

    if (revPeriod === 'month') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const weeks: { label: string; revenue: number; isToday: boolean }[] = [];
      let ws = new Date(first);
      let wn = 1;

      while (ws <= last && wn <= 5) {
        const we = new Date(ws);
        we.setDate(ws.getDate() + 6);
        if (we > last) we.setTime(last.getTime());

        let rev = 0;
        salesData.forEach(s => {
          const sd = new Date(s.date);
          if (sd >= ws && sd <= we) rev += s.revenue;
        });

        const weStr = we.toISOString().split('T')[0];
        const wsStr = ws.toISOString().split('T')[0];
        weeks.push({ label: `${t('analytics.week')} ${wn}`, revenue: rev, isToday: todayStr >= wsStr && todayStr <= weStr });
        ws = new Date(we);
        ws.setDate(ws.getDate() + 1);
        wn++;
      }
      return weeks;
    }

    if (calendarType === 'ethiopian') {
      const ethNow = toEthiopianDate(new Date());
      const months: { label: string; revenue: number; isToday: boolean }[] = [];
      for (let m = 1; m <= 13; m++) {
        let rev = 0;
        salesData.forEach(s => {
          const eth = toEthiopianDate(new Date(s.date));
          if (eth.month === m) rev += s.revenue;
        });
        months.push({ label: getEthiopianMonthName(m - 1, language as any), revenue: rev, isToday: m === ethNow.month });
      }
      return months;
    } else {
      const now = new Date();
      const curMonth = now.getMonth();
      const loc = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : language === 'ti' ? 'ti-ET' : 'en-US';
      const months: { label: string; revenue: number; isToday: boolean }[] = [];
      for (let m = 0; m < 12; m++) {
        const md = new Date(now.getFullYear(), m, 1);
        let rev = 0;
        salesData.forEach(s => {
          const sd = new Date(s.date);
          if (sd.getMonth() === m && sd.getFullYear() === now.getFullYear()) rev += s.revenue;
        });
        months.push({ label: md.toLocaleDateString(loc, { month: 'short' }), revenue: rev, isToday: m === curMonth });
      }
      return months;
    }
  }, [analytics, revPeriod, calendarType, language]);

  const chartConfig: ChartConfig = {
    revenue: { label: t('sales.revenue'), color: "var(--primary)" },
  };

  const kpiCards: SectionCardData[] = useMemo(() => [
    {
      title: t('sales.revenue'),
      value: `${t('common.etb')} ${(stats?.todayRevenue || 0).toLocaleString()}`,
      trend: stats?.yesterdayRevenue > 0 ? `${((Number(stats.todayRevenue || 0) - Number(stats.yesterdayRevenue || 0)) / Number(stats.yesterdayRevenue || 0) * 100).toFixed(1)}%` : '0%',
      trendType: (Number(stats?.todayRevenue || 0) >= Number(stats?.yesterdayRevenue || 0)) ? 'up' : 'down',
      footerTitle: t('dashboard.today_revenue'),
      footerSub: `${t('dashboard.yesterday')}: ${t('common.etb')} ${(stats?.yesterdayRevenue || 0).toLocaleString()}`
    },
    {
      title: t('sales.profit'),
      value: `${t('common.etb')} ${(stats?.todayProfit || 0).toLocaleString()}`,
      trend: stats?.yesterdayProfit > 0 ? `${((Number(stats.todayProfit || 0) - Number(stats.yesterdayProfit || 0)) / Number(stats.yesterdayProfit || 0) * 100).toFixed(1)}%` : '0%',
      trendType: (Number(stats?.todayProfit || 0) >= Number(stats?.yesterdayProfit || 0)) ? 'up' : 'down',
      footerTitle: t('dashboard.gross_profit'),
      footerSub: `${t('dashboard.yesterday')}: ${t('common.etb')} ${(stats?.yesterdayProfit || 0).toLocaleString()}`
    },
    {
      title: t('sales.transactions'),
      value: (stats?.todaySales || 0).toLocaleString(),
      trend: stats?.yesterdaySales > 0 ? `${((Number(stats.todaySales || 0) - Number(stats.yesterdaySales || 0)) / Number(stats.yesterdaySales || 0) * 100).toFixed(1)}%` : '0%',
      trendType: (Number(stats?.todaySales || 0) >= Number(stats?.yesterdaySales || 0)) ? 'up' : 'down',
      footerTitle: t('dashboard.units_sold'),
      footerSub: `${t('dashboard.yesterday')}: ${stats?.yesterdaySales || 0}`
    },
    {
      title: t('inventory.low'),
      value: stats?.lowStock || 0,
      trend: stats?.lowStock > 5 ? t('dashboard.trend_high') : t('dashboard.trend_normal'),
      trendType: stats?.lowStock > 5 ? 'up' : 'down',
      footerTitle: t('dashboard.low_stock'),
      footerSub: t('inventory.refill_needed')
    },
  ], [stats]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "description",
      header: t('common.description'),
      cell: ({ row }) => (
        <button
          className="font-medium text-sm hover:text-primary transition-colors text-left cursor-pointer"
          onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}
        >
          {row.original.description}
        </button>
      )
    },
    {
      accessorKey: "type",
      header: t('common.category'),
      cell: ({ row }) => (
        <Badge variant="secondary" className="cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>{t(`dashboard.${row.original.type.toLowerCase()}`)}</Badge>
      )
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t('common.amount')}</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium tabular-nums cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>{t('common.etb')} {row.original.amount.toLocaleString()}</div>
      )
    },
    {
      accessorKey: "extra",
      header: t('common.details'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground/70 cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>
          {row.original.extra || t('dashboard.system_entry')}
        </span>
      )
    },
    {
      accessorKey: "date",
      header: t('common.date'),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs tabular-nums cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>
          {formatDate(new Date(row.original.date), { month: 'short', day: 'numeric' })}
        </div>
      )
    }
  ];

  return (
    <motion.div
      className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <motion.div variants={itemVariants} className="px-4 lg:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
            <RefreshCw className="h-4 w-4 mr-1" /> {t('common.retry')}
          </Button>
        </motion.div>
      ) : !stats ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-base font-medium">{t('common.no_data')}</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {t(`dashboard.${greeting}`)}, {currentAdmin?.name?.split(' ')[0] || 'Admin'}
                </h1>
                <p className="text-sm text-muted-foreground/70 mt-0.5">
                  {t('dashboard.welcome')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium tabular-nums">
                    {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SectionCards cards={kpiCards} />
          </motion.div>

          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <DashboardAlerts />
          </motion.div>

          {empStats && (
            <motion.div variants={itemVariants} className="px-4 lg:px-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: t('dashboard.total_employees'), value: empStats.total || 0, color: 'text-foreground' },
                  { label: t('common.active'), value: empStats.active || 0, color: 'text-emerald-600' },
                  { label: t('dashboard.online_now'), value: empStats.online || 0, color: 'text-primary' },
                  { label: t('dashboard.clocked_in'), value: empStats.clockedIn || 0, color: 'text-amber-600' },
                  { label: t('common.pending'), value: empStats.pendingApprovals || 0, color: 'text-destructive' },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/40 bg-card/50 p-4 space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{item.label}</p>
                    <p className={`text-2xl font-semibold tracking-tight tabular-nums ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {reversalStats && (
            <motion.div variants={itemVariants} className="px-4 lg:px-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-3">
                <ArrowLeftRight className="h-3.5 w-3.5" /> {t('reports.reversals')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('reports.voided_sales'), value: reversalStats.voidedSales || 0, icon: Ban },
                  { label: t('dashboard.reversed_payments'), value: reversalStats.reversedPayments || 0, icon: RotateCcw },
                  { label: t('dashboard.reversed_adjustments'), value: reversalStats.reversedAdjustments || 0, icon: RotateCcw },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/40 bg-card/50 p-3.5 space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                      <item.icon className="h-3 w-3" /> {item.label}
                    </p>
                    <p className="text-xl font-semibold tracking-tight tabular-nums">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {supplierStats && (
            <motion.div variants={itemVariants} className="px-4 lg:px-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" />{t('suppliers.title')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/suppliers'} className="text-xs">{t('common.view_all')} →</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: t('suppliers.kpi_total'), value: supplierStats.totalSuppliers || 0 },
                  { label: t('suppliers.kpi_active'), value: supplierStats.activeSuppliers || 0, color: 'text-emerald-600' },
                  { label: t('suppliers.kpi_outstanding'), value: `${t('common.etb')} ${(supplierStats.outstandingBalance || 0).toLocaleString()}`, color: 'text-destructive', small: true },
                  { label: t('suppliers.kpi_month'), value: `${t('common.etb')} ${(supplierStats.monthPurchases || 0).toLocaleString()}`, small: true },
                  { label: t('suppliers.kpi_top'), value: supplierStats.topSupplier?.supplierName || '-', small: true },
                  { label: t('suppliers.kpi_recent'), value: (supplierStats.recent || []).length },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/40 bg-card/50 p-3.5 space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{item.label}</p>
                    <p className={`${item.small ? 'text-sm' : 'text-xl'} font-semibold tracking-tight tabular-nums ${item.color || ''} truncate`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {supplierUnpaidOrders.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-destructive" />
                      {t('dashboard.unpaid_supplier_orders', { count: supplierUnpaidOrders.length })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/20">
                          <tr>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('suppliers.col_supplier')}</th>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('reports.header_order_num')}</th>
                            <th className="text-right p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('common.balance')}</th>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('common.due')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierUnpaidOrders.slice(0, 5).map(o => (
                            <tr key={o.id} className="border-t border-border/20 hover:bg-muted/10 transition-colors">
                              <td className="p-2.5 text-xs font-medium">{o.supplierName}</td>
                              <td className="p-2.5 text-xs font-mono text-muted-foreground">{o.purchaseNumber || `#${o.id}`}</td>
                              <td className="p-2.5 text-right text-xs text-destructive font-semibold tabular-nums">{t('common.etb')} {o.remainingBalance.toLocaleString()}</td>
                              <td className="p-2.5 text-xs text-muted-foreground">{o.dueDate ? formatDate(o.dueDate) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplierPaymentAlerts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {t('dashboard.payment_due_alerts')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/20">
                          <tr>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('suppliers.col_supplier')}</th>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('reports.header_order_num')}</th>
                            <th className="text-right p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('common.amount')}</th>
                            <th className="text-right p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('dashboard.due_in')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierPaymentAlerts.slice(0, 5).map(a => (
                            <tr key={a.id} className="border-t border-border/20 hover:bg-muted/10 transition-colors">
                              <td className="p-2.5 text-xs font-medium">{a.supplierName}</td>
                              <td className="p-2.5 text-xs font-mono text-muted-foreground">{a.purchaseNumber || `#${a.id}`}</td>
                              <td className="p-2.5 text-right text-xs text-amber-600 font-semibold tabular-nums">{t('common.etb')} {a.remainingBalance.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-xs">
                                {a.daysUntilDue !== null && a.daysUntilDue !== undefined ? (
                                  a.daysUntilDue <= 0 ? (
                                    <Badge variant="destructive" className="text-[10px]">{t('common.overdue')}</Badge>
                                  ) : (
                                    <span className="text-amber-600 font-semibold tabular-nums">{a.daysUntilDue} {t('common.days')}</span>
                                  )
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplierLowStock.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-500" />
                      {t('dashboard.low_stock_supplier')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/20">
                          <tr>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('inventory.product')}</th>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('suppliers.col_supplier')}</th>
                            <th className="text-right p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('common.stock')}</th>
                            <th className="text-left p-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t('common.category')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierLowStock.map(p => (
                            <tr key={p.id} className="border-t border-border/20 hover:bg-muted/10 transition-colors">
                              <td className="p-2.5 text-xs font-medium">{p.name}</td>
                              <td className="p-2.5 text-xs text-muted-foreground">{p.supplierName}</td>
                              <td className="p-2.5 text-right text-xs text-destructive font-semibold tabular-nums">{p.totalBaseQuantity} {p.baseUnit}</td>
                              <td className="p-2.5 text-xs text-muted-foreground/70">{p.categoryName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <BusinessAssistant />
          </motion.div>

          {(window.location.protocol === 'http:' || window.location.hostname === 'localhost') && (
            <motion.div variants={itemVariants} className="px-4 lg:px-6">
              <TestDataGenerator />
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <Card className="@container/card">
              <CardHeader>
                <CardTitle>{t('dashboard.revenue_intelligence')}</CardTitle>
                <CardDescription>
                  <span className="hidden @[540px]/card:block">{t('dashboard.performance_analysis')}</span>
                  <span className="@[540px]/card:hidden">{t('dashboard.performance_analysis')}</span>
                </CardDescription>
                <CardAction>
                  <ToggleGroup
                    type="single"
                    value={revPeriod}
                    onValueChange={(v) => v && setRevPeriod(v as any)}
                    className="*:data-[slot=toggle-group-item]:px-4!"
                  >
                    <ToggleGroupItem value="week">{t('analytics.week')}</ToggleGroupItem>
                    <ToggleGroupItem value="month">{t('analytics.month')}</ToggleGroupItem>
                    <ToggleGroupItem value="year">{t('analytics.year')}</ToggleGroupItem>
                  </ToggleGroup>
                </CardAction>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                  <BarChart data={revenueChartData} barGap={4} barCategoryGap="20%">
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v ?? 0) >= 1000 ? `${((v ?? 0) / 1000).toFixed(0)}k` : `${v ?? 0}`}
                      width={40}
                      className="text-[10px]"
                    />
                    <ChartTooltip
                      cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    >
                      {revenueChartData.map((entry: any, idx: number) => (
                        <Cell
                          key={idx}
                          fill={entry.isToday ? 'var(--primary)' : 'var(--primary)'}
                          opacity={entry.isToday ? 1 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <CategorySalesChart data={analytics?.categoryBreakdown || []} />
          </motion.div>

          <motion.div variants={itemVariants} className="px-4 lg:px-6">
            <DataTable
              columns={columns}
              data={recentActivity}
              title={t('dashboard.recent_activity')}
              addLabel={t('sales.new_btn')}
              onAddClick={() => {}}
            />
          </motion.div>

          <Modal isOpen={showActivityDetail} onClose={() => setShowActivityDetail(false)} title={t('common.details')} size="md">
            {selectedActivity && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {selectedActivity.type === 'sale' ? <ShoppingBag className="h-6 w-6 text-primary" /> :
                     selectedActivity.type === 'expense' ? <Receipt className="h-6 w-6 text-destructive" /> :
                     <Sliders className="h-6 w-6 text-amber-500" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{selectedActivity.description}</h3>
                    <Badge variant="outline" className="mt-1 capitalize">{selectedActivity.type}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">{t('common.amount')}</p>
                    <p className="text-xl font-semibold tabular-nums text-primary">{t('common.etb')} {selectedActivity.amount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">{t('common.date')}</p>
                    <p className="text-base font-semibold">{formatDate(new Date(selectedActivity.date), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/30 bg-card/50 col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">{t('common.details')}</p>
                    <p className="text-sm">{selectedActivity.extra || t('dashboard.system_entry')}</p>
                  </div>
                </div>

                <Button onClick={() => setShowActivityDetail(false)} className="w-full h-10 font-semibold">
                  {t('inventory.close_specs')}
                </Button>
              </motion.div>
            )}
          </Modal>
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;
