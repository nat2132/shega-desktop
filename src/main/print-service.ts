import net from 'net';
import db from './database';
import { EscposWriter } from './escpos';

export interface PrinterConfig {
  transport: 'network' | 'os-dialog';
  host: string;
  port: number;
  drawerPin: 2 | 5;
  autoOpenDrawer: boolean;
  enabled: boolean;
}

const SETTING_KEY = 'printer_config';

export function getPrinterConfig(): PrinterConfig {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTING_KEY) as any;
    const stored = row ? JSON.parse(row.value) : {};
    return {
      transport: stored.transport === 'network' ? 'network' : 'os-dialog',
      host: stored.host || '127.0.0.1',
      port: Number(stored.port) || 9100,
      drawerPin: stored.drawerPin === 5 ? 5 : 2,
      autoOpenDrawer: stored.autoOpenDrawer !== false,
      enabled: stored.enabled !== false,
    };
  } catch {
    return { transport: 'os-dialog', host: '127.0.0.1', port: 9100, drawerPin: 2, autoOpenDrawer: true, enabled: true };
  }
}

export function savePrinterConfig(cfg: Partial<PrinterConfig>): PrinterConfig {
  const merged = { ...getPrinterConfig(), ...cfg };
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(SETTING_KEY, JSON.stringify(merged));
  return merged;
}

export interface PrintStatus {
  enabled: boolean;
  transport: string;
  host: string;
  port: number;
  drawerPin: 2 | 5;
  autoOpenDrawer: boolean;
  online: boolean;
  lastError: string | null;
  lastPrintAt: string | null;
}

let lastError: string | null = null;
let lastPrintAt: string | null = null;

function sendTcp(data: Uint8Array): Promise<void> {
  const cfg = getPrinterConfig();
  return new Promise<void>((resolve, reject) => {
    let done = false;
    const sock = net.connect({ host: cfg.host, port: cfg.port }, () => {
      sock.write(Buffer.from(data));
      sock.end();
    });
    sock.setTimeout(5000, () => {
      if (done) return;
      done = true;
      sock.destroy();
      reject(new Error(`Printer timeout: ${cfg.host}:${cfg.port}`));
    });
    sock.on('error', (e) => {
      if (done) return;
      done = true;
      reject(new Error(`Printer connection failed (${cfg.host}:${cfg.port}): ${e.message}`));
    });
    sock.on('close', () => {
      if (done) return;
      done = true;
      resolve();
    });
  });
}

export function probePrinter(timeoutMs: number = 3000): Promise<boolean> {
  const cfg = getPrinterConfig();
  if (cfg.transport === 'os-dialog') return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const sock = net.connect({ host: cfg.host, port: cfg.port }, () => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve(true);
    });
    sock.setTimeout(timeoutMs, () => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve(false);
    });
    sock.on('error', () => {
      if (done) return;
      done = true;
      resolve(false);
    });
  });
}

export function getPrintStatus(): PrintStatus {
  const cfg = getPrinterConfig();
  return {
    enabled: cfg.enabled,
    transport: cfg.transport,
    host: cfg.host,
    port: cfg.port,
    drawerPin: cfg.drawerPin,
    autoOpenDrawer: cfg.autoOpenDrawer,
    online: cfg.enabled && cfg.transport === 'network',
    lastError,
    lastPrintAt,
  };
}

// Simple FIFO so concurrent receipts never interleave on the socket.
let queue: Promise<void> = Promise.resolve();
function enqueue(fn: () => Promise<void>): Promise<void> {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

// Send raw ESC/POS bytes to the configured printer. Only supported for the
// network transport; the OS print dialog path is handled by the renderer.
export async function printRaw(data: Uint8Array): Promise<void> {
  const cfg = getPrinterConfig();
  if (!cfg.enabled) throw new Error('Printer is disabled in Settings');
  if (cfg.transport === 'os-dialog') throw new Error('Raw ESC/POS requires the network printer transport');
  await enqueue(async () => {
    try {
      await sendTcp(data);
      lastPrintAt = new Date().toISOString();
      lastError = null;
    } catch (e: any) {
      lastError = e.message;
      throw e;
    }
  });
}

// Open the cash drawer through the printer (ESC p), or directly for a
// standalone serial drawer (not yet supported — network printers only).
export async function openDrawer(): Promise<void> {
  const cfg = getPrinterConfig();
  const w = new EscposWriter().init().openDrawer(cfg.drawerPin);
  await printRaw(w.toUint8Array());
  lastPrintAt = new Date().toISOString();
}