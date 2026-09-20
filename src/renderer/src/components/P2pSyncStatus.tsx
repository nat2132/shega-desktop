import React, { useCallback, useEffect, useState } from 'react';
import {
  Monitor, Smartphone, Wifi, Globe, ShieldOff, RefreshCw, Pencil,
  CheckCircle2, AlertTriangle, Loader2, XCircle, Plus, X, Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { cn } from '../utils/shadcn';
import { useSettings } from '../context/SettingsContext';
import { RadarPulse } from './RadarPulse';

const STATE_DOT: Record<string, string> = {
  synced: 'bg-green-500',
  syncing: 'bg-blue-500 animate-pulse',
  waiting: 'bg-amber-500',
  pending: 'bg-orange-500',
  error: 'bg-red-500',
  offline: 'bg-gray-500',
};

const STATE_LABEL: Record<string, string> = {
  synced: 'Synced',
  syncing: 'Syncing…',
  waiting: 'Waiting for device',
  pending: 'Changes pending',
  error: 'Sync failed',
  offline: 'Offline',
};

const KIND_LABEL: Record<string, string> = {
  lan: 'LAN',
  'p2p-direct': '🟢 Direct P2P',
  relay: '🟡 Relay',
};

interface DeviceRow {
  deviceId: string;
  deviceType: string;
  kind: string;
  connectedAt: number;
  lastSyncAt: number | null;
  online: boolean;
  source: 'webrtc' | 'roster';
  name?: string;
  model?: string;
  state?: string;
  pending?: number;
  user?: string;
}

function lastSyncLabel(ts: number | null): string {
  if (!ts) return 'Never synced';
  const diff = Date.now() - ts;
  if (diff < 45_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return new Date(ts).toLocaleDateString();
}

/** Connected Devices — full device management for all device combinations. */
export default function P2pSyncStatus() {
  const { t } = useSettings() as any;
  const [health, setHealth] = useState<any>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [detail, setDetail] = useState<DeviceRow | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [h, d, c] = await Promise.all([
        window.api?.p2pHealth?.() ?? Promise.resolve(null),
        window.api?.p2pDevices?.() ?? Promise.resolve([]),
        window.api?.p2pRecordCounts?.() ?? Promise.resolve({}),
      ]);
      setHealth(h);
      setDevices((d || []) as DeviceRow[]);
      setCounts(c || {});
    } catch { /* not started yet */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const revoke = async (deviceId: string) => {
    setBusy(true);
    try { await window.api?.p2pRevokeDevice?.(deviceId); toast.success('Device revoked — it can no longer sync.'); await load(); } finally { setBusy(false); }
  };

  const rename = async () => {
    if (!renaming?.value.trim()) return;
    setBusy(true);
    try {
      const ok = await window.api?.p2pRenameDevice?.(renaming.id, renaming.value.trim());
      toast[ok ? 'success' : 'error'](ok ? 'Device renamed.' : 'Rename failed.');
      setRenaming(null);
      await load();
    } finally { setBusy(false); }
  };

  const discover = async () => {
    setBusy(true);
    try { await window.api?.p2pAnnounce?.(); toast.success('Discovering nearby Shega devices on this network…'); await load(); } finally { setBusy(false); }
  };

  const deviceState = (d: DeviceRow): string => {
    if (!d.online) return 'offline';
    if ((d.pending ?? 0) > 0) return 'pending';
    return 'synced';
  };

  const online = devices.filter((d) => d.online);
  const offline = devices.filter((d) => !d.online);

  const renderRow = (d: DeviceRow) => {
    const st = deviceState(d);
    const Icon = d.deviceType === 'desktop' ? Monitor : Smartphone;
    const kind = KIND_LABEL[d.kind] ?? 'LAN';
    return (
      <div key={d.deviceId} className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3',
        d.online ? 'border-border bg-background' : 'border-dashed border-border opacity-70',
      )}>
        <div className={cn(
          'flex size-9 items-center justify-center rounded-lg',
          d.online ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}>
          <Icon size={16} />
        </div>
        <button className="flex-1 min-w-0 text-left" onClick={() => setDetail(d)}>
          <p className="text-sm font-bold text-foreground truncate">
            {d.name || (d.deviceType === 'desktop' ? 'Shega Desktop' : 'Shega Mobile')}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {d.deviceType === 'desktop' ? 'Desktop' : 'Mobile'} · {d.model || d.deviceId.slice(0, 12) + '…'} · {d.online ? kind : 'Last seen ' + lastSyncLabel(d.connectedAt || null)}
          </p>
        </button>
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-block size-2 rounded-full', STATE_DOT[st])} />
          <span className={cn('text-[11px] font-bold', d.online ? 'text-foreground' : 'text-muted-foreground')}>
            {STATE_LABEL[st]}
          </span>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-muted-foreground">Last sync</p>
          <p className="text-[11px] font-bold text-foreground">{lastSyncLabel(d.lastSyncAt)}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setRenaming({ id: d.deviceId, value: d.name || '' })} title="Rename">
          <Pencil size={12} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={busy} onClick={() => revoke(d.deviceId)} title="Revoke device">
          <ShieldOff size={12} className="text-red-500" />
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Connected Devices</CardTitle>
          <CardDescription className="text-xs">
            All your Shega devices — Desktop ↔ Desktop, Mobile ↔ Mobile, and mixed — sync directly with each other
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span className="text-[11px] font-bold text-muted-foreground">
              {devices.filter((d) => d.online).length} online · {health.pendingUpdates ?? 0} pending
            </span>
          )}
          <Button variant="outline" size="sm" disabled={busy} onClick={discover}>
            <RefreshCw className={cn('mr-1 size-3.5', busy && 'animate-spin')} /> Find devices
          </Button>
          <Button size="sm" onClick={() => setPairOpen(true)}>
            <Plus className="mr-1 size-3.5" /> Connect New Device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renaming && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <Input
              value={renaming.value}
              onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
              placeholder="Device name"
              className="h-9 flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && rename()}
            />
            <Button size="sm" onClick={rename} disabled={busy}><CheckCircle2 className="mr-1 size-3.5" /> Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setRenaming(null)}>Cancel</Button>
          </div>
        )}

        {/* Online devices */}
        {online.length === 0 && offline.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <Monitor className="mb-2 size-6 opacity-30" />
            <p className="text-sm font-bold text-foreground">No devices yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Connect another Desktop or Mobile to sync products, sales, inventory and more — directly, device to device.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setPairOpen(true)}>
              <Plus className="mr-1 size-3.5" /> Connect New Device
            </Button>
          </div>
        ) : (
          <>
            {online.length > 0 && (
              <>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Connected</p>
                <div className="space-y-2">{online.map(renderRow)}</div>
              </>
            )}
            {offline.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Offline</p>
                <div className="space-y-2">{offline.map(renderRow)}</div>
              </>
            )}
          </>
        )}

        {/* Pair modal */}
        {pairOpen && (
          <PairDeviceModal
            onClose={() => setPairOpen(false)}
            recordCounts={counts}
            businessName={(t && typeof t === 'function' && t('dashboard.business_name', '')) || 'this business'}
          />
        )}

        {/* Device detail drawer */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setDetail(null)}>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  {detail.name || (detail.deviceType === 'desktop' ? 'Shega Desktop' : 'Shega Mobile')}
                </p>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetail(null)}><X size={14} /></Button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ['Type', detail.deviceType === 'desktop' ? 'Desktop' : 'Mobile'],
                  ['Status', STATE_LABEL[deviceState(detail)]],
                  ['Connection', detail.online ? (KIND_LABEL[detail.kind] ?? 'LAN') : '—'],
                  ['Last sync', lastSyncLabel(detail.lastSyncAt)],
                  ['Pending changes', String(detail.pending ?? 0)],
                  ['Device ID', detail.deviceId],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-bold text-foreground truncate">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Business data on this device</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(counts).slice(0, 9).map(([label, n]) => (
                  <div key={label} className="rounded-lg border border-border bg-background p-2 text-center">
                    <p className="text-sm font-black text-foreground">{n.toLocaleString()}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Add Device modal — discovery radar, no QR and no pairing code.
 *
 * This device advertises itself and browses for other Shega devices on the
 * LAN, showing each one by name under a pulsing radar. Selecting a device
 * grants it trust and kicks the Yjs full-state bootstrap. The pairing
 * credential stays available behind "Show pairing code instead" for networks
 * where mDNS is blocked.
 */
function PairDeviceModal({ onClose, recordCounts, businessName }: {
  onClose: () => void;
  recordCounts: Record<string, number>;
  businessName: string;
}) {
  const [approving, setApproving] = useState(false);
  const [selfName, setSelfName] = useState('This computer');
  const [peers, setPeers] = useState<Array<{ id: string; name: string; platform?: string }>>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [pairingToken, setPairingToken] = useState('');
  const [hubUrl, setHubUrl] = useState('');

  // Advertise while this modal is open, and refresh the nearby list live —
  // no button press, like a Bluetooth device scan.
  useEffect(() => {
    let stopped = false;
    window.api?.deviceName?.().then((n) => { if (n) setSelfName(n); }).catch(() => {});
    (async () => {
      try {
        const s = await window.api?.syncStatus?.();
        setPairingToken(s?.pairingToken || '');
        setHubUrl(s?.lanUrl || '');
      } catch { /* hub status unavailable */ }
    })();
    (async () => {
      try { await window.api?.pairBeaconDiscoverable?.(true, businessName, 'owner'); } catch { /* ignore */ }
      await window.api?.p2pAnnounce?.();
      while (!stopped) {
        try {
          const list = await window.api?.pairBeaconNearby?.();
          if (!stopped && Array.isArray(list)) {
            setPeers(list.map((e: any) => ({
              id: e.beacon?.owner?.deviceId || e.beacon?.businessId || String(Math.random()),
              name: e.beacon?.owner?.deviceName || 'Nearby device',
              platform: e.beacon?.owner?.platform,
            })));
          }
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 3000));
      }
    })();
    return () => {
      stopped = true;
      window.api?.pairBeaconDiscoverable?.(false).catch(() => {});
    };
  }, [businessName]);

  const copyToken = async () => {
    if (!pairingToken) return;
    try { await navigator.clipboard.writeText(pairingToken); toast.success('Pairing code copied'); } catch { /* ignore */ }
  };

  const approveIncoming = async (deviceName?: string, code?: string) => {
    setApproving(true);
    try {
      // Real trust grant: register the peer on this LAN as an active device in
      // the registry + business roster, then re-announce so the granted peer
      // dials us and the Yjs full-state bootstrap runs.
      const granted = await window.api?.p2pApprove?.(deviceName, code || undefined) ?? [];
      const scope = deviceName ? `“${deviceName}”` : 'on this network';
      if (granted.length === 0) toast.info(`No desktop peer ${scope} yet — keep this window open and try again.`);
      await window.api?.p2pAnnounce?.();
      toast.success(granted.length > 0 ? `Approved ${granted.length} device(s) ${scope} — syncing business data…` : `Ready — waiting for ${scope}…`);
      if (granted.length > 0) setTimeout(onClose, 1200);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Add Team / Device</p>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X size={14} /></Button>
        </div>

        <RadarPulse
          deviceName={selfName}
          status={peers.length > 0 ? `${peers.length} device${peers.length === 1 ? '' : 's'} found` : 'Searching for nearby devices…'}
          tone={peers.length > 0 ? 'found' : 'searching'}
          compact
          peers={peers.map((p) => ({
            id: p.id,
            name: p.name,
            platform: p.platform,
            detail: approving ? 'Approving…' : 'Tap to connect',
            disabled: approving,
          }))}
          onPickPeer={(p) => void approveIncoming(p.name)}
          emptyHint={`Open Shega on the other device (Devices → Add Team / Device). Devices on this Wi-Fi appear here for ${businessName}.`}
        />

        <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Joining</p>
          <p className="text-sm font-bold text-foreground">{businessName}</p>
        </div>

        {approving && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
            <Loader2 className="size-3.5 animate-spin" /> Syncing business data…
            <span className="font-normal text-muted-foreground">
              {Object.entries(recordCounts).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </span>
          </div>
        )}

        <Button size="sm" className="mt-4 w-full" onClick={() => void approveIncoming()} disabled={approving}>
          <CheckCircle2 className="mr-1 size-3.5" /> Approve nearby device & start sync
        </Button>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="mt-3 w-full text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground/80 transition-colors"
        >
          {showDetails ? 'Hide pairing code' : 'Show pairing code instead'}
        </button>

        {/* Credential fallback for networks where device discovery is blocked. */}
        {showDetails && (
          <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pairing code</p>
              <button onClick={copyToken} className="font-mono text-sm font-black tracking-[0.2em] text-foreground" title="Click to copy">
                {pairingToken || '—'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hub URL</p>
              <p className="font-mono text-[11px] text-foreground truncate">{hubUrl || '—'}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter both on the other Shega device under Devices → Add Team / Device. Short-lived, contains no credentials.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
