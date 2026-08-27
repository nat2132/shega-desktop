import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse, Building2, Phone, User, Plus, Edit2, Trash2,
  Package, ArrowRightLeft, History, Search, RefreshCw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../utils/shadcn';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

type Tab = 'warehouses' | 'inventory' | 'transfers' | 'movements';

const Warehouses: React.FC = () => {
  const { t, formatDate, formatDateTime } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('warehouses');

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [allInventory, setAllInventory] = useState<any[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingWh, setEditingWh] = useState<any>(null);

  const [whForm, setWhForm] = useState({ name: '', location: '', managerName: '', managerPhone: '', email: '' });
  const [transferForm, setTransferForm] = useState({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: '', transferredBy: '' });
  const [adjustForm, setAdjustForm] = useState({ warehouseId: 0, itemId: 0, quantity: 0 });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (activeTab === 'inventory' && selectedWarehouse) loadInventory(selectedWarehouse); }, [selectedWarehouse, activeTab]);
  useEffect(() => { if (activeTab === 'transfers') loadTransfers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'movements') loadMovements(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'inventory') loadAllInventory(); }, [activeTab]);

  const loadData = async () => {
    try {
      const [wh, inv, it] = await Promise.all([
        window.api.getWarehouses(),
        window.api.getAllWarehouseInventory(),
        window.api.getItems({ limit: 1000 }),
      ]);
      setWarehouses(wh || []);
      setAllInventory(inv || []);
      setItems(it || []);
      if (wh?.length && !selectedWarehouse) setSelectedWarehouse(wh[0].id);
    } catch (err) { console.error('Failed to load warehouse data:', err); }
  };

  const loadInventory = async (id: number) => {
    try { setInventory(await window.api.getWarehouseInventory(id) || []); } catch (err) { console.error(err); }
  };

  const loadTransfers = async () => {
    try { setTransfers(await window.api.getStockTransfers({ limit: 100 }) || []); } catch (err) { console.error(err); }
  };

  const loadMovements = async () => {
    try {
      const opts: any = { limit: 100 };
      if (selectedWarehouse) opts.warehouseId = selectedWarehouse;
      setMovements(await window.api.getStockMovements(opts) || []);
    } catch (err) { console.error(err); }
  };

  const loadAllInventory = async () => {
    try {
      setAllInventory(await window.api.getAllWarehouseInventory({ search: searchQuery || undefined }) || []);
    } catch (err) { console.error(err); }
  };

  const kpiCards = useMemo(() => {
    const totalWh = warehouses.length;
    const totalStock = allInventory.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
    const totalValue = allInventory.reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.baseSellingPrice || 0)), 0);
    const lowStock = allInventory.filter((i: any) => i.quantity > 0 && i.quantity < 10).length;
    return [
      { title: t('warehouses.total_warehouses'), value: totalWh, trend: '', trendType: 'up' as const, footerTitle: t('warehouses.active_locations'), footerSub: `${warehouses.filter(w => w.isActive).length} ${t('warehouses.active')}` },
      { title: t('warehouses.total_items'), value: totalStock, trend: '', trendType: 'up' as const, footerTitle: t('warehouses.across_warehouses'), footerSub: `${allInventory.length} SKUs` },
      { title: t('warehouses.stock_value'), value: `ETB ${totalValue.toLocaleString()}`, trend: '', trendType: 'up' as const, footerTitle: t('warehouses.total_inventory_value'), footerSub: t('warehouses.at_cost') },
      { title: t('warehouses.low_stock_alerts'), value: lowStock, trend: '', trendType: lowStock > 0 ? 'down' as const : 'up' as const, footerTitle: t('warehouses.items_below_threshold'), footerSub: '< 10 units' },
    ];
  }, [warehouses, allInventory]);

  // Warehouse CRUD
  const openCreateWh = () => {
    setEditingWh(null);
    setWhForm({ name: '', location: '', managerName: '', managerPhone: '', email: '' });
    setShowWarehouseModal(true);
  };

  const openEditWh = (wh: any) => {
    setEditingWh(wh);
    setWhForm({ name: wh.name, location: wh.location || '', managerName: wh.managerName || '', managerPhone: wh.managerPhone || '', email: wh.email || '' });
    setShowWarehouseModal(true);
  };

  const handleSaveWarehouse = async () => {
    if (!whForm.name.trim()) return toast.error(t('warehouses.wh_name_required'));
    try {
      if (editingWh) {
        await window.api.updateWarehouse(editingWh.id, whForm);
        toast.success(t('warehouses.wh_updated'));
      } else {
        await window.api.insertWarehouse(whForm);
        toast.success(t('warehouses.wh_created'));
      }
      setShowWarehouseModal(false);
      await window.api.getWarehouses().then(setWarehouses);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteWarehouse = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteWarehouse(deleteTarget.id);
      toast.success(t('warehouses.wh_deleted'));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      await window.api.getWarehouses().then(setWarehouses);
    } catch (err: any) { toast.error(err.message); }
  };

  // Transfer
  const handleTransfer = async () => {
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.itemId || transferForm.quantity <= 0) {
      return toast.error(t('warehouses.fill_required'));
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      return toast.error(t('warehouses.different_warehouses'));
    }
    try {
      await window.api.transferStock(transferForm);
      toast.success(t('warehouses.transfer_success'));
      setShowTransferModal(false);
      setTransferForm({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: '', transferredBy: '' });
      loadTransfers();
      if (selectedWarehouse) loadInventory(selectedWarehouse);
    } catch (err: any) { toast.error(err.message); }
  };

  // Inventory Adjust
  const handleAdjustInventory = async () => {
    if (!adjustForm.warehouseId || !adjustForm.itemId || adjustForm.quantity < 0) {
      return toast.error(t('warehouses.fill_fields'));
    }
    try {
      await window.api.updateWarehouseInventory(adjustForm.warehouseId, adjustForm.itemId, adjustForm.quantity);
      toast.success(t('warehouses.inv_updated'));
      setShowAdjustModal(false);
      setAdjustForm({ warehouseId: 0, itemId: 0, quantity: 0 });
      loadInventory(adjustForm.warehouseId);
    } catch (err: any) { toast.error(err.message); }
  };

  const tabs = [
    { id: 'warehouses' as Tab, label: t('warehouses.title'), icon: Building2 },
    { id: 'inventory' as Tab, label: t('warehouses.inventory'), icon: Package },
    { id: 'transfers' as Tab, label: t('warehouses.transfers'), icon: ArrowRightLeft },
    { id: 'movements' as Tab, label: t('warehouses.movements'), icon: History },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      {/* KPI Cards */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiCards.map((card, i) => (
            <div key={i} className="p-5 rounded-2xl border bg-card/40">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-black tracking-tight mt-2">{card.value}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant={card.trendType === 'up' ? 'default' : 'destructive'} className="text-xs font-black uppercase">
                  {card.trendType === 'up' ? '+0%' : '0%'}
                </Badge>
                <span className="text-xs text-muted-foreground font-bold">{card.footerTitle}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.footerSub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-6">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border w-fit">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="h-8 px-4 text-xs font-black uppercase tracking-widest rounded-lg"
            >
              <tab.icon size={14} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6">
        {activeTab === 'warehouses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{warehouses.length} {t('warehouses.title')}</p>
              <Button size="sm" className="h-9 px-5 text-xs font-black uppercase tracking-widest" onClick={openCreateWh}>
                <Plus size={14} className="mr-2" /> {t('warehouses.add_warehouse')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {warehouses.map(wh => (
                <div key={wh.id} className={cn(
                  "p-5 rounded-2xl border-2 transition-all group",
                  wh.isActive ? "bg-card/40 border-muted hover:border-muted-foreground/30" : "bg-muted/10 border-muted/30 opacity-60"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Warehouse size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">{wh.name}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">{wh.location || t('warehouses.no_warehouse_location')}</p>
                      </div>
                    </div>
                    <Badge variant={wh.isActive ? 'default' : 'secondary'} className="text-[7px] font-black uppercase">
                      {wh.isActive ? t('warehouses.active') : t('warehouses.inactive')}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {wh.managerName && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <User size={12} /> {wh.managerName}
                      </div>
                    )}
                    {wh.managerPhone && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Phone size={12} /> {wh.managerPhone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="h-7 text-xs font-black uppercase tracking-widest" onClick={() => openEditWh(wh)}>
                      <Edit2 size={11} className="mr-1" /> {t('warehouses.edit_warehouse')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs font-black uppercase tracking-widest text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(wh); setShowDeleteConfirm(true); }}>
                      <Trash2 size={11} className="mr-1" /> {t('warehouses.delete')}
                    </Button>
                  </div>
                </div>
              ))}
              {warehouses.length === 0 && (
                <div className="col-span-full p-12 text-center">
                  <Warehouse size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.no_warehouses')}</p>
                  <Button size="sm" className="mt-4" onClick={openCreateWh}>{t('warehouses.create_first')}</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.warehouse_name')}:</label>
                <select
                  value={selectedWarehouse || ''}
                  onChange={e => setSelectedWarehouse(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border bg-background text-xs font-bold"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('warehouses.search_items')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-9 text-xs font-black uppercase tracking-widest" onClick={() => { setAdjustForm({ warehouseId: selectedWarehouse || 0, itemId: 0, quantity: 0 }); setShowAdjustModal(true); }}>
                <Package size={14} className="mr-2" /> {t('warehouses.set_quantity')}
              </Button>
              <Button size="sm" variant="outline" className="h-9 text-xs font-black uppercase tracking-widest" onClick={() => { loadInventory(selectedWarehouse!); }}>
                <RefreshCw size={14} className="mr-2" /> {t('warehouses.refresh')}
              </Button>
            </div>
            <div className="rounded-2xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">{t('warehouses.item')}</th>
                      <th className="p-4">{t('warehouses.item_category')}</th>
                      <th className="p-4">{t('warehouses.quantity')}</th>
                      <th className="p-4">{t('warehouses.unit')}</th>
                      <th className="p-4">{t('warehouses.unit_price')}</th>
                      <th className="p-4">{t('warehouses.total_value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchQuery ? inventory.filter(i =>
                      i.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                    ) : inventory).map((inv: any) => (
                      <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="text-xs font-black uppercase tracking-tight">{inv.itemName}</p>
                          {inv.companyName && <p className="text-xs text-muted-foreground">{inv.companyName}</p>}
                        </td>
                        <td className="p-4 text-xs font-semibold">{inv.categoryName || '-'}</td>
                        <td className="p-4">
                          <Badge variant={inv.quantity < 10 ? 'destructive' : 'default'} className="text-xs font-black">
                            {inv.quantity || 0}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs font-semibold">{inv.baseUnit || 'pcs'}</td>
                        <td className="p-4 text-xs font-semibold">ETB {inv.baseSellingPrice?.toLocaleString() || 0}</td>
                        <td className="p-4 text-xs font-black">ETB {((inv.quantity || 0) * (inv.baseSellingPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                    {inventory.length === 0 && (
                      <tr><td colSpan={6} className="p-12 text-center"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.no_inventory')}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.transfer_history')}</p>
              <Button size="sm" className="h-9 px-5 text-xs font-black uppercase tracking-widest" onClick={() => {
                setTransferForm({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: '', transferredBy: '' });
                setShowTransferModal(true);
              }}>
                <ArrowRightLeft size={14} className="mr-2" /> {t('warehouses.new_transfer')}
              </Button>
            </div>
            <div className="rounded-2xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">{t('warehouses.date')}</th>
                      <th className="p-4">{t('warehouses.from')}</th>
                      <th className="p-4">{t('warehouses.to')}</th>
                      <th className="p-4">{t('warehouses.item')}</th>
                      <th className="p-4">{t('warehouses.qty')}</th>
                      <th className="p-4">{t('warehouses.status')}</th>
                      <th className="p-4">{t('warehouses.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((tr: any) => (
                      <tr key={tr.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-xs font-semibold">{formatDate(tr.createdAt)}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-xs font-black">{tr.fromWarehouseName}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="default" className="text-xs font-black">{tr.toWarehouseName}</Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-black uppercase tracking-tight">{tr.itemName}</p>
                        </td>
                        <td className="p-4 text-xs font-black">{tr.quantity}</td>
                        <td className="p-4">
                          <Badge variant={tr.status === 'completed' ? 'default' : 'secondary'} className="text-xs font-black uppercase">
                            {tr.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">{tr.notes || '-'}</td>
                      </tr>
                    ))}
                    {transfers.length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.no_transfers')}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.warehouse_name')}:</label>
                <select
                  value={selectedWarehouse || ''}
                  onChange={e => setSelectedWarehouse(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border bg-background text-xs font-bold"
                >
                  <option value="">{t('warehouses.all_warehouses')}</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" variant="outline" className="h-9 text-xs font-black uppercase tracking-widest" onClick={loadMovements}>
                <RefreshCw size={14} className="mr-2" /> {t('warehouses.refresh')}
              </Button>
            </div>
            <div className="rounded-2xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">{t('warehouses.date')}</th>
                      <th className="p-4">{t('warehouses.title')}</th>
                      <th className="p-4">{t('warehouses.item')}</th>
                      <th className="p-4">{t('warehouses.type')}</th>
                      <th className="p-4">{t('warehouses.quantity')}</th>
                      <th className="p-4">{t('warehouses.reference')}</th>
                      <th className="p-4">{t('warehouses.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mv: any) => (
                      <tr key={mv.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-xs font-semibold">{formatDateTime(mv.createdAt)}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs font-black">{mv.warehouseName}</Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-black uppercase tracking-tight">{mv.itemName}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant={mv.type === 'transfer_in' ? 'default' : mv.type === 'transfer_out' ? 'secondary' : 'outline'} className="text-xs font-black uppercase">
                            {mv.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs font-black">{mv.quantity}</td>
                        <td className="p-4 text-xs text-muted-foreground">{mv.referenceType || '-'}</td>
                        <td className="p-4 text-xs text-muted-foreground max-w-[200px] truncate" title={mv.notes}>{mv.notes || '-'}</td>
                      </tr>
                    ))}
                    {movements.length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.no_movements_recorded')}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Modal */}
      <Modal isOpen={showWarehouseModal} onClose={() => setShowWarehouseModal(false)} title={editingWh ? t('warehouses.edit_warehouse') : t('warehouses.new_warehouse')} size="md">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.warehouse_name')} *</label>
            <Input value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} placeholder="e.g. Main Warehouse" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.warehouse_location')}</label>
            <Input value={whForm.location} onChange={e => setWhForm({ ...whForm, location: e.target.value })} placeholder="e.g. Headquarters" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.manager_name')}</label>
              <Input value={whForm.managerName} onChange={e => setWhForm({ ...whForm, managerName: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.manager_phone')}</label>
              <Input value={whForm.managerPhone} onChange={e => setWhForm({ ...whForm, managerPhone: e.target.value })} placeholder="e.g. +251..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</label>
            <Input value={whForm.email} onChange={e => setWhForm({ ...whForm, email: e.target.value })} placeholder="e.g. warehouse@shega.tech" type="email" />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={handleSaveWarehouse}>
              {editingWh ? t('warehouses.update_warehouse') : t('warehouses.create_warehouse')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={() => setShowWarehouseModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title={t('warehouses.transfer_stock')} size="md">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.source')} *</label>
              <select
                value={transferForm.fromWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
              >
                <option value={0}>{t('warehouses.select_source')}</option>
                {warehouses.filter(w => w.isActive).map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.destination')} *</label>
              <select
                value={transferForm.toWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, toWarehouseId: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
              >
                <option value={0}>{t('warehouses.select_destination')}</option>
                {warehouses.filter(w => w.isActive).map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.item')} *</label>
            <select
              value={transferForm.itemId}
              onChange={e => setTransferForm({ ...transferForm, itemId: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
            >
              <option value={0}>{t('warehouses.select_item')}</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>{item.name} {item.companyName ? `(${item.companyName})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.quantity')} *</label>
            <Input type="number" min={1} value={transferForm.quantity || ''} onChange={e => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })} placeholder="e.g. 50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.transferred_by')}</label>
            <Input value={transferForm.transferredBy} onChange={e => setTransferForm({ ...transferForm, transferredBy: e.target.value })} placeholder="e.g. Operations Manager" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.notes')}</label>
            <textarea
              value={transferForm.notes}
              onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none"
              placeholder={t('warehouses.optional_notes')}
            />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={handleTransfer}>
              <ArrowRightLeft size={14} className="mr-2" /> {t('warehouses.execute_transfer')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={() => setShowTransferModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Inventory Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title={t('warehouses.set_inventory_qty')} size="sm">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.title')}</label>
            <select
              value={adjustForm.warehouseId}
              onChange={e => setAdjustForm({ ...adjustForm, warehouseId: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
            >
              <option value={0}>{t('warehouses.select_warehouse')}</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.item')}</label>
            <select
              value={adjustForm.itemId}
              onChange={e => setAdjustForm({ ...adjustForm, itemId: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
            >
              <option value={0}>{t('warehouses.select_item')}</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('warehouses.new_qty')}</label>
            <Input type="number" min={0} value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })} placeholder="e.g. 100" />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={handleAdjustInventory}>
              <Package size={14} className="mr-2" /> {t('warehouses.set_quantity')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-xs tracking-widest" onClick={() => setShowAdjustModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('warehouses.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('warehouses.delete_desc').replace('{name}', deleteTarget?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWarehouse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('warehouses.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Warehouses;
