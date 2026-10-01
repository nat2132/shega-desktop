/**
 * The device-wide sync progress store (desktop main process).
 *
 * The desktop counterpart of the mobile `syncProgressStore`. It lives in the main
 * process because that is where syncing actually runs (peer-sync.ts cycle, the
 * WS server, the HTTP hub) and because the renderer needs the state pushed over
 * IPC rather than polled — a renderer that polls would show a bar that lags the
 * sync by a whole poll interval.
 *
 * Being a module-level singleton outside React is what makes the sync survive the
 * window being closed or the settings screen being navigated away from.
 */

import { SyncCoordinator, type ChangeDetection, type SyncProgressState } from '@shega/shared';

/**
 * The one coordinator. HTTP, WebSocket and LAN-TCP all report through this, so
 * the renderer has a single state and never learns which transport is carrying
 * the bytes.
 */
const coordinator = new SyncCoordinator();

export function getSyncCoordinator(): SyncCoordinator {
  return coordinator;
}

export function getSyncProgress(): SyncProgressState {
  return coordinator.getState();
}

export function isSyncActive(): boolean {
  const p = coordinator.getState();
  return p.phase === 'checking' || p.phase === 'changes-found' || p.phase === 'syncing';
}

/**
 * Push every state change to the renderer.
 *
 * A module-level singleton outside React means the sync keeps running with no
 * window open; IPC is what lets a renderer that happens to be mounted show the
 * bar without polling (polling would render a bar that lags the real sync).
 */
let ipcBound = false;
export function bindProgressIpc(send: (channel: string, state: SyncProgressState) => void): void {
  if (ipcBound) return;
  ipcBound = true;
  coordinator.subscribe((s) => {
    try { send('sync:progress', s); } catch { /* no window yet */ }
  });
}

/**
 * Record a change check and move to the right state.
 *
 * Returns true when a pass is warranted. A peer holding nothing we lack
 * produces a visible "up to date" instead of an empty pass with a progress bar —
 * the desktop runs a cycle on a timer, so without this it would flash a bar
 * every interval for no reason.
 */
export function reportChangeDetection(peerId: string, detection: ChangeDetection): boolean {
  return coordinator.check(peerId, detection);
}

/**
 * Pause on a transport failure, fail on everything else.
 *
 * Split because a flaky LAN is the normal case on a shop floor: a dropped socket
 * keeps its applied counters so the next cycle resumes, while a checksum or
 * database failure is a real problem worth surfacing.
 */
export function reportSyncTransportError(peerId: string, error: unknown): SyncProgressState {
  void peerId;
  coordinator.reportError(error);
  return coordinator.getState();
}
