import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Package,
  BarChart3, CreditCard, ShoppingCart, Receipt, PiggyBank,
  Loader2, AlertCircle, RefreshCw, Zap, Banknote
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useSettings } from '../context/SettingsContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayProfit: number;
  todaySales: number;
  yesterdaySales: number;
  yesterdayProfit: number;
  lowStock: number;
  activeDebts: number;
  totalItems: number;
}

interface AnalyticsData {
  salesData: { date: string; revenue: number; units: number; profit: number }[];
  expenseData: { date: string; amount: number }[];
  topItems: { name: string; totalQty: number; totalRevenue: number }[];
  summary: { totalRevenue: number; totalProfit: number; totalExpenses: number; netProfit: number };
}

const Summary: React.FC = () => {
  const { t } = useSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, anData, items] = await Promise.all([
        window.api?.getDashboardStats() || Promise.resolve({} as DashboardStats),
        window.api?.getAnalytics('month') || Promise.resolve({ salesData: [], expenseData: [], topItems: [], summary: { totalRevenue: 0, totalProfit: 0, totalExpenses: 0, netProfit: 0 } }),
        window.api?.getItems({}) || Promise.resolve([])
      ]);
      setStats(statData);
      setAnalytics(anData);

      if (items) {
        const val = items.reduce((s: number, i: any) => s + (i.totalBaseQuantity * i.basePurchasePrice), 0);
        setInventoryValue(val);
      }
    } catch (e: any) {
      setError(e.message || t('summary.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const totalSales = analytics?.summary?.totalRevenue || 0;
  const totalExpenses = analytics?.summary?.totalExpenses || 0;
  const netCashFlow = analytics?.summary?.netProfit || 0;
  const activeDebts = stats?.activeDebts || 0;
  const lowStock = stats?.lowStock || 0;

  const revenueScore = totalSales > 0 ? Math.min((totalSales / (totalSales + totalExpenses + 1)) * 100, 100) : 0;
  const expenseRatio = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;
  const profitMargin = totalSales > 0 ? (netCashFlow / totalSales) * 100 : 0;

  const pulseData = useMemo(() => {
    if (!analytics?.salesData) return [];
    const now = new Date();
    const days: { label: string; revenue: number; expense: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const sale = analytics.salesData.find(s => s.date === dateStr);
      const expense = analytics.expenseData.find(e => e.date === dateStr);
      const loc = 'en-US';
      days.push({
        label: d.toLocaleDateString(loc, { weekday: 'short' }),
        revenue: sale?.revenue || 0,
        expense: expense?.amount || 0
      });
    }
    return days;
  }, [analytics]);

  const topProduct = analytics?.topItems?.[0]?.name || null;

  const getExpenseStatusColor = (ratio: number) => {
    if (ratio <= 40) return 'text-green-500';
    if (ratio <= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getExpenseStatusBg = (ratio: number) => {
    if (ratio <= 40) return 'bg-green-500/10 border-green-500/20';
    if (ratio <= 70) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getScoreStatusColor = (score: number) => {
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreStatusBg = (score: number) => {
    if (score >= 60) return 'bg-green-500/10 border-green-500/20';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getProfitStatusColor = (margin: number) => {
    if (margin >= 25) return 'text-green-500';
    if (margin >= 10) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProfitStatusBg = (margin: number) => {
    if (margin >= 25) return 'bg-green-500/10 border-green-500/20';
    if (margin >= 10) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 fade-in">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="px-4 lg:px-6">
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData} className="ml-auto shrink-0">
                <RefreshCw className="h-4 w-4 mr-1" /> {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t('common.no_data')}</p>
        </div>
      ) : (
        <>
          <div className="px-4 lg:px-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {t('summary.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('summary.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-4 @xl/main:grid-cols-2">
            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <ShoppingCart size={20} />
                  </div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">
                    {t('summary.total_sales')}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">
                  {t('summary.total_sales')}
                </p>
                <h3 className="text-2xl font-black tracking-tight">
                  {t('common.etb')} {totalSales.toLocaleString()}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <Receipt size={20} />
                  </div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">
                    {t('summary.total_expenses')}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">
                  {t('summary.total_expenses')}
                </p>
                <h3 className="text-2xl font-black tracking-tight">
                  {t('common.etb')} {totalExpenses.toLocaleString()}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <PiggyBank size={20} />
                  </div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">
                    {t('summary.net_cashflow')}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">
                  {t('summary.net_cashflow')}
                </p>
                <h3 className={`text-2xl font-black tracking-tight ${netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {t('common.etb')} {netCashFlow.toLocaleString()}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <CreditCard size={20} />
                  </div>
                  <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">
                    {t('summary.active_debts')}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">
                  {t('summary.active_debts')}
                </p>
                <h3 className={`text-2xl font-black tracking-tight ${activeDebts > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {t('common.etb')} {activeDebts.toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                {t('summary.financial_summary')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <BarChart3 size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.revenue_score')}
                    </p>
                  </div>
                  <p className={`text-3xl font-black tracking-tight ${getScoreStatusColor(revenueScore)}`}>
                    {revenueScore.toFixed(1)}%
                  </p>
                  <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${revenueScore >= 60 ? 'bg-green-500' : revenueScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${revenueScore}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`mt-3 text-xs font-black uppercase tracking-widest ${getScoreStatusBg(revenueScore)}`}>
                    {revenueScore >= 60 ? t('summary.healthy') : revenueScore >= 40 ? t('summary.needs_attention') : t('summary.critical')}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <TrendingDown size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.expense_ratio')}
                    </p>
                  </div>
                  <p className={`text-3xl font-black tracking-tight ${getExpenseStatusColor(expenseRatio)}`}>
                    {expenseRatio.toFixed(1)}%
                  </p>
                  <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${expenseRatio <= 40 ? 'bg-green-500' : expenseRatio <= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`mt-3 text-xs font-black uppercase tracking-widest ${getExpenseStatusBg(expenseRatio)}`}>
                    {expenseRatio <= 40 ? t('summary.healthy') : expenseRatio <= 70 ? t('summary.needs_attention') : t('summary.critical')}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <TrendingUp size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.profit_margin')}
                    </p>
                  </div>
                  <p className={`text-3xl font-black tracking-tight ${getProfitStatusColor(profitMargin)}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                  <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${profitMargin >= 25 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(Math.min(profitMargin, 100), 0)}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`mt-3 text-xs font-black uppercase tracking-widest ${getProfitStatusBg(profitMargin)}`}>
                    {profitMargin >= 25 ? t('summary.healthy') : profitMargin >= 10 ? t('summary.needs_attention') : t('summary.critical')}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <Card className="rounded-3xl border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">
                      {t('summary.performance_pulse')}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t('summary.subtitle')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-0 sm:px-6">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pulseData} barGap={2} barCategoryGap="20%">
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 700 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v ?? 0) >= 1000 ? `${((v ?? 0) / 1000).toFixed(0)}k` : `${v ?? 0}`}
                        width={36}
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 700 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--foreground)', fontSize: '11px', fontWeight: 700 }}
                        labelStyle={{ color: 'var(--muted-foreground)', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}
                      />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={32} name={t('summary.total_sales')} />
                      <Bar dataKey="expense" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} maxBarSize={32} name={t('summary.total_expenses')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                {t('summary.insights')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <Zap size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.total_sales')}
                    </p>
                  </div>
                  <p className="text-xl font-black tracking-tight truncate">
                    {topProduct || t('common.no_data')}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {t('summary.top_selling_product')}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <Package size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.inventory_health')}
                    </p>
                  </div>
                  <p className="text-xl font-black tracking-tight">
                    {lowStock}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {t('summary.low_stock_alerts')}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <AlertTriangle size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.active_debts')}
                    </p>
                  </div>
                  <p className={`text-xl font-black tracking-tight ${activeDebts > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                    {t('common.etb')} {activeDebts.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {t('summary.debt_alert')}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-muted rounded-xl text-foreground">
                      <Banknote size={18} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.net_cashflow')}
                    </p>
                  </div>
                  <p className={`text-xl font-black tracking-tight ${netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {t('common.etb')} {netCashFlow.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {netCashFlow >= 0 ? t('summary.positive_cash_flow') : t('summary.negative_cash_flow')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <Card className="rounded-3xl border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl text-foreground">
                    <Package size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">
                      {t('summary.inventory_health')}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t('summary.subtitle')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
                  <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.inventory_value')}
                    </p>
                    <p className="text-2xl font-black">
                      {t('common.etb')} {inventoryValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.total_sales')}
                    </p>
                    <p className="text-2xl font-black">
                      {totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card/40 p-4 space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {t('summary.active_debts')}
                    </p>
                    <p className="text-2xl font-black">
                      {activeDebts.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Summary;
