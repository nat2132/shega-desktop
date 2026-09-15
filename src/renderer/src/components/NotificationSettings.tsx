import React, { useEffect, useState } from 'react';
import {
  Bell, Volume2, MonitorSmartphone, Save, Trash2,
  Loader2, Moon
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface NotificationPref {
  key: string;
  enabled: number;
  sound: number;
  desktop: number;
  inApp: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  'inventory.low_stock': 'notification_settings.low_stock_alerts',
  'inventory.out_of_stock': 'notification_settings.out_of_stock_alerts',
  'inventory.expiring': 'notification_settings.expiring_alerts',
  'inventory.adjustment': 'notification_settings.adjustment_alerts',
  'sales.completed': 'notification_settings.sale_completed',
  'sales.refund': 'notification_settings.sale_refund',
  'customers.overdue_balance': 'notification_settings.overdue_customer',
  'customers.payment_due': 'notification_settings.customer_payment_due',
  'suppliers.overdue_balance': 'notification_settings.overdue_supplier',
  'suppliers.payment_due': 'notification_settings.supplier_payment_due',
  'suppliers.purchase_received': 'notification_settings.purchase_received',
  'system.backup_complete': 'notification_settings.backup_complete',
  'system.backup_reminder': 'notification_settings.backup_reminder',
  'system.update_available': 'notification_settings.update_available',
  'system.license_expiring': 'notification_settings.license_expiring',
  'employees.account_locked': 'notification_settings.account_locked',
  'employees.shift_reminder': 'notification_settings.shift_reminder',
};

const CATEGORIES = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'system', label: 'System' },
  { key: 'employees', label: 'Employees' },
];

const NotificationSettings: React.FC = () => {
  const { t } = useSettings();
  const [prefs, setPrefs] = useState<NotificationPref[]>([]);
  const [alertPrefs, setAlertPrefs] = useState<Record<string, boolean>>({
    inventory_alerts: true,
    debt_alerts: true,
    expiry_alerts: true,
    sales_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [quietHours, setQuietHours] = useState({ startTime: '22:00', endTime: '07:00', active: false });
  const [savingQuietHours, setSavingQuietHours] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        window.api.getNotificationPreferences(),
        window.api.getSetting('notification_preferences'),
      ]);
      setPrefs(p || []);
      if (a) setAlertPrefs({ ...alertPrefs, ...a });
    } catch (e: any) {
      toast.error(e.message || t('notifications.load_error', 'Failed to load preferences'));
    } finally {
      setLoading(false);
    }
  };

  const loadQuietHours = async () => {
    try {
      const result = await window.api.getQuietHours();
      if (result && result.length > 0) {
        setQuietHours(result[0]);
      }
    } catch (_) {}
  };

  useEffect(() => { loadData(); loadQuietHours(); }, []);

  const updateAlertPref = async (key: string, value: boolean) => {
    const updated = { ...alertPrefs, [key]: value };
    setAlertPrefs(updated);
    try {
      await window.api.setSetting('notification_preferences', updated);
    } catch (e: any) {
      toast.error(e.message || t('notifications.update_error', 'Update failed'));
    }
  };

  const updatePref = async (key: string, patch: Partial<NotificationPref>) => {
    setSavingKey(key);
    try {
      const current = prefs.find(p => p.key === key) || { key, enabled: 1, sound: 0, desktop: 0, inApp: 1 };
      const updated = { ...current, ...patch };
      await window.api.updateNotificationPreference(key, updated);
      setPrefs(prev => prev.map(p => p.key === key ? updated : p));
    } catch (e: any) {
      toast.error(e.message || t('notifications.update_error', 'Update failed'));
    } finally {
      setSavingKey(null);
    }
  };

  const saveQuietHours = async () => {
    setSavingQuietHours(true);
    try {
      await window.api.setQuietHours({
        startTime: quietHours.startTime,
        endTime: quietHours.endTime,
        active: quietHours.active,
      });
      toast.success(t('quiet_hours.saved'));
    } catch (e: any) {
      toast.error(e.message || t('quiet_hours.save_error', 'Failed to save quiet hours'));
    } finally {
      setSavingQuietHours(false);
    }
  };

  const deleteQuietHours = async () => {
    try {
      await window.api.deleteQuietHours();
      setQuietHours({ startTime: '22:00', endTime: '07:00', active: false });
      toast.success(t('quiet_hours.deleted', 'Quiet hours deleted'));
    } catch (e: any) {
      toast.error(e.message || t('quiet_hours.delete_error', 'Failed to delete quiet hours'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5" />{t('notifications.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('notifications.settings_subtitle')}</p>
      </div>

      {/* Channel legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="flex items-center gap-2 p-2 rounded border bg-muted/20 text-xs">
          <MonitorSmartphone className="h-4 w-4 text-blue-600" /><span>{t('notifications.channel_desktop')}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded border bg-muted/20 text-xs">
          <Bell className="h-4 w-4 text-primary" /><span>{t('notifications.channel_inapp')}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded border bg-muted/20 text-xs">
          <Volume2 className="h-4 w-4 text-purple-600" /><span>{t('notifications.channel_sound')}</span>
        </div>
      </div>

      {/* Alert Group Toggles */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm">{t('settings.alert_groups', 'Alert Categories')}</h3>
        <p className="text-xs text-muted-foreground">{t('settings.notif_desc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'inventory_alerts', label: t('settings.inventory_alerts'), desc: t('settings.inventory_notif_desc') },
            { key: 'debt_alerts', label: t('settings.debt_alerts'), desc: t('settings.debt_notif_desc') },
            { key: 'expiry_alerts', label: t('settings.expiry_alerts'), desc: t('settings.expiry_notif_desc') },
            { key: 'sales_alerts', label: t('settings.sales_alerts'), desc: t('settings.sales_notif_desc') },
          ].map(item => (
            <div key={item.key} className="flex items-start gap-3 p-2 rounded hover:bg-muted/20">
              <Switch
                checked={alertPrefs[item.key]}
                onCheckedChange={(v: boolean) => updateAlertPref(item.key, v)}
              />
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences by category */}
      <div className="space-y-4">
        {CATEGORIES.map(cat => {
          const catPrefs = prefs.filter(p => p.key.startsWith(cat.key + '.'));
          if (catPrefs.length === 0) return null;
          return (
            <div key={cat.key} className="bg-card border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">{t(`notifications.cat_${cat.key}`, cat.label)}</h3>
              <div className="space-y-2">
                {catPrefs.map(p => (
                  <div key={p.key} className="flex items-center gap-3 p-2 rounded hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{t(CATEGORY_LABELS[p.key] || p.key)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChannelToggle
                        active={!!p.inApp}
                        onChange={v => updatePref(p.key, { inApp: v ? 1 : 0 })}
                        title={t('notifications.channel_inapp')}
                        icon={<Bell className="h-3 w-3" />}
                        loading={savingKey === p.key}
                      />
                      <ChannelToggle
                        active={!!p.desktop}
                        onChange={v => updatePref(p.key, { desktop: v ? 1 : 0 })}
                        title={t('notifications.channel_desktop')}
                        icon={<MonitorSmartphone className="h-3 w-3" />}
                        loading={savingKey === p.key}
                      />
                      <ChannelToggle
                        active={!!p.sound}
                        onChange={v => updatePref(p.key, { sound: v ? 1 : 0 })}
                        title={t('notifications.channel_sound')}
                        icon={<Volume2 className="h-3 w-3" />}
                        loading={savingKey === p.key}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiet Hours */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Moon className="h-4 w-4" />{t('quiet_hours.title')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('quiet_hours.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="quiet-hours-toggle" className="text-xs">
              {quietHours.active ? t('quiet_hours.enabled') : t('quiet_hours.disabled')}
            </Label>
            <Switch
              id="quiet-hours-toggle"
              checked={quietHours.active}
              onCheckedChange={(v: boolean) => setQuietHours({ ...quietHours, active: v })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="quiet-hours-start" className="text-xs">{t('quiet_hours.start_time')}</Label>
            <Input
              id="quiet-hours-start"
              type="time"
              value={quietHours.startTime}
              onChange={e => setQuietHours({ ...quietHours, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quiet-hours-end" className="text-xs">{t('quiet_hours.end_time')}</Label>
            <Input
              id="quiet-hours-end"
              type="time"
              value={quietHours.endTime}
              onChange={e => setQuietHours({ ...quietHours, endTime: e.target.value })}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t('quiet_hours.info')}</p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={deleteQuietHours}>
            <Trash2 className="h-4 w-4 mr-1" />{t('quiet_hours.delete', 'Delete')}
          </Button>
          <Button size="sm" onClick={saveQuietHours} disabled={savingQuietHours}>
            {savingQuietHours ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChannelToggle: React.FC<{
  active: boolean;
  onChange: (v: boolean) => void;
  title: string;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ active, onChange, title, icon, loading }) => (
  <button
    onClick={() => onChange(!active)}
    disabled={loading}
    title={title}
    className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
    }`}
  >
    {icon}
  </button>
);

export default NotificationSettings;
