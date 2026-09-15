import React, { useCallback, useEffect, useState } from 'react';
import {
  ScanLine, Smartphone, Printer, Tags, Archive, CheckCircle2,
  AlertTriangle, RefreshCw, XCircle, Settings2, ArchiveRestore,
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { cn } from '../utils/shadcn';

export type ScannerMode = 'physical' | 'phone';

export interface PosDeviceStatus {
  id: 'scanner' | 'mobile-scanner' | 'printer-58' | 'printer-80' | 'label' | 'drawer';
  label: string;
  state: 'ok' | 'warn' | 'off';
  detail: string;
}

const SCANNER_MODE_KEY = 'shega.pos.scannerMode';
const SETUP_DONE_KEY = 'shega.pos.setupDone';

export function getScannerMode(): ScannerMode {
  try { return (localStorage.getItem(SCANNER_MODE_KEY) as ScannerMode) || 'physical'; } catch { return 'physical'; }
}
export function setScannerMode(mode: ScannerMode): void {
  try { localStorage.setItem(SCANNER_MODE_KEY, mode); } catch {}
}
export function isSetupDone(): boolean {
  try { return localStorage.getItem(SETUP_DONE_KEY) === '1'; } catch { return false; }
}
export function markSetupDone(): void {
  try { localStorage.setItem(SETUP_DONE_KEY, '1'); } catch {}
}

/** Probe the live state of every POS device. */
export async function probeDevices(): Promise<PosDeviceStatus[]> {
  const status: PosDeviceStatus[] = [];

  // Physical scanner: the keyboard wedge is always listening (built-in), so it
  // is "ready" — real detection is not possible for HID keyboards, but we can
  // verify the listener exists.
  status.push({
    id: 'scanner',
    label: 'Barcode Scanner',
    state: 'ok',
    detail: getScannerMode() === 'physical' ? 'Wedge scanner active — scan into search box' : 'Standby (using phone scanner)',
  });

  // Mobile scanner: presence of registered phone peripherals.
  let phoneOk = false;
  try {
    const phones = (await window.api?.peripheralPhones?.()) || [];
    phoneOk = phones.length > 0;
    status.push({
      id: 'mobile-scanner',
      label: 'Mobile Scanner',
      state: phoneOk ? 'ok' : 'warn',
      detail: phoneOk
        ? `${phones[0].name || 'Phone'} connected`
        : 'No phone connected — open Shega Mobile on the same Wi-Fi',
    });
  } catch {
    status.push({ id: 'mobile-scanner', label: 'Mobile Scanner', state: 'warn', detail: 'Not connected' });
  }

  // Printer(s): one configured device with a paper width; report per width.
  try {
    const ps: any = await window.api?.getPrintStatus?.();
    const enabled = !!ps?.enabled;
    const width = ps?.paperWidth === 58 ? '58mm' : '80mm';
    const online = !!ps?.online;
    status.push({
      id: ps?.paperWidth === 58 ? 'printer-58' : 'printer-80',
      label: `Thermal Printer ${width}`,
      state: enabled ? (online ? 'ok' : 'warn') : 'off',
      detail: !enabled
        ? 'Disabled — enable in Devices settings'
        : online
          ? ps?.simulate ? 'Simulate mode — prints to file' : `Ready (${ps.host}:${ps.port})`
          : `Unreachable (${ps.host}:${ps.port})`,
    });
    status.push({
      id: 'label',
      label: 'Label Printer',
      state: enabled ? (online ? 'ok' : 'warn') : 'off',
      detail: enabled ? 'Uses the thermal printer' : 'Disabled',
    });
    status.push({
      id: 'drawer',
      label: 'Cash Drawer',
      state: enabled && ps?.autoOpenDrawer ? 'ok' : 'off',
      detail: enabled && ps?.autoOpenDrawer ? `Opens on sale (pin ${ps.drawerPin})` : 'Not configured',
    });
  } catch {
    status.push({ id: 'printer-80', label: 'Thermal Printer', state: 'warn', detail: 'Status unavailable' });
  }

  return status;
}

/** First-time scanner choice modal. */
export function ScannerSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<ScannerMode>(getScannerMode());
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);
    try {
      if (mode === 'phone') {
        const phones = (await window.api?.peripheralPhones?.()) || [];
        if (!phones.length) { toast.error('No phone connected yet — open Shega Mobile on the same Wi-Fi, then tap Test again.'); return; }
        toast.success(`Phone found: ${phones[0].name || 'Mobile'} — it will scan into the POS.`);
      } else {
        toast.success('Wedge scanner is active — scan any barcode into the search box to test.', { duration: 5000 });
      }
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    setScannerMode(mode);
    markSetupDone();
    toast.success(`Scanner set to ${mode === 'phone' ? 'Mobile phone' : 'Physical barcode scanner'}. You can change this anytime in Devices.`);
    onClose();
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6', !open && 'hidden')}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-base font-bold text-foreground">How do you want to scan products?</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          You can change this anytime in Settings → Devices.
        </p>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => setMode('physical')}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
              mode === 'physical' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
            )}
          >
            <ScanLine className="mt-0.5 size-5 text-primary" />
            <span className="flex-1">
              <span className="block text-sm font-bold text-foreground">Barcode Scanner</span>
              <span className="block text-xs text-muted-foreground">
                USB / Bluetooth scanner that types into the POS. Auto-detected — no driver needed.
              </span>
            </span>
            {mode === 'physical' && <CheckCircle2 className="size-4 text-primary" />}
          </button>

          <button
            onClick={() => setMode('phone')}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
              mode === 'phone' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
            )}
          >
            <Smartphone className="mt-0.5 size-5 text-primary" />
            <span className="flex-1">
              <span className="block text-sm font-bold text-foreground">Use Mobile as Barcode Scanner</span>
              <span className="block text-xs text-muted-foreground">
                Cashier's phone scans and sends the barcode to this POS over Wi-Fi. Works offline on the same network.
              </span>
            </span>
            {mode === 'phone' && <CheckCircle2 className="size-4 text-primary" />}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={test} disabled={testing}>
            <RefreshCw className={cn('mr-1 size-3.5', testing && 'animate-spin')} /> Test
          </Button>
          <Button size="sm" onClick={save}>Save & Start Selling</Button>
        </div>
      </div>
    </div>
  );
}

/** Compact "POS Ready" strip for the cashier header. */
export function PosDeviceStrip({ onOpenSetup }: { onOpenSetup: () => void }) {
  const [devices, setDevices] = useState<PosDeviceStatus[]>([]);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(async () => {
    setDevices(await probeDevices());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const summary = (() => {
    const scanner = devices.find((d) => d.id === 'scanner');
    const printer = devices.find((d) => d.id === 'printer-58' || d.id === 'printer-80');
    const phone = devices.find((d) => d.id === 'mobile-scanner');
    return [
      { label: 'Scanner', state: scanner?.state ?? 'warn', detail: scanner?.state === 'ok' ? 'Connected' : 'Not connected' },
      { label: 'Printer', state: printer?.state === 'ok' ? 'ok' : printer?.state === 'warn' ? 'warn' : 'off', detail: printer?.detail ?? 'Unknown' },
      { label: 'Mobile', state: phone?.state ?? 'warn', detail: phone?.state === 'ok' ? 'Connected' : 'Not connected' },
    ];
  })();

  const problems = devices.filter((d) => d.state !== 'ok');

  return (
    <div className="border-b border-border/60 bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
            problems.length === 0 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600',
          )}
        >
          {problems.length === 0 ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
          {problems.length === 0 ? 'POS Ready' : `${problems.length} device${problems.length === 1 ? '' : 's'} need attention`}
        </span>
        {summary.map((s) => (
          <span key={s.label} className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            <span className={cn('inline-block size-1.5 rounded-full', s.state === 'ok' ? 'bg-green-500' : s.state === 'warn' ? 'bg-amber-500' : 'bg-gray-400')} />
            {s.label}: {s.detail}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            title="Device status"
          >
            <Archive className="size-3.5" />
          </button>
          <button onClick={onOpenSetup} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" title="Scanner setup">
            <Settings2 className="size-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-xs">
              {d.state === 'ok' ? (
                <CheckCircle2 className="size-3.5 text-green-500" />
              ) : d.state === 'warn' ? (
                <AlertTriangle className="size-3.5 text-amber-500" />
              ) : (
                <XCircle className="size-3.5 text-gray-400" />
              )}
              <span className="font-bold text-foreground">{d.label}</span>
              <span className="text-muted-foreground">— {d.detail}</span>
              {d.id === 'mobile-scanner' && d.state !== 'ok' && (
                <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[10px]" onClick={async () => {
                  const phones = await window.api?.peripheralPhones?.().catch(() => []);
                  toast[phones?.length ? 'success' : 'error'](
                    phones?.length ? `Reconnected: ${phones[0].name}` : 'No phone found — open Shega Mobile on this Wi-Fi, then retry.',
                  );
                  refresh();
                }}>
                  <RefreshCw className="mr-1 size-3" /> Reconnect
                </Button>
              )}
              {(d.id === 'printer-58' || d.id === 'printer-80') && d.state !== 'off' && (
                <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[10px]" onClick={async () => {
                  const r = await window.api?.printTestPage?.();
                  toast[r?.success ? 'success' : 'error'](r?.success ? 'Test page printed' : `Test failed: ${r?.error}`);
                  refresh();
                }}>
                  <ArchiveRestore className="mr-1 size-3" /> Test print
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
