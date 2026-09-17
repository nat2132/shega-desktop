import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, AlertCircle, RefreshCw, LayoutDashboard, Building2,
  Loader2, TrendingUp, Activity, Package, ShoppingCart,
  ChevronRight
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveAvatar } from '../lib/avatar';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useDataChangedRefresh } from '../hooks/useDataChangedRefresh';
import { SectionCards, SectionCardData } from '../components/section-cards';
import DashboardAlerts from '../components/DashboardAlerts';
import { BusinessAssistant } from '../components/BusinessAssistant';
import { BusinessSwitcher } from '../components/BusinessSwitcher';
import BusinessCenter from './BusinessCenter';

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
  Tabs, TabsList, TabsTrigger, TabsContent
} from '../components/ui/tabs';
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
  const { t, formatDate, formatTime, calendarType, language } = useSettings();
  const { currentAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab');
  }, [location.search]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'business'>(location.pathname === '/business' ? 'business' : 'dashboard');
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [empStats, setEmpStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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

  // Live sync: re-query when P2P/Yjs sync lands new data in SQLite.
  useDataChangedRefresh(() => { loadData(); });

  useEffect(() => {
    window.api?.getAnalytics(revPeriod === 'week' ? 'month' : revPeriod)
      .then(data => setAnalytics(data || { salesData: [] }));
  }, [revPeriod]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, anData, employees, activity] = await Promise.all([
        window.api?.getDashboardStats() || Promise.resolve({}),
        window.api?.getAnalytics('month') || Promise.resolve({ salesData: [], topItems: [] }),
        window.api?.getEmployeeStats() || Promise.resolve(null),
        window.api?.getRecentActivity(10) || Promise.resolve([]),
      ]);
      setStats(statData);
      setAnalytics(anData);
      setEmpStats(employees);
      setRecentActivity(activity);
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

  // Fresh business — no sales and no products yet: show first-launch CTAs.
  const isFresh = !!stats &&
    (stats.todaySales || 0) === 0 &&
    (stats.yesterdaySales || 0) === 0 &&
    (stats.totalItems || 0) === 0;

  return (
    <motion.div
      className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dashboard' | 'business')} className="space-y-4 md:space-y-6">
        <motion.div variants={itemVariants} className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                {t(`dashboard.${greeting}`)}, {currentAdmin?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-sm text-muted-foreground/70 mt-0.5">
                {t('dashboard.welcome')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <BusinessSwitcher onChanged={loadData} />
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground/60">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium tabular-nums">
                  {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <TabsList className="mt-4 h-auto rounded-xl p-1">
            <TabsTrigger value="dashboard" className="gap-2 rounded-lg px-4 py-2 text-sm">
              <LayoutDashboard className="h-4 w-4" /> {t('tabs.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2 rounded-lg px-4 py-2 text-sm">
              <Building2 className="h-4 w-4" /> {t('tabs.business')}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
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
              <motion.div variants={itemVariants}>
                <SectionCards cards={kpiCards} />
              </motion.div>

              {/* First-launch steps — fresh business with no products or sales yet */}
              {isFresh && (
                <motion.div variants={itemVariants} className="px-4 lg:px-6">
                  <Card className="@container/card">
                    <CardHeader className="pb-3">
                      <CardTitle>{t('dashboard.get_selling', 'Let\'s get selling')}</CardTitle>
                      <CardDescription>
                        {t('dashboard.first_steps_hint', 'Two quick steps to start using Shega.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 @[600px]/card:grid-cols-2">
                      <button type="button" onClick={() => navigate('/inventory')}
                        className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 text-left transition-all hover:bg-muted/60 hover:border-foreground/20 active:scale-[0.99]"
                      >
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{t('dashboard.add_first_product', 'Add your first product')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.add_first_product_hint', 'Create an inventory item to sell')}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      </button>
                      <button type="button" onClick={() => navigate('/register')}
                        className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 text-left transition-all hover:bg-muted/60 hover:border-foreground/20 active:scale-[0.99]"
                      >
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{t('dashboard.first_sale', 'Make your first sale')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.first_sale_hint', 'Open the register and start selling')}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

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
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{item.label}</p>
                        <p className={`text-2xl font-semibold tracking-tight tabular-nums ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="px-4 lg:px-6">
                <BusinessAssistant />
              </motion.div>

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
                          className="text-xs"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => (v ?? 0) >= 1000 ? `${((v ?? 0) / 1000).toFixed(0)}k` : `${v ?? 0}`}
                          width={40}
                          className="text-xs"
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
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.recent_activity')}</CardTitle>
                    <CardDescription>{t('dashboard.recent_activity_desc', 'Latest actions across your team')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                        <Activity size={24} className="mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {t('analytics.no_activity')}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                        {recentActivity.map((activity, i) => {
                          const isSale = activity.type === 'sale';
                          const isMoney = isSale;
                          const isClock = activity.type === 'clock_in' || activity.type === 'clock_out';
                          const typeKey = isClock ? `employees.${activity.type}` : `dashboard.${activity.type}`;
                          return (
                            <div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
                              <div className="relative mt-0.5 h-fit">
                                {(isSale || activity.type === 'adjustment') && activity.itemImage ? (
                                  <>
                                    <img
                                      src={activity.itemImage}
                                      alt={activity.description || 'Product'}
                                      className="h-8 w-8 rounded-lg object-cover ring-1 ring-border"
                                    />
                                    <span
                                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border"
                                    >
                                      {isSale ? <TrendingUp size={9} /> : <Activity size={9} />}
                                    </span>
                                  </>
                                ) : activity.userAvatar ? (
                                  <>
                                    <img
                                      src={resolveAvatar(activity.userAvatar)}
                                      alt={activity.userName || 'User'}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                    <span
                                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border"
                                    >
                                      {isSale ? <TrendingUp size={9} /> : <Activity size={9} />}
                                    </span>
                                  </>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-muted text-foreground">
                                    {isSale ? <TrendingUp size={12} /> : <Activity size={12} />}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className="text-xs font-bold truncate max-w-[140px] capitalize text-foreground">
                                    {t(typeKey)}
                                  </p>
                                  {isMoney ? (
                                    <span className="text-xs font-bold text-foreground">
                                      {isSale ? '+' : '-'}
                                      {t('common.etb')} {(activity.amount || 0).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                      {formatTime(activity.date)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
                                  {activity.description || activity.extra || t('analytics.system_update')}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  {activity.userName && (
                                    <span className="inline-flex items-center gap-1">
                                      <img
                                        src={resolveAvatar(activity.userAvatar)}
                                        alt=""
                                        className="h-4 w-4 rounded-full object-cover"
                                      />
                                      <span className="text-primary font-bold">{activity.userName}</span>
                                    </span>
                                  )}
                                  {activity.userName ? ' · ' : ''}
                                  {formatTime(activity.date)} · {formatDate(activity.date)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>

        <TabsContent value="business" className="px-4 lg:px-6">
          <BusinessCenter key={queryTab || 'overview'} initialTab={queryTab as any} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Dashboard;
