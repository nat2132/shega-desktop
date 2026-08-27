import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Plus, MoreHorizontal, Filter,
  ArrowRight, X,
  CheckCircle, Ban, CreditCard, PiggyBank
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
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
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetTrigger, SheetFooter, SheetClose, SheetDescription
} from '../components/ui/sheet';
import Modal from '../components/Modal';

interface Order {
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
}

interface CartItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  unitPrice: number;
}

const Orders: React.FC = () => {
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchItem, setSearchItem] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const [showConvertSale, setShowConvertSale] = useState<Order | null>(null);
  const [salePaymentMethod, setSalePaymentMethod] = useState('Cash');

  const [showConvertDebt, setShowConvertDebt] = useState<Order | null>(null);
  const [debtDueDate, setDebtDueDate] = useState('');

  const [showCancelDialog, setShowCancelDialog] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadOrders();
    loadItems();
  }, []);

  const loadOrders = () => {
    const opts: any = {};
    if (searchTerm) opts.search = searchTerm;
    if (statusFilter !== 'All') opts.status = statusFilter;
    if (filterStartDate) opts.startDate = filterStartDate;
    if (filterEndDate) opts.endDate = filterEndDate;
    window.api?.getOrders(opts).then(setOrders);
  };

  const loadItems = async () => {
    const data = await window.api?.getItems({ limit: 500 });
    setItems(data || []);
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    const q = searchTerm.toLowerCase();
    if (q) {
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(o => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);

  const kpiCards: SectionCardData[] = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'Order');
    const totalActive = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
    const convertedCount = orders.filter(o => o.status === 'Converted').length;
    const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

    return [
      {
        title: t('orders.active_orders'),
        value: activeOrders.length,
        trend: activeOrders.length > 0 ? 'up' : 'neutral',
        trendType: 'up' as const,
        trendText: `${t('common.etb')} ${totalActive.toLocaleString()}`,
        footerTitle: t('orders.total_value'),
        footerSub: t('orders.pending_fulfillment')
      },
      {
        title: t('orders.converted'),
        value: convertedCount,
        trend: 'up',
        trendType: 'up' as const,
        trendText: `${Math.round((convertedCount / (orders.length || 1)) * 100)}%`,
        footerTitle: t('orders.of_total'),
        footerSub: t('orders.fulfilled')
      },
      {
        title: t('orders.cancelled'),
        value: cancelledCount,
        trend: cancelledCount > 0 ? 'down' : 'neutral',
        trendType: cancelledCount > 0 ? 'down' as const : 'up' as const,
        trendText: `${Math.round((cancelledCount / (orders.length || 1)) * 100)}%`,
        footerTitle: t('orders.cancellation_rate'),
        footerSub: t('orders.last_30_days')
      },
      {
        title: t('orders.total_orders'),
        value: orders.length,
        trend: 'up',
        trendType: 'up' as const,
        trendText: t('orders.all_time'),
        footerTitle: t('orders.total_revenue'),
        footerSub: `${t('common.etb')} ${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`
      },
    ];
  }, [orders]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id);
      if (existing) {
        return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unit: item.baseUnit || t('common.pcs'),
        unitType: 'base',
        unitPrice: item.baseSellingPrice || 0,
      }];
    });
  };

  const updateCartItem = (itemId: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map(c => c.itemId === itemId ? { ...c, [field]: value } : c));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.itemId !== itemId));
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error(t('orders.cart_empty'));
      return;
    }
    try {
      await window.api?.insertOrder({
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        notes: orderNotes || null,
        items: cart.map(c => ({
          itemId: c.itemId,
          itemName: c.itemName,
          quantity: c.quantity,
          unit: c.unit,
          unitType: c.unitType,
          unitPrice: c.unitPrice
        }))
      });
      toast.success(t('orders.created'));
      setShowCreateModal(false);
      resetForm();
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || t('orders.create_error'));
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setCart([]);
    setSearchItem('');
  };

  const handleConvertToSale = async () => {
    if (!showConvertSale) return;
    try {
      const result = await window.api?.convertOrderToSale({
        orderId: showConvertSale.id,
        paymentMethod: salePaymentMethod,
      });
      if (result?.success) {
        toast.success(t('orders.converted_to_sale'));
        setShowConvertSale(null);
        loadOrders();
      }
    } catch (err: any) {
      toast.error(err.message || t('orders.convert_error'));
    }
  };

  const handleConvertToDebt = async () => {
    if (!showConvertDebt) return;
    try {
      const result = await window.api?.convertOrderToDebt({
        orderId: showConvertDebt.id,
        dueDate: debtDueDate || undefined,
        paymentMethod: 'Credit',
      });
      if (result?.success) {
        toast.success(t('orders.converted_to_debt'));
        setShowConvertDebt(null);
        setDebtDueDate('');
        loadOrders();
      }
    } catch (err: any) {
      toast.error(err.message || t('orders.convert_error'));
    }
  };

  const handleCancelOrder = async () => {
    if (!showCancelDialog) return;
    try {
      await window.api?.cancelOrder({
        orderId: showCancelDialog.id,
        reason: cancelReason || undefined,
      });
      toast.success(t('orders.cancelled'));
      setShowCancelDialog(null);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || t('orders.cancel_error'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order':
        return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30">{t('orders.status_order')}</Badge>;
      case 'Converted':
        return <Badge className="bg-green-500/15 text-green-500 border-green-500/30">{t('orders.status_converted')}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-500/15 text-red-500 border-red-500/30">{t('orders.status_cancelled')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const hasActiveFilters = filterStartDate || filterEndDate || statusFilter !== 'All';
  const filteredItems = items.filter((i: any) =>
    !i.is_deleted && i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{t('orders.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('orders.subtitle')}</p>
        </div>
        {hasPermission('orders.create') && (
          <Button onClick={() => setShowCreateModal(true)} className="h-10 px-5 font-black uppercase tracking-widest rounded-xl shadow-xl text-xs gap-2">
            <Plus size={16} />
            {t('orders.create')}
          </Button>
        )}
      </div>

      <SectionCards cards={kpiCards} />

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

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className={`h-8 px-3 transition-all ${hasActiveFilters ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {t('inventory.filters')} {hasActiveFilters && <Badge className="ml-1.5 h-4 px-1 text-xs rounded-full">{t('inventory.active')}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">{t('orders.filter_title')}</SheetTitle>
                <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('orders.filter_desc')}</SheetDescription>
              </SheetHeader>
              <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('orders.status')}</h4>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">{t('orders.all')}</SelectItem>
                      <SelectItem value="Order">{t('orders.status_order')}</SelectItem>
                      <SelectItem value="Converted">{t('orders.status_converted')}</SelectItem>
                      <SelectItem value="Cancelled">{t('orders.status_cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t('inventory.timeframe')}</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.start_date')}</label>
                      <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('inventory.end_date')}</label>
                      <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
                    </div>
                  </div>
                </div>
              </div>
              <SheetFooter className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
                <div className="flex gap-4 w-full">
                  <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setStatusFilter('All'); }}>
                    {t('inventory.reset_all')}
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl">{t('inventory.apply_filters')}</Button>
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
                <th className="px-5 py-4">{t('orders.order_number')}</th>
                <th className="px-5 py-4">{t('orders.customer')}</th>
                <th className="px-5 py-4 text-right">{t('orders.total')}</th>
                <th className="px-5 py-4">{t('orders.status')}</th>
                <th className="px-5 py-4">{t('orders.date')}</th>
                <th className="px-5 py-4">{t('orders.created_by')}</th>
                <th className="px-5 py-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-t border-border/40 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td className="px-5 py-4 font-mono text-xs font-bold">{order.orderNumber}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{order.customerName || t('orders.walk_in')}</span>
                      {order.customerPhone && <span className="text-xs text-muted-foreground">{order.customerPhone}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold">{t('common.etb')} {order.totalAmount.toLocaleString()}</td>
                  <td className="px-5 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">{order.createdByName || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px] rounded-xl">
                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                            <ArrowRight size={14} className="mr-2" />
                            {t('orders.view_details')}
                          </DropdownMenuItem>
                          {order.status === 'Order' && (
                            <>
                              <DropdownMenuSeparator />
                              {hasPermission('orders.convert') && (
                                <>
                                  <DropdownMenuItem onClick={() => { setShowConvertSale(order); setSalePaymentMethod('Cash'); }}>
                                    <CreditCard size={14} className="mr-2" />
                                    {t('orders.convert_to_sale')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setShowConvertDebt(order); setDebtDueDate(''); }}>
                                    <PiggyBank size={14} className="mr-2" />
                                    {t('orders.convert_to_debt')}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {hasPermission('orders.cancel') && (
                                <DropdownMenuItem onClick={() => { setShowCancelDialog(order); setCancelReason(''); }} className="text-destructive">
                                  <Ban size={14} className="mr-2" />
                                  {t('orders.cancel_order')}
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">{t('orders.no_orders')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title={t('orders.create_order')} size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.customer_name')}</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t('orders.customer_name_placeholder')} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.customer_phone')}</Label>
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder={t('orders.customer_phone_placeholder')} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.notes')}</Label>
            <Textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder={t('orders.notes_placeholder')} className="bg-muted/30 border-border/50 rounded-xl text-xs resize-none" rows={2} />
          </div>

          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest">{t('orders.items')}</h4>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchItem}
                onChange={e => setSearchItem(e.target.value)}
                placeholder={t('orders.search_items')}
                className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-xs"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3 custom-scrollbar">
              {filteredItems.slice(0, 20).map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => addToCart(item)}>
                  <div>
                    <p className="text-xs font-bold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{t('common.etb')} {item.baseSellingPrice?.toLocaleString() || 0} / {item.baseUnit || t('common.pcs')}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                    <Plus size={14} />
                  </Button>
                </div>
              ))}
              {filteredItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{t('orders.no_items_found')}</p>}
            </div>

            {cart.length > 0 && (
              <div className="space-y-2 border rounded-xl p-3 bg-muted/10">
                {cart.map(item => (
                  <div key={item.itemId} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.itemName}</p>
                    </div>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateCartItem(item.itemId, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="h-8 w-20 text-xs text-center bg-muted/30 border-border/50 rounded-lg"
                      min={1}
                    />
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateCartItem(item.itemId, 'unitPrice', Math.max(0, Number(e.target.value)))}
                      className="h-8 w-24 text-xs text-right bg-muted/30 border-border/50 rounded-lg"
                      min={0}
                      step={0.01}
                    />
                    <p className="text-xs font-bold w-20 text-right">{t('common.etb')} {(item.quantity * item.unitPrice).toLocaleString()}</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFromCart(item.itemId)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-xs font-black uppercase tracking-widest">{t('orders.total')}</span>
                  <span className="text-sm font-black">{t('common.etb')} {cart.reduce((s, c) => s + c.quantity * c.unitPrice, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-border/50">
            <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl" onClick={handleCreateOrder} disabled={cart.length === 0}>
              {t('orders.create_order')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showConvertSale} onClose={() => setShowConvertSale(null)} title={t('orders.convert_to_sale')} size="sm">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/20 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('orders.order_number')}</p>
            <p className="font-mono font-bold">{showConvertSale?.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{t('orders.total')}: {t('common.etb')} {showConvertSale?.totalAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.payment_method')}</Label>
            <Select value={salePaymentMethod} onValueChange={setSalePaymentMethod}>
              <SelectTrigger className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">{t('suppliers.payment_cash')}</SelectItem>
                <SelectItem value="Bank Transfer">{t('suppliers.payment_bank')}</SelectItem>
                <SelectItem value="Mobile Money">{t('suppliers.payment_mobile')}</SelectItem>
                <SelectItem value="Check">{t('suppliers.payment_check')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{t('orders.convert_sale_warning')}</p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => setShowConvertSale(null)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl" onClick={handleConvertToSale}>
              <CheckCircle size={16} className="mr-2" />
              {t('orders.confirm_convert')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showConvertDebt} onClose={() => setShowConvertDebt(null)} title={t('orders.convert_to_debt')} size="sm">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/20 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('orders.order_number')}</p>
            <p className="font-mono font-bold">{showConvertDebt?.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{t('orders.customer')}: {showConvertDebt?.customerName}</p>
            <p className="text-xs text-muted-foreground">{t('orders.total')}: {t('common.etb')} {showConvertDebt?.totalAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.due_date')}</Label>
            <DatePicker value={debtDueDate} onChange={setDebtDueDate} className="h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" />
          </div>
          <p className="text-xs text-muted-foreground">{t('orders.convert_debt_warning')}</p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl" onClick={() => setShowConvertDebt(null)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl" onClick={handleConvertToDebt}>
              <PiggyBank size={16} className="mr-2" />
              {t('orders.confirm_convert')}
            </Button>
          </div>
        </div>
      </Modal>

      <AlertDialog open={!!showCancelDialog} onOpenChange={(open) => { if (!open) setShowCancelDialog(null); }}>
        <AlertDialogContent className="rounded-[32px] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">{t('orders.cancel_order')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {t('orders.cancel_warning')} <span className="font-mono font-bold">{showCancelDialog?.orderNumber}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('orders.cancel_reason')}</Label>
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

export default Orders;
