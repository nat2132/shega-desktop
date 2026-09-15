import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bell, Search, Check, CheckCheck, X, Trash2, Clock,
  AlertCircle, AlertTriangle, Info, CheckCircle2, ShoppingCart,
  Package, Users, Truck, Settings as SettingsIcon, Archive,
  Filter, Eye, BellOff, Hourglass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  inventory: <Package className="h-4 w-4" />,
  sales: <ShoppingCart className="h-4 w-4" />,
  customers: <Users className="h-4 w-4" />,
  suppliers: <Truck className="h-4 w-4" />,
  employees: <Users className="h-4 w-4" />,
  system: <SettingsIcon className="h-4 w-4" />,
  reminders: <Clock className="h-4 w-4" />,
  backup: <Archive className="h-4 w-4" />,
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: <Info className="h-4 w-4 text-blue-600" /> },
  success: { bg: 'bg-green-500/10', text: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
  error: { bg: 'bg-red-500/10', text: 'text-red-600', icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
};

interface NotificationCenterProps {
  collapsed?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ collapsed }) => {
  const { t, formatDate } = useSettings();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, categoryCounts,
    markRead, markAllRead, dismiss, snooze, clearAll
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    let list = notifications;
    if (activeCategory !== 'all') list = list.filter(n => n.category === activeCategory);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s));
    }
    return list;
  }, [notifications, activeCategory, search]);

  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    const list = [{ key: 'all', label: t('notifications.filter_all'), total: notifications.length, unread: unreadCount }];
    categoryCounts.forEach(c => {
      if (!seen.has(c.category)) {
        seen.add(c.category);
        list.push({
          key: c.category,
          label: t(`notifications.cat_${c.category}`) || c.category,
          total: c.total,
          unread: c.unread
        });
      }
    });
    return list;
  }, [categoryCounts, notifications, unreadCount, t]);

  const handleAction = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setOpen(false);
    }
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t('notifications.just_now');
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const d = Math.floor(hr / 24);
    if (d < 7) return `${d}d`;
    return formatDate(iso, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        onClick={() => setOpen(!open)}
        className="relative"
        title={t('notifications.title')}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} style={{ left: collapsed ? 0 : 0 }}>
          <div
            className="absolute right-2 top-2 w-[420px] max-w-[calc(100vw-1rem)] bg-card border rounded-lg shadow-xl z-50 flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-widest">{t('notifications.title')}</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
                    <CheckCheck className="h-3 w-3 mr-1" />{t('notifications.mark_all_read')}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('notifications.search_placeholder')}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-1 p-2 border-b overflow-x-auto">
              {allCategories.map(c => (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeCategory === c.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 hover:bg-muted/60'
                  }`}
                >
                  {c.key !== 'all' && CATEGORY_ICONS[c.key] && <span className="opacity-70">{CATEGORY_ICONS[c.key]}</span>}
                  <span>{c.label}</span>
                  {c.unread > 0 && (
                    <span className={`ml-1 px-1 rounded-full text-xs ${activeCategory === c.key ? 'bg-white/20' : 'bg-red-500/20 text-red-600'}`}>
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                    {t('notifications.empty')}
                  </p>
                </div>
              ) : (
                filtered.map(n => {
                  const sev = SEVERITY_COLORS[n.severity] || SEVERITY_COLORS.info;
                  const catIcon = CATEGORY_ICONS[n.category] || CATEGORY_ICONS.system;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 border-b hover:bg-muted/20 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => handleAction(n)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded ${sev.bg}`}>{catIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-normal'} truncate`}>{n.title}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">{relativeTime(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {n.actionUrl && (
                              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); handleAction(n); }}>
                                <Eye className="h-3 w-3 mr-1" />{n.actionLabel || t('common.view')}
                              </Button>
                            )}
                            {!n.isRead && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                                <Check className="h-3 w-3 mr-1" />{t('notifications.mark_read')}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); snooze(n.id, 1); }} title={t('notifications.snooze_1h')}>
                              <Hourglass className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between p-2 border-t bg-muted/20">
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="h-7 text-xs">
                  <Filter className="h-3 w-3 mr-1" />{showHistory ? t('notifications.hide_history') : t('notifications.show_history')}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-red-500">
                  <Trash2 className="h-3 w-3 mr-1" />{t('notifications.clear_all')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
