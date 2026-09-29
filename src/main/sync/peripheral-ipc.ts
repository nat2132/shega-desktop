import { ipcMain, BrowserWindow } from 'electron';
import { randomBytes } from 'crypto';
import { peripheralHub, type PeripheralScanPushResultPayload } from './peripheral-server';
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

/**
 * Phone-initiated scan pushes awaiting a verdict from the renderer.
 *
 * The cart lives in the renderer, so the main process cannot decide "added"
 * itself. `reply` is the callback the WS handler handed us for that push; the
 * renderer answers through the `peripheral:scan-push-ack` IPC channel and we
 * relay the verdict back down the phone's socket.
 */
const pushReplies = new Map<string, { barcode: string; at: number; reply: (result: PeripheralScanPushResultPayload) => void }>();

/** Drop pushes the renderer never answered (its ack was lost). */
function pruneScanPushes(): void {
  const cutoff = Date.now() - 60000;
  for (const [token, entry] of pushReplies) {
    if (entry.at < cutoff) pushReplies.delete(token);
  }
}

export function registerScanPushForwarder(): void {
  peripheralHub.on('scanPush', (push) => {
    pruneScanPushes();
    const pushToken = randomBytes(8).toString('hex');
    pushReplies.set(pushToken, { barcode: push.barcode, at: Date.now(), reply: push.reply });

    const windows = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
    if (!windows.length) {
      // Nobody can add to a cart with no window open — settle now instead of
      // letting the phone hang until its own timeout.
      pushReplies.delete(pushToken);
      push.reply({ ok: false, status: 'unavailable', barcode: push.barcode, message: 'Shega Desktop is not open' });
      return;
    }

    // Broadcast: whichever checkout screen is mounted answers first. Two
    // BrowserWindows cannot both be on a cart screen in normal use, and the
    // token is consumed on the first ack either way.
    for (const win of windows) {
      win.webContents.send('peripheral:scan-push', {
        pushToken,
        barcode: push.barcode,
        symbology: push.symbology,
        deviceId: push.deviceId,
      });
    }
  });
}

function settleScanPush(pushToken: string, result: PeripheralScanPushResultPayload): boolean {
  const pending = pushReplies.get(pushToken);
  if (!pending) return false;
  pushReplies.delete(pushToken);
  pending.reply({ ...result, barcode: result?.barcode || pending.barcode });
  return true;
}

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
  registerScanPushForwarder();

  // The renderer's verdict for a phone-initiated scan push.
  ipcMain.handle('peripheral:scan-push-ack', (_, pushToken: string, result: PeripheralScanPushResultPayload) =>
    settleScanPush(String(pushToken), result || { ok: false, status: 'error', barcode: '' }));

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
