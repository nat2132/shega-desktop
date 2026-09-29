/**
 * Desktop Hardware IPC Handlers
 * Bridges main-process printer/scanner services to renderer via IPC
 */

import { ipcMain, BrowserWindow } from 'electron';
import { printerManager } from './printer/manager';
import { barcodeScannerService, BarcodeScannerService } from './scanner/service';
import type { BarcodeScanResult } from './scanner/service';
import { buildReceiptBytes, buildTestPageBytes, buildLabelBytes } from '@shega/shared/peripherals/escpos-encoder';
import type { LabelPayload } from '@shega/shared/peripherals/escpos-encoder';
import type { ReceiptPayload } from '@shega/shared/peripherals/types';
import { HardwareSettings, PrinterConfig, ScannerConfig } from '@shega/shared/config/hardwareSettings';
import { getDb } from './database';
import { printSpooler } from './print-spooler-instance';

const SETTING_KEY = 'hardware_settings';

// ==== Settings Persistence ====

function getHardwareSettings(): HardwareSettings | null {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTING_KEY) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  } catch {
    return null;
  }
}

function saveHardwareSettings(settings: HardwareSettings): void {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(SETTING_KEY, JSON.stringify(settings));
}

// ==== Printer IPC ====

export function registerHardwareIpcHandlers(): void {
  // Printer: Get status
  ipcMain.handle('hardware:printer:getStatus', async () => {
    try {
      const status = await printerManager.getStatus();
      return { success: true, status };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Get config
  ipcMain.handle('hardware:printer:getConfig', async () => {
    try {
      const config = printerManager.getConfig();
      return { success: true, config };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Save config
  ipcMain.handle('hardware:printer:saveConfig', async (_, config: PrinterConfig) => {
    try {
      await printerManager.selectTransport(config.type as any, config);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Print receipt
  ipcMain.handle('hardware:printer:printReceipt', async (_, payload: ReceiptPayload) => {
    try {
      const result = await printerManager.printReceipt(payload);
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Print test page
  ipcMain.handle('hardware:printer:printTestPage', async (_, paperWidth: 58 | 80 = 80) => {
    try {
      const result = await printerManager.printTestPage(paperWidth);
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Print label
  ipcMain.handle('hardware:printer:printLabel', async (_, payload: LabelPayload) => {
    try {
      const result = await printerManager.printLabel(payload);
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Open cash drawer
  ipcMain.handle('hardware:printer:openDrawer', async () => {
    try {
      const result = await printerManager.openDrawer();
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Printer: Get available transports
  ipcMain.handle('hardware:printer:getAvailableTransports', async () => {
    try {
      const transports = printerManager.getAvailableTransports();
      return { success: true, transports };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ==== Scanner IPC ====

  // Scanner: Start listening
  ipcMain.handle('hardware:scanner:start', async () => {
    try {
      await barcodeScannerService.start();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: Stop listening
  ipcMain.handle('hardware:scanner:stop', async () => {
    try {
      await barcodeScannerService.stop();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: Get config
  ipcMain.handle('hardware:scanner:getConfig', async () => {
    try {
      const config = barcodeScannerService.getConfig();
      return { success: true, config };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: Update config
  ipcMain.handle('hardware:scanner:updateConfig', async (_, config: Partial<ScannerConfig>) => {
    try {
      await barcodeScannerService.setConfig(config);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: List serial ports
  ipcMain.handle('hardware:scanner:listSerialPorts', async () => {
    try {
      const ports = await BarcodeScannerService.listSerialPorts();
      return { success: true, ports };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: List USB HID devices
  ipcMain.handle('hardware:scanner:listUsbHidDevices', async () => {
    try {
      const devices = BarcodeScannerService.listUsbHidDevices();
      return { success: true, devices };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Scanner: Simulate scan (for testing)
  ipcMain.handle('hardware:scanner:simulateScan', async (_, code: string) => {
    try {
      barcodeScannerService.emit('scan', {
        code,
        timestamp: Date.now(),
        source: 'keyboard_wedge',
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ==== Hardware Settings IPC ====

  // Settings: Get all hardware settings
  ipcMain.handle('hardware:settings:get', async () => {
    try {
      const settings = getHardwareSettings();
      return { success: true, settings };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Settings: Save hardware settings
  ipcMain.handle('hardware:settings:save', async (_, settings: HardwareSettings) => {
    try {
      saveHardwareSettings(settings);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ==== Print spooler: pending / failed jobs ====

  ipcMain.handle('hardware:spooler:list', async (_e, status?: 'pending' | 'done' | 'failed', limit?: number) => {
    try {
      return { success: true, jobs: printSpooler.list(status, limit), counts: printSpooler.counts() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hardware:spooler:retry', async (_e, id: number) => {
    try {
      const printed = await printSpooler.retry(id);
      return { success: printed, counts: printSpooler.counts() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hardware:spooler:discard', async (_e, id: number) => {
    try {
      printSpooler.discard(id);
      return { success: true, counts: printSpooler.counts() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hardware:spooler:clearCompleted', async () => {
    try {
      return { success: true, removed: printSpooler.clearCompleted(), counts: printSpooler.counts() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ==== Event Forwarding: Scanner → Renderer ====

  // Every scanner source converges on one app-level DOM event carrying the
  // unified BarcodeScanEvent, so the POS listens in exactly one place regardless
  // of whether the code came from COM11, USB/HID, a paired phone, or the mock.
  const toUnifiedScanEvent = (result: BarcodeScanResult) => ({
    barcode: result.code,
    source: (result.source === 'usb_hid' ? 'hid' : result.source) as
      'serial' | 'hid' | 'camera' | 'bluetooth' | 'remote',
    deviceId: result.portPath,
    timestamp: result.timestamp,
  });

  const dispatchScanToWindows = (result: BarcodeScanResult) => {
    const event = toUnifiedScanEvent(result);
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed()) continue;
      // Inject rather than ipcRenderer so the existing preload bridge and the
      // mock path share one contract.
      win.webContents
        .executeJavaScript(
          `window.dispatchEvent(new CustomEvent('shega:barcode-scan', { detail: ${JSON.stringify(event)} }))`
        )
        .catch(() => {
          // window may be mid-navigation; ignore
        });
    }
  };

  // Forward scan events to all renderer windows
  barcodeScannerService.on('scan', (result: BarcodeScanResult) => {
    dispatchScanToWindows(result);
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('hardware:scanner:scan', result);
      }
    }
  });

  // Forward error events
  barcodeScannerService.on('error', (error: { source: string; error: string }) => {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('hardware:scanner:error', error);
      }
    }
  });
}

// ==== Cleanup ====

export function cleanupHardwareIpcHandlers(): void {
  barcodeScannerService.removeAllListeners('scan');
  barcodeScannerService.removeAllListeners('error');
}