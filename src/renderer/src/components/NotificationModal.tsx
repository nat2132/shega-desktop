import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import Modal from './Modal';
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const SEVERITY_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="h-6 w-6 text-blue-600" />, color: 'text-blue-600' },
  success: { icon: <CheckCircle2 className="h-6 w-6 text-green-600" />, color: 'text-green-600' },
  warning: { icon: <AlertTriangle className="h-6 w-6 text-amber-600" />, color: 'text-amber-600' },
  error: { icon: <AlertCircle className="h-6 w-6 text-red-600" />, color: 'text-red-600' },
};

const NotificationModal: React.FC = () => {
  const { pendingModal, respondModal } = useNotifications();

  if (!pendingModal) return null;
  const sev = SEVERITY_ICONS[pendingModal.severity] || SEVERITY_ICONS.info;

  return (
    <Modal
      isOpen={!!pendingModal}
      title={pendingModal.title}
      onClose={() => respondModal('close')}
      size="md"
    >
      <div className="space-y-4 p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{sev.icon}</div>
          <div className="flex-1">
            <p className="text-sm text-foreground">{pendingModal.message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
          {pendingModal.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => respondModal(a.value)}
              className={
                a.variant === 'destructive'
                  ? 'px-3 py-1.5 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700'
                  : a.variant === 'outline'
                    ? 'px-3 py-1.5 rounded border bg-background text-foreground text-sm font-semibold hover:bg-muted'
                    : 'px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90'
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
