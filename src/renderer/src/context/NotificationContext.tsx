import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { toast } from 'sonner';
import { playSound } from '../utils/sound';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  severity: string;
  isRead: number;
  isDismissed: number;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: number;
  snoozedUntil?: string;
  channels?: string;
  createdAt: string;
}

export interface Banner {
  id: number;
  title: string;
  message: string;
  severity: string;
  dismissible: number;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DashboardAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  count: number;
  actionUrl?: string;
  actionLabel?: string;
  entityType: string;
  dismissible: boolean;
}

export interface ModalNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actions: { label: string; value: string; variant?: 'default' | 'outline' | 'destructive' }[];
  payload?: any;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  categoryCounts: { category: string; total: number; unread: number }[];
  banners: Banner[];
  dashboardAlerts: DashboardAlert[];
  pendingModal: ModalNotification | null;

  refresh: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshModal: () => Promise<void>;

  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: number) => Promise<void>;
  snooze: (id: number, hours: number) => Promise<void>;
  clearAll: () => Promise<void>;
  dismissBanner: (id: number) => Promise<void>;
  dismissAlert: (id: string) => void;
  respondModal: (actionValue: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const DISMISSED_ALERTS_KEY = 'shega_dismissed_alerts_v1';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, language } = useSettings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<{ category: string; total: number; unread: number }[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dashboardAlerts, setDashboardAlerts] = useState<DashboardAlert[]>([]);
  const [pendingModal, setPendingModal] = useState<ModalNotification | null>(null);
  const dismissedAlertsRef = useRef<Set<string>>(new Set());

  // Load dismissed alert IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (raw) dismissedAlertsRef.current = new Set(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const prevGeneratedRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!window.api) return;
    try {
      const result = await window.api.checkNotifications();
      const [list, count, cats] = await Promise.all([
        window.api.getNotifications({ limit: 100 }),
        window.api.getUnreadNotificationCount(),
        window.api.getNotificationCategories(),
      ]);
      setNotifications(list || []);
      setUnreadCount(count || 0);
      setCategoryCounts(cats || []);
      if (result && result.generated > 0) {
        const badCount = result.bad || 0;
        if (badCount > 0) {
          playSound('bad');
          toast.warning(`${badCount} urgent notification${badCount > 1 ? 's' : ''}`, { description: 'Check notifications for details' });
        }
        prevGeneratedRef.current = result.generated;
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, []);

  const refreshBanners = useCallback(async () => {
    if (!window.api) return;
    try {
      const data = await window.api.getActiveBanners();
      setBanners(data || []);
    } catch (e) {
      console.error('Failed to load banners:', e);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    if (!window.api) return;
    try {
      const data = await window.api.getDashboardAlerts();
      const visible = (data || []).filter((a: DashboardAlert) => !dismissedAlertsRef.current.has(a.id));
      setDashboardAlerts(visible);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  }, []);

  function soundForType(type: string): 'nice' | 'bad' | 'reminder' {
    const bad = ['low_stock', 'out_of_stock', 'overdue', 'due_date', 'expiring', 'refund']
    const nice = ['completed', 'added', 'received', 'adjustment', 'complete']
    if (type.includes('reminder') || type.includes('Reminder')) return 'reminder'
    if (bad.some(k => type.includes(k))) return 'bad'
    if (nice.some(k => type.includes(k))) return 'nice'
    return 'reminder'
  }

  // Run the reminder engine on mount and every 5 minutes
  const refreshModal = useCallback(async () => {
    if (!window.api) return;
    try {
      const result = await window.api.runReminderEngine();
      if (result?.fired > 0) {
        // After firing, refresh notifications so the bell picks them up
        await refresh();
        // Show a toast for the most recent one
        const fresh = await window.api.getNotifications({ limit: 1 });
        if (fresh && fresh[0]) {
          toast.info(fresh[0].title, { description: fresh[0].message });
          playSound(soundForType(fresh[0].type));
        }
      }
    } catch (_) {}
  }, [refresh]);

  useEffect(() => {
    refresh();
    refreshBanners();
    refreshAlerts();
    refreshModal();
    const interval = setInterval(() => {
      refresh();
      refreshBanners();
      refreshAlerts();
      refreshModal();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh, refreshBanners, refreshAlerts, refreshModal, language]);

  const markRead = useCallback(async (id: number) => {
    try {
      await window.api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await window.api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
      toast.success(t('notifications.marked_all_read'));
    } catch (_) {}
  }, [t]);

  const dismiss = useCallback(async (id: number) => {
    try {
      await window.api.dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  const snooze = useCallback(async (id: number, hours: number) => {
    try {
      const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      await window.api.snoozeNotification(id, until);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(t('notifications.snoozed', { hours: String(hours) }));
    } catch (_) {}
  }, [t]);

  const clearAll = useCallback(async () => {
    if (!window.confirm(t('notifications.confirm_clear'))) return;
    try {
      await window.api.clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setCategoryCounts([]);
      toast.success(t('notifications.cleared'));
    } catch (_) {}
  }, [t]);

  const dismissBanner = useCallback(async (id: number) => {
    try {
      await window.api.dismissBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (_) {}
  }, []);

  const dismissAlert = useCallback((id: string) => {
    dismissedAlertsRef.current.add(id);
    try {
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(Array.from(dismissedAlertsRef.current)));
    } catch (_) {}
    setDashboardAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const respondModal = useCallback((actionValue: string) => {
    setPendingModal(null);
    // The action is handled by the source that pushed the modal (no global handling needed)
    if (actionValue === 'remind_later') {
      // Default: snooze 1 hour via a fresh reminder notif
      toast.info(t('notifications.remind_later'));
    }
  }, [t]);

  // Expose a global method to push modal notifications
  useEffect(() => {
    (window as any).__shegaPushModal = (modal: ModalNotification) => setPendingModal(modal);
    return () => { delete (window as any).__shegaPushModal; };
  }, []);

  // Device + sync lifecycle notifications: one channel, all events.
  // The main process pushes device:event payloads for connect / disconnect /
  // reconnecting / sync started / sync completed / sync failed; each maps to a
  // clear toast so the user always knows which device is doing what.
  useEffect(() => {
    if (!window.api?.onDeviceEvent) return;
    const off = window.api.onDeviceEvent(({ event, deviceName, deviceId, platform, mode }: any) => {
      const name = deviceName || (deviceId ? String(deviceId).slice(0, 12) : 'device');
      switch (event) {
        case 'device-visible': {
          const role = mode === 'team' ? 'team member' : 'owner';
          toast.info(`${name} is discoverable${platform ? ' (' + platform + ')' : ''}`, { description: `Ready to join as ${role}.` });
          break;
        }
        case 'device-hidden':
          toast.info(`${name} is no longer visible for pairing`);
          break;
        case 'device-connected': {
          const who = platform === 'mobile' ? `${name} (mobile)` : platform === 'desktop' ? `${name} (desktop)` : name;
          toast.success(`${who} connected`, { description: 'Syncing business data automatically.' });
          break;
        }
        case 'device-reconnecting':
          toast.info(`${name} reconnecting…`, { description: 'Sync will resume automatically once reconnected.' });
          break;
        case 'device-disconnected':
          toast.warning(`${name} disconnected`, { description: 'Sync is paused until the device reconnects.' });
          break;
        case 'sync-started':
          toast.info(`Sync started${deviceName ? ' with ' + deviceName : ''}`, { description: 'Applying changes from the connected device.' });
          break;
        case 'sync-completed':
          toast.success('Sync completed', { description: 'All changes from the connected device are up to date.' });
          break;
        case 'sync-failed':
          toast.error('Sync interrupted', { description: deviceName ? `Sync with ${deviceName} failed — changes may not be up to date.` : 'Sync failed — check the connected device.' });
          break;
      }
    });
    return () => { if (off) off(); };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications, unreadCount, categoryCounts,
        banners, dashboardAlerts, pendingModal,
        refresh, refreshBanners, refreshAlerts, refreshModal,
        markRead, markAllRead, dismiss, snooze, clearAll,
        dismissBanner, dismissAlert, respondModal
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
