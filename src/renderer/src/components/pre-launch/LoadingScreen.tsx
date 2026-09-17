import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface SyncStatusData {
  running: boolean;
  hubId: string;
  lanUrl: string;
  port: number;
  peers: Array<{ deviceId: string; name: string; lastSeenAt: string | null; cursorSeq: number; lastSyncAt: string | null; stale: boolean }>;
  pendingOutbox: number;
  conflicts: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const { t, settingsLoaded } = useSettings();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [mounted, setMounted] = useState(false);
  const [minShown, setMinShown] = useState(false);
  // Live status from the main process — no fake timers.
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 100);
    const t2 = setTimeout(() => setMinShown(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let failures = 0;
    const poll = async () => {
      try {
        const s = await window.api?.syncStatus?.();
        if (cancelled) return;
        setStatus(s ?? null);
        setPollError(null);
        failures = 0;
      } catch (err: any) {
        if (cancelled) return;
        setPollError(err?.message || 'Sync status unavailable');
        if (++failures >= 2) setStatus(null);
      }
    };
    poll();
    const timer = setInterval(poll, 1200);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Finish once the business data is actually loaded and a short minimum has
  // elapsed so the screen never flashes.
  useEffect(() => {
    if (!settingsLoaded || !minShown) return;
    const t = setTimeout(() => onCompleteRef.current(), 300);
    return () => clearTimeout(t);
  }, [settingsLoaded, minShown]);

  const stepRows = [
    {
      label: t('loading.step_1'),
      sub: settingsLoaded ? 'Ready' : 'Reading this terminal’s local data',
      done: settingsLoaded,
    },
    {
      label: status == null
        ? (pollError ? t('loading.wait') : 'Contacting the sync hub…')
        : status.pendingOutbox > 0
          ? `${status.pendingOutbox} pending change${status.pendingOutbox === 1 ? '' : 's'} to push`
          : 'All changes synced',
      sub: status == null
        ? (pollError || 'Starting the LAN hub…')
        : status.pendingOutbox > 0
          ? 'Flushing your offline changes to the hub'
          : 'Nothing waiting in the outbox',
      done: !!status && status.pendingOutbox === 0,
    },
    {
      label: status == null
        ? 'Checking connected devices…'
        : status.peers.length > 0
          ? `${status.peers.length} device${status.peers.length === 1 ? '' : 's'} on the LAN hub`
          : status.running ? 'Hub is live — waiting for other devices on Wi-Fi' : 'Sync hub is starting…',
      sub: status?.lanUrl ? `Hub at ${status.lanUrl}` : undefined,
      done: !!status && status.running && status.peers.length > 0,
    },
    {
      label: status == null
        ? 'Verifying sync health…'
        : status.conflicts > 0
          ? `${status.conflicts} conflict${status.conflicts === 1 ? '' : 's'} to review`
          : 'Sync healthy — no conflicts',
      sub: status == null ? undefined : status.conflicts > 0 ? 'Check Sync Settings after you sign in' : 'All devices in agreement',
      done: !!status && status.conflicts === 0,
    },
  ];

  const completedSteps = stepRows.filter(r => r.done).length;
  const activeIdx = stepRows.findIndex(r => !r.done);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-sm px-10 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-10">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t('loading.preparing')}</h2>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/20 mt-2">{t('loading.wait')}</p>
        </div>

        <div className="space-y-3">
          {stepRows.map((step, i) => {
            const isCompleted = step.done;
            const isActive = !isCompleted && (i === 0 || stepRows[i - 1].done);

            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                isCompleted ? 'bg-white/[0.04]' : 'bg-transparent'
              }`}>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted ? 'bg-white/10' : 'bg-white/[0.03]'
                }`}>
                  {isCompleted ? (
                    <Check size={14} className="text-white/60" />
                  ) : isActive ? (
                    <Loader2 size={14} className="text-white/30 animate-spin" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold uppercase tracking-widest truncate transition-all duration-300 ${
                    isCompleted ? 'text-white/50' : isActive || i === activeIdx ? 'text-white/70' : 'text-white/15'
                  }`}>
                    {step.label}
                  </p>
                  {step.sub && (
                    <p className="text-[10px] font-bold text-white/20 tracking-wide truncate mt-0.5">{step.sub}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real progress from the main process */}
        <div className="mt-8 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/20 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps / stepRows.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;