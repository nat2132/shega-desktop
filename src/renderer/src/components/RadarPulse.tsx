import React from 'react';
import { AlertTriangle, Check, Loader2, MonitorSmartphone, Radar, Smartphone } from 'lucide-react';

/**
 * RadarPulse — the single pairing visual shared by Join Mode and
 * Add Team / Add Device.
 *
 * A centered device icon inside soft pulsing rings, with this device's own name
 * underneath and a status line. Discovered peers are passed in as `peers` and
 * slide in beneath the radar as they arrive, so the owner sees devices moving
 * toward the center rather than a form.
 *
 * Animations are pure CSS keyframes (no per-ring JS timers) so the screen stays
 * smooth on low-end hardware, and are disabled under prefers-reduced-motion.
 */

export type RadarTone = 'searching' | 'found' | 'connecting' | 'connected' | 'failed';

const TONE_DOT: Record<RadarTone, string> = {
  searching: 'bg-blue-400',
  found: 'bg-emerald-400',
  connecting: 'bg-amber-400',
  connected: 'bg-emerald-400',
  failed: 'bg-red-400',
};

const TONE_STYLE: Record<RadarTone, string> = {
  searching: 'text-blue-400 border-blue-400/25 bg-blue-400/10',
  found: 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10',
  connecting: 'text-amber-400 border-amber-400/25 bg-amber-400/10',
  connected: 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10',
  failed: 'text-red-400 border-red-400/25 bg-red-400/10',
};

const RADAR_CSS = `
@keyframes shega-radar-ring {
  0%   { transform: scale(0.72); opacity: 0.55; }
  70%  { transform: scale(1.55); opacity: 0; }
  100% { transform: scale(1.55); opacity: 0; }
}
@keyframes shega-radar-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
@keyframes shega-radar-in {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.shega-radar-ring {
  animation: shega-radar-ring 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
}
.shega-radar-core { animation: shega-radar-breathe 3.2s ease-in-out infinite; }
.shega-radar-in { animation: shega-radar-in 0.35s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .shega-radar-ring, .shega-radar-core, .shega-radar-in { animation: none !important; }
}
`;

let cssInjected = false;
function useRadarCss() {
  React.useEffect(() => {
    if (cssInjected) return;
    const el = document.createElement('style');
    el.setAttribute('data-shega-radar', 'true');
    el.textContent = RADAR_CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }, []);
}

export interface RadarPeer {
  id: string;
  name: string;
  platform?: string;
  detail?: string;
  disabled?: boolean;
}

interface RadarPulseProps {
  /** This device's own name, shown in the center under the icon. */
  deviceName: string;
  /** One short human status line — "Waiting for connection…", "Connecting…", etc. */
  status: string;
  tone: RadarTone;
  /** Extra icon shown between the status dot and the text (defaults to Radar). */
  compact?: boolean;
  peers?: RadarPeer[];
  onPickPeer?: (peer: RadarPeer) => void;
  emptyHint?: string;
}

export const RadarPulse: React.FC<RadarPulseProps> = ({
  deviceName,
  status,
  tone,
  compact = false,
  peers = [],
  onPickPeer,
  emptyHint,
}) => {
  useRadarCss();
  const badge = `${TONE_STYLE[tone]} flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest`;
  const size = compact ? 92 : 128;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Radar */}
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <span
          className="shega-radar-ring absolute inset-0 rounded-full border border-foreground/25"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="shega-radar-ring absolute inset-0 rounded-full border border-foreground/15"
          style={{ animationDelay: '0.8s' }}
        />
        <span
          className="shega-radar-ring absolute inset-0 rounded-full border border-foreground/10"
          style={{ animationDelay: '1.6s' }}
        />
        <span
          className="shega-radar-core grid place-items-center rounded-full bg-muted/60 border border-border"
          style={{ width: size * 0.56, height: size * 0.56 }}
        >
          <MonitorSmartphone size={compact ? 24 : 30} className="text-foreground" />
        </span>
      </div>

      {/* This device's identity */}
      <div className="text-center space-y-1.5">
        <p className="text-sm font-black uppercase tracking-widest text-foreground break-all">{deviceName}</p>
        <div className={badge}>
          {tone === 'searching' && <Radar size={12} className="animate-pulse" />}
          {tone === 'connecting' && <Loader2 size={12} className="animate-spin" />}
          {(tone === 'found' || tone === 'connected') && <Check size={12} />}
          {tone === 'failed' && <AlertTriangle size={12} />}
          <span>{status}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]} ${tone === 'searching' || tone === 'connecting' ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      {/* Discovered peers sliding toward the center */}
      {peers.length > 0 && (
        <div className="w-full space-y-1.5">
          {peers.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={p.disabled}
              onClick={() => onPickPeer?.(p)}
              className="shega-radar-in w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-all text-left disabled:opacity-50 disabled:cursor-default"
            >
              <span className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-400">
                {p.platform === 'mobile' ? <Smartphone size={15} /> : <MonitorSmartphone size={15} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-foreground truncate">{p.name}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 truncate">
                  {p.detail || 'Nearby device'}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {peers.length === 0 && emptyHint && (
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 px-2">
          {emptyHint}
        </p>
      )}
    </div>
  );
};

export default RadarPulse;
