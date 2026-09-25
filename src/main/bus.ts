/**
 * Main-process event bus for device/sync lifecycle events.
 *
 * Emitters: sync-hub (device-connected, sync-started, sync-completed),
 * websocket-server (device-connected, device-disconnected, device-reconnecting),
 * pairing-beacon (device-visible, device-hidden).
 *
 * Subscribers: the 'device:on-event' IPC bridge that forwards each event to
 * every renderer window so the UI can toast/notify the user.
 */
import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';
import { logger } from './logger';

export type DeviceEventName =
  | 'device-visible'
  | 'device-hidden'
  | 'device-connected'
  | 'device-reconnecting'
  | 'device-disconnected'
  | 'sync-started'
  | 'sync-completed'
  | 'sync-failed';

export interface DeviceEvent {
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  mode?: string;
  pushed?: number;
  pulled?: number;
  conflicts?: number;
  reason?: string;
  [k: string]: any;
}

class DeviceEventBus extends EventEmitter {
  emitEvent(name: DeviceEventName, e: DeviceEvent = {}): void {
    try {
      this.emit(name, e);
      // Forward to every renderer window as a single namespaced channel.
      const payload = { event: name, ...e, at: new Date().toISOString() };
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send('device:event', payload);
      }
      logger.info(`[device-event] ${name}`, { deviceName: e.deviceName, deviceId: e.deviceId });
    } catch { /* notification must never break sync */ }
  }
}

export const mainBus = new DeviceEventBus();
