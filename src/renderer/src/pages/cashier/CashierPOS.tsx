import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDataChangedRefresh } from '../../hooks/useDataChangedRefresh';
import {
  Search,
  ShoppingCart,
  Banknote,
  CreditCard,
  Zap,
  Minus,
  Plus,
  Trash2,
  Receipt,
  PackageSearch,
  X,
  ScanLine,
  Smartphone,
  Percent,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ScannerSetupModal, PosDeviceStrip, isSetupDone, getScannerMode, markSetupDone } from '../../components/PosHardware';
import { Input } from '../../components/ui/input';
import { cn } from '../../utils/shadcn';
import { useCashier } from '../../context/CashierContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';
import SaleSuccessModal from '../../components/SaleSuccessModal';
import { DatePicker } from '../../components/DatePicker';

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  baseSellingPrice: number;
  packSellingPrice: number;
  baseUnit?: string;
  allowSellByBaseUnit?: number;
  allowSellByPackUnit?: number;
  unitsPerPack?: number;
  totalBaseQuantity: number;
  totalPackQuantity: number;
  image?: string | null;
  categoryId?: number | null;
  categoryName?: string;
}

interface CartLine {
  itemId: number;
  name: string;
  price: number;
  unit: string;
  unitType: 'base' | 'pack';
  qty: number;
  discount: number;
  stock: number;
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'mobile', label: 'Mobile', icon: Zap },
  { id: 'debt', label: 'Debt', icon: Wallet },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

const QUICK_CASH = [100, 200, 500, 1000, 2000, 5000];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function CashierPOS() {
  const { shift } = useCashier();
  const { hasRole } = useAuth();
  const { taxEnabled, taxRate } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<CartLine[]>([]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [debtCustomerName, setDebtCustomerName] = useState('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  const scanRef = useRef<HTMLInputElement>(null);

  const loadPosData = React.useCallback(async () => {
      try {
        const [items, cats] = await Promise.all([
          window.api?.posProducts?.(),
          window.api?.posCategories?.(),
        ]);
        setProducts((items || []).map((p: any) => ({
          ...p,
          baseSellingPrice: Number(p.baseSellingPrice) || 0,
          packSellingPrice: Number(p.packSellingPrice) || 0,
          totalBaseQuantity: Number(p.totalBaseQuantity) || 0,
          totalPackQuantity: Number(p.totalPackQuantity) || 0,
        })));
        setCategories(cats || []);
      } catch (e) {
        console.error('Failed to load POS products', e);
        toast.error('Could not load products');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => { loadPosData(); }, [loadPosData]);
  // Live sync: reload POS products when sync lands new data in SQLite.
  useDataChangedRefresh(() => { loadPosData(); });

  const visible = useMemo(() => {
    let list = products;
    if (cat !== 'all') list = list.filter((p) => p.categoryId === cat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }
    return list.filter((p) => p.totalBaseQuantity > 0 || p.totalPackQuantity > 0);
  }, [products, cat, search]);

  const totals = useMemo(() => {
    const subtotal = round2(cart.reduce((s, c) => s + c.price * c.qty, 0));
    const discount = round2(cart.reduce((s, c) => s + c.discount, 0));
    const vat = taxEnabled ? round2((subtotal - discount) * (taxRate / 100)) : 0;
    const total = round2(subtotal - discount + vat);
    return { subtotal, discount, vat, total };
  }, [cart, taxEnabled, taxRate]);

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const price = p.baseSellingPrice;
      const unit = p.baseUnit || 'pcs';
      const unitType = 'base' as const;
      const stock = p.totalBaseQuantity;
      const existing = prev.find((c) => c.itemId === p.id);
      if (existing) {
        if (existing.qty >= stock) return prev;
        return prev.map((c) => (c.itemId === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { itemId: p.id, name: p.name, price, unit, unitType, qty: 1, discount: 0, stock }];
    });
    setSearch('');
    scanRef.current?.focus();
  }, []);

  const changeQty = (itemId: number, unitType: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.itemId !== itemId || c.unitType !== unitType) return c;
        const next = c.qty + delta;
        if (delta < 0 && next < 1) return prev.filter((c2) => !(c2.itemId === itemId && c2.unitType === unitType));
        if (next > c.stock) return c;
        return { ...c, qty: next };
      })
    );
  };

  const setLineDiscount = (itemId: number, unitType: string, value: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.itemId !== itemId || c.unitType !== unitType) return c;
        const max = c.price * c.qty;
        return { ...c, discount: Math.max(0, Math.min(value || 0, max)) };
      })
    );
  };

  const clearCart = () => setCart([]);

  const handleScanOrEnter = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const product = products.find((p) => (p.barcode && p.barcode.toLowerCase() === q) || (p.sku && p.sku.toLowerCase() === q));
    if (product) addToCart(product);
    else toast.error('No item found for that code');
  };

  // ── Phone as scanner: ask a connected mobile to scan a barcode ──
  const [scanningPhone, setScanningPhone] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  // First-time scanner setup: ask once, remember the answer, always changeable.
  useEffect(() => {
    if (!isSetupDone()) setShowSetup(true);
  }, []);
  const handlePhoneScan = async () => {
    try {
      const phones = (await window.api?.peripheralPhones?.()) || [];
      if (!phones.length) {
        toast.error('No phone connected. Open Shega on your phone and connect to this POS.');
        return;
      }
      const phone = phones[0];
      setScanningPhone(phone.name);
      const res = await window.api!.peripheralScan(phone.deviceId);
      setScanningPhone(null);
      // Empty barcode = phone-side cancel/decline.
      if (!res.barcode) {
        toast.info('Scan cancelled on the phone.');
        return;
      }
      const product = products.find((p) => (p.barcode && p.barcode.toLowerCase() === res.barcode.toLowerCase()) || (p.sku && p.sku.toLowerCase() === res.barcode.toLowerCase()));
      if (product) {
        addToCart(product);
        toast.success(`Added ${product.name} via phone scan`);
      } else {
        toast.error(`No item found for ${res.barcode}`);
      }
    } catch (err: any) {
      setScanningPhone(null);
      if (err?.message !== 'cancelled') toast.error(err?.message || 'Phone scan failed — check the phone is connected.');
    }
  };

  const completeSale = async () => {
    if (cart.length === 0 || submitting) return;
    if (method === 'debt' && !debtCustomerName.trim()) {
      toast.error('Customer name is required for debt sales');
      return;
    }
    setSubmitting(true);
    try {
      const isDebt = method === 'debt';
      const lines = cart.map((c) => {
        const lineSub = round2(c.price * c.qty - c.discount);
        const vat = taxEnabled ? round2(lineSub * (taxRate / 100)) : 0;
        const total = round2(lineSub + vat);
        return {
          itemId: c.itemId,
          quantity: c.qty,
          unit: c.unit,
          unitType: c.unitType,
          discount: c.discount,
          vat,
          totalPrice: total,
          paymentMethod: isDebt ? 'Cash' : method,
          paymentStatus: isDebt ? 'Debt' as const : 'Paid' as const,
          customerName: isDebt ? debtCustomerName.trim() : null,
          customerPhone: isDebt ? debtCustomerPhone.trim() || null : null,
          dueDate: isDebt && debtDueDate ? debtDueDate : null,
          paidAmount: isDebt ? 0 : total,
        };
      });

      const ids = await window.api?.insertSalesBatch(lines);
      if (!ids) throw new Error('Sale failed');

      if (shift?.id && !isDebt) {
        for (let i = 0; i < lines.length; i++) {
          try {
            await window.api?.shiftRecordTransaction({
              shiftId: shift.id,
              saleId: ids[i],
              paymentMethod: lines[i].paymentMethod,
              amount: lines[i].totalPrice,
            });
          } catch (e) {
            console.error('Shift transaction record failed', e);
          }
        }
      }

      setLastSale({
        id: ids[0] || Date.now(),
        totalPrice: lines.reduce((s, l) => s + l.totalPrice, 0),
        itemCount: lines.reduce((s, l) => s + l.quantity, 0),
        paymentMethod: method,
        paymentStatus: method === 'debt' ? 'Debt' : 'Paid',
        paidAmount: method === 'debt' ? 0 : lines.reduce((s, l) => s + l.totalPrice, 0),
        customerName: method === 'debt' ? debtCustomerName.trim() : 'Walk-in',
        items: cart.map((c) => ({ name: c.name, quantity: c.qty, price: c.price })),
      });
      setCart([]);
      setTendered('');
      setDebtCustomerName('');
      setDebtCustomerPhone('');
      setDebtDueDate('');
      setShowCheckout(false);
      toast.success('Sale completed');
    } catch (e: any) {
      toast.error(e?.message || 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const change = method === 'cash' ? round2((parseFloat(tendered) || 0) - totals.total) : 0;
  const canPay = method === 'debt' ? !!debtCustomerName.trim() : (method !== 'cash' || parseFloat(tendered) >= totals.total);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <ScannerSetupModal open={showSetup} onClose={() => setShowSetup(false)} />
      <PosDeviceStrip onOpenSetup={() => setShowSetup(true)} />
      <div className="flex min-h-0 flex-1">
        {/* ── Left: catalog ── */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-border/60">
          <div className="flex flex-col gap-2 border-b border-border/60 bg-card px-4 py-3">
            <form onSubmit={handleScanOrEnter} className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={scanRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, or scan barcode…"
                autoFocus
                className="h-11 w-full rounded-2xl border border-input bg-background pl-9 pr-9 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePhoneScan}
                disabled={!!scanningPhone}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
              >
                <Smartphone className={cn('size-3.5', scanningPhone && 'animate-pulse')} />
                {scanningPhone ? `Waiting for ${scanningPhone} — approve on the phone…` : 'Scan with Phone'}
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setCat('all')}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors',
                  cat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors',
                    cat === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <PackageSearch className="size-12 opacity-40" />
                <p className="text-sm font-medium">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visible.map((p) => {
                  const price = p.baseSellingPrice;
                  const stock = p.totalBaseQuantity;
                  const out = stock <= 0;
                  const low = !out && stock <= 10;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={out}
                      className={cn(
                        'group flex flex-col rounded-2xl border bg-card p-2.5 text-left transition-all',
                        out
                          ? 'cursor-not-allowed border-border/40 opacity-50'
                          : 'border-border/60 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-[0.98]'
                      )}
                    >
                      {/* Image tile with stock badge overlay */}
                      <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl bg-muted">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PackageSearch className="size-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <span
                          className={cn(
                            'absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shadow-sm backdrop-blur-sm',
                            out
                              ? 'bg-muted/90 text-muted-foreground'
                              : low
                                ? 'bg-red-500/90 text-white'
                                : 'bg-emerald-500/90 text-white'
                          )}
                        >
                          {out ? 'Out of Stock' : low ? `${stock} left` : 'In Stock'}
                        </span>
                      </div>

                      {/* Category eyebrow */}
                      <div className="truncate px-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {p.categoryName || 'Uncategorized'}
                      </div>

                      {/* Name */}
                      <div className="truncate px-0.5 text-sm font-bold leading-snug" title={p.name}>
                        {p.name}
                      </div>

                      {/* Price + add button */}
                      <div className="mt-1 flex w-full items-center justify-between px-0.5 pb-0.5">
                        <div className="text-sm font-black tracking-tight">
                          {price.toLocaleString()}
                          <span className="ml-0.5 text-[9px] font-bold text-muted-foreground">ETB</span>
                        </div>
                        {!out && (
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Plus className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: cart rail ── */}
        <div className="flex w-full flex-col border-l border-border/60 bg-card md:w-[380px] xl:w-[420px]">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              <span className="text-sm font-black uppercase tracking-widest">Cart</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{cart.length}</span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs font-bold text-muted-foreground hover:text-destructive">
                Clear
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Receipt className="size-12 opacity-30" />
                <p className="px-6 text-center text-sm font-medium">
                  {shift ? 'Tap products to add them here' : 'Open a shift first to start selling'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={`${c.itemId}-${c.unitType}`} className="rounded-2xl border border-border/60 bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.price.toLocaleString()} ETB × {c.qty} {c.unit}
                        </div>
                      </div>
                      <div className="text-sm font-black whitespace-nowrap">
                        {round2(c.price * c.qty).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full border border-border/60 p-0.5">
                        <button
                          onClick={() => changeQty(c.itemId, c.unitType, -1)}
                          className="rounded-full p-1.5 hover:bg-muted"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-bold">{c.qty}</span>
                        <button
                          onClick={() => changeQty(c.itemId, c.unitType, 1)}
                          disabled={c.qty >= c.stock}
                          className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <div className="relative ml-auto">
                        <Percent className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={c.discount || ''}
                          placeholder="Disc"
                          onChange={(e) => setLineDiscount(c.itemId, c.unitType, parseFloat(e.target.value) || 0)}
                          className="h-8 w-20 rounded-xl border border-input bg-background pl-7 pr-2 text-right text-xs font-bold outline-none focus:border-primary"
                        />
                      </div>

                      <button
                        onClick={() => changeQty(c.itemId, c.unitType, -c.qty)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-3 border-t border-border/60 p-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{totals.subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold" style={{ color: totals.discount ? 'var(--destructive)' : undefined }}>
                  −{totals.discount.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span className="font-semibold">{totals.vat.toLocaleString()} ETB</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
              <span className="text-sm font-black uppercase tracking-widest text-primary">Total</span>
              <span className="text-xl font-black tracking-tight text-primary">{totals.total.toLocaleString()} ETB</span>
            </div>

            <Button
              size="lg"
              disabled={cart.length === 0}
              onClick={() => {
                setMethod('cash');
                setTendered('');
                setShowCheckout(true);
              }}
              className="h-13 w-full rounded-2xl py-4"
            >
              <Wallet className="mr-2 size-5" />
              {cart.length === 0 ? 'Cart empty' : `Charge ${totals.total.toLocaleString()} ETB`}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Checkout modal ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => !submitting && setShowCheckout(false)}>
          <div className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-tight">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} disabled={submitting} className="rounded-full p-1.5 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 transition-all',
                    method === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 hover:border-primary/40'
                  )}
                >
                  <m.icon className="size-5" />
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="text-2xl font-black tracking-tight">{totals.total.toLocaleString()} ETB</span>
              </div>

              {method === 'cash' && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CASH.map((q) => (
                      <button
                        key={q}
                        onClick={() => setTendered(String(q + totals.total))}
                        className="rounded-xl border border-border/60 px-3 py-1.5 text-xs font-bold hover:border-primary/50"
                      >
                        +{q.toLocaleString()}
                      </button>
                    ))}
                    <button
                      onClick={() => setTendered(String(totals.total))}
                      className="rounded-xl border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
                    >
                      Exact
                    </button>
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={tendered}
                    placeholder="Cash received"
                    onChange={(e) => setTendered(e.target.value)}
                    autoFocus
                    className="h-14 w-full rounded-2xl border border-input bg-background px-4 text-center text-2xl font-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3',
                      change >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-600'
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">Change</span>
                    <span className="text-lg font-black">{Math.abs(change).toLocaleString()} ETB</span>
                  </div>
                </>
              )}

              {method === 'debt' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Customer name *
                    </label>
                    <Input
                      value={debtCustomerName}
                      onChange={(e) => setDebtCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      autoFocus
                      className="h-12 w-full rounded-2xl border-input bg-background px-4 text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Phone (optional)
                    </label>
                    <Input
                      value={debtCustomerPhone}
                      onChange={(e) => setDebtCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      inputMode="tel"
                      className="h-12 w-full rounded-2xl border-input bg-background px-4 text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Due date (optional)
                    </label>
                    <DatePicker value={debtDueDate} onChange={setDebtDueDate} className="w-full" />
                  </div>
                </div>
              )}

              {hasRole('cashier') && !shift && (
                <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-center text-xs font-bold text-amber-600">
                  You have no open shift — sales won't be attributed to a shift.
                </p>
              )}

              <Button onClick={completeSale} disabled={!canPay || submitting} className="h-13 w-full rounded-2xl py-4 text-base font-black">
                <CheckCircle2 className="mr-2 size-5" />
                {submitting ? 'Processing…' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SaleSuccessModal open={!!lastSale} onClose={() => setLastSale(null)} sale={lastSale} />
    </div>
  );
}