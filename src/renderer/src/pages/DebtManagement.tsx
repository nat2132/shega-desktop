import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  Banknote, Search, ChevronDown, ChevronUp,
  CircleDollarSign, History, X,
  MoreHorizontal, Filter, Ban, Plus, ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useDataChangedRefresh } from '../hooks/useDataChangedRefresh';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DatePicker } from '../components/DatePicker';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '../components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetTrigger, SheetFooter, SheetClose, SheetDescription
} from '../components/ui/sheet';
import Modal from '../components/Modal';
import { computeTrend } from '../lib/trend-utils';

interface DebtSale {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  totalPrice: number;
  paidAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  dueDate: string;
  createdAt: string;
}

interface DebtPayment {
  id: number;
  saleId: number;
  amount: number;
  paymentMethod: string;
  note: string;
  createdAt: string;
  reversalId?: number | null;
}

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Check'];

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const DebtManagement: React.FC = () => {
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();
  const [debts, setDebts] = useState<DebtSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<DebtSale | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [lossTarget, setLossTarget] = useState<DebtSale | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [paymentHistories, setPaymentHistories] = useState<Record<number, DebtPayment[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [reversePaymentTarget, setReversePaymentTarget] = useState<DebtPayment | null>(null);
  const [reversePaymentReason, setReversePaymentReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({
    itemId: '' as string,
    quantity: '1' as string,
    price: '' as string,
    customerName: '' as string,
    customerPhone: '' as string,
    dueDate: '' as string,
  });

  const paymentMethodKeys: Record<string, string> = {
    Cash: 'debt.payment_cash',
    'Bank Transfer': 'debt.payment_bank_transfer',
    'Mobile Money': 'debt.payment_mobile_money',
    Check: 'debt.payment_check',
  };

  useEffect(() => {
    loadDebts();
  }, []);

  // Live sync: re-query when P2P/Yjs sync lands new data in SQLite.
  useDataChangedRefresh(() => { loadDebts(); });

  const loadDebts = () => {
    window.api?.getSales({ paymentStatus: 'Debt' }).then((data: DebtSale[]) => {
      setDebts(data || []);
    });
  };

  const openPaymentModal = (debt: DebtSale) => {
    setSelectedDebt(debt);
    setPaymentAmount(String(debt.totalPrice - debt.paidAmount));
    setPaymentMethod('Cash');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error(t('debt.amount_positive'));
      return;
    }
    const result = await window.api?.payDebt(selectedDebt.id, amount);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t('debt.confirm_payment'));
    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentAmount('');
    loadDebts();
  };

  const openLossDialog = (debt: DebtSale) => {
    setLossTarget(debt);
    setShowLossDialog(true);
  };

  const handleMarkAsLoss = async () => {
    if (!lossTarget) return;
    const result = await window.api?.payDebt(lossTarget.id, lossTarget.totalPrice - lossTarget.paidAmount, { type: 'loss', note: t('debt.marked_as_loss') });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t('debt.mark_loss'));
    setShowLossDialog(false);
    setLossTarget(null);
    loadDebts();
  };

  const handleReverseDebtPayment = async () => {
    if (!reversePaymentTarget) return;
    try {
      await window.api.reverseDebtPayment({ paymentId: reversePaymentTarget.id, reason: reversePaymentReason });
      toast.success(t('debt.payment_reversed'));
      const saleId = reversePaymentTarget.saleId;
      setReversePaymentTarget(null);
      setReversePaymentReason('');
      if (expandedHistory) {
        const data = await window.api.getDebtPayments(saleId);
        setPaymentHistories(prev => ({ ...prev, [saleId]: data || [] }));
      }
      loadDebts();
    } catch (error) {
      toast.error(t('debt.reverse_error'));
    }
  };

  const openAddDebt = async () => {
    setAddForm({ itemId: '', quantity: '1', price: '', customerName: '', customerPhone: '', dueDate: '' });
    const data = await window.api?.getItems?.() || [];
    setItems(data);
    setShowAddModal(true);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === parseInt(addForm.itemId));
    if (!item) {
      toast.error(t('debt.select_item', 'Select an item'));
      return;
    }
    if (!addForm.customerName.trim()) {
      toast.error(t('debt.customer_required', 'Customer name is required'));
      return;
    }
    const qty = parseFloat(addForm.quantity);
    const price = parseFloat(addForm.price);
    if (!qty || qty <= 0) {
      toast.error(t('debt.amount_positive'));
      return;
    }
    const total = qty * price;
    if (total <= 0) {
      toast.error(t('debt.amount_positive'));
      return;
    }
    try {
      await window.api?.insertSalesBatch([{
        itemId: item.id,
        quantity: qty,
        unit: item.baseUnit || item.unit || 'pcs',
        unitType: 'base',
        discount: 0,
        vat: 0,
        totalPrice: total,
        paymentMethod: 'Cash',
        paymentStatus: 'Debt',
        customerName: addForm.customerName.trim(),
        customerPhone: addForm.customerPhone.trim() || null,
        dueDate: addForm.dueDate || null,
        paidAmount: 0,
      }]);
      toast.success(t('debt.debt_created', 'Debt created'));
      setShowAddModal(false);
      loadDebts();
    } catch (error: any) {
      toast.error(error?.message || t('debt.create_error', 'Failed to create debt'));
    }
  };

  const toggleHistory = async (debtId: number) => {
    if (expandedHistory === debtId) {
      setExpandedHistory(null);
      return;
    }
    setExpandedHistory(debtId);
    if (!paymentHistories[debtId]) {
      setLoadingHistory(debtId);
      const data = await window.api?.getDebtPayments(debtId);
      setPaymentHistories(prev => ({ ...prev, [debtId]: data || [] }));
      setLoadingHistory(null);
    }
  };

  const filteredDebts = useMemo(() => {
    let result = debts;
    const q = searchTerm.toLowerCase();
    if (q) {
      result = result.filter(d =>
        d.customerName.toLowerCase().includes(q) ||
        d.itemName.toLowerCase().includes(q) ||
        d.customerPhone?.toLowerCase().includes(q)
      );
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      result = result.filter(d => new Date(d.createdAt) >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(d => new Date(d.createdAt) <= end);
    }
    return result;
  }, [debts, searchTerm, filterStartDate, filterEndDate]);

  const kpiCards: SectionCardData[] = useMemo(() => {
    const totalOutstanding = debts.reduce((sum, d) => sum + (d.totalPrice - d.paidAmount), 0);
    const totalCollected = debts.reduce((sum, d) => sum + d.paidAmount, 0);
    const activeDebtors = new Set(debts.filter(d => d.totalPrice > d.paidAmount).map(d => d.customerName)).size;
    const overdueAmt = debts
      .filter(d => daysOverdue(d.dueDate) > 0)
      .reduce((sum, d) => sum + (d.totalPrice - d.paidAmount), 0);

    const outTrend = computeTrend(debts, 'createdAt', d => d.totalPrice - d.paidAmount);
    const colTrend = computeTrend(debts, 'createdAt', d => d.paidAmount);
    const activeTrend = computeTrend(debts, 'createdAt', d => d.totalPrice > d.paidAmount ? 1 : 0);
    const overdueTrend = computeTrend(debts, 'createdAt', d => daysOverdue(d.dueDate) > 0 ? d.totalPrice - d.paidAmount : 0);

    return [
      {
        title: t('debt.total_outstanding'),
        value: `${t('common.etb')} ${totalOutstanding.toLocaleString()}`,
        ...outTrend,
        footerTitle: t('customers.credit_volume'),
        footerSub: t('customers.last_30')
      },
      {
        title: t('debt.total_collected'),
        value: `${t('common.etb')} ${totalCollected.toLocaleString()}`,
        ...colTrend,
        footerTitle: t('customers.recovery_rate'),
        footerSub: t('customers.high_efficiency')
      },
      {
        title: t('debt.active_debtors'),
        value: activeDebtors,
        ...activeTrend,
        footerTitle: t('customers.entity_count'),
        footerSub: t('customers.active_ledgers')
      },
      {
        title: t('debt.overdue_amount'),
        value: `${t('common.etb')} ${overdueAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        ...overdueTrend,
        footerTitle: t('customers.est_risk'),
        footerSub: t('customers.action_req')
      },
    ];
  }, [debts]);

  const getOverdueBadge = (dueDate: string) => {
    const overdue = daysOverdue(dueDate);
    if (overdue === 0) {
      return <Badge className="bg-green-500/15 text-green-500 border-green-500/30">{t('debt.on_track')}</Badge>;
    }
    if (overdue <= 7) {
      return <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30">{overdue}d {t('debt.overdue')}</Badge>;
    }
    return <Badge className="bg-red-500/15 text-red-500 border-red-500/30">{overdue}d {t('debt.overdue')}</Badge>;
  };

  const hasActiveFilters = filterStartDate || filterEndDate;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-black tracking-tighter uppercase">{t('debt.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('debt.subtitle')}</p>
      </div>

      <SectionCards cards={kpiCards} storageKey="debts" />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`${t('common.search')}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={openAddDebt} className="h-8 px-3 shadow-md shadow-primary/20">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('debt.add_debt', 'Add Debt')}
          </Button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className={`h-8 px-3 transition-all ${hasActiveFilters ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {t('inventory.filters')} {hasActiveFilters && <Badge className="ml-1.5 h-4 px-1 text-xs rounded-full">{t('inventory.active')}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">{t('debt.filter_title')}</SheetTitle>
                <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.refine_view')}</SheetDescription>
              </SheetHeader>

              <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.timeframe')}</h4>
                  <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.start_date')}</label>
                        <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="bg-muted/30 border-border/50 rounded-xl text-xs w-full [&>div]:w-full [&>div>button]:flex-1 [&>div>button]:min-w-0" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.end_date')}</label>
                        <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="bg-muted/30 border-border/50 rounded-xl text-xs w-full [&>div]:w-full [&>div>button]:flex-1 [&>div>button]:min-w-0" />
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                  >
                    {t('inventory.reset_all')}
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl">
                      {t('inventory.apply_filters')}
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="border rounded-[32px] overflow-hidden bg-card">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">{t('debt.customer')}</th>
                <th className="px-5 py-4">{t('inventory.product')}</th>
                <th className="px-5 py-4 text-right">{t('debt.amount')}</th>
                <th className="px-5 py-4 text-right">{t('customers.paid')}</th>
                <th className="px-5 py-4 text-right">{t('sales.outstanding')}</th>
                <th className="px-5 py-4">{t('debt.due_date')}</th>
                <th className="px-5 py-4">{t('debt.status')}</th>
                <th className="px-5 py-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredDebts.map(debt => {
                const outstanding = debt.totalPrice - debt.paidAmount;
                const isSettled = outstanding === 0;
                return (
                  <React.Fragment key={debt.id}>
                    <tr className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{debt.customerName}</span>
                          {debt.customerPhone && (
                            <span className="text-xs text-muted-foreground">{debt.customerPhone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{debt.itemName}</td>
                      <td className="px-5 py-4 text-right font-bold">
                        {t('common.etb')} {debt.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {t('common.etb')} {debt.paidAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-destructive">
                        {t('common.etb')} {outstanding.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(debt.dueDate)}</td>
                      <td className="px-5 py-4">
                        {isSettled ? (
                          <Badge className="bg-green-500/15 text-green-500 border-green-500/30">{t('debt.settled')}</Badge>
                        ) : (
                          getOverdueBadge(debt.dueDate)
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl">
                              {!isSettled && (
                                <DropdownMenuItem onClick={() => openPaymentModal(debt)}>
                                  <CircleDollarSign size={14} className="mr-2" />
                                  {t('debt.mark_paid')}
                                </DropdownMenuItem>
                              )}
                              {!isSettled && (
                                <DropdownMenuItem onClick={() => openLossDialog(debt)}>
                                  <AlertTriangle size={14} className="mr-2" />
                                  {t('debt.mark_loss')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => toggleHistory(debt.id)}>
                                <History size={14} className="mr-2" />
                                {t('debt.payment_history')}
                                {expandedHistory === debt.id ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    {expandedHistory === debt.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="rounded-xl bg-background/50 p-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                              <History size={12} /> {t('debt.payment_history')}
                            </h4>
                            {loadingHistory === debt.id ? (
                              <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
                            ) : paymentHistories[debt.id] && paymentHistories[debt.id].length > 0 ? (
                              <div className="space-y-2">
                                {paymentHistories[debt.id].map(p => (
                                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <Banknote size={14} className="text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold">{t('common.etb')} {p.amount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">{t(paymentMethodKeys[p.paymentMethod] || p.paymentMethod)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                                        {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                                      </div>
                                      {!p.reversalId && hasPermission('payments.reverse') && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => { setReversePaymentTarget(p); setReversePaymentReason(''); }}
                                        >
                                          <Ban size={12} />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t('common.no_data')}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">{t('common.no_data')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
        title={t('debt.record_payment')} size="sm">
        {selectedDebt && (
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="p-4 rounded-xl bg-muted/20 space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('debt.customer')}</p>
              <p className="font-bold">{selectedDebt.customerName}</p>
              <p className="text-xs text-muted-foreground">{selectedDebt.itemName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('debt.payment_amount')}
              </Label>
              <Input
                required
                type="number"
                min={0}
                max={selectedDebt.totalPrice - selectedDebt.paidAmount}
                step={0.01}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('common.max')}: {t('common.etb')} {(selectedDebt.totalPrice - selectedDebt.paidAmount).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('debt.payment_method')}
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => {
                    const methodKey: Record<string, string> = { Cash: 'suppliers.payment_cash', 'Bank Transfer': 'suppliers.payment_bank', 'Mobile Money': 'suppliers.payment_mobile', Check: 'suppliers.payment_check' };
                    return <SelectItem key={m} value={m}>{t(methodKey[m] || m)}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('debt.payment_note')}
              </Label>
              <Input
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
                placeholder={t('debt.payment_note_placeholder')}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                <X size={14} className="mr-1" /> {t('common.cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                <CircleDollarSign size={14} className="mr-1" /> {t('debt.confirm_payment')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <AlertDialog open={reversePaymentTarget !== null} onOpenChange={(open) => { if (!open) { setReversePaymentTarget(null); setReversePaymentReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('debt.reverse_payment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('debt.reverse_payment_confirm', { amount: `${t('common.etb')} ${reversePaymentTarget?.amount.toLocaleString()}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('adjustments.reason_req')}
              </Label>
              <Textarea
                required
                value={reversePaymentReason}
                onChange={(e) => setReversePaymentReason(e.target.value)}
                className="bg-background resize-none"
                placeholder={t('debt.reverse_reason_placeholder')}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!reversePaymentReason}
              onClick={handleReverseDebtPayment}
            >
              <Ban size={14} className="mr-1" /> {t('debt.reverse')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('debt.mark_as_loss_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('debt.mark_as_loss_desc')}
              {lossTarget && (
                <span className="block mt-2 font-bold text-foreground">
                  {lossTarget.customerName} - {t('common.etb')} {(lossTarget.totalPrice - lossTarget.paidAmount).toLocaleString()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleMarkAsLoss}>
              <AlertTriangle size={14} className="mr-1" /> {t('debt.mark_loss')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}
        title={t('debt.add_debt', 'Add Debt')} size="md">
        <form onSubmit={handleAddDebt} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('debt.select_item', 'Item')} *
            </Label>
            <Select value={addForm.itemId} onValueChange={(v) => {
              const item = items.find(i => i.id === parseInt(v));
              setAddForm({ ...addForm, itemId: v, price: item?.baseSellingPrice?.toString() || '' });
            }}>
              <SelectTrigger className="h-10 bg-muted/30 border-border/50 rounded-xl">
                <SelectValue placeholder={t('debt.select_item', 'Select item')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {items.map(item => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name} ({item.baseUnit}) — {t('common.etb')} {Number(item.baseSellingPrice).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('inventory.quantity', 'Quantity')} *
              </Label>
              <Input type="number" min="1" step="1" value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('inventory.unit_price', 'Unit Price')} ({t('common.etb')}) *
              </Label>
              <Input type="number" min="0" step="0.01" value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('customers.customer_name', 'Customer Name')} *
              </Label>
              <Input required value={addForm.customerName}
                onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                placeholder={t('customers.customer_name', 'Customer name')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('common.phone', 'Phone')}
              </Label>
              <Input value={addForm.customerPhone}
                onChange={(e) => setAddForm({ ...addForm, customerPhone: e.target.value })}
                placeholder={t('common.phone', 'Phone')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('debt.due_date', 'Due Date')}
            </Label>
            <DatePicker value={addForm.dueDate} onChange={(v) => setAddForm({ ...addForm, dueDate: v })} className="w-full" />
          </div>
          {addForm.itemId && addForm.price && addForm.quantity && (
            <div className="rounded-xl bg-primary/10 p-3 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-primary">{t('debt.amount')}</span>
              <span className="text-lg font-black text-primary">
                {t('common.etb')} {((parseFloat(addForm.price) || 0) * (parseFloat(addForm.quantity) || 1)).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              <ShoppingCart size={14} className="mr-1" /> {t('debt.add_debt', 'Add Debt')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DebtManagement;
