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
import ApprovalConfig from './JoinApprovalConfig';

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

/** How a device is actually connected — from the live peer/roster presence. */
const METHOD_LABEL: Record<string, string> = {
  lan: 'Connected via LAN',
  p2p: 'Peer-to-Peer',
  relay: 'TURN relay',
  cloud: 'Cloud',
  offline: 'Offline',
};

type DeviceMethod = 'lan' | 'p2p' | 'relay' | 'cloud' | 'offline';
type DeviceStatus = 'connected' | 'connecting' | 'offline' | 'reconnecting';

interface DeviceRow {
  deviceId: string;
  deviceType: string;
  kind: string;
  method?: DeviceMethod;
  connectedAt: number;
  lastSyncAt: number | null;
  lastSeenAt?: number | null;
  online: boolean;
  status?: DeviceStatus;
  source: 'webrtc' | 'ws' | 'roster';
  name?: string;
  model?: string;
  userName?: string | null;
  role?: string | null;
  avatar?: string | null;
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

function initials(name?: string | null): string {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
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
    if (d.status === 'connecting') return 'syncing';
    if (d.status === 'reconnecting') return 'waiting';
    if (!d.online || d.status === 'offline') return 'offline';
    if ((d.pending ?? 0) > 0) return 'pending';
    return 'synced';
  };

  const online = devices.filter((d) => d.online);
  const offline = devices.filter((d) => !d.online);

  const renderRow = (d: DeviceRow) => {
    const st = deviceState(d);
    const Icon = d.deviceType === 'desktop' ? Monitor : Smartphone;
    const method = METHOD_LABEL[d.method ?? (d.online ? 'lan' : 'offline')] ?? 'Connected via LAN';
    const who = d.userName || d.user || (d.role ? 'Team member' : null);
    return (
      <div key={d.deviceId} className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3',
        d.online ? 'border-border bg-background' : 'border-dashed border-border opacity-70',
      )}>
        <div className={cn(
          'flex size-9 items-center justify-center rounded-lg text-[11px] font-black overflow-hidden shrink-0',
          d.online ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}>
          {d.avatar ? (
            <img src={d.avatar} alt={d.userName || d.name || 'Avatar'} className="size-full object-cover" />
          ) : (d.userName || d.user) ? (
            initials(d.userName || d.user)
          ) : (
            <Icon size={16} />
          )}
        </div>
        <button className="flex-1 min-w-0 text-left" onClick={() => setDetail(d)}>
          <p className="text-sm font-bold text-foreground truncate">
            {d.name || (d.deviceType === 'desktop' ? 'Shega Desktop' : 'Shega Mobile')}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {who && <span className="font-bold text-foreground/80">{who}{d.role ? ` · ${d.role}` : ''} — </span>}
            <span className={cn(d.online && 'text-green-600 dark:text-green-400')}>{method}</span>
            {!d.online && ` · Last seen ${lastSyncLabel(d.lastSeenAt ?? (d.connectedAt || null))}`}
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
            onConnected={() => load()}
            businessName={(t && typeof t === 'function' && t('dashboard.business_name', '')) || 'this business'}
          />
        )}

        {/* Device detail drawer */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setDetail(null)}>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden font-bold shrink-0">
                  {detail.avatar ? (
                    <img src={detail.avatar} alt={detail.userName || 'Avatar'} className="size-full object-cover" />
                  ) : (detail.userName || detail.user) ? (
                    initials(detail.userName || detail.user)
                  ) : (
                    detail.deviceType === 'desktop' ? <Monitor size={18} /> : <Smartphone size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {detail.name || (detail.deviceType === 'desktop' ? 'Shega Desktop' : 'Shega Mobile')}
                  </p>
                  {detail.userName && (
                    <p className="text-xs text-muted-foreground truncate">{detail.userName} {detail.role ? `· ${detail.role}` : ''}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetail(null)}><X size={14} /></Button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ['Type', detail.deviceType === 'desktop' ? 'Desktop' : 'Mobile'],
                  ['User', detail.userName || '—'],
                  ['Role', detail.role || '—'],
                  ['Status', STATE_LABEL[deviceState(detail)]],
                  ['Connection', detail.online ? (METHOD_LABEL[detail.method ?? 'lan'] ?? 'Connected via LAN') : '—'],
                  ['Last seen', lastSyncLabel(detail.lastSeenAt ?? (detail.connectedAt || null))],
                  ['Last sync', lastSyncLabel(detail.lastSyncAt)],
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

/** Connection flow state for a single radar peer inside the Add Device modal.
 *  Honest ladder: the trust GRANT (approved) and the live CONNECTION (online)
 *  are distinct moments and are reported distinctly — a granted device that
 *  has not dialed in yet must not claim to be syncing. */
type PeerPhase = 'idle' | 'connecting' | 'approved' | 'online' | 'failed';

interface RadarPeerRow {
  id: string;
  deviceId?: string;
  host?: string;
  name: string;
  platform?: string;
}

/**
 * Add Device modal — pairing code first, discovery radar secondary.
 *
 * This device advertises itself and browses for other Shega devices on the
 * LAN, showing each one by name under a pulsing radar. Tapping a row grants
 * EXACTLY that device (its radar identity, which includes LAN-sweep hits that
 * mDNS misses), then the row walks Device found → Connecting… → Approved →
 * Connected (online) — or shows Connection failed with a Retry. "Approved"
 * means the grant succeeded but the device has not dialed in yet; the row
 * only says "Connected — syncing" once the peer is actually online. The
 * pairing code is always shown up top so a joiner on a network where
 * discovery is blocked can still connect by typing it on their device.
 */
function PairDeviceModal({ onClose, recordCounts, businessName, onConnected }: {
  onClose: () => void;
  recordCounts: Record<string, number>;
  businessName: string;
  onConnected?: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [selfName, setSelfName] = useState('This computer');
  const [peers, setPeers] = useState<RadarPeerRow[]>([]);
  const [phase, setPhase] = useState<Record<string, PeerPhase>>({});
  const [peerError, setPeerError] = useState<Record<string, string>>({});
  const [pairingToken, setPairingToken] = useState('');
  const [hubUrl, setHubUrl] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [rolePeer, setRolePeer] = useState<RadarPeerRow | null>(null);

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
      let first = true;
      const refreshNearby = async () => {
        try {
          const [list, activeDevices] = await Promise.all([
            window.api?.pairBeaconNearby?.(first),
            window.api?.p2pDevices?.(),
          ]);
          first = false;
          const activeSet = new Set(
            (Array.isArray(activeDevices) ? activeDevices : [])
              .filter((d: any) => d.online || d.status === 'active')
              .map((d: any) => d.deviceId)
          );
          if (!stopped && Array.isArray(list)) {
            setPeers(list
              .filter((e: any) => !e.beacon?.owner?.deviceId || !activeSet.has(e.beacon.owner.deviceId))
              .map((e: any) => ({
                id: e.beacon?.owner?.deviceId || e.beacon?.businessId || String(Math.random()),
                deviceId: e.beacon?.owner?.deviceId,
                host: e.host,
                name: e.beacon?.owner?.deviceName || 'Nearby device',
                platform: e.beacon?.owner?.platform,
              })));
          }
        } catch { /* ignore */ }
      };

      // Listen for instant device-visible events pushed from UDP / mDNS
      const unsub = window.api?.onDeviceEvent?.((e: any) => {
        if (e?.type === 'device-visible' || e?.type === 'device-event') {
          void refreshNearby();
        }
      });

      while (!stopped) {
        await refreshNearby();
        await new Promise((r) => setTimeout(r, 1200));
      }

      return () => {
        unsub?.();
      };
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

  const markPhase = (id: string, p: PeerPhase) => setPhase((x) => ({ ...x, [id]: p }));

  /**
   * Watch the granted peer until it actually comes ONLINE (WebRTC/WS/roster
   * presence — this includes mobile peers, whose hub registration now flips
   * the roster row). Honest phases: the grant (approved) and the live
   * connection (online) are different moments. On timeout the row KEEPS the
   * approved state — the grant persists and the device may connect when its
   * user opens Shega; only a failed grant is 'failed'.
   */
  const watchPeerOnline = async (deviceId: string, p: RadarPeerRow) => {
    for (let i = 0; i < 8; i += 1) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const list = (await window.api?.p2pDevices?.()) as DeviceRow[] | undefined;
        if (Array.isArray(list) && list.some((d) => d.deviceId === deviceId && d.online)) {
          markPhase(p.id, 'online');
          onConnected?.();
          toast.success(`“${p.name}” is connected.`);
          return;
        }
      } catch { /* transient poll error — keep watching */ }
    }
  };

  const connectPeer = async (peer: RadarPeerRow) => {
    if (!peer.deviceId) { toast.error('That device did not share an identity yet — try again in a moment.'); return; }
    if (phase[peer.id] === 'connecting' || phase[peer.id] === 'online') return;
    setPeerError((x) => ({ ...x, [peer.id]: '' }));
    // Owner-controlled onboarding: the tap opens the role prompt FIRST, and the
    // chosen role rides the approved join request to the joining device.
    setRolePeer(peer);
  };

  /** Grant the tapped peer with the owner-assigned role (role step done). */
  const grantPeer = async (peer: RadarPeerRow, role: string, permissions?: Record<string, unknown>) => {
    setRolePeer(null);
    markPhase(peer.id, 'connecting');
    setApproving(true);
    try {
      const res = await window.api?.p2pApproveOne?.({
        deviceId: peer.deviceId,
        name: peer.name,
        host: peer.host,
        platform: peer.platform,
        role,
        permissions,
      });
      if (res?.connected) {
        // Trust granted. The actual connection happens when the peer dials in.
        markPhase(peer.id, 'approved');
        await window.api?.p2pAnnounce?.();
        void watchPeerOnline(peer.deviceId!, peer);
      } else {
        markPhase(peer.id, 'failed');
        setPeerError((x) => ({ ...x, [peer.id]: res?.error || 'The device did not respond. Keep Shega open on it and try again.' }));
      }
    } catch {
      markPhase(peer.id, 'failed');
      setPeerError((x) => ({ ...x, [peer.id]: 'Connection attempt failed — please try again.' }));
    } finally {
      setApproving(false);
    }
  };

  const approveIncoming = async (deviceName?: string, code?: string) => {
    setApproving(true);
    try {
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

  /** Manual fallback: enter the code that the other device shows ("Pairing code"). */
  const connectWithCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) { toast.info('Enter the pairing code shown on the other device.'); return; }
    setApproving(true);
    try {
      const granted = await window.api?.p2pApprove?.(undefined, code) ?? [];
      if (granted.length === 0) { toast.error('No device matched that code — make sure both devices are on the same network and the code is correct.'); return; }
      await window.api?.p2pAnnounce?.();
      toast.success('Approved by pairing code — syncing business data…');
      setTimeout(onClose, 1200);
    } finally {
      setApproving(false);
    }
  };

  const peerDetail = (p: RadarPeerRow): string => {
    switch (phase[p.id]) {
      case 'connecting': return 'Connecting…';
      case 'approved': return 'Approved — waiting for the device to connect (tap to retry)';
      case 'online': return 'Connected — syncing business data';
      case 'failed': return peerError[p.id] || 'Connection failed — tap to retry';
      default: return 'Tap to assign a role';
    }
  };

  const onlineCount = peers.filter((p) => phase[p.id] === 'online').length;
  const approvedCount = peers.filter((p) => phase[p.id] === 'approved').length;
  const activeConnecting = peers.some((p) => phase[p.id] === 'connecting');
  const activeConnectingName = peers.find((p) => phase[p.id] === 'connecting')?.name;

  const radarPeers = peers.map((p) => {
    const ph = phase[p.id];
    // 'approved' stays tappable: the grant persists, so a tap re-announces and
    // restarts the online watch instead of leaving the user at a dead end.
    const inFlight = ph === 'connecting' || ph === 'online';
    return {
      id: p.id,
      deviceId: p.deviceId,
      host: p.host,
      name: p.name,
      platform: p.platform,
      detail: peerDetail(p),
      disabled: inFlight || approving,
    } as any;
  });

  const radarTone = activeConnecting ? 'connecting' : onlineCount > 0 ? 'connected' : peers.length > 0 ? 'found' : 'searching';
  const radarStatus = activeConnecting
    ? `Connecting to ${activeConnectingName || 'device'}…`
    : onlineCount > 0
      ? `${onlineCount} connected — syncing${approvedCount > 0 ? ` · ${approvedCount} waiting` : ''}`
      : approvedCount > 0
        ? `${approvedCount} approved — waiting for device${approvedCount === 1 ? '' : 's'} to connect`
        : peers.length > 0
          ? `${peers.length} device${peers.length === 1 ? '' : 's'} found`
          : 'Searching across Wi-Fi/LAN, P2P, and Cloud…';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Add Team / Device</p>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X size={14} /></Button>
        </div>

        {/* Pairing credential — code-first, prominently at the top. */}
        <div className="mb-3 rounded-xl border-2 border-dashed border-blue-500/40 bg-blue-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your pairing code</p>
            <p className="font-mono text-2xl font-black tracking-[0.3em] text-blue-600">{pairingToken || '—'}</p>
            <button onClick={copyToken} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground" title="Copy pairing code">
              Copy
            </button>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">
            Devices see this on the same Wi-Fi or online. A joiner can also type it on the other Shega device instead of tapping the radar.
          </p>
        </div>

        <RadarPulse
          deviceName={selfName}
          status={radarStatus}
          tone={radarTone}
          compact
          peers={radarPeers}
          onPickPeer={(p) => void connectPeer(p as any)}
          emptyHint="Checked Wi-Fi/LAN, P2P signaling, and Internet cloud sync. Open Shega on the other device — devices appear here automatically."
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

        {/* Manual fallback: enter a code from another device when discovery is blocked. */}
        <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Or connect with a pairing code</p>
          <div className="flex gap-2">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="CODE FROM OTHER DEVICE"
              className="font-mono uppercase tracking-[0.2em]"
              onKeyDown={(e) => { if (e.key === 'Enter') void connectWithCode(); }}
            />
            <Button size="sm" variant="outline" onClick={() => void connectWithCode()} disabled={approving}>
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hub URL</p>
            <p className="truncate font-mono text-[11px] text-foreground">{hubUrl || '—'}</p>
          </div>
        </div>
      </div>

      {/* Role assignment prompt — shown right after the owner taps a radar peer,
          before the grant. The owner assigns ONLY the role; the joiner sets up
          their own name, profile picture and PIN after approval. */}
      {rolePeer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6" onClick={() => setRolePeer(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Assign a role to “{rolePeer.name}”</p>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setRolePeer(null)}><X size={14} /></Button>
            </div>
            <ApprovalConfig
              applicantName={rolePeer.name}
              busy={approving}
              onConfirm={(cfg) => void grantPeer(rolePeer, cfg.role, cfg.permissions)}
              onDecline={() => setRolePeer(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}