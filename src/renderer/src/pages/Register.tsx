import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, CreditCard, Banknote, Receipt, X, Plus, Minus, Keyboard, Zap, Coins } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { AppButton } from '../components/ui/button';
import { AppInput } from '../components/ui/input';
import { AppCard } from '../components/ui/card';
import { AppText } from '../components/ui/text';
import { AppBadge } from '../components/ui/badge';

interface CartItem {
  id: number;
  uuid: string;
  name: string;
  baseSalePrice: number;
  categoryId: number;
  categoryName?: string;
  totalBaseQuantity: number;
  unitsPerPack: number;
  qty: number;
  discount: number;
  taxRate: number;
}

interface Item {
  id: number;
  uuid: string;
  name: string;
  companyName?: string;
  baseSalePrice: number;
  basePurchasePrice: number;
  totalBaseQuantity: number;
  unitsPerPack: number;
  categoryId: number;
  categoryName?: string;
  sku?: string;
  barcode?: string;
}

const CATEGORIES = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Beverages' },
  { id: 2, name: 'Snacks' },
  { id: 3, name: 'Dairy' },
  { id: 4, name: 'Bakery' },
  { id: 5, name: 'Produce' },
  { id: 6, name: 'Household' },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Cash, shortcut: 'F4' },
  { id: 'card', label: 'Card', icon: CreditCard, shortcut: 'F5' },
  { id: 'mobile', label: 'Mobile', icon: Zap, shortcut: 'F6' },
];

export default function Register() {
  const { t, colors } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const result = await window.api?.getItems?.({ limit: 500 });
      if (result?.data) {
        setItems(result.data);
      } else if (Array.isArray(result)) {
        setItems(result);
      }
    } catch (e) {
      console.error('Failed to load items:', e);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'F4':
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod('cash');
          }
          break;
        case 'F5':
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod('card');
          }
          break;
        case 'F6':
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod('mobile');
          }
          break;
        case 'Escape':
          if (showPayment) {
            setShowPayment(false);
          }
          break;
        case 'Enter':
          if (barcodeInputRef.current === document.activeElement) {
            handleBarcodeScan();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showPayment]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 0 || item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory && item.totalBaseQuantity > 0;
    });
  }, [items, searchQuery, selectedCategory]);

  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.qty >= item.totalBaseQuantity) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { 
        ...item, 
        qty: 1, 
        discount: 0, 
        taxRate: 0.15 
      }];
    });
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateQty = (itemId: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== itemId) return c;
      const newQty = Math.max(1, c.qty + delta);
      const itemData = items.find(i => i.id === itemId);
      if (itemData && newQty > itemData.totalBaseQuantity) return c;
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateDiscount = (itemId: number, discount: number) => {
    setCart(prev => prev.map(c => c.id === itemId ? { ...c, discount: Math.max(0, discount) } : c));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.baseSalePrice - item.discount) * item.qty, 0);
  const tax = cart.reduce((sum, item) => sum + (item.baseSalePrice - item.discount) * item.qty * item.taxRate, 0);
  const total = subtotal + tax;
  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(cashTendered) - total) : 0;

  const handleBarcodeScan = () => {
    const barcode = barcodeInputRef.current?.value?.trim();
    if (!barcode) return;
    const item = items.find(i => i.barcode === barcode || i.sku === barcode);
    if (item) {
      addToCart(item);
      barcodeInputRef.current.value = '';
    } else {
      // Could add toast notification here
    }
  };

  const handlePayment = async () => {
    if (cart.length === 0) return;
    
    try {
      const saleItems = cart.map(item => ({
        itemId: item.id,
        qty: item.qty,
        unitPrice: item.baseSalePrice,
        discount: item.discount,
        taxRate: item.taxRate,
      }));
      
      const result = await window.api?.createSale?.({
        items: saleItems,
        paymentMethod,
        cashTendered: paymentMethod === 'cash' ? parseFloat(cashTendered) : undefined,
      });
      
      if (result?.success) {
        setCart([]);
        setCashTendered('');
        setShowPayment(false);
        // Could show success toast
      }
    } catch (e) {
      console.error('Sale failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <AppText variant="h4" weight="bold" className="text-foreground">
            {t('register.title') || 'POS Register'}
          </AppText>
          <AppBadge variant="secondary" className="text-xs">
            {cart.length} {t('register.items') || 'items'}
          </AppBadge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-xs text-muted-foreground font-mono">
            <kbd className="px-1.5 py-0.5 bg-background rounded border">F2</kbd>
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded border">F4</kbd>
            <span>Cash</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded border">F5</kbd>
            <span>Card</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded border">F6</kbd>
            <span>Mobile</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search & Category Bar */}
          <div className="p-4 border-b bg-card flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('register.search_placeholder') || 'Search items, scan barcode...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-30" />
                <AppText variant="body" weight="medium">
                  {searchQuery 
                    ? t('register.no_results') || 'No items found'
                    : t('register.no_items') || 'No items available'}
                </AppText>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={item.totalBaseQuantity <= 0}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      item.totalBaseQuantity <= 0
                        ? 'bg-muted/50 border-muted text-muted-foreground opacity-50 cursor-not-allowed'
                        : 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]'
                    }`}
                  >
                    <div className="font-medium text-base mb-1 line-clamp-1">{item.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">{item.categoryName}</div>
                    <div className="flex items-center justify-between">
                      <AppText variant="h5" weight="bold" className="text-foreground">
                        {item.baseSalePrice.toLocaleString()} ETB
                      </AppText>
                      <div className="text-xs text-muted-foreground">
                        Stock: {item.totalBaseQuantity}
                      </div>
                    </div>
                    {item.totalBaseQuantity <= 10 && item.totalBaseQuantity > 0 && (
                      <div className="absolute top-2 right-2">
                        <AppBadge variant="destructive" className="text-xs">
                          Low Stock
                        </AppBadge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Rail */}
        <div className="w-full md:w-96 lg:w-[380px] xl:w-[420px] border-l bg-card flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <AppText variant="h4" weight="bold">{t('register.cart') || 'Cart'}</AppText>
            {cart.length > 0 && (
              <AppButton variant="ghost" size="sm" onClick={() => setCart([])}>
                <X className="h-4 w-4" />
              </AppButton>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-30" />
                <AppText variant="body" weight="medium" className="text-center px-4">
                  {t('register.empty_cart') || 'Cart is empty. Tap items to add.'}
                </AppText>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-background rounded-xl border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <AppText variant="body" weight="medium" className="truncate">{item.name}</AppText>
                        <AppText variant="caption" className="text-muted-foreground">
                          {item.baseSalePrice.toLocaleString()} ETB × {item.qty}
                        </AppText>
                      </div>
                      <AppText variant="body" weight="bold" className="text-foreground whitespace-nowrap">
                        {(item.baseSalePrice - item.discount) * item.qty} ETB
                      </AppText>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AppButton
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={item.qty <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </AppButton>
                      <span className="w-12 text-center font-mono text-lg">{item.qty}</span>
                      <AppButton
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.id, 1)}
                        disabled={items.find(i => i.id === item.id)?.totalBaseQuantity <= item.qty}
                      >
                        <Plus className="h-4 w-4" />
                      </AppButton>
                      
                      <div className="flex-1" />
                      
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={item.baseSalePrice * item.qty}
                        value={item.discount}
                        onChange={e => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm bg-background border rounded-lg text-right focus:ring-2 focus:ring-primary"
                        placeholder="Disc."
                      />
                      
                      <AppButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="p-4 border-t space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('register.subtotal') || 'Subtotal'}</span>
                <span>{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('register.tax') || 'Tax (15%)'}</span>
                <span>{tax.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t('register.total') || 'Total'}</span>
                <span className="text-primary">{total.toLocaleString()} ETB</span>
              </div>
            </div>

            {cart.length > 0 && (
              <>
                <AppButton
                  className="w-full h-12 text-lg"
                  onClick={() => { setShowPayment(true); setPaymentMethod('cash'); }}
                >
                  <Coins className="h-5 w-5 mr-2" />
                  {t('register.pay_cash') || 'Pay Cash'} — F4
                </AppButton>
                
                <AppButton
                  variant="outline"
                  className="w-full h-12 text-lg"
                  onClick={() => { setShowPayment(true); setPaymentMethod('card'); }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {t('register.pay_card') || 'Pay Card'} — F5
                </AppButton>
                
                <AppButton
                  variant="outline"
                  className="w-full h-12 text-lg"
                  onClick={() => { setShowPayment(true); setPaymentMethod('mobile'); }}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {t('register.pay_mobile') || 'Mobile Pay'} — F6
                </AppButton>
              </>
            )}

            {/* Payment Modal Inline */}
            {showPayment && (
              <div className="border-t pt-4 space-y-4 animate-slide-down">
                <div className="flex items-center justify-between">
                  <AppText variant="h5" weight="bold">{t('register.payment') || 'Payment'}</AppText>
                  <button onClick={() => setShowPayment(false)} className="p-1 hover:bg-muted rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                        paymentMethod === pm.id
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      <pm.icon className="h-5 w-5" />
                      <span className="font-medium">{pm.label}</span>
                      <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-xs">{pm.shortcut}</kbd>
                    </button>
                  ))}
                </div>
                
                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('register.cash_tendered') || 'Cash Tendered'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={total}
                      value={cashTendered}
                      onChange={e => setCashTendered(e.target.value)}
                      className="w-full px-4 py-3 text-2xl font-bold text-center bg-background border rounded-xl focus:ring-2 focus:ring-primary"
                      placeholder={total.toLocaleString()}
                      autoFocus
                    />
                    {cashTendered && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-800">{t('register.change') || 'Change'}</span>
                          <span className="font-bold text-green-800">{change.toFixed(2)} ETB</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <AppButton
                  className="w-full h-12 text-lg"
                  onClick={handlePayment}
                  disabled={paymentMethod === 'cash' && parseFloat(cashTendered) < total}
                >
                  {t('register.complete_sale') || 'Complete Sale'}
                </AppButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}