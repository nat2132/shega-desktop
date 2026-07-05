import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: number;
  createdAt: string;
}

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { formatDateTime } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    window.api.getNotifications({ limit: 50 }).then((data: Notification[]) => {
      setNotifications(data);
    });
  };

  const markAsRead = (id: number) => {
    window.api.markNotificationRead(id).then(() => {
      loadNotifications();
    });
  };

  const clearAll = () => {
    window.api.clearNotifications().then(() => {
      setNotifications([]);
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={18} className="text-orange-400" />;
      case 'error': return <AlertCircle size={18} className="text-red-400" />;
      case 'success': return <CheckCircle size={18} className="text-green-400" />;
      default: return <Info size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="fixed right-6 top-24 w-96 bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] shadow-2xl z-50 fade-in border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-bold text-lg">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Clear all">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-white/30">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                n.isRead ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-white/50 text-xs mt-1">{n.message}</p>
                  <p className="text-white/30 text-xs mt-2">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
