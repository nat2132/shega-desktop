import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X, ExternalLink, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <AlertTriangle className="h-5 w-5 text-amber-600" /> },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <AlertCircle className="h-5 w-5 text-red-600" /> },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Info className="h-5 w-5 text-blue-600" /> },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <CheckCircle2 className="h-5 w-5 text-green-600" /> },
};

interface DashboardAlertsProps {
  maxItems?: number;
  showHeader?: boolean;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ maxItems = 6, showHeader = true }) => {
  const { dashboardAlerts, dismissAlert } = useNotifications();
  const { t } = useSettings();
  const navigate = useNavigate();

  if (dashboardAlerts.length === 0) return null;

  const visible = dashboardAlerts.slice(0, maxItems);

  return (
    <Card className="@container/card">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />{t('notifications.alerts_title')}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">
              {dashboardAlerts.length} {t('notifications.alerts_active')}
            </span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {visible.map(a => {
          const style = SEVERITY_STYLES[a.type] || SEVERITY_STYLES.info;
          return (
            <div
              key={a.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{a.title}</p>
                  {a.count > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-background/60">
                      {a.count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{a.message}</p>
                {a.actionUrl && a.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(a.actionUrl!)}
                    className="h-6 mt-2 text-[10px]"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />{a.actionLabel}
                  </Button>
                )}
              </div>
              {a.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissAlert(a.id)}
                  className="h-6 w-6 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardAlerts;
