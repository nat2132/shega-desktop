import React from 'react';
import { Lock, ShieldX, MinusCircle } from 'lucide-react';
import { useDeviceEnforcement } from '../hooks/useDeviceEnforcement';

/**
 * Full-screen, non-dismissible blocker for the receive side of remote device
 * control (spec §17/§18). When THIS desktop install's roster status is
 * locked/disabled/removed, this covers the whole UI so the user cannot transact
 * or reach any screen. Clearing requires the owner or manager to re-enable it
 * remotely; the next poll lifts the overlay automatically.
 */
const DeviceLockOverlay: React.FC = () => {
  const { blocked, status, name, reason } = useDeviceEnforcement();
  if (!blocked) return null;

  const Icon = status === 'locked' ? Lock : status === 'removed' ? MinusCircle : ShieldX;
  const accentCls = status === 'locked' ? 'text-amber-500' : 'text-red-500';
  const iconBg = status === 'locked' ? 'bg-amber-500/15' : 'bg-red-500/15';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`h-10 w-10 ${accentCls}`} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest">
          {status === 'locked'
            ? 'Device Locked'
            : status === 'disabled'
              ? 'Device Disabled'
              : 'Device Removed'}
        </h2>
        {name && (
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">{name}</p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{reason}</p>
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/70">
          Access will be restored automatically by the owner when this device is re-enabled.
        </p>
      </div>
    </div>
  );
};

export default DeviceLockOverlay;
