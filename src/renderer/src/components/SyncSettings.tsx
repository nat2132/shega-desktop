import React, { useState, useEffect, useCallback } from 'react';
import { Network, RefreshCw, ShieldCheck, ScrollText, Server, Users, Wifi, WifiOff, QrCode, Copy, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface Peer {
  deviceId: string;
  name: string;
  lastSeenAt: string;
  cursorSeq: number;
  lastSyncAt: string | null;
  stale: boolean;
}

interface SyncStatus {
  running: boolean;
  hubId: string;
  pairingToken: string;
  lanUrl: string | null;
  port: number;
  peers: Peer[];
  lastSeq: number;
  pendingOutbox: number;
  conflicts: number;
}

const SyncSettings: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [verify, setVerify] = useState<Record<string, { count: number; checksum: string }> | null>(null);
  const [log, setLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await window.api?.syncStatus?.();
      if (s) {
        setStatus(s);
        const payload = s.lanUrl ? `shega://pair?url=${encodeURIComponent(s.lanUrl)}&token=${encodeURIComponent(s.pairingToken)}` : s.pairingToken;
        try {
          setQrData(await QRCode.toDataURL(payload, { width: 220, margin: 1 }));
        } catch {
          setQrData(null);
        }
      }
      const l = await window.api?.syncLog?.(50);
      if (l) setLog(l);
    } catch {
      /* hub status unavailable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const runVerify = async () => {
    setVerifying(true);
    try {
      const v = await window.api?.syncVerify?.();
      if (v) {
        setVerify(v);
        toast.success('Sync verification complete');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyPairing = async () => {
    if (!status) return;
    const text = status.lanUrl ? `shega://pair?url=${status.lanUrl}&token=${status.pairingToken}` : status.pairingToken;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — copy the code manually');
    }
  };

  const resyncDevice = async (p: Peer) => {
    try {
      await window.api?.syncResync?.(p.deviceId);
      toast.success(`Full re-snapshot queued for ${p.name} — it will resync on next contact`);
      setTimeout(load, 800);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to queue re-snapshot');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase tracking-widest">Offline-first Sync Hub</h4>
        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
          LAN hub that keeps this register and mobile devices in sync.
        </p>
      </div>

      {status?.peers?.some((p) => p.stale) && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-600" />
          <p className="text-sm font-bold text-amber-700">
            {status.peers.filter((p) => p.stale).length} paired device{status.peers.filter((p) => p.stale).length > 1 ? 's' : ''} stale &gt;24h — check it is powered on and on the same Wi-Fi.
          </p>
        </div>
      )}

      {/* §24 unified health banner (LAN) */}
      {(() => {
        const lanUp = status?.running;
        const pending = (status?.pendingOutbox ?? 0) > 0 || false;
        const synced = lanUp && !pending;
        const cls = synced
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : pending
            ? 'border-amber-500/30 bg-amber-500/10'
            : 'border-slate-300 bg-slate-100';
        const text = synced ? 'text-emerald-600' : pending ? 'text-amber-600' : 'text-muted-foreground';
        const mode = lanUp ? 'LAN' : 'Offline';
        return (
          <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${cls}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${synced ? 'bg-emerald-500' : pending ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <p className={`text-sm font-bold ${text}`}>
                {synced ? 'Everything synchronized' : pending ? 'Changes pending — sync now' : 'Sync offline'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{mode}</span>
            </div>
          </div>
        );
      })()}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server size={16} /> Hub Status
            </CardTitle>
            <CardDescription>HTTP JSON hub on this machine</CardDescription>
          </div>
          {status?.running ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <Wifi size={12} /> Listening :{status.port}
            </Badge>
          ) : (
            <Badge variant="destructive"><WifiOff size={12} /> Stopped</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Hub ID</p>
              <p className="font-mono text-xs break-all">{status?.hubId || '…'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Change log seq</p>
              <p className="font-mono text-xs">{status?.lastSeq ?? '…'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Pending outbox</p>
              <p className="font-mono text-xs">{status?.pendingOutbox ?? '…'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Conflicts</p>
              <p className="font-mono text-xs">{status?.conflicts ?? '…'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
              <Users size={12} /> Paired devices
            </p>
            {status?.peers?.length ? (
              <div className="rounded-xl border divide-y">
                {status.peers.map((p) => (
                  <div key={p.deviceId} className="flex items-center justify-between px-3 py-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Network size={14} className="text-muted-foreground" />
                      <span className="text-sm font-bold">{p.name}</span>
                      {p.stale && <Badge variant="destructive">stale</Badge>}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{p.deviceId.slice(0, 13)}…</span>
                    <span className="text-xs text-muted-foreground">
                      {p.lastSyncAt ? new Date(p.lastSyncAt).toLocaleTimeString() : p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleTimeString() : 'never'}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">@{p.cursorSeq ?? 0}</span>
                    <Button size="sm" variant="ghost" onClick={() => resyncDevice(p)} title="Queue full re-snapshot">
                      <RotateCcw size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No devices paired yet. Set the hub URL on a phone's Settings → Sync.</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={runVerify} disabled={verifying || loading}>
              <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} /> Verify
            </Button>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode size={16} /> Pair a device</CardTitle>
          <CardDescription>Scan with the phone's Settings → Sync, or enter the code manually</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          {qrData ? (
            <img src={qrData} alt="Pairing QR" className="rounded-xl border bg-white p-2" width={220} height={220} />
          ) : (
            <div className="w-[220px] h-[220px] rounded-xl border flex items-center justify-center text-muted-foreground">
              {loading ? '…' : 'QR unavailable'}
            </div>
          )}
          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Pairing code</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-2xl font-black tracking-[0.35em]">{status?.pairingToken || '—'}</p>
                <Button size="sm" variant="ghost" onClick={copyPairing} disabled={!status}>
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Hub URL</p>
              <p className="font-mono text-sm">{status?.lanUrl || '—'}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              On the phone: Settings → Sync → enter this hub URL and code, then tap <b>Pair device</b>. The phone will then auto-sync sales, items and stock over your local network.
            </p>
          </div>
        </CardContent>
      </Card>

      {verify && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck size={16} /> Checksums</CardTitle>
            <CardDescription>Per-table row counts + SHA-256 fingerprints for drift detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border divide-y">
              {Object.entries(verify).map(([table, v]) => (
                <div key={table} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-bold">{table}</span>
                  <span className="text-xs text-muted-foreground">{v.count} rows</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{v.checksum.slice(0, 16)}…</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText size={16} /> Sync activity</CardTitle>
        </CardHeader>
        <CardContent>
          {log.length ? (
            <div className="rounded-xl border divide-y max-h-64 overflow-y-auto">
              {log.map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">{e.op}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{e.entity}</span>
                  <span className="flex-1 text-xs text-muted-foreground truncate">{e.detail}</span>
                  <span className="text-[10px] text-muted-foreground">{e.created_at ? new Date(e.created_at).toLocaleTimeString() : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No sync activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncSettings;