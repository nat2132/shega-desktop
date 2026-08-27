import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus, Wallet, RefreshCcw, Download,
  PieChart, Trash2, Copy, AlertTriangle,
  Clock, BarChart3, FileText, Eye, TrendingUp
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { SectionCards } from '../components/section-cards';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Modal from '../components/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { exportCSV, exportPDF } from '../lib/export-utils';
import { toEthiopianDate, fromEthiopianDate, getEthiopianMonthName } from '../utils/ethiopian-calendar';

const BUDGET_CATEGORY_VALUES = [
  'Employee Salaries/Labor', 'Rent', 'Utilities (Electricity, Water, Internet)',
  'Transportation', 'Inventory Purchases', 'Marketing & Advertising',
  'Maintenance & Repairs', 'Taxes & Government Fees', 'Loan Repayments',
  'Miscellaneous Expenses',
];

const BUDGET_CATEGORY_KEYS = [
  'budgets.category_employee_salaries', 'budgets.category_rent', 'budgets.category_utilities',
  'budgets.category_transportation', 'budgets.category_inventory_purchases', 'budgets.category_marketing',
  'budgets.category_maintenance', 'budgets.category_taxes', 'budgets.category_loan',
  'budgets.category_misc',
];

const BUDGET_TYPES = [
  { id: 'business', label: 'budgets.type_business' },
  { id: 'department', label: 'budgets.type_department' },
  { id: 'project', label: 'budgets.type_project' },
  { id: 'branch', label: 'budgets.type_branch' },
];

const PERIODS = [
  { id: 'monthly', label: 'budgets.monthly' },
  { id: 'quarterly', label: 'budgets.quarterly' },
  { id: 'yearly', label: 'budgets.yearly' },
];

const statusConfig: Record<string, { color: string; bg: string; labelKey: string }> = {
  healthy: { color: 'text-green-600', bg: 'bg-green-100', labelKey: 'budgets.status_healthy' },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', labelKey: 'budgets.status_warning' },
  critical: { color: 'text-red-600', bg: 'bg-red-100', labelKey: 'budgets.status_critical' },
};

const BudgetManagement: React.FC = () => {
  const { t, formatDate, currentBusiness, calendarType } = useSettings();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [adjustments] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const isEthiopian = calendarType === 'ethiopian';

  // Filters - always store Gregorian values internally, convert for display
  const [period, setPeriod] = useState('monthly');
  const [budgetType, setBudgetType] = useState('business');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [ethMonth, setEthMonth] = useState(String(toEthiopianDate(new Date()).month).padStart(2, '0'));
  const [ethYear, setEthYear] = useState(String(toEthiopianDate(new Date()).year));

  // Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // Detail view state
  const [detailBudget, setDetailBudget] = useState<any>(null);
  const [detailExpenses, setDetailExpenses] = useState<any[]>([]);
  const [detailAdjustments, setDetailAdjustments] = useState<any[]>([]);
  const [detailAlerts, setDetailAlerts] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: BUDGET_CATEGORY_VALUES[0],
    amount: '',
    period: 'monthly',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    budgetType: 'business',
    referenceName: '',
    isRecurring: false,
    notes: '',
  });

  const ethToGreg = (ethM: string, ethY: string) => {
    const g = fromEthiopianDate(parseInt(ethY), parseInt(ethM), 1);
    return { month: String(g.getMonth() + 1).padStart(2, '0'), year: String(g.getFullYear()) };
  };

  const gregToEth = (gM: string, gY: string) => {
    const gDate = new Date(parseInt(gY), parseInt(gM) - 1, 1);
    const e = toEthiopianDate(gDate);
    return { month: String(e.month).padStart(2, '0'), year: String(e.year) };
  };

  const handleMonthChange = (val: string) => {
    if (isEthiopian) {
      setEthMonth(val);
      const g = ethToGreg(val, ethYear);
      setSelectedMonth(g.month);
      setSelectedYear(g.year);
    } else {
      setSelectedMonth(val);
    }
  };

  const handleYearChange = (val: string) => {
    if (isEthiopian) {
      setEthYear(val);
      const g = ethToGreg(ethMonth, val);
      setSelectedMonth(g.month);
      setSelectedYear(g.year);
    } else {
      setSelectedYear(val);
    }
  };

  const monthOptions = isEthiopian
    ? Array.from({ length: 13 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0');
        return { value: m, label: getEthiopianMonthName(i) };
      })
    : Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0');
        const monthKeys = ['budgets.month_jan','budgets.month_feb','budgets.month_mar','budgets.month_apr','budgets.month_may','budgets.month_jun','budgets.month_jul','budgets.month_aug','budgets.month_sep','budgets.month_oct','budgets.month_nov','budgets.month_dec'];
        return { value: m, label: t(monthKeys[i]) };
      });

  const displayMonth = isEthiopian ? ethMonth : selectedMonth;
  const displayYear = isEthiopian ? ethYear : selectedYear;
  const monthKeys = ['budgets.month_jan','budgets.month_feb','budgets.month_mar','budgets.month_apr','budgets.month_may','budgets.month_jun','budgets.month_jul','budgets.month_aug','budgets.month_sep','budgets.month_oct','budgets.month_nov','budgets.month_dec'];
  const periodLabel = isEthiopian
    ? `${getEthiopianMonthName(parseInt(displayMonth) - 1)} ${displayYear}`
    : `${t(monthKeys[parseInt(selectedMonth) - 1])} ${selectedYear}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsData, alertsData, reportData, forecastData] = await Promise.all([
        window.api?.getBudgets({ period, month: selectedMonth, year: selectedYear, budgetType }) || Promise.resolve([]),
        window.api?.getBudgetAlerts({ acknowledged: false, limit: 20 }) || Promise.resolve([]),
        window.api?.getBudgetReport({ month: selectedMonth, year: selectedYear }) || Promise.resolve({}),
        window.api?.getBudgetForecast({ months: 3 }) || Promise.resolve([]),
      ]);
      setBudgets(budgetsData);
      setAlerts(alertsData);
      setReport(reportData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Failed to load budget data:', err);
    }
    setLoading(false);
  }, [period, selectedMonth, selectedYear, budgetType]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetBudget = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t('budgets.budget_amount_error'));
      return;
    }
    await window.api?.setBudget({
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      month: formData.month,
      year: formData.year,
      budgetType: formData.budgetType,
      referenceName: formData.referenceName || null,
      isRecurring: formData.isRecurring,
      notes: formData.notes || null,
    });
    toast.success(editingBudget ? t('budgets.budget_updated') : t('budgets.budget_set_success'));
    setShowBudgetModal(false);
    setEditingBudget(null);
    resetForm();
    loadData();
  };

  const handleDeleteBudget = async (id: number) => {
    await window.api?.deleteBudget(id);
    toast.success(t('budgets.budget_deleted_msg'));
    loadData();
  };

  const handleDuplicate = async () => {
    const targetMonth = document.getElementById('dupMonth') as HTMLSelectElement;
    const targetYear = document.getElementById('dupYear') as HTMLSelectElement;
    const toMonth = targetMonth?.value || selectedMonth;
    const toYear = targetYear?.value || selectedYear;

    const result = await window.api?.duplicateBudget(
      { month: selectedMonth, year: selectedYear },
      toMonth, toYear
    );
    if (result?.count && result.count > 0) {
      toast.success(t('budgets.duplicate_count', { count: result.count }));
      setShowDuplicateModal(false);
      loadData();
    } else {
      toast(t('budgets.duplicate_exists'));
    }
  };

  const handleCreateAdjustment = async () => {
    if (!showAdjustModal) return;
    const reason = (document.getElementById('adjReason') as HTMLTextAreaElement)?.value;
    if (!reason) { toast.error(t('budgets.adjust_reason_required')); return; }
    const newAmount = parseFloat((document.getElementById('adjAmount') as HTMLInputElement)?.value);
    if (!newAmount || newAmount <= 0) { toast.error(t('budgets.adjust_amount_required')); return; }

    await window.api?.createBudgetAdjustment({
      budgetId: showAdjustModal.id,
      previousAmount: showAdjustModal.amount,
      newAmount,
      reason,
      status: 'approved',
      requestedBy: 'Admin',
    });
    toast.success(t('budgets.budget_adjusted'));
    setShowAdjustModal(null);
    loadData();
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (!report?.categories) return;
    const headers = [
      t('budgets.col_category'), t('budgets.col_planned'), t('budgets.col_actual'),
      t('budgets.col_remaining'), t('budgets.col_used_percent'), t('budgets.col_status')
    ];
    const rows = report.categories.map((c: any) => [
      c.category,
      `${t('common.etb')} ${c.planned.toLocaleString()}`,
      `${t('common.etb')} ${c.actual.toLocaleString()}`,
      `${t('common.etb')} ${c.remaining.toLocaleString()}`,
      `${c.usagePercent}%`,
      c.status,
    ]);
    const filename = `budget-report-${periodLabel.replace(/\s+/g, '-')}`;
    if (type === 'csv') {
      exportCSV(headers, rows, filename);
    } else {
      exportPDF(t('budgets.report_title', { period: periodLabel }), headers, rows, filename, undefined, undefined, currentBusiness);
    }
    toast.success(t('budgets.export_success', { type: type.toUpperCase() }));
  };

  const resetForm = () => {
    setFormData({
    category: BUDGET_CATEGORY_VALUES[0],
      amount: '',
      period: 'monthly',
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      year: String(new Date().getFullYear()),
      budgetType: 'business',
      referenceName: '',
      isRecurring: false,
      notes: '',
    });
  };

  const openEditBudget = (budget: any) => {
    setFormData({
      category: budget.category,
      amount: String(budget.amount),
      period: budget.period,
      month: budget.month || selectedMonth,
      year: budget.year || selectedYear,
      budgetType: budget.budgetType || 'business',
      referenceName: budget.referenceName || '',
      isRecurring: !!budget.isRecurring,
      notes: budget.notes || '',
    });
    setEditingBudget(budget);
    setShowBudgetModal(true);
  };

  const openBudgetDetails = async (budget: any) => {
    setDetailBudget(budget);
    setDetailLoading(true);
    try {
      const [exps, adjs, alerts] = await Promise.all([
        window.api?.getExpenses({ category: budget.category, limit: 200 }) || Promise.resolve([]),
        window.api?.getBudgetAdjustments(budget.id) || Promise.resolve([]),
        window.api?.getBudgetAlerts({ acknowledged: false, limit: 50 }) || Promise.resolve([]),
      ]);
      setDetailExpenses(exps);
      setDetailAdjustments(adjs);
      setDetailAlerts((alerts || []).filter((a: any) => a.category === budget.category));
    } catch (err) {
      console.error('Failed to load budget details:', err);
      setDetailExpenses([]);
      setDetailAdjustments([]);
      setDetailAlerts([]);
    }
    setDetailLoading(false);
  };

  const detailTrend = useMemo(() => {
    if (!detailBudget) return [];
    const map: Record<string, number> = {};
    for (const e of detailExpenses) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + e.amount;
    }
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const max = map[key] || 0;
      return {
        key,
        label: `${t(monthKeys[d.getMonth()])}`,
        total: max,
        max,
        height: Math.max(8, Math.min(100, (max / Math.max(...Object.values(map), 1)) * 100)),
      };
    });
  }, [detailBudget, detailExpenses, t, monthKeys]);

  const healthScore = report
    ? Math.max(0, Math.min(100, Math.round(100 - (report.usagePercent || 0))))
    : 100;

  const dashboardCards = useMemo(() => [
    {
      title: t('budgets.total_budget'),
      value: `${t('common.etb')} ${(report?.totalPlanned || 0).toLocaleString()}`,
      trend: '0%',
      trendType: 'up' as const,
      footerTitle: t('budgets.planned_budget'),
      footerSub: t('budgets.for_period', { period: periodLabel }),
    },
    {
      title: t('budgets.total_spent'),
      value: `${t('common.etb')} ${(report?.totalSpent || 0).toLocaleString()}`,
      trend: `${report?.usagePercent || 0}%`,
      trendType: (report?.usagePercent || 0) > 50 ? 'up' as const : 'down' as const,
      footerTitle: t('budgets.budget_used'),
      footerSub: t('budgets.percent_of_total', { percent: (report?.usagePercent || 0) }),
    },
    {
      title: t('budgets.remaining'),
      value: `${t('common.etb')} ${(report?.remaining || 0).toLocaleString()}`,
      trend: report?.remaining > 0 ? '+' + ((report.remaining / (report.totalPlanned || 1)) * 100).toFixed(1) + '%' : '0%',
      trendType: report?.remaining > 0 ? 'up' as const : 'down' as const,
      footerTitle: report?.remaining > 0 ? t('budgets.under_budget') : t('budgets.over_budget'),
      footerSub: `${Math.abs(report?.remaining || 0) > 0 ? t('budgets.remaining_funds') : t('budgets.no_funds')}`,
    },
    {
      title: t('budgets.budget_health'),
      value: `${healthScore}%`,
      trend: healthScore >= 50 ? t('budgets.healthy') : t('budgets.critical'),
      trendType: healthScore >= 50 ? 'up' as const : 'down' as const,
      footerTitle: healthScore >= 50 ? t('budgets.good_shape') : t('budgets.needs_attention'),
      footerSub: healthScore >= 50 ? t('budgets.within_targets') : t('budgets.review_spending'),
    },
  ], [report, healthScore, t, periodLabel]);

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('budgets.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium">{t('budgets.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={displayMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-36 h-9 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={displayYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-28 h-9 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: isEthiopian ? 5 : 5 }, (_, i) => {
                  const base = isEthiopian ? parseInt(ethYear) - 2 : new Date().getFullYear() - 2;
                  const y = String(base + i);
                  return <SelectItem key={y} value={y}>{isEthiopian ? t('budgets.ethiopian_year', { year: y }) : y}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28 h-9 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  {PERIODS.map(p => <SelectItem key={p.id} value={p.id}>{t(p.label)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={loadData} className="h-9">
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.refresh')}
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-2xl">
          <TabsTrigger value="dashboard" className="text-xs font-bold uppercase tracking-widest rounded-xl">
            <PieChart className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.tab_dashboard')}
          </TabsTrigger>
          <TabsTrigger value="budgets" className="text-xs font-bold uppercase tracking-widest rounded-xl">
            <Wallet className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.tab_budgets')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-bold uppercase tracking-widest rounded-xl">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.tab_reports')}
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="text-xs font-bold uppercase tracking-widest rounded-xl">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.tab_adjustments')}
          </TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs font-bold uppercase tracking-widest rounded-xl">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.tab_forecast')}
          </TabsTrigger>
        </TabsList>

        {/* ==================== DASHBOARD TAB ==================== */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <SectionCards cards={dashboardCards} />

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" /> {t('budgets.active_alerts', { count: alerts.length })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-yellow-200">
                    <div>
                      <p className="text-xs font-bold">{alert.category} - {alert.alertType}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs font-bold" onClick={async () => {
                      await window.api?.acknowledgeBudgetAlert(alert.id);
                      loadData();
                    }}>
                      {t('budgets.dismiss')}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Spending Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('budgets.category_breakdown')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report?.categories?.sort((a: any, b: any) => b.actual - a.actual).slice(0, 8).map((cat: any) => {
                const st = statusConfig[cat.status] || statusConfig.healthy;
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          {t('common.etb')}{cat.actual.toLocaleString()} / {t('common.etb')}{cat.planned.toLocaleString()}
                        </span>
                        <Badge className={`${st.bg} ${st.color} text-xs font-black border-0`}>{t(st.labelKey)}</Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cat.status === 'exceeded' ? 'bg-red-500' : cat.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(cat.usagePercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{t('budgets.percent_used', { percent: cat.usagePercent })}</span>
                  </div>
                );
              })}
              {(!report?.categories || report.categories.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">{t('budgets.no_budgets_period')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== BUDGETS TAB ==================== */}
        <TabsContent value="budgets" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={budgetType} onValueChange={setBudgetType}>
                <SelectTrigger className="w-44 h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_TYPES.map(bt => <SelectItem key={bt.id} value={bt.id}>{t(bt.label)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setShowDuplicateModal(true)} className="h-9 text-xs font-bold">
                <Copy className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.duplicate_from_previous')}
              </Button>
            </div>
            <Button size="sm" onClick={() => { setEditingBudget(null); resetForm(); setShowBudgetModal(true); }} className="h-9 text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.set_budget')}
            </Button>
          </div>

          <div className="grid gap-3">
            {budgets.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground font-medium">
                {t('budgets.empty_state')}
              </div>
            ) : (
              budgets.map((budget: any) => {
                const st = budget.usagePercent > 100 ? statusConfig.critical : budget.usagePercent >= 80 ? statusConfig.warning : statusConfig.healthy;
                return (
                  <Card key={budget.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">{budget.category}</h3>
                            {budget.isRecurring ? <Badge variant="outline" className="text-xs font-black h-4 border-blue-200 text-blue-600 bg-blue-50">{t('budgets.recurring')}</Badge> : null}
                            <Badge className={`${st.bg} ${st.color} text-xs font-black border-0`}>{t(st.labelKey)}</Badge>
                          </div>
                          {budget.referenceName && <p className="text-xs text-muted-foreground mt-0.5">{budget.referenceName}</p>}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">{t('budgets.budget')}</p>
                            <p className="font-black">{t('common.etb')}{budget.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">{t('budgets.spent')}</p>
                            <p className="font-black">{t('common.etb')}{(budget.spent || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">{t('budgets.remaining')}</p>
                            <p className={`font-black ${budget.remaining < 0 ? 'text-red-600' : ''}`}>{t('common.etb')}{(budget.remaining || 0).toLocaleString()}</p>
                          </div>
                          <div className="w-24">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${budget.usagePercent >= 100 ? 'bg-red-500' : budget.usagePercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(budget.usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">{t('budgets.percent_used', { percent: budget.usagePercent })}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openBudgetDetails(budget)} title={t('budgets.view_details')}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditBudget(budget)}>
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteBudget(budget.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowAdjustModal(budget)} title={t('budgets.adjust_btn_title')}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ==================== REPORTS TAB ==================== */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest">
              {t('budgets.planned_vs_actual', { period: periodLabel })}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport('csv')} className="h-9 text-xs font-bold">
                <Download className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.export_csv')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} className="h-9 text-xs font-bold">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.export_pdf')}
              </Button>
            </div>
          </div>

          {report?.categories && report.categories.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.total_planned')}</p>
                    <p className="text-xl font-black mt-1">{t('common.etb')}{report.totalPlanned.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.total_spent')}</p>
                    <p className="text-xl font-black mt-1">{t('common.etb')}{report.totalSpent.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.remaining')}</p>
                    <p className={`text-xl font-black mt-1 ${report.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{t('common.etb')}{report.remaining.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.usage')}</p>
                    <p className="text-xl font-black mt-1">{report.usagePercent}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">{t('budgets.category_breakdown')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_category')}</th>
                          <th className="text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_planned')}</th>
                          <th className="text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_actual')}</th>
                          <th className="text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_remaining')}</th>
                          <th className="text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_used_percent')}</th>
                          <th className="text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground">{t('budgets.col_status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.categories.map((cat: any) => {
                          const st = statusConfig[cat.status] || statusConfig.healthy;
                          return (
                            <tr key={cat.category} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="py-3 px-2 font-bold">{cat.category}</td>
                              <td className="py-3 px-2 text-right">{t('common.etb')}{cat.planned.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">{t('common.etb')}{cat.actual.toLocaleString()}</td>
                              <td className={`py-3 px-2 text-right font-bold ${cat.remaining < 0 ? 'text-red-600' : ''}`}>{t('common.etb')}{cat.remaining.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className={`h-full rounded-full ${cat.status === 'exceeded' ? 'bg-red-500' : cat.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(cat.usagePercent, 100)}%` }} />
                                  </div>
                                  <span>{cat.usagePercent}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Badge className={`${st.bg} ${st.color} text-xs font-black border-0`}>{t(st.labelKey)}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground font-medium">
              {t('budgets.no_data_period')}
            </div>
          )}
        </TabsContent>

        {/* ==================== ADJUSTMENTS TAB ==================== */}
        <TabsContent value="adjustments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('budgets.adjustment_history')}</CardTitle>
              <CardDescription>{t('budgets.adjustment_history_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {adjustments.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground font-medium">
                  {t('budgets.no_adjustments')}
                </p>
              ) : (
                <div className="space-y-3">
                  {adjustments.map((adj: any) => (
                    <div key={adj.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                      <div>
                        <p className="text-xs font-bold">{adj.reason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('common.etb')}{adj.previousAmount.toLocaleString()} → {t('common.etb')}{adj.newAmount.toLocaleString()}
                          {adj.approvedBy ? ` • ${t('budgets.approved_by', { name: adj.approvedBy })}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs font-black border-0 ${adj.status === 'approved' ? 'bg-green-100 text-green-700' : adj.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {adj.status === 'approved' ? t('budgets.status_approved') : adj.status === 'pending' ? t('budgets.status_pending') : t('budgets.status_rejected')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(adj.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== FORECAST TAB ==================== */}
        <TabsContent value="forecast" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('budgets.forecast_title')}</CardTitle>
              <CardDescription>{t('budgets.forecast_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {forecast.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground font-medium">
                  {t('budgets.forecast_no_data')}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {forecast.map((f: any) => (
                    <Card key={`${f.month}-${f.year}`} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{f.label}</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{t('budgets.budgeted_label')}</span>
                            <span className="font-bold">{t('common.etb')}{f.planned.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{t('budgets.estimated_label')}</span>
                            <span className="font-bold">{t('common.etb')}{f.estimated.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{t('budgets.variance_label')}</span>
                            <span className={`font-bold ${f.planned - f.estimated < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {t('common.etb')}{(f.planned - f.estimated).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== SET BUDGET MODAL ==================== */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => { setShowBudgetModal(false); setEditingBudget(null); }}
        title={editingBudget ? t('budgets.edit_budget') : t('budgets.set_budget')}
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.budget_type')}</label>
            <Select
              value={formData.budgetType}
              onValueChange={(v) => setFormData({ ...formData, budgetType: v })}
            >
              <SelectTrigger className="w-full h-10 text-xs font-bold rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_TYPES.map(bt => <SelectItem key={bt.id} value={bt.id}>{t(bt.label)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {formData.budgetType !== 'business' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {formData.budgetType === 'department' ? t('budgets.department_name') : formData.budgetType === 'project' ? t('budgets.project_name') : t('budgets.branch_name')}
              </label>
              <Input
                value={formData.referenceName}
                onChange={e => setFormData({ ...formData, referenceName: e.target.value })}
                placeholder={t('budgets.enter_name_placeholder', { type: formData.budgetType })}
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.category')}</label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="w-full h-10 text-xs font-bold rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORY_VALUES.map((c, i) => <SelectItem key={c} value={c}>{t(BUDGET_CATEGORY_KEYS[i])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.planned_amount')}</label>
            <Input
              type="number"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder={t('budgets.amount_placeholder')}
              className="h-10 text-sm font-bold rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.period')}</label>
              <Select
                value={formData.period}
                onValueChange={(v) => setFormData({ ...formData, period: v })}
              >
                <SelectTrigger className="w-full h-10 text-xs font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => <SelectItem key={p.id} value={p.id}>{t(p.label)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.period_month')}</label>
              <Select
                value={isEthiopian ? gregToEth(formData.month, formData.year).month : formData.month}
                onValueChange={(v) => {
                  if (isEthiopian) {
                    const g = ethToGreg(v, gregToEth(formData.month, formData.year).year);
                    setFormData({ ...formData, month: g.month, year: g.year });
                  } else {
                    setFormData({ ...formData, month: v });
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 text-xs font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(isEthiopian ? monthOptions : Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    const mk = ['budgets.month_jan','budgets.month_feb','budgets.month_mar','budgets.month_apr','budgets.month_may','budgets.month_jun','budgets.month_jul','budgets.month_aug','budgets.month_sep','budgets.month_oct','budgets.month_nov','budgets.month_dec'];
                    return { value: m, label: t(mk[i]) };
                  })).map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="rounded border-border"
            />
            <label htmlFor="isRecurring" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('budgets.recurring_label')}
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.notes_label')}</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('budgets.notes_placeholder')}
              className="w-full h-20 px-3 py-2 text-xs font-medium rounded-xl border border-border bg-background resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSetBudget} className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              {editingBudget ? t('budgets.update_budget') : t('budgets.set_budget')}
            </Button>
            <Button variant="outline" onClick={() => { setShowBudgetModal(false); setEditingBudget(null); }} className="py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== ADJUST BUDGET MODAL ==================== */}
      <Modal
        isOpen={!!showAdjustModal}
        onClose={() => setShowAdjustModal(null)}
        title={t('budgets.adjust_budget_title', { category: showAdjustModal?.category || '' })}
        size="sm"
      >
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium">{t('budgets.current_budget')}</p>
            <p className="font-black text-lg">{t('common.etb')}{(showAdjustModal?.amount || 0).toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.new_amount')}</label>
            <Input
              id="adjAmount"
              type="number"
              defaultValue={showAdjustModal?.amount || 0}
              className="h-10 text-sm font-bold rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.adjustment_reason')}</label>
            <textarea
              id="adjReason"
              placeholder={t('budgets.adjustment_reason_placeholder')}
              className="w-full h-24 px-3 py-2 text-xs font-medium rounded-xl border border-border bg-background resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateAdjustment} className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              {t('budgets.apply_adjustment')}
            </Button>
            <Button variant="outline" onClick={() => setShowAdjustModal(null)} className="py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== DUPLICATE BUDGET MODAL ==================== */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title={t('budgets.duplicate_title')}
        size="sm"
      >
        <div className="space-y-4 py-4">
          <p className="text-xs text-muted-foreground">
            {t('budgets.duplicate_desc', { period: periodLabel })}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.target_month')}</label>
              <select
                id="dupMonth"
                defaultValue={selectedMonth}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-border bg-background"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, '0');
                  const mk = ['budgets.month_jan','budgets.month_feb','budgets.month_mar','budgets.month_apr','budgets.month_may','budgets.month_jun','budgets.month_jul','budgets.month_aug','budgets.month_sep','budgets.month_oct','budgets.month_nov','budgets.month_dec'];
                  return <option key={m} value={m}>{t(mk[i])}</option>;
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('budgets.target_year')}</label>
              <select
                id="dupYear"
                defaultValue={selectedYear}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-border bg-background"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = String(new Date().getFullYear() - 1 + i);
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleDuplicate} className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              <Copy className="h-3.5 w-3.5 mr-1.5" /> {t('budgets.duplicate_btn')}
            </Button>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)} className="py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== BUDGET DETAILS MODAL ==================== */}
      <Modal
        isOpen={!!detailBudget}
        onClose={() => setDetailBudget(null)}
        title={t('budgets.details_title')}
        size="lg"
      >
        {detailBudget && (
          <div className="space-y-6 py-4">
            {(() => {
              const st = detailBudget.usagePercent > 100
                ? statusConfig.critical
                : detailBudget.usagePercent >= 80 ? statusConfig.warning : statusConfig.healthy;
              const spent = detailBudget.spent || 0;
              const remaining = detailBudget.remaining ?? (detailBudget.amount - spent);
              const avgMonthly = detailTrend.length > 0
                ? detailTrend.reduce((s: number, m: any) => s + m.total, 0) / detailTrend.length
                : 0;
              return (
                <>
                  <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black tracking-tight">{detailBudget.category}</h3>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                            {detailBudget.referenceName ? `${detailBudget.referenceName} • ` : ''}
                            {t(BUDGET_TYPES.find((bt: any) => bt.id === detailBudget.budgetType)?.label || 'budgets.type_business')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${st.bg} ${st.color} text-xs font-black border-0`}>{t(st.labelKey)}</Badge>
                        {detailBudget.isRecurring ? <Badge variant="outline" className="text-xs font-black h-4 border-blue-200 text-blue-600 bg-blue-50">{t('budgets.recurring')}</Badge> : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.budget')}</p>
                        <p className="text-lg font-black">{t('common.etb')}{detailBudget.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.spent')}</p>
                        <p className={`text-lg font-black ${spent > detailBudget.amount ? 'text-red-600' : ''}`}>{t('common.etb')}{spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.remaining')}</p>
                        <p className={`text-lg font-black ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{t('common.etb')}{Math.max(0, remaining).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.usage')}</p>
                        <p className={`text-lg font-black ${detailBudget.usagePercent >= 100 ? 'text-red-600' : ''}`}>{detailBudget.usagePercent}%</p>
                      </div>
                    </div>

                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${detailBudget.usagePercent >= 100 ? 'bg-red-500' : detailBudget.usagePercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(detailBudget.usagePercent, 100)}%` }}
                      />
                    </div>

                    {detailBudget.notes && (
                      <p className="text-xs text-muted-foreground font-medium italic">{detailBudget.notes}</p>
                    )}
                  </div>

                  {/* Spending trend */}
                  <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-widest">{t('budgets.monthly_trend')}</h4>
                    </div>
                    <div className="flex items-end gap-3 h-32 pt-4">
                      {detailTrend.map((m: any) => (
                        <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-black text-muted-foreground">{t('common.etb')}{m.total > 999 ? `${(m.total / 1000).toFixed(1)}k` : Math.round(m.total)}</span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary"
                            style={{ height: `${m.height}%` }}
                            title={`${m.label}: ${t('common.etb')} ${m.total.toLocaleString()}`}
                          />
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{m.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-muted-foreground pt-1 border-t border-border/50">
                      <span>{t('budgets.avg_monthly')}</span>
                      <span>{t('common.etb')}{Math.round(avgMonthly).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Recent expenses */}
                  <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest">{t('budgets.recent_expenses')}</h4>
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : detailExpenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-medium text-center py-6">{t('budgets.no_expenses')}</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {detailExpenses.slice(0, 8).map((e: any) => (
                          <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                            <div>
                              <p className="text-xs font-bold">{e.name}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{formatDate(e.date)}</p>
                            </div>
                            <span className="text-sm font-black">{t('common.etb')}{Number(e.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Related adjustments */}
                  <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest">{t('budgets.adjustment_history')}</h4>
                    {detailAdjustments.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-medium text-center py-4">{t('budgets.no_adjustments')}</p>
                    ) : (
                      <div className="space-y-2">
                        {detailAdjustments.map((adj: any) => (
                          <div key={adj.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                            <div>
                              <p className="text-xs font-bold">{adj.reason}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{formatDate(adj.createdAt)}</p>
                            </div>
                            <span className="text-sm font-black">{t('common.etb')}{adj.previousAmount.toLocaleString()} → {t('common.etb')}{adj.newAmount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Related alerts */}
                  <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" /> {t('budgets.related_alerts')}
                    </h4>
                    {detailAlerts.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-medium text-center py-4">{t('budgets.no_alerts')}</p>
                    ) : (
                      <div className="space-y-2">
                        {detailAlerts.slice(0, 5).map((alert: any) => (
                          <div key={alert.id} className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                            <p className="text-xs font-bold">{alert.message}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{formatDate(alert.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BudgetManagement;
