import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Ban, Printer, Edit, Trash2, Undo2,
  User, Phone, CreditCard, ShoppingBag,
  Hash, Calendar, BadgePercent, Receipt,
  Banknote, History
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Modal from '../components/Modal';
import { VOID_REASONS, RETURN_REASONS } from '@shega/shared';

interface Sale {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  discount: number;
  vat: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  dueDate: string;
  paidAmount: number;
  createdAt: string;
  basePurchasePrice?: number;
  unitsPerPack?: number;
  itemImage?: string;
  status?: string;
}

interface DebtPayment {
  id: number;
  saleId: number;
  amount: number;
  paymentMethod: string;
  note: string;
  createdAt: string;
}

const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    discount: 0,
    vat: 0,
    quantity: 0,
  });

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnQty, setReturnQty] = useState('');
  const [returnRefund, setReturnRefund] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidCustomReason, setVoidCustomReason] = useState('');
  const [returnCustomReason, setReturnCustomReason] = useState('');

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    setLoading(true);
    try {
      const saleData = await window.api?.getSale(Number(id));
      if (!saleData) {
        toast.error(t('sale_detail.not_found'));
        navigate('/sales');
        return;
      }
      setSale(saleData);
      setEditForm({
        customerName: saleData.customerName || '',
        customerPhone: saleData.customerPhone || '',
        discount: saleData.discount || 0,
        vat: saleData.vat || 0,
        quantity: saleData.quantity,
      });

      if (saleData.paymentStatus === 'Debt' || saleData.paymentStatus === t('sales.debt')) {
        const payments = await window.api?.getDebtPayments(saleData.id) || [];
        setPaymentHistory(payments);
      }
    } catch (err) {
      toast.error(t('sale_detail.load_error'));
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const openReturn = () => {
    if (!sale) return;
    setReturnQty(String(sale.quantity));
    setReturnRefund('0');
    setReturnReason('');
    setShowReturnModal(true);
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;
    const reason = returnReason === 'other' && returnCustomReason.trim()
      ? returnCustomReason.trim()
      : returnReason;
    if (!reason) {
      toast.error(t('sale_detail.return_reason_required', 'A reason is required for a return'));
      return;
    }
    const result = await window.api?.createReturn({
      saleId: sale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason,
    });
    if (result?.success) {
      toast.success(t('sale_detail.return_processed'));
      setShowReturnModal(false);
      loadSale();
    } else {
      toast.error(result?.error || t('sale_detail.return_failed'));
    }
  };

  const handleEdit = async () => {
    if (!sale) return;
    setSaving(true);
    try {
      const result = await window.api?.updateSale(sale.id, {
        customerName: editForm.customerName || null,
        customerPhone: editForm.customerPhone || null,
        discount: editForm.discount,
        vat: editForm.vat,
        quantity: editForm.quantity,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t('sale_detail.updated'));
        setShowEditDialog(false);
        loadSale();
      }
    } catch {
      toast.error(t('sale_detail.update_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sale) return;
    setDeleting(true);
    try {
      await window.api?.deleteSale(sale.id);
      toast.success(t('sale_detail.deleted'));
      navigate('/sales');
    } catch {
      toast.error(t('sale_detail.delete_error'));
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    if (!sale) return;
    window.api?.printReceipt(sale);
  };

  const handleVoidSale = async () => {
    if (!sale) return;
    const reason = voidReason === 'other' && voidCustomReason.trim()
      ? voidCustomReason.trim()
      : voidReason;
    if (!reason) {
      toast.error(t('sale_detail.void_reason_required', 'A reason is required to void this sale'));
      return;
    }
    try {
      await window.api?.voidSale({ saleId: sale.id, reason });
      toast.success(t('sale_detail.voided', { id: sale.id }));
      setVoidReason('');
      setVoidCustomReason('');
      loadSale();
    } catch (err: any) {
      toast.error(err.message || t('sale_detail.void_error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{t('sale_detail.not_found')}</p>
      </div>
    );
  }

  const isDebt = sale.paymentStatus === 'Debt' || sale.paymentStatus === t('sales.debt');
  const outstanding = sale.totalPrice - sale.paidAmount;

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 fade-in">
      {/* Header */}
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales')} className="h-9 w-9 p-0 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                {t('sales.sale')} #{sale.id}
              </h1>
              <Badge variant={isDebt ? 'destructive' : 'default'} className="uppercase text-xs font-bold tracking-widest">
                {isDebt ? t('sales.debt') : t('sales.paid')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {t('reports.date')}: {formatDate(sale.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 text-xs font-black uppercase tracking-widest rounded-xl">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> {t('common.print')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="h-9 text-xs font-black uppercase tracking-widest rounded-xl">
            <Edit className="h-3.5 w-3.5 mr-1.5" /> {t('common.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={openReturn} className="h-9 text-xs font-black uppercase tracking-widest rounded-xl text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
            <Undo2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.return')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="h-9 text-xs font-black uppercase tracking-widest rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.delete')}
          </Button>
          {hasPermission('sales.void') && sale && sale.status !== 'Voided' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8 text-xs font-black uppercase tracking-widest">
                  <Ban size={14} className="mr-2" /> {t('sale_detail.void_sale')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('sale_detail.void_title', { id: sale.id })}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('sale_detail.void_description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">{t('sale_detail.void_reason_label')}</label>
                  <Select value={voidReason} onValueChange={(v) => { setVoidReason(v); if (v !== 'other') setVoidCustomReason(''); }}>
                    <SelectTrigger className="w-full rounded-xl bg-muted/20 border-border/50">
                      <SelectValue placeholder={t('sale_detail.void_reason_placeholder', 'Select a reason…')} />
                    </SelectTrigger>
                    <SelectContent>
                      {VOID_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {voidReason === 'other' && (
                    <textarea
                      className="mt-3 w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs resize-none"
                      placeholder={t('sale_detail.void_reason_other', 'Describe the reason…')}
                      value={voidCustomReason}
                      onChange={e => setVoidCustomReason(e.target.value)}
                    />
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!voidReason || (voidReason === 'other' && !voidCustomReason.trim())}
                    onClick={handleVoidSale}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('sale_detail.confirm_void')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Info Card */}
        <Card className="rounded-[32px] border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" /> {t('sales.transaction_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('reports.date')}</p>
                <p className="text-sm font-bold">{formatDate(sale.createdAt)}</p>
              </div>
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.customer')}</p>
                <p className="text-sm font-bold">{sale.customerName || t('sales.walk_in')}</p>
                {sale.customerPhone && (
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {sale.customerPhone}
                  </p>
                )}
              </div>
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.payment_method')}</p>
                <p className="text-sm font-bold">{sale.paymentMethod}</p>
              </div>
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <BadgePercent className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.payment_status')}</p>
                <Badge variant={isDebt ? 'destructive' : 'default'} className="uppercase text-xs font-bold tracking-widest">
                  {isDebt ? t('sales.debt') : t('sales.paid')}
                </Badge>
              </div>
            </div>
            {isDebt && sale.dueDate && (
              <>
                <Separator className="bg-border/40" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.due_date')}</p>
                    <p className="text-sm font-bold text-destructive">{formatDate(sale.dueDate)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Item Details Card */}
        <Card className="rounded-[32px] border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5" /> {t('sales.item_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-xs font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3.5">{t('inventory.product')}</th>
                    <th className="px-5 py-3.5 text-right">{t('inventory.quantity')}</th>
                    <th className="px-5 py-3.5 text-right">{t('inventory.unit')}</th>
                    <th className="px-5 py-3.5 text-right">{t('sales.unit_price')}</th>
                    <th className="px-5 py-3.5 text-right">{t('common.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {sale.itemImage ? (
                            <img src={sale.itemImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-bold text-sm">{sale.itemName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold">{sale.quantity}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground text-sm">{sale.unit}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground text-sm">
                      {t('common.etb')} {(sale.totalPrice / sale.quantity).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-black">
                      {t('common.etb')} {sale.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="px-4 lg:px-6">
        <Card className="rounded-[32px] border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Banknote className="h-3.5 w-3.5" /> {t('sales.financial_summary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.subtotal')}</p>
                <p className="text-lg font-black">{t('common.etb')} {(sale.totalPrice + sale.discount - sale.vat).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.discount')}</p>
                <p className="text-lg font-black text-destructive">-{t('common.etb')} {sale.discount.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('sales.vat')}</p>
                <p className="text-lg font-black text-amber-500">{t('common.etb')} {sale.vat.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">{t('sales.total_price')}</p>
                <p className="text-xl font-black text-primary">{t('common.etb')} {sale.totalPrice.toLocaleString()}</p>
              </div>
              {isDebt && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-black uppercase tracking-widest text-destructive mb-1">{t('sales.due_amount')}</p>
                  <p className="text-xl font-black text-destructive">{t('common.etb')} {outstanding.toLocaleString()}</p>
                </div>
              )}
              {!isDebt && (
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
                  <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-1">{t('sales.paid_amount')}</p>
                  <p className="text-xl font-black text-green-500">{t('common.etb')} {sale.paidAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
            {isDebt && (
              <div className="mt-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-1">{t('sales.paid_amount')}</p>
                <p className="text-lg font-black text-green-500">{t('common.etb')} {sale.paidAmount.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History (Debt Only) */}
      {isDebt && paymentHistory.length > 0 && (
        <div className="px-4 lg:px-6">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-5">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <History className="h-3.5 w-3.5" /> {t('sales.payment_history')}
              </CardTitle>
              <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {paymentHistory.length} {t('customers.transactions')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 text-xs font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-3.5">{t('reports.date')}</th>
                      <th className="px-5 py-3.5 text-right">{t('debt.amount')}</th>
                      <th className="px-5 py-3.5">{t('debt.payment_method')}</th>
                      <th className="px-5 py-3.5">{t('debt.payment_note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((p) => (
                      <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium">{formatDate(p.createdAt)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-green-500">
                          {t('common.etb')} {p.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.paymentMethod}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-background rounded-[32px] border-border shadow-2xl sm:max-w-xl p-0 gap-0">
          <DialogHeader className="p-6 border-b border-border/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">{t('sales.modify_transaction')}</DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('inventory.product')}: {sale.itemName}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.customer_name')}</Label>
                <Input
                  value={editForm.customerName}
                  onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50"
                  placeholder={t('sales.walk_in')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.phone_number')}</Label>
                <Input
                  value={editForm.customerPhone}
                  onChange={e => setEditForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('inventory.quantity')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={e => setEditForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.discount')} ({t('common.etb')})</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.discount}
                  onChange={e => setEditForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('sales.vat')} ({t('common.etb')})</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.vat}
                  onChange={e => setEditForm(f => ({ ...f, vat: parseFloat(e.target.value) || 0 }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-border/50 flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl h-11 text-xs font-black uppercase tracking-widest flex-1">
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={saving || editForm.quantity < 1} className="rounded-xl h-11 text-xs font-black uppercase tracking-widest flex-1 shadow-lg">
              {saving ? t('common.saving') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={t('common.return')} size="sm">
        {sale && (
          <form onSubmit={handleReturn} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 text-sm space-y-1">
              <p className="font-bold">{sale.itemName}</p>
              <p className="text-xs text-muted-foreground">{t('sales.sale')} #{sale.id} &middot; {sale.customerName || t('sales.walk_in')}</p>
              <p className="text-xs">{t('inventory.quantity')}: {sale.quantity} &middot; {t('common.total')}: {t('common.etb')} {sale.totalPrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.return_qty')} *</Label>
              <Input required type="number" min="1" max={sale.quantity}
                value={returnQty} onChange={e => setReturnQty(e.target.value)}
                className="h-10 rounded-xl bg-muted/20 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.refund_amount')} ({t('common.etb')})</Label>
              <Input type="number" min="0"
                value={returnRefund} onChange={e => setReturnRefund(e.target.value)}
                className="h-10 rounded-xl bg-muted/20 border-border/50" />
              <p className="text-xs text-muted-foreground">{t('sales.refund_hint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('sales.return_reason')} *</Label>
              <Select value={returnReason} onValueChange={(v) => { setReturnReason(v); if (v !== 'other') setReturnCustomReason(''); }}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/20 border-border/50">
                  <SelectValue placeholder={t('sales.return_reason_placeholder', 'Select a reason…')} />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {returnReason === 'other' && (
                <Input value={returnCustomReason} onChange={e => setReturnCustomReason(e.target.value)}
                  placeholder={t('sales.return_reason_other', 'Describe the reason…')}
                  className="mt-2 h-10 rounded-xl bg-muted/20 border-border/50" />
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-widest" onClick={() => setShowReturnModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-widest shadow-lg"
                disabled={!returnQty || parseFloat(returnQty) < 1 || !returnReason || (returnReason === 'other' && !returnCustomReason.trim())}>
                {t('common.process')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('sales.revoke_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t('sales.revoke_desc')}
              {sale && (
                <span className="block mt-2 font-bold text-foreground">
                  {t('inventory.product')}: {sale.itemName} &middot; {t('common.etb')} {sale.totalPrice.toLocaleString()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest"
            >
              {deleting ? t('common.deleting') : t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SaleDetail;
