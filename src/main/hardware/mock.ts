// Mock peripheral service for shega-desktop (main process).
//
// When USE_MOCK_PERIPHERALS is enabled (default in dev), all scanner + printer
// traffic can be driven by the shared SDK's mock implementations instead of
// physical hardware. USB is desktop-only by design (supportsUsb()).
//
// The mock service exposes IPC channels (mock:*) used by the renderer / dev
// console, bridges synthetic scans into the same `shega:barcode-scan` event the
// real USB-HID scanner dispatches, and runs the ESC/POS mock printer with
// decode + preview for every job.

import { BrowserWindow, ipcMain } from 'electron';
import {
  describePeripheralEnvironment,
  getPeripheralMockService,
  installMockPeripherals,
  USE_MOCK_PERIPHERALS,
  type PrintJobEvent,
  type ReceiptPayload,
  type ScannedBarcode,
} from '@shega/shared';
import { logger } from '../logger';

/** True when the app should use mock peripherals on this launch. */
export function isMockMode(): boolean {
  return USE_MOCK_PERIPHERALS;
}

export interface SimulatedScanResult {
  success: boolean;
  value?: string;
  simulated: boolean;
  transport?: 'hid' | 'serial';
  error?: string;
}

/** Dispatch a scan to every renderer window — same contract as real HID scans. */
export function dispatchScanToWindows(code: string): void {
  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    if (win.isDestroyed()) continue;
    win.webContents
      .executeJavaScript(
        `window.dispatchEvent(new CustomEvent('shega:barcode-scan', { detail: ${JSON.stringify(code)} }))`,
      )
      .catch(() => {
        // window may be mid-navigation; ignore
      });
  }
}

/**
 * The unified scan path used by the existing `simulate-scan` IPC handler.
 * With mock mode ON this replays a genuine HID keystroke stream (<20ms/key,
 * terminator Enter) through the mock scanner before dispatching; with mock
 * mode OFF it dispatches directly (previous behaviour).
 */
export async function runDesktopSimulateScan(code?: string): Promise<SimulatedScanResult> {
  const svc = getPeripheralMockService();
  if (!isMockMode()) {
    const value = (code && code.trim()) || String(Math.floor(100000000000 + Math.random() * 899999999999));
    dispatchScanToWindows(value);
    return { success: true, value, simulated: false };
  }
  const scan: ScannedBarcode = await svc.scan(code, 'hid');
  dispatchScanToWindows(scan.code);
  logger.info('mock.scan', {
    value: scan.code,
    transport: scan.transport,
    keys: scan.keyDetail?.intervalsMs.length ?? 0,
    maxKeyIntervalMs: scan.keyDetail?.maxIntervalMs ?? 0,
  });
  return { success: true, value: scan.code, simulated: true, transport: 'hid' };
}

function jobSummary(job: PrintJobEvent): Record<string, unknown> {
  return {
    jobId: job.jobId,
    transport: job.transport,
    byteLength: job.byteLength,
    commands: job.decoded.commands.length,
    hasCut: job.decoded.hasCut,
    hasDrawer: job.decoded.hasDrawer,
    previewLines: job.preview.ascii.split('\n').length,
  };
}

/**
 * Register `mock:*` IPC handlers. Guarded by USE_MOCK_PERIPHERALS — with mock
 * mode off these handlers return a helpful "disabled" payload instead of
 * pretending to work against hardware.
 */
export function registerMockPeripheralHandlers(): void {
  if (!isMockMode()) {
    logger.info('mock.disabled', { reason: 'USE_MOCK_PERIPHERALS=false' });
    return;
  }

  installMockPeripherals(); // starts scanners, installs __shegaMock* console helpers
  const svc = getPeripheralMockService();

  // Bridge synthetic scans into the renderer like a real USB-HID scanner would.
  svc.subscribeScan((scan) => {
    if (scan.transport === 'serial') {
      logger.info('mock.serial', { value: scan.code });
    }
    dispatchScanToWindows(scan.code);
  });

  svc.subscribePrint((job) => {
    logger.info('mock.print', jobSummary(job));
  });

  ipcMain.handle('mock:status', () => svc.status());

  ipcMain.handle('mock:scan', async (_e, code?: string): Promise<SimulatedScanResult> => {
    const scan = await svc.scan(code, 'hid');
    dispatchScanToWindows(scan.code);
    return { success: true, value: scan.code, simulated: true, transport: 'hid' };
  });

  ipcMain.handle('mock:scan-serial', async (_e, code?: string): Promise<SimulatedScanResult> => {
    const scan = await svc.scan(code, 'serial');
    dispatchScanToWindows(scan.code);
    return { success: true, value: scan.code, simulated: true, transport: 'serial' };
  });

  ipcMain.handle('mock:print-receipt', async (_e, payload?: Partial<ReceiptPayload>) => {
    const job = await svc.print(payload ?? undefined);
    return { success: true, ...jobSummary(job), ascii: job.preview.ascii, html: job.preview.html };
  });

  ipcMain.handle('mock:print-bytes', async (_e, data?: number[]) => {
    if (!Array.isArray(data)) return { success: false, error: 'expected number[]' };
    const job = await svc.printBytes(Uint8Array.from(data));
    return { success: true, ...jobSummary(job), ascii: job.preview.ascii, html: job.preview.html };
  });

  ipcMain.handle('mock:decode', async (_e, data?: number[]) => {
    if (!Array.isArray(data)) return { success: false, error: 'expected number[]' };
    const decoded = svc.decode(Uint8Array.from(data));
    return { success: true, commands: decoded.commands, tokens: decoded.tokens };
  });

  logger.info('mock.ready', {
    ...describePeripheralEnvironment(),
    hid: 'started',
    serial: 'started',
    printer: 'network-cable mock driver attached',
  });

  console.log(
    '[Mock Peripherals] USE_MOCK_PERIPHERALS=true — console helpers: __shegaMockScan(), __shegaMockScanSerial(), __shegaMockPrintReceipt()',
  );
}