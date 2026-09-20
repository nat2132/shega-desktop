import { ipcMain } from 'electron';
import { peripheralHub } from './peripheral-server';
import { wsSyncServer } from './websocket-server';
import { PERIPHERAL_MSG } from '@shega/shared';
import { createUserInvite, listUserInvites, decideUserInvite, getUserInviteStatus, assignUserInviteIdentity } from './user-invites';
import { getActiveBusinessId } from '../ipc-handlers';

/**
 * Renderer bridge for phone-peripherals: "Use my phone as a scanner/camera".
 * The renderer lists connected phones, then awaits a single scan/capture.
 * Results arrive on the peripheralHub event stream and complete the promise.
 */

type Waiter = {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  cleanup: () => void;
};

const waiters = new Map<string, Waiter>();

function failWaiter(requestId: string, err: string) {
  const w = waiters.get(requestId);
  if (!w) return;
  clearTimeout(w.timer);
  w.cleanup();
  waiters.delete(requestId);
  w.reject(new Error(err));
}

function completeWaiter(requestId: string, value: any) {
  const w = waiters.get(requestId);
  if (!w) return;
  clearTimeout(w.timer);
  w.cleanup();
  waiters.delete(requestId);
  w.resolve(value);
}

export function registerPeripheralHandlers(): void {
  peripheralHub.on('scanResult', (res) => completeWaiter(res.requestId, { barcode: res.barcode, symbology: res.symbology, deviceId: res.deviceId }));
  peripheralHub.on('captureResult', (res) => {
    if (res.cancelled) return failWaiter(res.requestId, 'cancelled');
    completeWaiter(res.requestId, { dataUrl: res.dataUrl, text: res.text, mode: res.mode, deviceId: res.deviceId });
  });

  ipcMain.handle('peripheral:phones', () => peripheralHub.list().map((p) => ({
    ...p.info,
    mode: peripheralHub.getMode(p.deviceId),
    connectedAt: p.registeredAt,
  })));

  ipcMain.handle('peripheral:scan', async (_, deviceId: string, timeoutMs = 60000) => {
    const requestId = wsSyncServer.requestScan(deviceId);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => failWaiter(requestId, 'timeout'), timeoutMs);
      const onReg = () => {};
      waiters.set(requestId, { resolve, reject, timer, cleanup: () => { peripheralHub.off('peripheralRegistered', onReg); } });
    });
  });

  ipcMain.handle('peripheral:capture', async (_, deviceId: string, mode: 'photo' | 'barcode' | 'qr', timeoutMs = 120000) => {
    const requestId = wsSyncServer.requestCapture(deviceId, mode);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => failWaiter(requestId, 'timeout'), timeoutMs);
      const noop = () => {};
      waiters.set(requestId, { resolve, reject, timer, cleanup: () => { peripheralHub.off('peripheralRegistered', noop); } });
    });
  });

  ipcMain.handle('peripheral:cancel', (_, deviceId: string, requestId: string) => {
    wsSyncServer.cancelRequest(deviceId, requestId);
    failWaiter(requestId, 'cancelled');
    return true;
  });

  // ---------- QR user invites (Teams → Add User) ----------

  ipcMain.handle('invites:create', (_, opts: { suggestedRole?: string } = {}) => {
    const invite = createUserInvite(getActiveBusinessId() ?? 1, { suggestedRole: opts?.suggestedRole, createdBy: undefined });
    // Bluetooth-style discovery: advertise the open invite as a pairing beacon
    // so nearby devices see this business in their join discovery list.
    import('./pairing-beacon').then(({ startPairingBeaconForInvite }) => startPairingBeaconForInvite(invite)).catch(() => {});
    return invite;
  });

  ipcMain.handle('invites:list', () => listUserInvites(getActiveBusinessId() ?? 1));

  ipcMain.handle('invites:decide', async (_, inviteId: string, decision: 'approved' | 'rejected', opts: { role?: string; name?: string; avatar?: string | null; permissions?: Record<string, unknown> } = {}) => {
    // Approval provisions the member with the owner-assigned identity, so the
    // beacon is only taken off the air once the configuration is applied.
    const invite = decideUserInvite(inviteId, decision, {
      role: opts?.role,
      name: opts?.name,
      avatar: opts?.avatar,
      permissions: opts?.permissions,
    });
    if (decision === 'rejected') {
      const { pairingBeacon } = await import('./pairing-beacon');
      pairingBeacon.stopPublishing();
    }
    return invite;
  });

  // Radar flow: the owner configures a discovered device before it claims the
  // invite, so the request carries the assigned identity when it arrives.
  ipcMain.handle('invites:assign-identity', (_, inviteId: string, identity: { name?: string; avatar?: string | null; role?: string; permissions?: Record<string, unknown> }) =>
    assignUserInviteIdentity(inviteId, identity));

  ipcMain.handle('invites:status', (_, code: string) => getUserInviteStatus(code));
}
