import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Pencil, Trash2, Eye, EyeOff, Crown, Power
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
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

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { DataTable } from '../components/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Modal from '../components/Modal';
import { cn } from '../utils/shadcn';

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '🛒' },
  { id: 'expenses', label: 'Expenses', icon: '💰' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'adjustments', label: 'Adjustments', icon: '⚙️' },
  { id: 'settings', label: 'Settings', icon: '🔧' },
];

interface AdminRow {
  id: number;
  name: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: number;
  createdAt: string;
}

const AdminManagement: React.FC = () => {
  const { currentAdmin } = useAuth();
  const { t } = useSettings();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    pin: '',
    confirmPin: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await window.api?.getAdmins();
      setAdmins(data || []);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const total = admins.length;
    const active = admins.filter(a => a.isActive).length;
    const superAdmins = admins.filter(a => a.role === 'super_admin').length;
    const avgPerms = active > 0
      ? Math.round(admins.filter(a => a.role !== 'super_admin').reduce((sum, a) => sum + a.permissions.length, 0) / Math.max(admins.filter(a => a.role !== 'super_admin').length, 1))
      : 0;

    return [
      {
        title: t('admin.total_operators'),
        value: total,
        trend: t('settings.active'),
        trendType: 'up' as const,
        footerTitle: t('admin.system_accounts'),
        footerSub: t('admin.all_admins')
      },
      {
        title: t('admin.active_sessions'),
        value: active,
        trend: `${total - active} ${t('admin.inactive')}`,
        trendType: 'up' as const,
        footerTitle: t('admin.operational_capacity'),
        footerSub: t('admin.currently_enabled')
      },
      {
        title: t('admin.super_admins'),
        value: superAdmins,
        trend: t('admin.protected'),
        trendType: 'up' as const,
        footerTitle: t('admin.root_access'),
        footerSub: t('admin.highest_privilege')
      },
      {
        title: t('admin.avg_permissions'),
        value: avgPerms,
        trend: `${t('admin.of_total')} ${ALL_PERMISSIONS.length}`,
        trendType: 'up' as const,
        footerTitle: t('admin.access_breadth'),
        footerSub: t('admin.per_account')
      },
    ];
  }, [admins]);

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map(p => p.id)
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const resetForm = () => {
    setFormData({ name: '', username: '', pin: '', confirmPin: '', permissions: [] });
    setEditingAdmin(null);
    setError('');
    setShowPin(false);
  };

  const openEdit = (admin: AdminRow) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      username: admin.username,
      pin: '',
      confirmPin: '',
      permissions: [...admin.permissions],
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setError(t('admin.required_fields'));
      return;
    }

    if (!editingAdmin && (!formData.pin || formData.pin.length !== 4)) {
      setError(t('admin.pin_error'));
      return;
    }

    if (formData.pin && formData.pin !== formData.confirmPin) {
      setError(t('admin.pin_mismatch'));
      return;
    }

    try {
      if (editingAdmin) {
        const updateData: any = {
          name: formData.name.trim(),
          username: formData.username.trim(),
          permissions: formData.permissions,
        };
        if (formData.pin) {
          updateData.pin = formData.pin;
        }
        const result = await window.api?.updateAdmin(editingAdmin.id, updateData);
        if (!result?.success) {
          setError(result?.error || 'Update failed');
          return;
        }
      } else {
        const result = await window.api?.insertAdmin({
          name: formData.name.trim(),
          username: formData.username.trim(),
          pin: formData.pin,
          role: 'admin',
          permissions: formData.permissions,
        });
        if (!result?.success) {
          setError(result?.error || 'Creation failed');
          return;
        }
      }

      setShowModal(false);
      resetForm();
      loadAdmins();
    } catch (err) {
      setError(t('common.error'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await window.api?.deleteAdmin(id);
    if (result?.success) {
      loadAdmins();
    }
  };

  const handleToggleActive = async (admin: AdminRow) => {
    await window.api?.updateAdmin(admin.id, { isActive: admin.isActive ? 0 : 1 });
    loadAdmins();
  };

  const columns: ColumnDef<AdminRow>[] = [
    {
      accessorKey: "name",
      header: t('admin.identity'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm",
            row.original.role === 'super_admin'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold">{row.original.name}</span>
              {row.original.role === 'super_admin' && (
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
              @{row.original.username}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "role",
      header: t('common.category'),
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === 'super_admin' ? 'default' : 'outline'}
          className="uppercase text-xs font-bold"
        >
          {row.original.role === 'super_admin' ? t('admin.super_admins') : t('common.operator')}
        </Badge>
      )
    },
    {
      accessorKey: "permissions",
      header: t('admin.access_scope'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.role === 'super_admin' ? (
            <Badge variant="outline" className="text-xs font-bold bg-primary/5 border-primary/20 text-primary">
              {t('admin.full_access')}
            </Badge>
          ) : (
            <>
              {row.original.permissions.slice(0, 3).map(p => (
                <Badge key={p} variant="outline" className="text-xs font-bold">
                  {p}
                </Badge>
              ))}
              {row.original.permissions.length > 3 && (
                <Badge variant="outline" className="text-xs font-bold">
                  +{row.original.permissions.length - 3}
                </Badge>
              )}
            </>
          )}
        </div>
      )
    },
    {
      accessorKey: "isActive",
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? 'default' : 'destructive'}
          className="uppercase text-xs font-bold"
        >
          {row.original.isActive ? t('settings.active') : t('admin.inactive')}
        </Badge>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => {
        const isSelf = row.original.id === currentAdmin?.id;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleActive(row.original)}
              disabled={isSelf}
              title={row.original.isActive ? t('admin.deactivate') : t('admin.activate')}
              className={row.original.isActive ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} title={t('common.edit')}>
              <Pencil className="h-4 w-4" />
            </Button>

            {!isSelf && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('admin.remove_title')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                      {t('admin.remove_desc')} <span className="font-bold text-retail-black">{row.original.name}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel className="rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.original.id)}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest"
                    >
                      {t('admin.confirm_removal')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
        <SectionCards cards={kpiCards} />

        <div className="px-4 lg:px-6">
          <DataTable
            columns={columns}
            data={admins}
            title={t('admin.directory')}
          />
        </div>

        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingAdmin ? t('admin.modify') : t('admin.create')} size="lg">
          <form onSubmit={handleSubmit} className="space-y-8 py-2">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('admin.identity')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('admin.display_name')}</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 bg-card rounded-xl font-bold"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('admin.username')}</label>
                  <Input
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    className="h-12 bg-card rounded-xl font-bold"
                    placeholder="e.g. johndoe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">
                {editingAdmin ? t('admin.pin_reset') : t('admin.security_pin')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('admin.pin_code')}</label>
                  <div className="relative">
                    <Input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                      className="h-12 bg-card rounded-xl font-black text-center text-2xl tracking-[0.5em] pr-12"
                      placeholder="••••"
                      required={!editingAdmin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('admin.confirm_pin')}</label>
                  <Input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={formData.confirmPin}
                    onChange={e => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '') })}
                    className="h-12 bg-card rounded-xl font-black text-center text-2xl tracking-[0.5em]"
                    placeholder="••••"
                    required={!editingAdmin && !!formData.pin}
                  />
                </div>
              </div>
            </div>

            {/* Permission Picker */}
            {(!editingAdmin || editingAdmin.role !== 'super_admin') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{t('admin.access_permissions')}</h4>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllPermissions} className="text-xs font-black uppercase tracking-widest text-primary hover:underline">{t('common.max')}</button>
                    <span className="text-muted-foreground/30">|</span>
                    <button type="button" onClick={clearAllPermissions} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:underline">{t('common.abort')}</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ALL_PERMISSIONS.map(perm => {
                    const isActive = formData.permissions.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group",
                          isActive
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-transparent bg-muted/30 hover:border-muted-foreground/20"
                        )}
                      >
                        <span className="text-xl">{perm.icon}</span>
                        <span className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {t(`tabs.${perm.id}` as any)}
                        </span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {editingAdmin?.role === 'super_admin' && (
              <div className="p-6 rounded-2xl border bg-primary/5 border-primary/20 flex items-center gap-4">
                <Crown className="h-6 w-6 text-retail-orange" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">{t('admin.super_admins')}</p>
                  <p className="text-xs text-muted-foreground font-bold">{t('admin.super_admin_desc')}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
              <Button type="submit" className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg">
                {editingAdmin ? t('settings.commit_changes') : t('admin.create')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }} className="py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent">
                {t('common.abort')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* FAB */}
      <Button
        className="fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group"
        onClick={() => { resetForm(); setShowModal(true); }}
      >
        <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} />
        <span className="text-xs font-black uppercase tracking-tighter">{t('common.operator')}</span>
      </Button>
    </>
  );
};

export default AdminManagement;
