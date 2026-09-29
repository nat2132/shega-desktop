import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Smartphone, Monitor, WifiOff, Loader2, CheckCircle2, RefreshCw, Copy, Trash2,
  QrCode, KeyRound, Radar, Pencil, Check, X, ArrowLeft,
} from 'lucide-react';

/**
 * Connected Devices — the desktop half of Settings → Connected Devices.
 *
 * Pairing is device-to-device and business-data only: the QR / pairing code a
 * device scans authorises *this device's business data* to sync with that
 * device. It creates no user, assigns no role and copies no login credential —
 * each device keeps its own local users, sign-in and PIN.
 *
 * Everything shown here comes from the real sync layer (`sync:status` for the
 * hub's identity and code, `p2p:devices` for live peers, `p2p:record-counts`
 * for what will sync), so the page reflects what the device is actually doing
 * rather than a separate parallel model.
 */

interface Peer {
  deviceId: string;
  name?: string;
  lastSeenAt?: string | null;
  cursorSeq?: number;
  lastSyncAt?: string | null;
  stale?: boolean;
}

interface LiveDevice {
  deviceId: string;
  deviceType?: string;
  deviceName?: string;
  kind?: string;
  platform?: string;
  connectedAt?: number;
  lastSyncAt?: number | null;
}

interface SyncStatus {
  running?: boolean;
  hubId?: string;
  pairingToken?: string;
  lanUrl?: string;
  port?: number;
  peers?: Peer[];
}

const pairUri = (status: SyncStatus | null): string => {
  const host = status?.lanUrl || '';
  const token = status?.pairingToken || '';
  return `shega://pair?host=${encodeURIComponent(host)}&token=${encodeURIComponent(token)}`;
};

const formatWhen = (value?: string | number | null): string => {
  if (value === null || value === undefined || value === '') return 'Never';
  const date = new Date(typeof value === 'number' ? value : value);
  if (Number.isNaN(date.getTime())) return 'Never';
  const diff = Date.now() - date.getTime();
  if (diff < 45_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
};

const methodLabel = (kind?: string): string => {
  switch (kind) {
    case 'relay': return 'TURN relay';
    case 'p2p-direct': return 'Peer-to-peer';
    case 'cloud': return 'Cloud';
    default: return 'Connected via LAN';
  }
};

export const ConnectedDevices: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useSettings();

  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [live, setLive] = useState<LiveDevice[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [showCode, setShowCode] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statusRes, liveRes, countsRes] = await Promise.all([
        window.api.syncStatus().catch(() => null),
        window.api.p2pDevices().catch(() => []),
        window.api.p2pRecordCounts().catch(() => ({})),
      ]);
      setStatus((statusRes as SyncStatus) || null);
      setLive(Array.isArray(liveRes) ? (liveRes as LiveDevice[]) : []);
      setCounts((countsRes as Record<string, number>) || {});
    } catch (err) {
      console.error('[connected-devices] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Poll so a device that connects (or drops) shows up without a manual refresh.
  useEffect(() => {
    const timer = setInterval(() => { void load(); }, 8000);
    return () => clearInterval(timer);
  }, [load]);

  // The QR encodes the same LAN address + pairing token the manual code shows,
  // so a phone that can't read the QR can always type the code instead.
  useEffect(() => {
    let cancelled = false;
    const text = pairUri(status);
    if (!status?.pairingToken || !status?.lanUrl) { setQrDataUrl(null); return () => { cancelled = true; }; }
    (async () => {
      try {
        const url = await window.api.pairingQrCode(text);
        if (!cancelled) setQrDataUrl(typeof url === 'string' ? url : null);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  const devices = useMemo(() => {
    const byId = new Map<string, { deviceId: string; name: string; platform: string; online: boolean; method: string; lastSync: string | number | null; lastSeen: string | number | null }>();
    for (const d of live) {
      if (!d?.deviceId) continue;
      byId.set(d.deviceId, {
        deviceId: d.deviceId,
        name: d.deviceName || d.deviceId.slice(0, 8),
        platform: (d.deviceType || d.platform || 'desktop').toLowerCase() === 'mobile' ? 'mobile' : 'desktop',
        online: true,
        method: methodLabel(d.kind),
        lastSync: d.lastSyncAt ?? null,
        lastSeen: Date.now(),
      });
    }
    for (const p of status?.peers ?? []) {
      if (!p?.deviceId) continue;
      const existing = byId.get(p.deviceId);
      if (existing) {
        byId.set(p.deviceId, { ...existing, name: existing.name || p.name || p.deviceId.slice(0, 8) });
      } else {
        byId.set(p.deviceId, {
          deviceId: p.deviceId,
          name: p.name || p.deviceId.slice(0, 8),
          platform: 'mobile',
          online: false,
          method: 'Offline',
          lastSync: p.lastSyncAt ?? null,
          lastSeen: p.lastSeenAt ?? null,
        });
      }
    }
    return [...byId.values()].sort((a, b) => Number(b.online) - Number(a.online));
  }, [live, status]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  const discover = async () => {
    try {
      await window.api.p2pAnnounce();
      toast.info('Searching this network for other Shega devices…');
      setTimeout(() => { void load(); }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Could not start discovery.');
    }
  };

  const revoke = async (deviceId: string, name: string) => {
    if (!window.confirm(`Unpair "${name}"? It stops syncing immediately and must be paired again to reconnect.`)) return;
    setBusyId(deviceId);
    try {
      await window.api.p2pRevokeDevice(deviceId);
      toast.success('Device unpaired. Its local data and users are untouched.');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not unpair the device.');
    } finally {
      setBusyId(null);
    }
  };

  const resync = async (deviceId: string) => {
    setBusyId(deviceId);
    try {
      await window.api.syncResync(deviceId);
      toast.success('Requested a full sync from that device.');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not request a resync.');
    } finally {
      setBusyId(null);
    }
  };

  const saveRename = async () => {
    if (!renaming?.value.trim()) return;
    setBusyId(renaming.id);
    try {
      await window.api.p2pRenameDevice(renaming.id, renaming.value.trim());
      toast.success('Device renamed.');
      setRenaming(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Rename failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="size-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">
              {t('subscription.connected_devices', 'Connected Devices')}
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('subscription.connected_devices_desc', 'Sync business data between your Shega devices')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={discover} className="rounded-xl text-xs font-black uppercase tracking-widest">
            <Radar className="h-3 w-3 mr-1" />
            {t('devices.find', 'Find devices')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="rounded-xl text-xs font-black uppercase tracking-widest">
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Add Device — QR code or pairing code. Both encode the same grant. */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <QrCode className="h-3 w-3" />
            {t('devices.add_device', 'Add Device')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {!status?.pairingToken || !status?.lanUrl ? (
            <p className="text-xs text-muted-foreground">
              {t('devices.hub_offline', 'This device is not serving sync right now, so there is no pairing code to show. Reopen the app and try again.')}
            </p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-xl border border-border/50 bg-white p-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pairing QR code" className="h-[168px] w-[168px]" />
                ) : (
                  <div className="flex h-[168px] w-[168px] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-[220px] flex-1 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t('devices.add_device_hint', 'On the other device open Shega → Settings → Connected Devices → Add Device, then scan this QR code or enter the pairing code below.')}
                </p>

                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  <KeyRound className="h-3 w-3" />
                  {showCode ? t('devices.hide_code', 'Hide pairing code') : t('devices.show_code', 'Enter pairing code instead')}
                </button>

                {showCode && (
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-lg border border-border/50 bg-muted/40 px-3 py-2 font-mono text-sm tracking-[0.2em]">
                      {status.pairingToken}
                    </code>
                    <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={() => void copy(String(status.pairingToken), 'Pairing code')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-black uppercase tracking-widest">LAN</span>
                  <code className="font-mono">{status.lanUrl}</code>
                  <Button variant="ghost" size="icon" className="size-6 rounded-md" onClick={() => void copy(String(status.lanUrl), 'LAN address')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {t('devices.pairing_scope', 'Pairing shares business data only — products, sales, inventory, customers, suppliers, debts and stock movements. Users, sign-in details, PINs and roles stay on each device.')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paired devices */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t('devices.paired', 'Paired devices')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading && devices.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center">
              <WifiOff className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('devices.none', 'No devices connected yet')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('devices.none_hint', 'Open Add Device on the other Shega device to connect it.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const isRenaming = renaming?.id === device.deviceId;
                return (
                  <div key={device.deviceId} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 p-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      {device.platform === 'mobile'
                        ? <Smartphone className="h-4 w-4" />
                        : <Monitor className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={renaming.value}
                            onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                            className="h-8 text-xs"
                            autoFocus
                          />
                          <Button variant="outline" size="icon" className="size-7 rounded-md" onClick={() => void saveRename()} disabled={busyId === device.deviceId}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 rounded-md" onClick={() => setRenaming(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p className="truncate text-sm font-semibold">{device.name}</p>
                      )}
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{device.deviceId}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {device.online ? device.method : `Last seen ${formatWhen(device.lastSeen)}`}
                        {' · '}
                        {t('devices.last_sync', 'Last sync')} {formatWhen(device.lastSync)}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={device.online
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}
                    >
                      {device.online
                        ? <><CheckCircle2 className="mr-1 h-2.5 w-2.5" />{t('devices.online', 'Online')}</>
                        : <><WifiOff className="mr-1 h-2.5 w-2.5" />{t('devices.offline', 'Offline')}</>}
                    </Badge>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setRenaming({ id: device.deviceId, value: device.name })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => void resync(device.deviceId)} disabled={busyId === device.deviceId}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-red-400 hover:bg-red-500/10"
                        onClick={() => void revoke(device.deviceId, device.name)}
                        disabled={busyId === device.deviceId}
                      >
                        {busyId === device.deviceId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What will sync — business data only, never users */}
      {Object.keys(counts).length > 0 && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t('devices.synced_data', 'Business data shared with connected devices')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(counts).map(([label, n]) => (
                <span key={label} className="rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px]">
                  <span className="font-black">{Number(n).toLocaleString()}</span>{' '}
                  <span className="text-muted-foreground">{label}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConnectedDevices;
