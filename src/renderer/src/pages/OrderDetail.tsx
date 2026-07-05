import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ArrowLeft, CreditCard, PiggyBank, Ban,
  Clock, User, Phone, FileText, History, Package,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DatePicker } from '../components/DatePicker';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import Modal from '../components/Modal';

interface OrderItem {
  id: number;
  itemId: number | null;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
}

interface OrderHistory {
  id: number;
  action: string;
  performedBy: string | null;
  notes: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  status: string;
  totalAmount: number;
  createdByName: string | null;
  createdAt: string;
  convertedAt: string | null;
  convertedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  history: OrderHistory[];
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatDateTime } = useSettings();
  const { hasPermission } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [showConvertSale, setShowConvertSale] = useState(false);
  const [salePaymentMethod, setSalePaymentMethod] = useState('Cash');
  const [showConvertDebt, setShowConvertDebt] = useState(false);
  const [debtDueDate, setDebtDueDate] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) loadOrder(Number(id));
  }, [id]);

  const loadOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const data = await window.api?.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      toast.error(t('orders.load_error', 'Failed to load order'));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!order) return;
    try {
      const result = await window.api?.convertOrderToSale({
        orderId: order.id,
        paymentMethod: salePaymentMethod,
      });
      if (result?.success) {
        toast.success(t('orders.converted_to_sale'));
        setShowConvertSale(false);
        loadOrder(order.id);
      }
    } catch (err: any) {
      toast.error(err.message || t('orders.convert_error'));
    }
  };

  const handleConvertToDebt = async () => {
    if (!order) return;
    try {
      const result = await window.api?.convertOrderToDebt({
        orderId: order.id,
        dueDate: debtDueDate || undefined,
        paymentMethod: 'Credit',
      });
      if (result?.success) {
        toast.success(t('orders.converted_to_debt'));
        setShowConvertDebt(false);
        setDebtDueDate('');
        loadOrder(order.id);
      }
    } catch (err: any) {
      toast.error(err.message || t('orders.convert_error'));
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      await window.api?.cancelOrder({
        orderId: order.id,
        reason: cancelReason || undefined,
      });
      toast.success(t('orders.cancelled'));
      setShowCancelDialog(false);
      setCancelReason('');
      loadOrder(order.id);
    } catch (err: any) {
      toast.error(err.message || t('orders.cancel_error'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order':
        return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-xs px-3 py-1">{t('orders.status_order')}</Badge>;
      case 'Converted':
        return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs px-3 py-1">{t('orders.status_converted')}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-xs px-3 py-1">{t('orders.status_cancelled')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getHistoryIcon = (action: string) => {
    switch (action) {
      case 'created': return <ShoppingBag size={14} className="text-blue-500" />;
      case 'converted_to_sale': return <CreditCard size={14} className="text-green-500" />;
      case 'converted_to_debt': return <PiggyBank size={14} className="text-yellow-500" />;
      case 'cancelled': return <Ban size={14} className="text-red-500" />;
      default: return <Clock size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-32">
        <AlertTriangle size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">{t('orders.not_found')}</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>{t('orders.go_back')}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 fade-in">
      <div className="px-4 lg:px-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter uppercase font-mono">{order.orderNumber}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t('orders.detail_subtitle')}</p>
        </div>
        {order.status === 'Order' && (
          <div className="flex gap-2">
            {hasPermission('orders.convert') && (
              <>
                <Button onClick={() => setShowConvertSale(true)} className="h-9 px-4 font-black uppercase tracking-widest rounded-xl shadow-xl text-xs gap-2">
                  <CreditCard size={14} />
                  {t('orders.convert_to_sale')}
                </Button>
                <Button onClick={() => setShowConvertDebt(true)} variant="outline" className="h-9 px-4 font-black uppercase tracking-widest rounded-xl text-xs gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                  <PiggyBank size={14} />
                  {t('orders.convert_to_debt')}
                </Button>
              </>
            )}
            {hasPermission('orders.cancel') && (
              <Button onClick={() => setShowCancelDialog(true)} variant="outline" className="h-9 px-4 font-black uppercase tracking-widest rounded-xl text-xs gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                <Ban size={14} />
                {t('orders.cancel_order')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-[32px] overflow-hidden bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Package size={14} /> {t('orders.items')}
              </h2>
            </div>
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">{t('inventory.product')}</th>
                  <th className="px-6 py-3 text-right">{t('orders.qty')}</th>
                  <th className="px-6 py-3 text-right">{t('orders.unit_price')}</th>
                  <th className="px-6 py-3 text-right">{t('orders.total')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {order.items.map(item => (
                  <tr key={item.id} className="border-t border-border/40">
                    <td className="px-6 py-4 font-bold">{item.itemName}</td>
                    <td className="px-6 py-4 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-right">{t('common.etb')} {item.unitPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold">{t('common.etb')} {item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest">{t('orders.total')}</td>
                  <td className="px-6 py-4 text-right font-black text-lg">{t('common.etb')} {order.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border rounded-[32px] overflow-hidden bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> {t('orders.history')}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.history.map(entry => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                        {getHistoryIcon(entry.action)}
                      </div>
                      <div className="w-px flex-1 bg-border/40 mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest">
                          {entry.action === 'created' && t('orders.history_created')}
                          {entry.action === 'converted_to_sale' && t('orders.history_converted_sale')}
                          {entry.action === 'converted_to_debt' && t('orders.history_converted_debt')}
                          {entry.action === 'cancelled' && t('orders.history_cancelled')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      {entry.performedBy && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t('orders.by')} {entry.performedBy}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-[32px] overflow-hidden bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> {t('orders.order_info')}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.status')}</p>
                {getStatusBadge(order.status)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.customer')}</p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span className="text-sm font-bold">{order.customerName || t('orders.walk_in')}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.created_by')}</p>
                <p className="text-sm font-bold">{order.createdByName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.created_at')}</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-xs">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              {order.convertedAt && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.converted_at')}</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs">{formatDateTime(order.convertedAt)}</span>
                  </div>
                  {order.convertedBy && <p className="text-[10px] text-muted-foreground mt-0.5">{t('orders.by')} {order.convertedBy}</p>}
                </div>
              )}
              {order.cancelledAt && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.cancelled_at')}</p>
                  <div className="flex items-center gap-2">
                    <Ban size={14} className="text-red-500" />
                    <span className="text-xs">{formatDateTime(order.cancelledAt)}</span>
                  </div>
                  {order.cancelledBy && <p className="text-[10px] text-muted-foreground mt-0.5">{t('orders.by')} {order.cancelledBy}</p>}
                  {order.cancelReason && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{t('orders.reason')}: {order.cancelReason}</p>}
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('orders.notes')}</p>
                  <p className="text-xs text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showConvertSale} onClose={() => setShowConvertSale(false)} title={t('orders.convert_to_sale')} size="sm">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/20 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('orders.order_number')}</p>
            <p className="font-mono font-bold">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{t('orders.total')}: {t('common.etb')} {order.totalAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('orders.payment_method')}</Label>
            <Select value={salePaymentMethod} onValueChange={setSalePaymentMethod}>
              <SelectTrigger className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">{t('suppliers.payment_cash', 'Cash')}</SelectItem>
                <SelectItem value="Bank Transfer">{t('suppliers.payment_bank', 'Bank Transfer')}</SelectItem>
                <SelectItem value="Mobile Money">{t('suppliers.payment_mobile', 'Mobile Money')}</SelectItem>
                <SelectItem value="Check">{t('suppliers.payment_check', 'Check')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => setShowConvertSale(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl" onClick={handleConvertToSale}>
              <CheckCircle size={16} className="mr-2" />
              {t('orders.confirm_convert')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showConvertDebt} onClose={() => setShowConvertDebt(false)} title={t('orders.convert_to_debt')} size="sm">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/20 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('orders.order_number')}</p>
            <p className="font-mono font-bold">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{t('orders.customer')}: {order.customerName}</p>
            <p className="text-xs text-muted-foreground">{t('orders.total')}: {t('common.etb')} {order.totalAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('orders.due_date')}</Label>
            <DatePicker value={debtDueDate} onChange={setDebtDueDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => setShowConvertDebt(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl" onClick={handleConvertToDebt}>
              <PiggyBank size={16} className="mr-2" />
              {t('orders.confirm_convert')}
            </Button>
          </div>
        </div>
      </Modal>

      <AlertDialog open={showCancelDialog} onOpenChange={(open) => { if (!open) setShowCancelDialog(false); }}>
        <AlertDialogContent className="rounded-[32px] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">{t('orders.cancel_order')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {t('orders.cancel_warning')} <span className="font-mono font-bold">{order.orderNumber}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('orders.cancel_reason')}</Label>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder={t('orders.cancel_reason_placeholder')} className="bg-muted/30 border-border/50 rounded-xl text-xs resize-none" rows={3} />
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl font-black uppercase tracking-widest text-xs">{t('common.go_back')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase tracking-widest text-xs shadow-xl">
              <Ban size={14} className="mr-2" />
              {t('orders.confirm_cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
