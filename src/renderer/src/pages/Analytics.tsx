import React, { useEffect, useState, useMemo } from "react";
import { resolveAvatar } from '../lib/avatar';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Boxes,
  CreditCard,
  Zap,
  Shield,
  AlertTriangle,
  Package,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  PieChart,
  Banknote,
  ArrowRightLeft,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useSettings } from "../context/SettingsContext";
import { useDataChangedRefresh } from '../hooks/useDataChangedRefresh';
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/DatePicker";
import { KpiVisibility } from "../components/kpi-visibility";
import { CategorySalesChart } from "../components/category-sales-chart";

interface AnalyticsData {
  salesData: { date: string; revenue: number; units: number; profit: number }[];
  topItems: { name: string; totalQty: number; totalRevenue: number }[];
  categoryBreakdown: { name: string; saleCount: number; revenue: number }[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    netProfit: number;
  };
}

const Analytics: React.FC = () => {
  const { t, formatDate, formatTime, language, isModuleEnabled } = useSettings();
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "year" | "custom"
  >("month");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [rawSales, setRawSales] = useState<any[]>([]);

  // Calculate current period dates for display and filtering
  const currentRange = useMemo(() => {
    if (period === "custom") return dateRange;
    const now = new Date();
    let end = now.toISOString().split("T")[0];
    let start = "";

    if (period === "today") {
      start = end;
    } else if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split("T")[0];
    } else if (period === "year") {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split("T")[0];
    }
    return { start, end };
  }, [period, dateRange]);

  useEffect(() => {
    if (period !== "custom" || (dateRange.start && dateRange.end)) {
      loadData();
    }
  }, [period]);

  // Live sync: re-query when P2P/Yjs sync lands new data in SQLite.
  useDataChangedRefresh(() => { loadData(); });

  const loadData = async (customRange?: { start: string; end: string }) => {
    const range = customRange || currentRange;

    try {
      // Fetch independently so one failing call (e.g. a permission error on
      // get-items/get-sales) can't blank out the entire page including charts.
      const [anRes, dbRes, itemsRes, actRes, salesRes] = await Promise.allSettled([
        window.api.getAnalytics(period, range),
        window.api.getDashboardStats(),
        window.api.getItems({}),
        window.api.getRecentActivity(10, range),
        window.api.getSales({ startDate: range.start, endDate: range.end }),
      ]);

      if (anRes.status === "fulfilled") {
        console.log("[Analytics] getAnalytics ok:", JSON.stringify({
          period,
          range,
          salesDataPoints: anRes.value?.salesData?.length ?? 0,
          salesData: anRes.value?.salesData,
        }));
        setData(anRes.value);
      }
      else console.error("[Analytics] getAnalytics failed:", (anRes.reason as Error)?.message || anRes.reason);
      setDashboardStats(dbRes.status === "fulfilled" ? dbRes.value : null);
      setRecentActivity(actRes.status === "fulfilled" ? actRes.value || [] : []);
      setRawSales(salesRes.status === "fulfilled" ? salesRes.value || [] : []);
      if (actRes.status === "rejected") console.error("getRecentActivity failed:", (actRes.reason as Error)?.message || actRes.reason);
      if (salesRes.status === "rejected") console.error("getSales failed:", (salesRes.reason as Error)?.message || salesRes.reason);

      if (itemsRes.status === "fulfilled" && itemsRes.value) {
        const items = itemsRes.value;
        const val = items.reduce(
          (s: number, i: any) => s + i.totalBaseQuantity * i.basePurchasePrice,
          0,
        );
        setInventoryValue(val);

        const lowStock = items
          .filter((i: any) => i.totalBaseQuantity <= 10)
          .sort((a: any, b: any) => a.totalBaseQuantity - b.totalBaseQuantity);
        setLowStockItems(lowStock);
      } else if (itemsRes.status === "rejected") {
        console.error("getItems failed:", (itemsRes.reason as Error)?.message || itemsRes.reason);
      }
    } catch (e: any) {
      console.error(e.message || 'Failed to load analytics');
    }
  };

  const chartData = useMemo(() => {
    if (!data) return [];

    let name = (s: any) => {
      let n = s.date;
      try {
        const d = new Date(s.date);
        if (period === "year" && !dateRange.start) {
          n = d.toLocaleDateString(language, { month: "short" });
        } else if (period === "today") {
          n = d.toLocaleTimeString(language, {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          n = d.toLocaleDateString(language, {
            month: "short",
            day: "numeric",
          });
        }
      } catch (e) {}

      return n;
    };

    return data.salesData.map((s) => ({
      name: name(s),
      revenue: s.revenue,
      profit: s.profit,
    }));
  }, [data, period, language, dateRange]);

  const salesDistribution = useMemo(() => {
    if (!rawSales.length) return { title: '', subtitle: '', data: [], dataKey: '' };
    const range = currentRange;
    const start = range.start ? new Date(range.start) : null;
    const end = range.end ? new Date(range.end) : null;
    const daySpan = start && end ? Math.ceil((end.getTime() - start.getTime()) / 86400000) : 0;

    let granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
    if (period === 'today') granularity = 'hourly';
    else if (period === 'week') granularity = 'daily';
    else if (period === 'month') granularity = 'weekly';
    else if (period === 'year') granularity = 'monthly';
    else if (period === 'custom') {
      if (daySpan <= 1) granularity = 'hourly';
      else if (daySpan <= 14) granularity = 'daily';
      else if (daySpan <= 60) granularity = 'weekly';
      else granularity = 'monthly';
    }

    if (granularity === 'hourly') {
      const hourly = Array.from({ length: 24 }, (_, i) => ({ label: `${i.toString().padStart(2, '0')}:00`, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const h = new Date(s.createdAt).getHours();
        hourly[h].revenue += s.totalPrice || 0;
        hourly[h].count += 1;
      });
      return { title: t('analytics.by_hour') || 'Sales by Hour', subtitle: t('analytics.by_hour_desc') || 'Peak revenue hours', data: hourly, dataKey: 'label' };
    }

    if (granularity === 'daily') {
      const dayNames = [t('analytics.day_sun'), t('analytics.day_mon'), t('analytics.day_tue'), t('analytics.day_wed'), t('analytics.day_thu'), t('analytics.day_fri'), t('analytics.day_sat')];
      const days = dayNames.map((n) => ({ label: n, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt).getDay();
        days[d].revenue += s.totalPrice || 0;
        days[d].count += 1;
      });
      return { title: t('analytics.by_day') || 'Sales by Day', subtitle: t('analytics.by_day_desc') || 'Daily revenue pattern', data: days, dataKey: 'label' };
    }

    if (granularity === 'weekly') {
      const weeks = Array.from({ length: 5 }, (_, i) => ({ label: t('analytics.week_label', { number: i + 1 }), revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt);
        const day = d.getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
        weeks[weekIdx].revenue += s.totalPrice || 0;
        weeks[weekIdx].count += 1;
      });
      return { title: t('analytics.by_week') || 'Sales by Week', subtitle: t('analytics.by_week_desc') || 'Weekly revenue pattern', data: weeks, dataKey: 'label' };
    }

    const months = [t('common.month_jan'), t('common.month_feb'), t('common.month_mar'), t('common.month_apr'), t('common.month_may'), t('common.month_jun'), t('common.month_jul'), t('common.month_aug'), t('common.month_sep'), t('common.month_oct'), t('common.month_nov'), t('common.month_dec')];
    const monthly = months.map((n) => ({ label: n, revenue: 0, count: 0 }));
    rawSales.forEach((s) => {
      const m = new Date(s.createdAt).getMonth();
      monthly[m].revenue += s.totalPrice || 0;
      monthly[m].count += 1;
    });
    return { title: t('analytics.by_month') || 'Sales by Month', subtitle: t('analytics.by_month_desc') || 'Monthly revenue pattern', data: monthly, dataKey: 'label' };
  }, [rawSales, period, currentRange, language]);

  const paymentMethodBreakdown = useMemo(() => {
    if (!rawSales.length) return [];
    const groups: Record<string, number> = {};
    rawSales.forEach((sale) => {
      const method = (sale.paymentMethod || "cash").toLowerCase();
      groups[method] = (groups[method] || 0) + (sale.totalPrice || 0);
    });
    const total = Object.values(groups).reduce((s, v) => s + v, 0);
    return Object.entries(groups)
      .map(([method, amount]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [rawSales]);

  const insights = useMemo(() => {
    if (!data || !dashboardStats) return null;

    const todayRev = dashboardStats.todayRevenue || 0;
    const yestRev = dashboardStats.yesterdayRevenue || 0;

    let growth = 0;
    if (yestRev > 0) {
      growth = ((todayRev - yestRev) / yestRev) * 100;
    } else if (todayRev > 0) {
      growth = 100;
    }

    return {
      growth: (growth || 0).toFixed(1),
      isGrowthPositive: growth >= 0,
    };
  }, [data, dashboardStats]);

  const handleCustomSearch = () => {
    if (dateRange.start && dateRange.end) {
      loadData(dateRange);
    }
  };

  const formattedRange = useMemo(() => {
    if (!currentRange.start) return "";
    if (currentRange.start === currentRange.end)
      return formatDate(currentRange.start);
    return `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`;
  }, [currentRange, formatDate]);

  return (
    <div className="fade-in pb-24 relative min-h-screen bg-background text-foreground">
      <div className="px-4 md:px-8 lg:px-12 max-w-[1800px] mx-auto flex flex-col gap-y-8 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("tabs.analytics")}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("analytics.subtitle")}
              </p>
              {formattedRange && (
                <>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    {formattedRange}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pro Features / Smart Insights Bar */}
        <Card className="rounded-2xl shadow-sm border-border bg-card text-card-foreground">
          <CardContent className="p-3 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                {(["today", "week", "month", "year", "custom"] as const).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        period === p
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`analytics.${p}`)}
                    </button>
                  ),
                )}
              </div>

              {period === "custom" && (
                <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <Label
                      htmlFor="start"
                      className="text-xs font-bold uppercase text-muted-foreground"
                    >
                      {t("analytics.start_date")}
                    </Label>
                    <DatePicker
                      value={dateRange.start}
                      onChange={(v) => setDateRange((prev) => ({ ...prev, start: v }))}
                      className="w-auto bg-background border-none text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <Label
                      htmlFor="end"
                      className="text-xs font-bold uppercase text-muted-foreground"
                    >
                      {t("analytics.end_date")}
                    </Label>
                    <DatePicker
                      value={dateRange.end}
                      onChange={(v) => setDateRange((prev) => ({ ...prev, end: v }))}
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

            <div className="flex flex-wrap items-center gap-3">
              {insights && (
                <div
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wider uppercase bg-muted text-foreground border border-border`}
                >
                  {insights.isGrowthPositive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {t("analytics.today_vs_yesterday")}:{" "}
                  {Math.abs(Number(insights.growth))}%{" "}
                  {insights.isGrowthPositive
                    ? t("analytics.increase")
                    : t("analytics.decrease")}
                </div>
              )}

              {lowStockItems.length > 0 && (
                <div className="px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wider uppercase bg-muted text-foreground border border-border">
                  <AlertTriangle size={14} />
                  {t("analytics.low_on")} {lowStockItems.length}{" "}
                  {t("analytics.products")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1. Overview Cards (Period Based) */}
        <KpiVisibility storageKey="analytics-overview-kpis">
          {visible => visible ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-muted rounded-xl text-foreground">
                  <DollarSign size={20} />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase tracking-widest"
                >
                  {t(`analytics.${period}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                {t("common.sales")}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {t("common.etb")}{" "}
                {(data?.summary?.totalRevenue || 0).toLocaleString()}
              </h3>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-muted rounded-xl text-foreground">
                  <TrendingUp size={20} />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase tracking-widest"
                >
                  {t(`analytics.${period}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                {t("common.profit")}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {t("common.etb")}{" "}
                {(data?.summary?.totalProfit || 0).toLocaleString()}
              </h3>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-muted rounded-xl text-foreground">
                  <Zap size={20} />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase tracking-widest"
                >
                  {t(`analytics.${period}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1 relative z-10">
                {t("analytics.net_today")}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground relative z-10">
                {t("common.etb")}{" "}
                {(data?.summary?.netProfit || 0).toLocaleString()}
              </h3>
            </CardContent>
          </Card>
        </div>
          ) : null}
        </KpiVisibility>

        {/* Payment Method Breakdown */}
        <Card className="rounded-3xl shadow-sm border-border bg-gradient-to-t from-primary/5 to-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-muted text-foreground rounded-xl">
                <PieChart size={20} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                {t('analytics.payment_methods')}
              </h3>
            </div>
            <div className="space-y-4">
              {paymentMethodBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-6">
                  <PieChart size={24} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {t("analytics.no_sales_data")}
                  </p>
                </div>
              ) : (
                paymentMethodBreakdown.map((pm, i) => {
                  const isPredominant = i === 0 && pm.percentage > 50;
                  const icon =
                    pm.method === "Cash" ? (
                      <Banknote size={14} />
                    ) : pm.method === "Transfer" ? (
                      <ArrowRightLeft size={14} />
                    ) : (
                      <CreditCard size={14} />
                    );
                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1 rounded-lg ${isPredominant ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {icon}
                          </div>
                          <span
                            className={`text-xs font-bold ${isPredominant ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {pm.method}
                          </span>
                          {isPredominant && (
                            <span className="text-xs font-bold uppercase text-primary tracking-wider">
                              {t('analytics.most_used')}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold ${isPredominant ? "text-foreground" : ""}`}
                          >
                            {t("common.etb")} {pm.amount.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground ml-2">
                            ({pm.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isPredominant ? "bg-primary" : "bg-muted-foreground/30"}`}
                          style={{ width: `${pm.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Sales & Profit Trend (Full Row) */}
        <Card className="rounded-3xl shadow-sm flex flex-col border-border">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {t("analytics.sales_trend")}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    {t("analytics.performance_over_time")}
                  </p>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    {formattedRange}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {t("common.sales")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("common.profit")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <TrendingUp size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">{t('analytics.no_chart_data')}</p>
                  <p className="text-xs mt-1 opacity-60">{t('analytics.no_trend')}</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--foreground)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--foreground)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorProfit"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--muted-foreground)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--muted-foreground)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "var(--muted-foreground)",
                      fontWeight: 700,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "var(--muted-foreground)",
                      fontWeight: 700,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{
                      color: "var(--foreground)",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                    labelStyle={{
                      color: "var(--muted-foreground)",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t("common.sales")}
                    stroke="var(--foreground)"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name={t("common.profit")}
                    stroke="var(--muted-foreground)"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Debt Summary & Inventory Status (One Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden border-border">
            <CardContent className="p-6 md:p-8 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-muted text-foreground rounded-xl">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {t("analytics.debt_summary")}
                    </h3>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider mt-0.5">
                      {t("analytics.critical_metrics")}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {isModuleEnabled('customers') && (
                    <div>
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ArrowUpRight size={12} className="text-foreground" />
                        {t("analytics.customers_owe")}
                      </p>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {t("common.etb")}{" "}
                        {(dashboardStats?.activeDebts || 0).toLocaleString()}
                      </h3>
                    </div>
                  )}

                  <div className="h-px w-full bg-border" />

                  <div>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <TrendingDown
                        size={12}
                        className="text-muted-foreground"
                      />
                      {t("analytics.you_owe")}
                    </p>
                    <h3 className="text-3xl font-bold tracking-tight text-muted-foreground">
                      {t("common.etb")} 0
                    </h3>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-2xl border border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("analytics.inventory_value")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {t("common.etb")} {inventoryValue.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm flex flex-col h-full border-border">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-muted text-foreground rounded-xl">
                  <Package size={20} />
                </div>
                <h3 className="text-lg font-bold tracking-tight uppercase tracking-wider text-foreground">
                  {t("analytics.inventory_status")}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[300px]">
                {lowStockItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                    <Shield size={24} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {t("analytics.all_healthy")}
                    </p>
                  </div>
                ) : (
                  lowStockItems.slice(0, 15).map((item, i) => {
                    const isOut = item.totalBaseQuantity <= 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${isOut ? "bg-foreground" : "bg-muted-foreground"}`}
                          />
                          <div>
                            <p className="text-xs font-bold truncate max-w-[150px] text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {item.totalBaseQuantity}{" "}
                              {t("analytics.left_in_stock")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold bg-muted text-foreground border-border`}
                        >
                          {isOut ? t("analytics.out") : t("analytics.low")}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Sales Distribution (adapts to period tab) */}
        <Card className="rounded-3xl shadow-sm flex flex-col border-border bg-gradient-to-t from-primary/5 to-card">
          <CardContent className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-muted text-foreground rounded-xl">
                {period === 'today' ? <Clock size={20} /> : <Calendar size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {salesDistribution.title}
                </h3>
                <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider mt-0.5">
                  {salesDistribution.subtitle}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              {salesDistribution.data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <BarChart3 size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">{t('analytics.no_chart_data')}</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
                <BarChart
                  data={salesDistribution.data}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey={salesDistribution.dataKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 }}
                    dy={10}
                    interval={salesDistribution.data.length > 12 ? 2 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "var(--foreground)", fontSize: "12px", fontWeight: 700 }}
                    labelStyle={{
                      color: "var(--muted-foreground)", fontSize: "9px",
                      textTransform: "uppercase", fontWeight: 700, marginBottom: "6px",
                    }}
                    formatter={(value: any) => [`${t('common.etb')} ${(value ?? 0).toLocaleString()}`, t('analytics.revenue')]}
                  />
                  <Bar dataKey="revenue" name={t('analytics.revenue')} fill="url(#colorDist)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Top Products & Recent Activity (Period Based) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-3xl shadow-sm flex flex-col border-border">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted text-foreground rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight uppercase tracking-wider text-foreground">
                    {t("analytics.top_products")}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">
                  {formattedRange}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]">
                {(data?.topItems || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                    <Boxes size={24} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {t("analytics.no_sales_data")}
                    </p>
                  </div>
                ) : (
                  (data?.topItems || []).slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-border">
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold truncate text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {item.totalQty} {t("analytics.units_sold")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">
                          {t("common.etb")} {item.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm flex flex-col border-border">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted text-foreground rounded-xl">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight uppercase tracking-wider text-foreground">
                    {t("analytics.recent_activity")}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">
                  {formattedRange}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-0 pr-2 custom-scrollbar max-h-[400px]">
                {recentActivity.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                    <Activity size={24} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {t("analytics.no_activity")}
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity, i) => {
                    const isSale = activity.type === "sale";

                    return (
                      <div
                        key={i}
                        className="flex gap-4 py-3 border-b border-border last:border-0"
                      >
                        <div className="relative mt-0.5 h-fit">
                          {isSale && activity.itemImage ? (
                            <>
                              <img
                                src={activity.itemImage}
                                alt={activity.description || 'Product'}
                                className="h-8 w-8 rounded-lg object-cover ring-1 ring-border"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border">
                                <TrendingUp size={9} />
                              </span>
                            </>
                          ) : activity.userAvatar ? (
                            <>
                              <img
                                src={resolveAvatar(activity.userAvatar)}
                                alt={activity.userName || 'User'}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border">
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
                              {t("dashboard." + activity.type)}
                            </p>
                            <span
                              className={`text-xs font-bold text-foreground`}
                            >
                              {isSale ? "+" : "-"}
                              {t("common.etb")}{" "}
                              {activity.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
                            {activity.description ||
                              activity.extra ||
                              t("analytics.system_update")}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            {activity.userName && (
                              <span className="inline-flex items-center gap-1">
                                <img src={resolveAvatar(activity.userAvatar)} alt="" className="h-4 w-4 rounded-full object-cover" />
                                <span className="text-primary font-bold">{activity.isMe ? t('common.me', 'Me') : activity.userName}</span>
                              </span>
                            )}
                            {activity.userName ? " · " : ""}
                            {formatTime(activity.date)}{" "}
                            · {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 6. Sales by Category */}
        <CategorySalesChart data={data?.categoryBreakdown || []} />
      </div>
    </div>
  );
};

export default Analytics;
