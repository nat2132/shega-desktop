import React, { useEffect, useState } from 'react';
import {
  Bell, Volume2, MonitorSmartphone, Save,
  Plus, Trash2, Clock, CheckCircle2, Calendar, Repeat,
  Loader2, Send, Moon
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
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

interface Reminder {
  id: number;
  title: string;
  message: string;
  category: string;
  triggerDate: string;
  repeatInterval: string;
  status: string;
  snoozedUntil: string;
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
  'expenses.recurring_due': 'notification_settings.recurring_expense',
  'expenses.overdue': 'notification_settings.overdue_expenses',
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
  { key: 'expenses', label: 'Expenses' },
  { key: 'system', label: 'System' },
  { key: 'employees', label: 'Employees' },
];

const NotificationSettings: React.FC = () => {
  const { t } = useSettings();
  const [prefs, setPrefs] = useState<NotificationPref[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '', message: '', category: 'system',
    triggerDate: new Date().toISOString().split('T')[0], repeatInterval: ''
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'unsupported'>('idle');
  const [quietHours, setQuietHours] = useState({ startTime: '22:00', endTime: '07:00', active: false });
  const [savingQuietHours, setSavingQuietHours] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        window.api.getNotificationPreferences(),
        window.api.getReminders({ limit: 200 }),
      ]);
      setPrefs(p || []);
      setReminders(r || []);
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

  const fireReminderEngine = async () => {
    try {
      const result = await window.api.runReminderEngine();
      if (result?.fired > 0) {
        toast.success(t('notifications.reminder_triggered', '{count} reminder(s) triggered').replace('{count}', String(result.fired)));
      }
    } catch (_) {}
  };

  const createReminder = async () => {
    if (!newReminder.title.trim()) return toast.error(t('notifications.title_required', 'Title is required'));
    try {
      await window.api.createReminder({
        ...newReminder,
        triggerDate: new Date(newReminder.triggerDate).toISOString(),
      });
      toast.success(t('notifications.reminder_created', 'Reminder created'));
      setShowAddReminder(false);
      setNewReminder({ title: '', message: '', category: 'system', triggerDate: new Date().toISOString().split('T')[0], repeatInterval: '' });
      await Promise.all([loadData(), fireReminderEngine()]);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const snoozeReminder = async (id: number, hours: number) => {
    const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    try {
      await window.api.snoozeReminder(id, until);
      toast.success(t('notifications.snoozed_hours', 'Snoozed for {hours}h').replace('{hours}', String(hours)));
      await Promise.all([loadData(), fireReminderEngine()]);
    } catch (e: any) { toast.error(e.message); }
  };

  const completeReminder = async (id: number) => {
    try {
      await window.api.completeReminder(id);
      toast.success(t('notifications.marked_complete', 'Marked complete'));
      await Promise.all([loadData(), fireReminderEngine()]);
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteReminder = async (id: number) => {
    if (!window.confirm(t('notifications.delete_confirm', 'Delete this reminder?'))) return;
    try {
      await window.api.deleteReminder(id);
      await loadData();
    } catch (e: any) { toast.error(e.message); }
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

  const testDesktopNotification = async () => {
    setTestStatus('sending');
    try {
      const r = await window.api.showDesktopNotification({
        title: 'Shega Test Notification',
        body: 'Desktop notifications are working correctly!',
        urgency: 'normal'
      });
      setTestStatus(r.shown ? 'ok' : 'unsupported');
      if (r.shown) toast.success(t('notifications.test_sent', 'Notification sent!'));
      else toast.error(t('notifications.test_unsupported', 'Not supported in this environment'));
    } catch {
      setTestStatus('unsupported');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
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
      {/* Header with test button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />{t('notifications.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('notifications.settings_subtitle')}</p>
        </div>
        <Button variant="outline" onClick={testDesktopNotification} disabled={testStatus === 'sending'}>
          {testStatus === 'sending' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
          {t('notifications.test_desktop')}
        </Button>
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
                      <p className="text-[10px] text-muted-foreground font-mono">{p.key}</p>
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

      {/* Reminders */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />{t('notifications.reminders_title')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('notifications.reminders_subtitle')}</p>
          </div>
          <Button size="sm" onClick={() => setShowAddReminder(!showAddReminder)}>
            <Plus className="h-4 w-4 mr-1" />{t('notifications.add_reminder')}
          </Button>
        </div>

        {showAddReminder && (
          <div className="border rounded p-3 space-y-2 bg-muted/20">
            <Input
              placeholder={t('notifications.reminder_title')}
              value={newReminder.title}
              onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
            />
            <textarea
              className="w-full border rounded px-2 py-1 bg-background text-sm min-h-[60px]"
              placeholder={t('notifications.reminder_message')}
              value={newReminder.message}
              onChange={e => setNewReminder({ ...newReminder, message: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                className="border rounded px-2 py-1 bg-background text-sm"
                value={newReminder.category}
                onChange={e => setNewReminder({ ...newReminder, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{t(`notifications.cat_${c.key}`, c.label)}</option>)}
              </select>
              <DatePicker
                value={newReminder.triggerDate}
                onChange={e => setNewReminder({ ...newReminder, triggerDate: e })}
              />
              <select
                className="border rounded px-2 py-1 bg-background text-sm"
                value={newReminder.repeatInterval}
                onChange={e => setNewReminder({ ...newReminder, repeatInterval: e.target.value })}
              >
                <option value="">{t('notifications.once')}</option>
                <option value="daily">{t('notifications.daily')}</option>
                <option value="weekly">{t('notifications.weekly')}</option>
                <option value="monthly">{t('notifications.monthly')}</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddReminder(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={createReminder}><Save className="h-4 w-4 mr-1" />{t('common.save')}</Button>
            </div>
          </div>
        )}

        {reminders.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-6">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {t('notifications.empty_reminders')}
          </div>
        ) : (
          <div className="space-y-1">
            {reminders.map(r => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/20">
                <div className={`h-2 w-2 rounded-full ${r.status === 'completed' ? 'bg-green-500' : r.status === 'pending' ? 'bg-amber-500' : 'bg-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${r.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{r.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />{r.triggerDate.split('T')[0]}
                    {r.repeatInterval && <><Repeat className="h-3 w-3" />{r.repeatInterval}</>}
                    <span className="px-1 rounded bg-muted">{r.category}</span>
                  </p>
                </div>
                {r.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => snoozeReminder(r.id, 1)} title={t('notification_settings.snooze_1h')}>
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => completeReminder(r.id)} title={t('notification_settings.mark_complete')}>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteReminder(r.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
