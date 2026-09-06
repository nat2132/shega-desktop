import React, { useState, useEffect, useMemo } from 'react';
import {
  Store as RegisterIcon, MapPin, Smartphone, Plus, Edit2, Trash2,
  Lock, Unlock, Pencil, LayoutDashboard, CircleDollarSign, Coins,
  PackageSearch, Users, RefreshCw, CheckCircle2, Wallet, ShoppingCart,
  TrendingUp, Building2, Check, Star, Archive
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { BusinessHealthScore } from '../components/BusinessHealthScore';
import { BusinessAssistant } from '../components/BusinessAssistant';
import { useSettings } from '../context/SettingsContext';

type Tab = 'overview' | 'registers' | 'locations' | 'devices' | 'businesses';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-500/15 text-green-600' },
  locked: { label: 'Locked', cls: 'bg-red-500/15 text-red-600' },
  disabled: { label: 'Disabled', cls: 'bg-gray-500/15 text-gray-500' },
  pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-600' },
};

const fmt = (n: number) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const BusinessCenter: React.FC = () => {
  const { currentBusiness, switchBusiness } = useSettings();
  const [tab, setTab] = useState<Tab>('overview');
  const [registers, setRegisters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ builtin: any[]; order: string[]; custom: any[] }>({ builtin: [], order: [], custom: [] });
  const [people, setPeople] = useState<any[]>([]);
  const [access, setAccess] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // §38 Business Overview data
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [debtSales, setDebtSales] = useState<any[]>([]);
  const [syncInfo, setSyncInfo] = useState<any>(null);
  const [cloudInfo, setCloudInfo] = useState<any>(null);

  // Multi-business management
  const [showBizModal, setShowBizModal] = useState(false);
  const [bizForm, setBizForm] = useState({ businessName: '', storeName: '', currency: 'ETB' });
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [defaultTarget, setDefaultTarget] = useState<any>(null);
  const [bizBusy, setBizBusy] = useState(false);

  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', locationId: '' as string, hasDrawer: false });
  const [editingReg, setEditingReg] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm] = useState({ name: '', address: '' });
  const [renaming, setRenaming] = useState<any>(null);
  const [renameValue, setRenameValue] = useState('');
  const [replacing, setReplacing] = useState<any>(null);
  const [replacementName, setReplacementName] = useState('');
  const [replacementPlatform, setReplacementPlatform] = useState('desktop');
  const [replacingBusy, setReplacingBusy] = useState(false);

  const isOwner = access['*'] === true || access['business.manage'] === true;

  const load = async () => {
    setLoading(true);
    try {
      const [regs, locs, devs, rols, ppl, bizs] = await Promise.all([
        window.api.businessListRegisters(),
        window.api.businessListLocations(),
        window.api.businessListDevices(),
        window.api.businessRoles(),
        window.api.businessListPeople(),
        window.api.businessList().catch(() => []),
      ]);
      setRegisters(regs || []);
      setLocations(locs || []);
      setDevices(devs || []);
      setRoles(rols || { builtin: [], order: [], custom: [] });
      setPeople(ppl || []);
      setBusinesses(bizs || []);
    } catch (err) {
      console.error('Failed to load business model', err);
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      const [biz, statsRes, lowStk, debts, sync, cloud] = await Promise.all([
        window.api.getActiveBusiness().catch(() => null),
        window.api.getDashboardStats().catch(() => null),
        window.api.getLowStockItems().catch(() => []),
        window.api.getDebtSales().catch(() => []),
        window.api.syncStatus().catch(() => null),
        window.api.cloudStatus().catch(() => null),
      ]);
      setBusiness(biz || null);
      setStats(statsRes || null);
      setLowStock(lowStk || []);
      setDebtSales(debts || []);
      setSyncInfo(sync || null);
      setCloudInfo(cloud || null);
    } catch {
      /* overview is best-effort */
    }
  };

  const approveDevice = async (d: any) => {
    try {
      await window.api.businessSetDeviceStatus(d.device_id ?? d.id, 'active');
      toast.success(`Device ${d.name || d.deviceName || ''} approved`);
      await Promise.all([load(), loadOverview()]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve device');
    }
  };

  useEffect(() => {
    load();
    loadOverview();
    (window.api.businessCan('*').then((r) => setAccess((a) => ({ ...a, '*': r.allowed }))).catch(() => {}));
    (window.api.businessCan('business.manage').then((r) => setAccess((a) => ({ ...a, 'business.manage': r.allowed }))).catch(() => {}));
  }, []);

  const kpi = useMemo(() => {
    const activeRegs = registers.filter((r) => r.isActive).length;
    const activeDevs = devices.filter((d) => (d.status || 'active') === 'active').length;
    return [
      { title: 'Registers', value: registers.length, sub: `${activeRegs} active` },
      { title: 'Locations', value: locations.length, sub: 'branches' },
      { title: 'Devices', value: devices.length, sub: `${activeDevs} online` },
      { title: 'People', value: people.length, sub: `${roles.builtin.length} canonical roles` },
    ];
  }, [registers, locations, devices, people, roles]);

  const openCreateReg = () => {
    setEditingReg(null);
    setRegForm({ name: '', locationId: '', hasDrawer: false });
    setShowRegModal(true);
  };

  const openEditReg = (r: any) => {
    setEditingReg(r);
    setRegForm({ name: r.name, locationId: r.locationId ? String(r.locationId) : '', hasDrawer: !!r.hasDrawer });
    setShowRegModal(true);
  };

  const saveRegister = async () => {
    if (!regForm.name.trim()) return toast.error('Register name is required');
    try {
      if (editingReg) {
        await window.api.businessUpdateRegister(editingReg.id, {
          name: regForm.name.trim(),
          locationId: regForm.locationId ? Number(regForm.locationId) : null,
          hasDrawer: regForm.hasDrawer,
        });
        toast.success('Register updated');
      } else {
        await window.api.businessAddRegister(regForm.name.trim(), regForm.locationId ? Number(regForm.locationId) : undefined);
        toast.success('Register created');
      }
      setShowRegModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save register');
    }
  };

  const deleteRegister = async () => {
    if (!deleteTarget) return;
    await window.api.businessDeleteRegister(deleteTarget.id);
    toast.success('Register removed');
    setDeleteTarget(null);
    load();
  };

  const saveLocation = async () => {
    if (!locForm.name.trim()) return toast.error('Location name is required');
    await window.api.businessAddLocation(locForm.name.trim(), locForm.address || undefined);
    toast.success('Location added');
    setShowLocModal(false);
    setLocForm({ name: '', address: '' });
    load();
  };

  const toggleDeviceStatus = async (d: any) => {
    const next = (d.status || 'active') === 'active' ? 'locked' : 'active';
    await window.api.businessSetDeviceStatus(d.device_id ?? d.id, next);
    toast.success(`Device ${next === 'active' ? 'unlocked' : 'locked'}`);
    load();
  };

  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await window.api.businessRenameDevice(renaming.device_id ?? renaming.id, renameValue.trim());
    toast.success('Device renamed');
    setRenaming(null);
    load();
  };

  const confirmReplace = async () => {
    if (!replacing || !replacementName.trim()) return;
    if (!confirm(`Replace "${replacing.name || replacing.device_id}" with a new device named "${replacementName.trim()}"? The original device will be marked as removed and its user/role/register will move to the new device.`)) return;
    setReplacingBusy(true);
    try {
      await window.api.businessReplaceDevice({
        oldDeviceId: replacing.device_id ?? replacing.id,
        name: replacementName.trim(),
        platform: replacementPlatform,
        setThisAsReplacement: true,
      });
      toast.success('Device replaced');
      setReplacing(null);
      setReplacementName('');
      setReplacementPlatform('desktop');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Replace failed');
    } finally {
      setReplacingBusy(false);
    }
  };

  const createBusiness = async () => {
    if (!bizForm.businessName.trim()) return toast.error('Business name is required');
    setBizBusy(true);
    try {
      const created = await window.api.businessCreate({
        businessName: bizForm.businessName.trim(),
        storeName: bizForm.storeName?.trim() || bizForm.businessName.trim(),
        currency: bizForm.currency || 'ETB',
      });
      toast.success(`Business "${created?.businessName}" created`);
      setShowBizModal(false);
      setBizForm({ businessName: '', storeName: '', currency: 'ETB' });
      await switchBusiness(created?.id);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create business');
    } finally {
      setBizBusy(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await window.api.businessArchive(archiveTarget.id);
      toast.success(`Business "${archiveTarget.businessName}" archived`);
      setArchiveTarget(null);
      await Promise.all([load(), switchBusiness(currentBusiness?.id)].filter(Boolean));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to archive business');
    }
  };

  const confirmSetDefault = async () => {
    if (!defaultTarget) return;
    try {
      await window.api.businessSetDefault(defaultTarget.id);
      toast.success(`"${defaultTarget.businessName}" is now the default business`);
      setDefaultTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set default business');
    }
  };

  const renderField = (label: string, value: any) =>
    value === null || value === undefined || value === '' ? null : (
      <p className="text-xs text-muted-foreground"><span className="text-foreground/70">{label}:</span> {value}</p>
    );

  return (
    <div className="p-6 space-y-6">
      {loading && <div className="py-16 text-center text-muted-foreground">Loading business model…</div>}
      {!loading && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpi.map((k) => (
              <Card key={k.title}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{k.title}</p>
                  <p className="text-3xl font-bold mt-1">{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="registers" className="gap-2"><RegisterIcon className="h-4 w-4" /> Registers</TabsTrigger>
              <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> Locations</TabsTrigger>
              <TabsTrigger value="devices" className="gap-2"><Smartphone className="h-4 w-4" /> Devices</TabsTrigger>
              <TabsTrigger value="businesses" className="gap-2"><Building2 className="h-4 w-4" /> Businesses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              {/* Business identity hero */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                  <div className="p-6 -mt-10 flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="flex-1 pt-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-bold tracking-tight">{business?.businessName || business?.storeName || 'My Business'}</h2>
                        {business?.businessCode && <Badge variant="secondary">{business.businessCode}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {business?.currency && <span>Currency: {business.currency}</span>}
                        {business?.phone && <span>{business.phone}</span>}
                        {business?.email && <span>{business.email}</span>}
                        {business?.address && <span>{business.address}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operational KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingCart className="h-4 w-4" /> Sales Today</div>
                  <p className="text-3xl font-bold mt-1">{stats?.todaySales ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs {stats?.yesterdaySales ?? 0} yesterday</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CircleDollarSign className="h-4 w-4" /> Revenue Today</div>
                  <p className="text-3xl font-bold mt-1">{fmt(stats?.todayRevenue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs {fmt(stats?.yesterdayRevenue ?? 0)} yesterday</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Net Profit Today</div>
                  <p className="text-3xl font-bold mt-1">{fmt(stats?.todayProfit ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs {fmt(stats?.yesterdayProfit ?? 0)} yesterday</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Coins className="h-4 w-4" /> Outstanding Debt</div>
                  <p className="text-3xl font-bold mt-1">{fmt(stats?.activeDebts ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{debtSales.length} open credit sales</p>
                </CardContent></Card>
              </div>

              {/* Pending device approvals */}
              {(() => {
                const pending = devices.filter((d) => (d.status || '') === 'pending');
                if (pending.length === 0) return null;
                return (
                  <Card className="border-amber-500/40">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-amber-500" />
                        <h3 className="font-semibold">{pending.length} device{pending.length > 1 ? 's' : ''} awaiting approval</h3>
                      </div>
                      {pending.map((d) => (
                        <div key={d.id ?? d.device_id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="text-sm">
                            <p className="font-medium">{d.name || d.deviceName || 'Unnamed device'}</p>
                            <p className="text-xs text-muted-foreground">{d.platform || 'Device'}{d.device_id ? ` · ${d.device_id}` : ''}</p>
                          </div>
                          {isOwner && (
                            <Button size="sm" onClick={() => approveDevice(d)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health score */}
                <BusinessHealthScore />
                {/* Assistant */}
                <BusinessAssistant />
              </div>

              {/* Inventory + Debt + Sync summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><PackageSearch className="h-4 w-4" /> Inventory Health</CardTitle>
                    <Badge variant="secondary">{stats?.totalItems ?? 0} items</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{lowStock.length} item{lowStock.length === 1 ? '' : 's'} below reorder point</p>
                    <div className="mt-3 space-y-2">
                      {lowStock.slice(0, 5).map((i) => (
                        <div key={i.id} className="flex items-center justify-between text-sm">
                          <span className="truncate pr-2">{i.name}</span>
                          <Badge className="bg-red-500/15 text-red-600">{fmt(i.totalBaseQuantity)} left</Badge>
                        </div>
                      ))}
                      {lowStock.length === 0 && <p className="text-xs text-muted-foreground">No items are running low.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Team</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">People</span><span className="font-medium">{people.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Canonical roles</span><span className="font-medium">{roles.builtin.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Custom roles</span><span className="font-medium">{roles.custom?.length ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Devices</span><span className="font-medium">{devices.length}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Sync Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LAN hub</span>
                      <span className="font-medium">{syncInfo?.running ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending outbox</span>
                      <span className="font-medium">{syncInfo?.pendingOutbox ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected peers</span>
                      <span className="font-medium">{(syncInfo?.peers ?? []).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cloud relay</span>
                      <span className="font-medium">{cloudInfo?.ok ? (cloudInfo.enabled ? 'Enabled' : 'Offline') : 'Unconfigured'}</span>
                    </div>
                    {(syncInfo?.conflicts ?? 0) > 0 && (
                      <p className="text-xs text-amber-600">{syncInfo.conflicts} conflict(s) detected</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="registers" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{registers.length} registers on the shared model</p>
                {isOwner && <Button onClick={openCreateReg}><Plus className="h-4 w-4 mr-2" /> Add Register</Button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registers.map((r) => (
                  <Card key={r.id}>
                    <CardHeader className="flex-row items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <RegisterIcon className="h-4 w-4" /> {r.name}
                        </CardTitle>
                        <Badge variant="secondary" className={r.isActive ? 'bg-green-500/15 text-green-600' : 'bg-gray-500/15 text-gray-500'}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {isOwner && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditReg(r)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {renderField('Location', locations.find((l) => l.id === r.locationId)?.name)}
                      {renderField('Drawer', r.hasDrawer ? 'Yes' : 'No')}
                      {renderField('Printer', r.printerName)}
                    </CardContent>
                  </Card>
                ))}
                {registers.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No registers yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{locations.length} locations</p>
                {isOwner && <Button onClick={() => setShowLocModal(true)}><Plus className="h-4 w-4 mr-2" /> Add Location</Button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-5 flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{l.name}</p>
                        {renderField('Address', l.address)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {locations.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No locations yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((d) => {
                  const st = STATUS_BADGE[d.status || 'active'] || STATUS_BADGE.active;
                  return (
                    <Card key={d.id ?? d.device_id}>
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <p className="font-medium">{d.name || d.deviceName || 'Unnamed device'}</p>
                          </div>
                          <Badge className={st.cls}>{st.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {renderField('Platform', d.platform)}
                          {renderField('Role', d.role)}
                          {renderField('App', d.appVersion)}
                          {renderField('Primary', d.isPrimary ? 'Yes' : 'No')}
                          {renderField('ID', d.device_id)}
                        </div>
                        <div className="flex gap-2 pt-2">
                          {isOwner && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => { setRenaming(d); setRenameValue(d.name || ''); }}>
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Rename
                              </Button>
                              {st.label !== 'Removed' && (
                                <Button size="sm" variant="outline" onClick={() => { setReplacing(d); setReplacementName(''); setReplacementPlatform(d.platform || 'desktop'); }}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Replace
                                </Button>
                              )}
                              <Button size="sm" variant={st.label === 'Active' ? 'outline' : 'secondary'} onClick={() => toggleDeviceStatus(d)}>
                                {st.label === 'Active' ? <><Lock className="h-3.5 w-3.5 mr-1" /> Lock</> : <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</>}
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {devices.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No devices registered yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="businesses" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{businesses.length} business{businesses.length === 1 ? '' : 'es'} on this installation</p>
                {isOwner && <Button onClick={() => setShowBizModal(true)}><Plus className="h-4 w-4 mr-2" /> New Business</Button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((b) => {
                  const isCurrent = currentBusiness?.id === b.id;
                  return (
                    <Card key={b.id} className={isCurrent ? 'ring-1 ring-primary/40' : ''}>
                      <CardHeader className="flex-row items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {b.businessName}
                              {isCurrent && <Badge variant="secondary">Active</Badge>}
                              {b.isDefault === 1 && <Badge className="bg-amber-500/15 text-amber-600"><Star className="h-3 w-3 mr-1" /> Default</Badge>}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">{b.currency || 'ETB'} · created {String(b.createdAt || '').slice(0, 10)}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>{b.employeeCount ?? 0} employees</span>
                          <span>{b.registerCount ?? 0} registers</span>
                          <span>{b.locationCount ?? 0} locations</span>
                          <span>{b.deviceCount ?? 0} devices</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          {!isCurrent && (
                            <Button size="sm" onClick={async () => { await switchBusiness(b.id); load(); }}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Switch
                            </Button>
                          )}
                          {isOwner && b.isDefault !== 1 && (
                            <Button size="sm" variant="outline" onClick={() => setDefaultTarget(b)}><Star className="h-3.5 w-3.5 mr-1" /> Set default</Button>
                          )}
                          {isOwner && !isCurrent && (
                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setArchiveTarget(b)}>
                              <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {businesses.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No businesses yet.</p>}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Register modal */}
      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title={editingReg ? 'Edit Register' : 'Add Register'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="Register name" />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Select value={regForm.locationId} onValueChange={(v) => setRegForm({ ...regForm, locationId: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="No location" /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={regForm.hasDrawer} onChange={(e) => setRegForm({ ...regForm, hasDrawer: e.target.checked })} />
            Has cash drawer
          </label>
          <Button className="w-full" onClick={saveRegister}>{editingReg ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>

      {/* Location modal */}
      <Modal isOpen={showLocModal} onClose={() => setShowLocModal(false)} title="Add Location">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="Location name" />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} placeholder="Address (optional)" />
          </div>
          <Button className="w-full" onClick={saveLocation}>Add</Button>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal isOpen={!!renaming} onClose={() => setRenaming(null)} title="Rename Device">
        <div className="space-y-4">
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Device name" autoFocus />
          <Button className="w-full" onClick={confirmRename}>Rename</Button>
        </div>
      </Modal>

      {/* Replace modal */}
      <Modal isOpen={!!replacing} onClose={() => setReplacing(null)} title="Replace Device">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Registering a replacement for <span className="text-foreground/80 font-medium">{replacing?.name || replacing?.device_id}</span>.
            The original device is marked as removed and its user, role and register are carried over to the new device.
          </p>
          <Input value={replacementName} onChange={(e) => setReplacementName(e.target.value)} placeholder="New device name" autoFocus />
          <Input value={replacementPlatform} onChange={(e) => setReplacementPlatform(e.target.value)} placeholder="Platform (e.g. desktop, mobile)" />
          <Button className="w-full" disabled={replacingBusy} onClick={confirmReplace}>
            {replacingBusy ? 'Replacing…' : 'Replace Device'}
          </Button>
        </div>
      </Modal>

      {/* New business modal */}
      <Modal isOpen={showBizModal} onClose={() => setShowBizModal(false)} title="Create Business">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Business name</label>
            <Input value={bizForm.businessName} onChange={(e) => setBizForm({ ...bizForm, businessName: e.target.value })} placeholder="Legal / business name" />
          </div>
          <div>
            <label className="text-sm font-medium">Store name</label>
            <Input value={bizForm.storeName} onChange={(e) => setBizForm({ ...bizForm, storeName: e.target.value })} placeholder="Store / branch name" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <Input value={bizForm.currency} onChange={(e) => setBizForm({ ...bizForm, currency: e.target.value })} placeholder="ETB" />
          </div>
          <Button className="w-full" disabled={bizBusy} onClick={createBusiness}>
            {bizBusy ? 'Creating…' : 'Create Business'}
          </Button>
        </div>
      </Modal>

      {/* Archive confirm */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive business?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.businessName}" will be archived (soft-deleted) and hidden. Its data is retained and sync tombstones propagate to other devices. This can be reversed by restoring from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set default confirm */}
      <AlertDialog open={!!defaultTarget} onOpenChange={(o) => !o && setDefaultTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set default business?</AlertDialogTitle>
            <AlertDialogDescription>
              "{defaultTarget?.businessName}" will become the default business for new installs and fresh logins. Only platform administrators can change this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetDefault}>Set default</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove register?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The register "{deleteTarget?.name}" will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRegister} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessCenter;
