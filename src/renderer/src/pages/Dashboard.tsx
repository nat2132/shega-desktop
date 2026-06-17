import React, { useEffect, useState, useMemo } from 'react';
import {
  Clock, Truck, AlertCircle, RefreshCw,
  Loader2, ShoppingBag, Receipt, Sliders,
  DollarSign, AlertTriangle, Package, Ban,
  RotateCcw, ArrowLeftRight
} from 'lucide-react';
import { 
  ColumnDef 
} from '@tanstack/react-table';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { SectionCards, SectionCardData } from '../components/section-cards';
import DashboardAlerts from '../components/DashboardAlerts';
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

  // Reload analytics when period changes
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
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── Revenue chart data aggregation ──
  const revenueChartData = useMemo(() => {
    if (!analytics?.salesData) return [];
    const salesData = analytics.salesData as { date: string; revenue: number; units: number }[];

    if (revPeriod === 'week') {
      // Current week: Sunday → Saturday
      const now = new Date();
      const sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay());
      sun.setHours(0, 0, 0, 0);

      const days: { label: string; revenue: number }[] = [];
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
        days.push({ label, revenue: sale?.revenue || 0 });
      }
      return days;
    }

    if (revPeriod === 'month') {
      // Current month split into weeks
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const weeks: { label: string; revenue: number }[] = [];
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

        weeks.push({ label: `${t('analytics.week')} ${wn}`, revenue: rev });
        ws = new Date(we);
        ws.setDate(ws.getDate() + 1);
        wn++;
      }
      return weeks;
    }

    // Year view
    if (calendarType === 'ethiopian') {
      // 13 Ethiopian months
      const months: { label: string; revenue: number }[] = [];
      for (let m = 1; m <= 13; m++) {
        let rev = 0;
        salesData.forEach(s => {
          const eth = toEthiopianDate(new Date(s.date));
          if (eth.month === m) rev += s.revenue;
        });
        months.push({ label: getEthiopianMonthName(m - 1, language as any), revenue: rev });
      }
      return months;
    } else {
      // 12 Gregorian months
      const now = new Date();
      const loc = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : language === 'ti' ? 'ti-ET' : 'en-US';
      const months: { label: string; revenue: number }[] = [];
      for (let m = 0; m < 12; m++) {
        const md = new Date(now.getFullYear(), m, 1);
        let rev = 0;
        salesData.forEach(s => {
          const sd = new Date(s.date);
          if (sd.getMonth() === m && sd.getFullYear() === now.getFullYear()) rev += s.revenue;
        });
        months.push({ label: md.toLocaleDateString(loc, { month: 'short' }), revenue: rev });
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
      trend: stats?.lowStock > 5 ? 'High' : 'Normal', 
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
          className="font-medium hover:text-primary transition-colors text-left cursor-pointer"
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
        <Badge variant="outline" className="capitalize cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>{t(`dashboard.${row.original.type.toLowerCase()}`)}</Badge>
      )
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t('common.amount')}</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>{t('common.etb')} {row.original.amount.toLocaleString()}</div>
      )
    },
    {
      accessorKey: "extra",
      header: t('common.details'),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>
          {row.original.extra || 'System'}
        </Badge>
      )
    },
    {
      accessorKey: "date",
      header: t('common.date'),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest cursor-pointer" onClick={() => { setSelectedActivity(row.original); setShowActivityDetail(true); }}>
          {formatDate(new Date(row.original.date), { month: 'short', day: 'numeric' })}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="px-4 lg:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t('common.no_data')}</p>
        </div>
      ) : (
        <>
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {t(`dashboard.${greeting}`)}, {currentAdmin?.name?.split(' ')[0] || 'Admin'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('dashboard.welcome')}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                <Clock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <SectionCards cards={kpiCards} />

          <div className="px-4 lg:px-6">
            <DashboardAlerts />
          </div>

          {empStats && (
            <div className="px-4 lg:px-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-black">{empStats.total || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active</p>
                  <p className="text-2xl font-black text-green-600">{empStats.active || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Online Now</p>
                  <p className="text-2xl font-black text-blue-600">{empStats.online || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Clocked In</p>
                  <p className="text-2xl font-black text-amber-600">{empStats.clockedIn || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pending</p>
                  <p className="text-2xl font-black text-destructive">{empStats.pendingApprovals || 0}</p>
                </div>
              </div>
            </div>
          )}

          {reversalStats && (
            <div className="px-4 lg:px-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                <ArrowLeftRight className="h-4 w-4" /> Reversals
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3" /> Voided Sales
                  </p>
                  <p className="text-xl font-black">{reversalStats.voidedSales || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Reversed Payments
                  </p>
                  <p className="text-xl font-black">{reversalStats.reversedPayments || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Reversed Adjustments
                  </p>
                  <p className="text-xl font-black">{reversalStats.reversedAdjustments || 0}</p>
                </div>
              </div>
            </div>
          )}

          {supplierStats && (
            <div className="px-4 lg:px-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4" />{t('suppliers.title')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/suppliers'} className="text-xs">{t('common.view_all')} →</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_total')}</p>
                  <p className="text-xl font-black">{supplierStats.totalSuppliers || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_active')}</p>
                  <p className="text-xl font-black text-green-600">{supplierStats.activeSuppliers || 0}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_outstanding')}</p>
                  <p className="text-sm font-black text-red-600">{t('common.etb')} {(supplierStats.outstandingBalance || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_month')}</p>
                  <p className="text-sm font-black">{t('common.etb')} {(supplierStats.monthPurchases || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_top')}</p>
                  <p className="text-sm font-black truncate">{supplierStats.topSupplier?.supplierName || '-'}</p>
                </div>
                <div className="rounded-xl border bg-card/40 p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('suppliers.kpi_recent')}</p>
                  <p className="text-sm font-black">{(supplierStats.recent || []).length}</p>
                </div>
              </div>

              {supplierUnpaidOrders.length > 0 && (
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-red-500" />
                      Unpaid Supplier Orders ({supplierUnpaidOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Supplier</th>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Order#</th>
                            <th className="text-right p-2 text-[10px] font-bold uppercase tracking-widest">Balance</th>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierUnpaidOrders.slice(0, 5).map(o => (
                            <tr key={o.id} className="border-t hover:bg-muted/20">
                              <td className="p-2 text-xs font-medium">{o.supplierName}</td>
                              <td className="p-2 font-mono text-xs">{o.purchaseNumber || `#${o.id}`}</td>
                              <td className="p-2 text-right text-xs text-red-600 font-semibold">{t('common.etb')} {o.remainingBalance.toLocaleString()}</td>
                              <td className="p-2 text-xs">{o.dueDate ? formatDate(o.dueDate) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplierPaymentAlerts.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Payment Due Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Supplier</th>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Order#</th>
                            <th className="text-right p-2 text-[10px] font-bold uppercase tracking-widest">Amount</th>
                            <th className="text-right p-2 text-[10px] font-bold uppercase tracking-widest">Due In</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierPaymentAlerts.slice(0, 5).map(a => (
                            <tr key={a.id} className="border-t hover:bg-muted/20">
                              <td className="p-2 text-xs font-medium">{a.supplierName}</td>
                              <td className="p-2 font-mono text-xs">{a.purchaseNumber || `#${a.id}`}</td>
                              <td className="p-2 text-right text-xs text-amber-600 font-semibold">{t('common.etb')} {a.remainingBalance.toLocaleString()}</td>
                              <td className="p-2 text-xs">
                                {a.daysUntilDue !== null && a.daysUntilDue !== undefined ? (
                                  a.daysUntilDue <= 0 ? (
                                    <Badge variant="destructive" className="text-[9px]">Overdue</Badge>
                                  ) : (
                                    <span className="text-amber-600 font-semibold">{a.daysUntilDue} days</span>
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
                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      Low Stock Products with Supplier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Product</th>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Supplier</th>
                            <th className="text-right p-2 text-[10px] font-bold uppercase tracking-widest">Stock</th>
                            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierLowStock.map(p => (
                            <tr key={p.id} className="border-t hover:bg-muted/20">
                              <td className="p-2 text-xs font-medium">{p.name}</td>
                              <td className="p-2 text-xs">{p.supplierName}</td>
                              <td className="p-2 text-right text-xs text-red-600 font-semibold">{p.totalBaseQuantity} {p.baseUnit}</td>
                              <td className="p-2 text-xs text-muted-foreground">{p.categoryName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Test Data Generator (dev mode only) ── */}
          {(window.location.protocol === 'http:' || window.location.hostname === 'localhost') && (
            <div className="px-4 lg:px-6">
              <TestDataGenerator />
            </div>
          )}

          {/* ── Revenue Intelligence Bar Chart ── */}
          <div className="px-4 lg:px-6">
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
                    variant="outline"
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
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                      fill="var(--primary)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6">
            <CategorySalesChart data={analytics?.categoryBreakdown || []} />
          </div>

          <div className="px-4 lg:px-6">
            <DataTable 
              columns={columns} 
              data={recentActivity} 
              title={t('dashboard.recent_activity')}
              addLabel={t('sales.new_btn')}
              onAddClick={() => {}}
            />
          </div>

          <Modal isOpen={showActivityDetail} onClose={() => setShowActivityDetail(false)} title={t('common.details')} size="md">
            {selectedActivity && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {selectedActivity.type === 'sale' ? <ShoppingBag className="h-6 w-6 text-primary" /> :
                     selectedActivity.type === 'expense' ? <Receipt className="h-6 w-6 text-destructive" /> :
                     <Sliders className="h-6 w-6 text-amber-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedActivity.description}</h3>
                    <Badge variant="outline" className="mt-1 capitalize">{selectedActivity.type}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/40 bg-card/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('common.amount')}</p>
                    <p className="text-xl font-black text-primary">{t('common.etb')} {selectedActivity.amount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('common.date')}</p>
                    <p className="text-xl font-black">{formatDate(new Date(selectedActivity.date), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/50 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('common.details')}</p>
                    <p className="font-medium">{selectedActivity.extra || 'System entry'}</p>
                  </div>
                </div>

                <Button onClick={() => setShowActivityDetail(false)} className="w-full h-10 rounded-xl font-bold uppercase tracking-widest">
                  {t('inventory.close_specs')}
                </Button>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default Dashboard;
