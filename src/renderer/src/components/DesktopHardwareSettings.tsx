/**
 * Desktop hardware settings — device list, connection state, testing, and the
 * persistent print spooler queue.
 *
 * ARCHITECTURE NOTE
 * The renderer must never import from `src/main`. Everything here goes through
 * the preload bridge (`window.api`) so the renderer stays sandboxed and no raw
 * OS/USB/Serial API is reachable from page code.
 */

import React, { useState, useEffect } from 'react';
import {
  Printer,
  ScanLine,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Inbox,
} from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { toast } from 'sonner';

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'disabled';

const STATE_BADGES: Record<
  ConnectionState,
  { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  connected: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Connected', variant: 'default' },
  disconnected: { icon: <XCircle className="h-3 w-3" />, label: 'Disconnected', variant: 'secondary' },
  reconnecting: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Reconnecting', variant: 'outline' },
  error: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Error', variant: 'destructive' },
  disabled: { icon: <XCircle className="h-3 w-3" />, label: 'Disabled', variant: 'secondary' },
};

interface SpoolCounts {
  pending: number;
  failed: number;
  done: number;
}

interface SpoolJob {
  id: number;
  label: string;
  kind: string;
  status: 'pending' | 'done' | 'failed';
  attempts: number;
  lastError: string | null;
  createdAt: number;
  completedAt: number | null;
}

export function DesktopHardwareSettings() {
  const [printerStatus, setPrinterStatus] = useState<{ online: boolean; lastError?: string } | null>(null);
  const [counts, setCounts] = useState<SpoolCounts>({ pending: 0, failed: 0, done: 0 });
  const [jobs, setJobs] = useState<SpoolJob[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const [status, spool] = await Promise.all([
        window.api?.getPrintStatus?.(),
        window.api?.hardwareSpoolerList?.('pending', 25),
      ]);
      if (status) setPrinterStatus({ online: status.online, lastError: status.lastError });
      if (spool?.success) {
        setCounts(spool.counts ?? { pending: 0, failed: 0, done: 0 });
        setJobs(spool.jobs ?? []);
      }
    } catch {
      // Settings must still render if the bridge is unavailable.
    }
  };

  useEffect(() => {
    void refresh();
    // Keep the queue indicator live so a reconnect visibly clears it.
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, []);

  const testPrint = async () => {
    setBusy(true);
    try {
      const res = await window.api?.printTestPage?.();
      if (res?.success) toast.success('Test page sent to printer');
      else toast.error(res?.error || 'Test print failed');
    } catch {
      toast.error('Test print failed');
    } finally {
      setBusy(false);
    }
  };

  const retryAll = async () => {
    setBusy(true);
    try {
      for (const job of jobs) {
        await window.api?.hardwareSpoolerRetry?.(job.id);
      }
      await refresh();
      toast.success('Retried queued print jobs');
    } finally {
      setBusy(false);
    }
  };

  const discard = async (id: number) => {
    await window.api?.hardwareSpoolerDiscard?.(id);
    await refresh();
  };

  const clearDone = async () => {
    const res = await window.api?.hardwareSpoolerClearCompleted?.();
    await refresh();
    if (res?.success) toast.success(`Cleared ${res.removed ?? 0} printed job(s)`);
  };

  const state: ConnectionState = !printerStatus
    ? 'disconnected'
    : printerStatus.online
      ? 'connected'
      : printerStatus.lastError
        ? 'error'
        : 'disconnected';
  const badge = STATE_BADGES[state];

  return (
    <div className="space-y-6">
      {/* ── Receipt printer ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5" />
              <div>
                <CardTitle>Receipt Printer</CardTitle>
                <CardDescription>ESC/POS thermal printer (58mm / 80mm)</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={badge.variant}>
                {badge.icon}
                {badge.label}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => void refresh()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {printerStatus?.lastError && (
            <p className="text-sm text-muted-foreground">{printerStatus.lastError}</p>
          )}

          {/* Queued work is surfaced here so a cashier can see that a receipt is
              waiting rather than assuming it printed. */}
          {(counts.pending > 0 || counts.failed > 0) && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold">
                  {counts.pending} receipt{counts.pending === 1 ? '' : 's'} waiting to print
                  {counts.failed > 0 ? ` · ${counts.failed} failed` : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                These are saved on this device and will print automatically once the printer is reachable.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void retryAll()} disabled={busy}>
                  Retry now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void refresh()}>
                  Refresh
                </Button>
              </div>

              {jobs.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {jobs.map((job) => (
                    <li key={job.id} className="flex items-center justify-between text-xs gap-3">
                      <span className="truncate">
                        {job.label || `Job #${job.id}`}
                        {job.lastError ? ` — ${job.lastError}` : ''}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">
                          {job.attempts} attempt{job.attempts === 1 ? '' : 's'}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => void discard(job.id)}>
                          Discard
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {counts.done > 0 && (
            <Button size="sm" variant="ghost" onClick={() => void clearDone()}>
              Clear {counts.done} printed job record(s)
            </Button>
          )}

          <Button size="sm" onClick={() => void testPrint()} disabled={busy}>
            Test print
          </Button>
        </CardContent>
      </Card>

      {/* ── Barcode scanner ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5" />
            <div>
              <CardTitle>Barcode Scanner</CardTitle>
              <CardDescription>USB/HID, Serial/COM and keyboard-wedge scanners</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Scans are captured app-wide, so a barcode adds to the cart whether or not a barcode field is
            focused. Configure specific ports in the Devices settings section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
