import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, Megaphone, Wifi } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', icon: <Info className="h-4 w-4" /> },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-300', icon: <CheckCircle2 className="h-4 w-4" /> },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', icon: <AlertTriangle className="h-4 w-4" /> },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-300', icon: <AlertCircle className="h-4 w-4" /> },
  announcement: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', icon: <Megaphone className="h-4 w-4" /> },
  maintenance: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-700 dark:text-slate-300', icon: <Wifi className="h-4 w-4" /> },
};

const NotificationBanners: React.FC = () => {
  const { banners, dismissBanner } = useNotifications();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (banners.length === 0) return null;

  const visibleBanners = banners.filter(b => !dismissed.has(b.id));

  return (
    <div className="space-y-1">
      {visibleBanners.map(b => {
        const style = SEVERITY_STYLES[b.severity] || SEVERITY_STYLES.info;
        return (
          <div
            key={b.id}
            className={`flex items-center gap-3 px-4 py-2 border-l-4 ${style.bg} ${style.border} ${style.text}`}
          >
            <div className="flex-shrink-0">{style.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{b.title}</p>
              {b.message && <p className="text-xs opacity-80 truncate">{b.message}</p>}
            </div>
            {b.actionUrl && b.actionLabel && (
              <button
                onClick={() => navigate(b.actionUrl!)}
                className="flex items-center gap-1 text-xs font-semibold hover:underline flex-shrink-0"
              >
                {b.actionLabel}
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
            {b.dismissible ? (
              <button
                onClick={() => { setDismissed(prev => new Set(prev).add(b.id)); dismissBanner(b.id); }}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
                title={t('notifications.dismiss')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default NotificationBanners;
