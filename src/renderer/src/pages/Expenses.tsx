import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Repeat, TrendingDown, 
  PieChart,
  Briefcase, Trash2, Edit, FileText,
  List, Wallet
} from 'lucide-react';
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
import { ColumnDef } from '@tanstack/react-table';

import { useSettings } from '../context/SettingsContext';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { DataTable } from '../components/data-table';
import { exportCSV, exportPDF } from '../lib/export-utils';
import { computeTrend } from '../lib/trend-utils';
import { ChartAreaInteractive } from '../components/chart-area-interactive';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import Modal from '../components/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  isRecurring: number;
  frequency: string;
  startDate: string;
  nextBillingDate: string;
}

const Expenses: React.FC = () => {
  const { t, formatDate } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0],
    isRecurring: false, frequency: 'monthly', startDate: new Date().toISOString().split('T')[0], nextBillingDate: ''
  });

  const [activeTab, setActiveTab] = useState('expenses');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budgetModal, setBudgetModal] = useState(false);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [budgetFormData, setBudgetFormData] = useState({
    category: 'Other', amount: '', period: 'monthly'
  });

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'budget') loadBudgets();
  }, [activeTab]);

  const loadData = async () => {
    const [expData, anData] = await Promise.all([
      window.api?.getExpenses({ search: searchQuery }) || Promise.resolve([]),
      window.api?.getAnalytics('month') || Promise.resolve(null)
    ]);
    setExpenses(expData);
    setAnalytics(anData);
  };

  const loadBudgets = async () => {
    const [budgetData, monthData] = await Promise.all([
      window.api?.getBudgets({ period: 'monthly' }) || Promise.resolve([]),
      window.api?.getExpenses({}) || Promise.resolve([])
    ]);
    setBudgets(budgetData);
    setMonthExpenses(monthData);
  };

  const getSpentForCategory = (category: string): number => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    return monthExpenses
      .filter(e => {
        const d = new Date(e.date);
        return e.category === category && d.getMonth() === curMonth && d.getFullYear() === curYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const resetBudgetForm = () => {
    setBudgetFormData({ category: 'Other', amount: '', period: 'monthly' });
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetFormData.amount || parseFloat(budgetFormData.amount) <= 0) { toast.error(t('budgets.budget_amount_error') || 'Please enter a valid budget amount'); return; }
    try {
      const result = await window.api?.setBudget({
        category: budgetFormData.category,
        amount: parseFloat(budgetFormData.amount),
        period: budgetFormData.period
      });
      if (result?.success) toast.success(t('budgets.budget_set') || 'Budget saved');
      setBudgetModal(false);
      resetBudgetForm();
      loadBudgets();
    } catch {
      toast.error(t('budgets.budget_save_error') || 'Failed to save budget');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await window.api?.deleteBudget(id);
      toast.success(t('budgets.budget_deleted') || 'Budget deleted');
      loadBudgets();
    } catch {
      toast.error(t('budgets.budget_delete_error') || 'Failed to delete budget');
    }
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const recurring = expenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0);
    const average = total / (expenses.length || 1);

    const outflowTrend = computeTrend(expenses, 'date', e => e.amount);
    const recurringTrend = computeTrend(expenses.filter(e => e.isRecurring), 'date', e => e.amount);
    const avgTrend = computeTrend(expenses, 'date', () => 1);

    const peakCat = [...new Set(expenses.map(e => e.category))].reduce((best, cat) => {
      const sum = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return sum > best.sum ? { cat, sum } : best;
    }, { cat: t('expense.salaries'), sum: 0 });

    return [
      { 
        title: t('expense.outflow'), 
        value: `${t('common.etb')} ${total.toLocaleString()}`, 
        ...outflowTrend,
        footerTitle: t('expense.growth'),
        footerSub: t('expense.since_last')
      },
      { 
        title: t('expense.recurring'), 
        value: `${t('common.etb')} ${recurring.toLocaleString()}`, 
        ...recurringTrend,
        footerTitle: t('expense.fixed'),
        footerSub: t('expense.sub_bills')
      },
      { 
        title: t('expense.average'), 
        value: `${t('common.etb')} ${average.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
        ...avgTrend,
        footerTitle: t('expense.per_trans'),
        footerSub: t('expense.efficiency')
      },
      { 
        title: t('expense.peak'), 
        value: peakCat.cat, 
        trend: t('dashboard.trend_high'), 
        trendType: 'up',
        footerTitle: t('expense.largest'),
        footerSub: t('expense.operational_focus')
      },
    ];
  }, [expenses]);

  const chartData = useMemo(() => {
    if (!analytics?.expenseData) return [];
    return analytics.expenseData.map((d: any) => ({
      date: d.date,
      outflow: d.amount
    }));
  }, [analytics]);

  const chartConfig = {
    outflow: { label: t('expense.outflow'), color: "hsl(var(--primary))" }
  };

  const EXPENSE_CATEGORIES = [
    { id: 'Rent', label: t('expense.rent') },
    { id: 'Utilities', label: t('expense.utilities') },
    { id: 'Salaries', label: t('expense.salaries') },
    { id: 'Transport', label: t('expense.transport') },
    { id: 'Supplies', label: t('expense.supplies') },
    { id: 'Other', label: t('expense.other') }
  ];

  const BUDGET_CATEGORIES = [
    { id: 'Utilities', label: t('expense.utilities') },
    { id: 'Rent', label: t('expense.rent') },
    { id: 'Salaries', label: t('expense.salaries') },
    { id: 'Marketing', label: t('expense.marketing') || 'Marketing' },
    { id: 'Maintenance', label: t('expense.maintenance') || 'Maintenance' },
    { id: 'Transport', label: t('expense.transport') },
    { id: 'Office Supplies', label: t('expense.office_supplies') || 'Office Supplies' },
    { id: 'Taxes', label: t('expense.taxes') || 'Taxes' },
    { id: 'Insurance', label: t('expense.insurance') || 'Insurance' },
    { id: 'Other', label: t('expense.other') },
  ];

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "name",
      header: t('expense.primary_narrative'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {EXPENSE_CATEGORIES.find(c => c.id === row.original.category)?.label || row.original.category} • {formatDate(row.original.date)}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t('common.amount')}</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-primary">
          {t('common.etb')} {row.original.amount.toLocaleString()}
        </div>
      )
    },
    {
      accessorKey: "isRecurring",
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.isRecurring ? 'default' : 'outline'} className="uppercase text-[9px] font-bold">
          {row.original.isRecurring ? t('expense.recurring') : t('expense.one_time')}
        </Badge>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} title={t('common.edit')}>
            <Edit className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" title={t('common.delete')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('expense.void_title')}</AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {t('expense.void_desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDelete(row.original.id)}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest"
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

  const handleDelete = async (id: number) => {
    await window.api?.deleteExpense(id);
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error(t('expense.name_required') || 'Expense name is required'); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { toast.error(t('expense.amount_required') || 'Valid amount is required'); return; }
    const expense = {
      ...formData,
      amount: parseFloat(formData.amount),
      isRecurring: formData.isRecurring ? 1 : 0,
      startDate: formData.isRecurring ? formData.startDate : null,
      nextBillingDate: formData.isRecurring ? formData.nextBillingDate : null
    };
    if (editingExpense) await window.api?.updateExpense(editingExpense.id, expense);
    else await window.api?.insertExpense(expense);
    setShowModal(false);
    setEditingExpense(null);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0],
      isRecurring: false, frequency: 'monthly', startDate: new Date().toISOString().split('T')[0], nextBillingDate: ''
    });
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name, amount: String(expense.amount), category: expense.category,
      date: expense.date, isRecurring: Boolean(expense.isRecurring),
      frequency: expense.frequency || 'monthly', startDate: expense.startDate || expense.date, nextBillingDate: expense.nextBillingDate || ''
    });
    setShowModal(true);
  };

  const exportExpensesCSV = () => {
    const h = [t('expense.export_name') || 'Name', t('expense.export_amount') || 'Amount', t('expense.export_category') || 'Category', t('expense.export_date') || 'Date', t('expense.export_recurring') || 'Recurring', t('expense.export_frequency') || 'Frequency'];
    const r = expenses.map(e => [e.name, e.amount, e.category, e.date, e.isRecurring ? (t('expense.export_yes') || 'Yes') : (t('expense.export_no') || 'No'), e.frequency || '']);
    exportCSV(h, r, 'expenses');
  };

  const exportExpensesPDF = () => {
    const h = [t('expense.export_name') || 'Name', t('expense.export_amount') || 'Amount', t('expense.export_category') || 'Category', t('expense.export_date') || 'Date', t('expense.export_recurring') || 'Recurring', t('expense.export_frequency') || 'Frequency'];
    const r = expenses.map(e => [e.name, String(e.amount), e.category, e.date, e.isRecurring ? (t('expense.export_yes') || 'Yes') : (t('expense.export_no') || 'No'), e.frequency || '']);
    exportPDF(t('data_transfer.expenses_report'), h, r, 'expenses');
    toast.success(t('reports.report_generated'));
  };

  return (
    <>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 lg:px-6">
            <TabsList className="grid w-full grid-cols-2 max-w-sm bg-muted/50 p-1 rounded-2xl h-12">
              <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest">
                <List className="w-4 h-4 mr-2" /> {t('expense.header')}
              </TabsTrigger>
              <TabsTrigger value="budget" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest">
                <PieChart className="w-4 h-4 mr-2" /> {t('budgets.tab_budgets')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="expenses" className="mt-6">
            <SectionCards cards={kpiCards} />

            <div className="px-4 lg:px-6 space-y-6">
              <div>
                <ChartAreaInteractive 
                  data={chartData} 
                  config={chartConfig} 
                  title={t('expense.operational_focus')}
                  description={t('expense.since_last')}
                  dataKey="outflow"
                />
              </div>

              <div className="p-8 rounded-[32px] border border-border/50 bg-card shadow-xl flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingDown className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-8 relative z-10">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <PieChart className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t('expense.category_insight')}</p>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">{t('expense.salaries')}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-black uppercase text-[9px]">{t('expense.critical_sector')}</Badge>
                      <span className="text-xs text-muted-foreground font-medium">{t('expense.consumption_desc')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right pr-12 hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1">{t('expense.projected_savings')}</p>
                  <p className="text-2xl font-black text-green-600">{t('expense.projected_savings_value') || '-12%'} {t('expense.savings_potential')}</p>
                </div>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <DataTable 
                columns={columns} 
                data={expenses} 
                title={t('expense.header')}
              />
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="outline" size="sm" onClick={exportExpensesCSV}><FileText size={14} className="mr-1" /> {t('reports.export_csv')}</Button>
                <Button variant="outline" size="sm" onClick={exportExpensesPDF}><FileText size={14} className="mr-1" /> {t('reports.export_pdf')}</Button>
              </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingExpense ? t('expense.modify') : t('expense.new')} size="lg">
              <form onSubmit={handleSubmit} className="space-y-8 py-4">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('expense.primary_narrative')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('expense.desc_payee')}</label>
                      <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 bg-card rounded-xl font-bold" placeholder={t('expense.placeholder_name') || 'e.g. Office Rent - May'} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('common.amount')} ({t('common.etb')})</label>
                      <Input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="h-12 bg-card rounded-xl font-black text-lg" placeholder={t('expense.placeholder_amount') || '0.00'} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('expense.fiscal_logistics')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('expense.classification')}</label>
                        <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('expense.trans_date')}</label>
                      <DatePicker value={formData.date} onChange={e => setFormData({...formData, date: e})} className="h-12 bg-card rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-[24px] border border-border/50 bg-card space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${formData.isRecurring ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Repeat className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('expense.recurring_comm')}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{t('expense.auto_log')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {formData.isRecurring && (
                        <Select value={formData.frequency} onValueChange={v => setFormData({...formData, frequency: v})}>
                          <SelectTrigger className="w-32 h-10 bg-muted/20 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="daily">{t('expense.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('expense.weekly')}</SelectItem>
                            <SelectItem value="monthly">{t('expense.monthly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Switch checked={formData.isRecurring} onCheckedChange={c => setFormData({...formData, isRecurring: c})} />
                    </div>
                  </div>
                  {formData.isRecurring && (
                    <div className="space-y-3 pt-2 border-t border-border/30">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t('common.start_date')}</label>
                        <DatePicker value={formData.startDate} onChange={e => setFormData({...formData, startDate: e})} className="h-10 bg-card rounded-xl text-xs w-full" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t('expense.next_billing') || 'Next Billing'}</label>
                        <DatePicker value={formData.nextBillingDate} onChange={e => setFormData({...formData, nextBillingDate: e})} className="h-10 bg-card rounded-xl text-xs w-full" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
                  <Button type="submit" className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg">{t('expense.commit')}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent">{t('common.abort')}</Button>
                </div>
              </form>
            </Modal>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <div className="px-4 lg:px-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{t('budgets.title')}</h2>
                  <p className="text-sm text-muted-foreground font-medium">{t('expense.budget_subtitle')}</p>
                </div>
                <Button onClick={() => { resetBudgetForm(); setBudgetModal(true); }}
                  className="h-11 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                  <Plus className="w-4 h-4 mr-2" /> {t('budgets.set_budget')}
                </Button>
              </div>

              {(() => {
                const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
                const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
                const budgetPercent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
                const cx = 50, cy = 50, r = 40, sw = 8, circ = 2 * Math.PI * r;
                const offset = circ - (budgetPercent / 100) * circ;
                const isOver = budgetPercent >= 100;
                const gradientId = 'budgetRingGradient';
                return totalBudget > 0 ? (
                  <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-xl flex items-center gap-8">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="shrink-0">
                      <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={isOver ? '#ef4444' : '#22c55e'} />
                          <stop offset="100%" stopColor={isOver ? '#dc2626' : '#3b82f6'} />
                        </linearGradient>
                      </defs>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth={sw}
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                        transform="rotate(-90 50 50)" className="transition-all duration-700 ease-out"
                      />
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                        className="text-lg font-black fill-foreground"
                      >{Math.round(budgetPercent)}%</text>
                    </svg>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        {isOver ? t('expense.budget_over') : t('expense.budget_health')}
                      </p>
                      <p className="text-2xl font-black tracking-tight">
                        {t('expense.budget_spent')} {t('common.etb')} {totalSpent.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('expense.budget_of', { amount: `${t('common.etb')} ${totalBudget.toLocaleString()}` })}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}

              {budgets.length === 0 ? (
                <div className="p-12 rounded-3xl border border-border/50 bg-card flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center">
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-black">{t('expense.budget_no_budgets')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">{t('expense.budget_create_first')}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {budgets.map(budget => {
                    const spent = getSpentForCategory(budget.category);
                    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                    const remaining = budget.amount - spent;
                    const isOver = spent > budget.amount;

                    return (
                      <div key={budget.id} className="p-6 rounded-3xl border border-border/50 bg-card shadow-xl space-y-4 relative overflow-hidden group">
                        {isOver && (
                          <div className="absolute top-0 right-0">
                            <Badge variant="destructive" className="rounded-bl-2xl rounded-tr-3xl text-[9px] font-black uppercase px-3 py-1.5">
                              {t('expense.budget_over')}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">{budget.category}</h3>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('expense.budget_period', { period: budget.period })}</p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('expense.budget_delete_title')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                                  {t('expense.budget_delete_confirm', { category: budget.category })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-3">
                                <AlertDialogCancel className="rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest">{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteBudget(budget.id)}
                                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest"
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.budget')}</p>
                            <p className="text-lg font-black">{t('common.etb')} {budget.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.spent')}</p>
                            <p className={`text-lg font-black ${isOver ? 'text-destructive' : ''}`}>{t('common.etb')} {spent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.remaining')}</p>
                            <p className={`text-lg font-black ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>{t('common.etb')} {Math.max(0, remaining).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                background: isOver
                                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                  : 'linear-gradient(90deg, #22c55e, #3b82f6)'
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                            <span>{t('budgets.percent_used', { percent: Math.round(percentage) })}</span>
                            {isOver && <span className="text-destructive">{t('expense.budget_overage', { percent: Math.round(percentage - 100) })}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Modal isOpen={budgetModal} onClose={() => setBudgetModal(false)} title={t('budgets.set_budget')} size="lg">
              <form onSubmit={handleSetBudget} className="space-y-8 py-4">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('expense.budget_details')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.category')}</label>
                      <Select value={budgetFormData.category} onValueChange={val => setBudgetFormData({...budgetFormData, category: val})}>
                        <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {BUDGET_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.amount')} ({t('common.etb')})</label>
                      <Input required type="number" value={budgetFormData.amount} onChange={e => setBudgetFormData({...budgetFormData, amount: e.target.value})} className="h-12 bg-card rounded-xl font-black text-lg" placeholder={t('expense.placeholder_amount') || '0.00'} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('budgets.period')}</label>
                    <Select value={budgetFormData.period} onValueChange={val => setBudgetFormData({...budgetFormData, period: val})}>
                      <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="monthly">{t('budgets.monthly')}</SelectItem>
                        <SelectItem value="quarterly">{t('budgets.quarterly')}</SelectItem>
                        <SelectItem value="yearly">{t('budgets.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
                  <Button type="submit" className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg">{t('expense.budget_save')}</Button>
                  <Button type="button" variant="ghost" onClick={() => setBudgetModal(false)} className="py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent">{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          </TabsContent>
        </Tabs>
      </div>

      {activeTab === 'expenses' && (
        <Button 
          className="fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group"
          onClick={() => { resetForm(); setEditingExpense(null); setShowModal(true); }}
        >
          <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} />
          <span className="text-[8px] font-black uppercase tracking-tighter">{t('expense.post')}</span>
        </Button>
      )}
    </>
  );
};

export default Expenses;
