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
  /** Receipt paper width — receipt renderer adapts columns to it. */
  paperWidth: 58 | 80;
  /** Simulated mode: bytes go to a log file instead of hardware (dev/testing). */
  simulate: boolean;
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
      paperWidth: Number(stored.paperWidth) === 58 ? 58 : 80,
      simulate: !!stored.simulate,
    };
  } catch {
    return { transport: 'os-dialog', host: '127.0.0.1', port: 9100, drawerPin: 2, autoOpenDrawer: true, enabled: true, paperWidth: 80 as const, simulate: false };
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
  paperWidth: 58 | 80;
  simulate: boolean;
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
    paperWidth: cfg.paperWidth,
    simulate: cfg.simulate,
    online: cfg.enabled && (cfg.transport === 'network' || cfg.simulate),
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
// In simulate mode bytes are appended to a local file instead (dev/testing).
export async function printRaw(data: Uint8Array): Promise<void> {
  const cfg = getPrinterConfig();
  if (!cfg.enabled) throw new Error('Printer is disabled in Settings');
  if (cfg.simulate) {
    const fs = await import('fs');
    const path = await import('path');
    const { app } = await import('electron');
    const dir = path.join(app.getPath('userData'), 'simulated-printer');
    fs.mkdirSync(dir, { recursive: true });
    const timestamp = Date.now();
    fs.appendFileSync(path.join(dir, `output-${cfg.paperWidth}mm.bin`), Buffer.from(data));
    // Decode the simulated job and persist ASCII/HTML previews next to the raw
    // bytes so the mock printer reads back exactly what a real one would print.
    try {
      const { decodeEscposBytes, renderPreview } = await import('@shega/shared');
      const decoded = decodeEscposBytes(new Uint8Array(data));
      const preview = renderPreview(decoded.tokens, { paperWidth: cfg.paperWidth });
      fs.writeFileSync(path.join(dir, `preview-${timestamp}.txt`), preview.ascii, 'utf-8');
      fs.writeFileSync(path.join(dir, `preview-${timestamp}.html`), preview.html, 'utf-8');
      if (decoded.commands.length > 0) {
        fs.writeFileSync(
          path.join(dir, `commands-${timestamp}.txt`),
          decoded.commands.map((c) => `${c.id.padEnd(14)} ${c.label}`).join('\n') + '\n',
          'utf-8',
        );
      }
    } catch (decodeError) {
      // Previewing is best-effort; the raw bytes are still recorded.
      lastError = (decodeError as Error).message;
    }
    lastPrintAt = new Date().toISOString();
    lastError = null;
    return;
  }
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
  if (cfg.simulate) { lastPrintAt = new Date().toISOString(); return; }
  const w = new EscposWriter().init().openDrawer(cfg.drawerPin);
  await printRaw(w.toUint8Array());
  lastPrintAt = new Date().toISOString();
}