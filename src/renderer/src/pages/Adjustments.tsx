import React, { useEffect, useState, useMemo } from 'react';
import { 
  History, Package, DollarSign, TrendingDown,
  ChevronRight, AlertCircle, Info,
  Zap, Database, Activity, User, X, TrendingUp, AlertTriangle, Blocks, Shield, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface Item {
  id: number;
  name: string;
  baseUnit: string;
  purchaseUnit: string;
  totalBaseQuantity: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  basePurchasePrice: number;
  category: string;
}

interface Adjustment {
  id: number;
  itemId: number;
  itemName: string;
  type: string;
  oldValue: number;
  newValue: number;
  quantity: number;
  unitType: string;
  reason: string;
  date: string;
  createdAt: string;
  reversalId?: number | null;
}

const Adjustments: React.FC = () => {
  const { t, formatDate, formatTime, formatDateTime } = useSettings();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<Adjustment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab States
  const [activeTab, setActiveTab] = useState('history');

  // Stock Form State
  const [stockItem, setStockItem] = useState<Item | null>(null);
  const [stockType, setStockType] = useState<'add_stock' | 'damage' | 'loss'>('add_stock');
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');

  // Price Form State
  const [priceItem, setPriceItem] = useState<Item | null>(null);
  const [priceUnitType, setPriceUnitType] = useState<'base' | 'pack'>('base');
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');

  // Bulk Adjustments State
  const [bulkCategory, setBulkCategory] = useState<string>('all');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkType, setBulkType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkUnitType, setBulkUnitType] = useState<'base' | 'pack'>('base');
  const [bulkReason, setBulkReason] = useState('');
  const [reverseTarget, setReverseTarget] = useState<Adjustment | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, historyData] = await Promise.all([
        window.api.getItems({}),
        window.api.getAdjustments({})
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load adjustment data:', error);
      setItems([]);
      setHistory([]);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category || t('inventory.uncategorized')));
    return Array.from(cats);
  }, [items, t]);

  // Handle Stock Submit
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem || !stockQty) return;

    const adjustment = {
      itemId: stockItem.id,
      type: stockType,
      oldValue: stockItem.totalBaseQuantity,
      newValue: stockType === 'add_stock' ? stockItem.totalBaseQuantity + parseFloat(stockQty) : stockItem.totalBaseQuantity - parseFloat(stockQty),
      quantity: parseFloat(stockQty),
      unitType: 'base',
      reason: stockReason,
      date: new Date().toISOString().split('T')[0]
    };
    
    await window.api.insertAdjustment(adjustment);
    setStockItem(null); setStockQty(''); setStockReason('');
    loadData();
    setActiveTab('history');
  };

  // Handle Price Submit
  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceItem || !newPrice) return;

    const oldPrice = priceUnitType === 'base' ? priceItem.baseSellingPrice : priceItem.packSellingPrice;
    const nPrice = parseFloat(newPrice);
    const type = nPrice > oldPrice ? 'price_increase' : 'price_decrease';

    const adjustment = {
      itemId: priceItem.id,
      type,
      oldValue: oldPrice,
      newValue: nPrice,
      quantity: null,
      unitType: priceUnitType,
      reason: priceReason,
      date: new Date().toISOString().split('T')[0]
    };

    await window.api.insertAdjustment(adjustment);
    setPriceItem(null); setNewPrice(''); setPriceReason('');
    loadData();
    setActiveTab('history');
  };

  // Handle Bulk Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkValue) return;

    const targetItems = bulkCategory === 'all' ? items : items.filter(i => (i.category || t('inventory.uncategorized')) === bulkCategory);
    if (targetItems.length === 0) return;

    const adjustments = targetItems.map(item => {
      const oldPrice = bulkUnitType === 'base' ? item.baseSellingPrice : item.packSellingPrice;
      let nPrice = oldPrice;
      
      const val = parseFloat(bulkValue);
      if (bulkType === 'percentage') {
        nPrice = oldPrice + (oldPrice * (val / 100));
      } else {
        nPrice = oldPrice + val;
      }

      const type = nPrice > oldPrice ? 'price_increase' : 'price_decrease';

      return {
        itemId: item.id,
        type,
        oldValue: oldPrice,
        newValue: nPrice,
        quantity: null,
        unitType: bulkUnitType,
        reason: bulkReason || `Bulk adjustment applied (${bulkType})`,
        date: new Date().toISOString().split('T')[0]
      };
    });

    await window.api.insertBulkAdjustments(adjustments);
    setBulkValue(''); setBulkReason('');
    loadData();
    setActiveTab('history');
  };

  const handleReverseAdjustment = async () => {
    if (!reverseTarget) return;
    try {
      await window.api.reverseAdjustment({ adjustmentId: reverseTarget.id, reason: reverseReason });
      toast.success('Adjustment reversed successfully');
      setReverseTarget(null);
      setReverseReason('');
      loadData();
    } catch (error) {
      toast.error('Failed to reverse adjustment');
    }
  };

  const calculatePriceChange = () => {
    if (!priceItem || !newPrice) return null;
    const oldP = priceUnitType === 'base' ? priceItem.baseSellingPrice : priceItem.packSellingPrice;
    const newP = parseFloat(newPrice);
    if (oldP === 0) return { diff: newP, perc: 100 };
    return {
      diff: newP - oldP,
      perc: ((newP - oldP) / oldP) * 100
    };
  };

  const getBadgeType = (type: string) => {
    switch (type) {
      case 'add_stock': return { text: t('adjustments.add_stock') };
      case 'damage': return { text: t('adjustments.record_damage') };
      case 'loss': return { text: t('adjustments.record_loss') };
      case 'price_increase': return { text: t('adjustments.price_up') };
      case 'price_decrease': return { text: t('adjustments.price_down') };
      default: return { text: type };
    }
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen bg-background text-foreground">
      <div className="px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto flex flex-col gap-y-8 pt-8">
        
        <div>
          <h1 className="text-3xl font-black tracking-tighter">{t('adjustments.title')}</h1>
          <p className="text-sm font-bold text-muted-foreground">{t('adjustments.subtitle')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/50 p-1 rounded-2xl h-14">
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold"><History className="w-4 h-4 mr-2"/> {t('adjustments.history')}</TabsTrigger>
            <TabsTrigger value="stock" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold"><Package className="w-4 h-4 mr-2"/> {t('adjustments.stock')}</TabsTrigger>
            <TabsTrigger value="price" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold"><DollarSign className="w-4 h-4 mr-2"/> {t('adjustments.price')}</TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold"><Blocks className="w-4 h-4 mr-2"/> {t('adjustments.bulk')}</TabsTrigger>
          </TabsList>

          <div className="mt-8">
            {/* HISTORY TAB */}
            <TabsContent value="history">
              <Card className="border-border shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{t('adjustments.audit_log')}</CardTitle>
                      <CardDescription>{t('adjustments.audit_desc')}</CardDescription>
                    </div>
                    <Input 
                      placeholder={t('adjustments.search_placeholder')}
                      className="max-w-xs bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 font-black">{t('adjustments.date')}</th>
                          <th className="px-6 py-4 font-black">{t('adjustments.item')}</th>
                          <th className="px-6 py-4 font-black">{t('adjustments.type')}</th>
                          <th className="px-6 py-4 font-black text-right">{t('adjustments.change')}</th>
                          <th className="px-6 py-4 font-black">{t('adjustments.reason')}</th>
                          <th className="px-6 py-4 font-black">{t('adjustments.user')}</th>
                          <th className="px-6 py-4 font-black text-center">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history
                          .filter(h => h.itemName.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((h, i) => {
                          const badge = getBadgeType(h.type);
                          const isPrice = h.type.includes('price');
                          return (
                            <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 font-medium whitespace-nowrap text-foreground">
                                {formatDate(h.date)}
                                <div className="text-[10px] text-muted-foreground">{formatTime(h.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-foreground">{h.itemName}</td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={`font-bold bg-muted text-foreground border-border`}>{badge.text}</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isPrice ? (
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-foreground">{t('common.etb')} {h.newValue.toLocaleString()}</span>
                                    <span className="text-[10px] text-muted-foreground line-through">{t('common.etb')} {h.oldValue.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className={`font-black text-foreground`}>
                                      {h.type === 'add_stock' ? '+' : '-'}{h.quantity} {h.unitType}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{t('adjustments.now')}: {h.newValue}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{h.reason || '-'}</td>
                              <td className="px-6 py-4 font-medium text-foreground">{t('common.operator')}</td>
                              <td className="px-6 py-4 text-center">
                                {h.reversalId ? (
                                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-bold text-[10px]">Reversed</Badge>
                                ) : hasPermission('adjustments.reverse') ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => { setReverseTarget(h); setReverseReason(''); }}
                                  >
                                    <Ban size={14} />
                                  </Button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                        {history.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-bold">
                              {t('adjustments.no_adjustments')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STOCK ADJUSTMENT TAB */}
            <TabsContent value="stock">
              <div className="flex flex-col gap-8">
                <Card className="border-border shadow-sm rounded-3xl">
                  <CardHeader>
                    <CardTitle>{t('adjustments.stock_form_title')}</CardTitle>
                    <CardDescription>{t('adjustments.stock_form_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleStockSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label>{t('adjustments.action_type')}</Label>
                        <Select value={stockType} onValueChange={(v: any) => setStockType(v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('adjustments.select_type')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add_stock">{t('adjustments.add_stock')}</SelectItem>
                            <SelectItem value="damage">{t('adjustments.record_damage')}</SelectItem>
                            <SelectItem value="loss">{t('adjustments.record_loss')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.select_item')}</Label>
                        <Select value={stockItem?.id.toString()} onValueChange={(id) => setStockItem(items.find(i => i.id === parseInt(id)) || null)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('adjustments.choose_item')} />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px]">
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.qty_change')}</Label>
                        <Input 
                          type="number" 
                          min="0.01" step="any"
                          required
                          value={stockQty}
                          onChange={(e) => setStockQty(e.target.value)}
                          className="bg-background font-bold text-lg"
                          placeholder="e.g. 5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.reason_req')}</Label>
                        <Textarea 
                          required
                          value={stockReason}
                          onChange={(e) => setStockReason(e.target.value)}
                          className="bg-background resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={!stockItem || !stockQty || !stockReason}>
                        {t('adjustments.submit_adj')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                {stockItem && (
                  <Card className="border-border shadow-sm rounded-3xl bg-muted/30">
                    <CardHeader>
                      <CardTitle>{t('adjustments.impact_preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border">
                        <div>
                          <p className="text-sm font-bold text-muted-foreground">{t('adjustments.current_stock')}</p>
                          <p className="text-2xl font-black">{stockItem.totalBaseQuantity} {stockItem.baseUnit}</p>
                        </div>
                        <ChevronRight className="text-muted-foreground" />
                        <div className="text-right">
                          <p className="text-sm font-bold text-muted-foreground">{t('adjustments.new_stock')}</p>
                          <p className={`text-2xl font-black text-foreground`}>
                            {stockType === 'add_stock' 
                              ? stockItem.totalBaseQuantity + (parseFloat(stockQty) || 0)
                              : Math.max(0, stockItem.totalBaseQuantity - (parseFloat(stockQty) || 0))} {stockItem.baseUnit}
                          </p>
                        </div>
                      </div>

                      {stockType !== 'add_stock' && (
                         <div className="p-4 bg-muted rounded-2xl border border-border flex items-start gap-3">
                           <AlertTriangle className="text-foreground shrink-0 mt-1" size={20} />
                           <div>
                             <h4 className="font-bold text-foreground">{t('adjustments.financial_loss')}</h4>
                             <p className="text-sm text-muted-foreground mt-1">{t('adjustments.financial_loss_desc')} {t('common.etb')} {((parseFloat(stockQty) || 0) * stockItem.basePurchasePrice).toLocaleString()}</p>
                           </div>
                         </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* PRICE ADJUSTMENT TAB */}
            <TabsContent value="price">
              <div className="flex flex-col gap-8">
                <Card className="border-border shadow-sm rounded-3xl">
                  <CardHeader>
                    <CardTitle>{t('adjustments.price_form_title')}</CardTitle>
                    <CardDescription>{t('adjustments.price_form_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePriceSubmit} className="space-y-6">
                      
                      <div className="space-y-2">
                        <Label>{t('adjustments.select_item')}</Label>
                        <Select value={priceItem?.id.toString()} onValueChange={(id) => setPriceItem(items.find(i => i.id === parseInt(id)) || null)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('adjustments.choose_item')} />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px]">
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('adjustments.unit_type')}</Label>
                          <Select value={priceUnitType} onValueChange={(v: any) => setPriceUnitType(v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="base">{t('adjustments.base_unit')}</SelectItem>
                              <SelectItem value="pack">{t('adjustments.pack_unit')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('adjustments.new_price')} ({t('common.etb')})</Label>
                          <Input 
                            type="number" 
                            min="0" step="any"
                            required
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="bg-background font-bold text-lg"
                            placeholder="e.g. 150"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.reason_opt')}</Label>
                        <Textarea 
                          value={priceReason}
                          onChange={(e) => setPriceReason(e.target.value)}
                          className="bg-background resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={!priceItem || !newPrice}>
                        {t('adjustments.apply_price')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                {priceItem && (
                  <Card className="border-border shadow-sm rounded-3xl bg-muted/30">
                    <CardHeader>
                      <CardTitle>{t('adjustments.impact_preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border">
                        <div>
                          <p className="text-sm font-bold text-muted-foreground">{t('adjustments.old_price')}</p>
                          <p className="text-2xl font-black text-foreground">{t('common.etb')} {(priceUnitType === 'base' ? priceItem.baseSellingPrice : priceItem.packSellingPrice).toLocaleString()}</p>
                        </div>
                        <ChevronRight className="text-muted-foreground" />
                        <div className="text-right">
                          <p className="text-sm font-bold text-muted-foreground">{t('adjustments.new_price')}</p>
                          <p className="text-2xl font-black text-foreground">{t('common.etb')} {parseFloat(newPrice) ? parseFloat(newPrice).toLocaleString() : '0'}</p>
                        </div>
                      </div>

                      {newPrice && (
                        <div className="p-4 bg-background rounded-2xl border border-border flex items-center justify-between">
                          <span className="font-bold text-foreground">{t('adjustments.difference')}</span>
                          {(() => {
                            const change = calculatePriceChange();
                            if (!change) return null;
                            const isPositive = change.diff > 0;
                            return (
                              <Badge variant="outline" className={`text-sm py-1 font-bold bg-muted text-foreground border-border`}>
                                {isPositive ? '+' : ''}{(change.perc || 0).toFixed(1)}% ({t('common.etb')} {Math.abs(change.diff || 0).toLocaleString()})
                              </Badge>
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* BULK ADJUSTMENT TAB */}
            <TabsContent value="bulk">
              <div className="flex flex-col gap-8">
                <Card className="border-border shadow-sm rounded-3xl">
                  <CardHeader>
                    <CardTitle>{t('adjustments.bulk_form_title')}</CardTitle>
                    <CardDescription>{t('adjustments.bulk_form_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBulkSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label>{t('adjustments.target_category')}</Label>
                        <Select value={bulkCategory} onValueChange={setBulkCategory}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('adjustments.select_category')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('adjustments.all_items')}</SelectItem>
                            {categories.map((c, i) => (
                              <SelectItem key={i} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('adjustments.unit_type')}</Label>
                          <Select value={bulkUnitType} onValueChange={(v: any) => setBulkUnitType(v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="base">{t('adjustments.base_unit')}</SelectItem>
                              <SelectItem value="pack">{t('adjustments.pack_unit')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('adjustments.adj_type')}</Label>
                          <Select value={bulkType} onValueChange={(v: any) => setBulkType(v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">{t('adjustments.percentage')}</SelectItem>
                              <SelectItem value="fixed">{t('adjustments.fixed_amount')} ({t('common.etb')})</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.adj_value')}</Label>
                        <Input 
                          type="number" 
                          step="any"
                          required
                          value={bulkValue}
                          onChange={(e) => setBulkValue(e.target.value)}
                          className="bg-background font-bold text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('adjustments.reason')}</Label>
                        <Textarea 
                          value={bulkReason}
                          onChange={(e) => setBulkReason(e.target.value)}
                          className="bg-background resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={!bulkValue}>
                        {t('adjustments.apply_to')} {bulkCategory === 'all' ? items.length : items.filter(i => (i.category || t('inventory.uncategorized')) === bulkCategory).length}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Bulk Preview Card */}
                {bulkValue && (
                  <Card className="border-border shadow-sm rounded-3xl bg-muted/30">
                    <CardHeader>
                      <CardTitle>{t('adjustments.bulk_impact')}</CardTitle>
                      <CardDescription>{t('adjustments.bulk_impact_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                          {items
                            .filter(i => bulkCategory === 'all' || (i.category || t('inventory.uncategorized')) === bulkCategory)
                            .slice(0, 50)
                            .map(item => {
                              const oldP = bulkUnitType === 'base' ? item.baseSellingPrice : item.packSellingPrice;
                              const val = parseFloat(bulkValue) || 0;
                              const newP = bulkType === 'percentage' ? oldP + (oldP * (val / 100)) : oldP + val;
                              const diff = newP - oldP;
                              return (
                                <div key={item.id} className="p-3 bg-background rounded-xl border border-border flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-sm truncate max-w-[150px]">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{t('common.etb')} {oldP.toLocaleString()} → {t('common.etb')} {newP.toLocaleString()}</p>
                                  </div>
                                  <Badge variant="outline" className={`font-bold bg-muted text-foreground border-border`}>
                                    {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                  </Badge>
                                </div>
                              );
                            })}
                            {items.filter(i => bulkCategory === 'all' || (i.category || t('inventory.uncategorized')) === bulkCategory).length > 50 && (
                               <p className="text-center text-xs text-muted-foreground mt-4 font-bold">
                                 {t('adjustments.and_more').replace('{count}', ((items.filter(i => bulkCategory === 'all' || (i.category || t('inventory.uncategorized')) === bulkCategory).length) - 50).toString())}
                               </p>
                            )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <AlertDialog open={reverseTarget !== null} onOpenChange={(open) => { if (!open) { setReverseTarget(null); setReverseReason(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse Adjustment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reverse this adjustment for {reverseTarget?.itemName}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('adjustments.reason_req')}</Label>
                <Textarea
                  required
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  className="bg-background resize-none"
                  placeholder="Reason for reversal..."
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!reverseReason}
                onClick={handleReverseAdjustment}
              >
                <Ban size={14} className="mr-1" /> Reverse
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Adjustments;
