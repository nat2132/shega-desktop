/* View-only enforcement for the desktop main process.
 *
 * The Shega backend is the source of truth for access level. When a linked
 * account has no active (or trial) license the renderer hides write UI, but the
 * renderer is not a security boundary — anything that can reach an IPC channel
 * (a stale window, a devtools console, a queued sync) could still write. This
 * module wraps `ipcMain.handle` once, before any handler is registered, so every
 * business-data mutation is checked in the main process and rejected while the
 * account is read-only.
 *
 * Design: reads are never blocked, and subscription/billing recovery always
 * works, so an expired account can still renew. Only channels that mutate
 * business data are gated. The channel classification is explicit rather than a
 * heuristic over every handler, so a new write channel is blocked by default.
 */
import { ipcMain } from 'electron';
import { getCloudSubscription } from './subscription-backend';

/** Marker so the renderer can recognise the failure and route to /subscription. */
export const VIEW_ONLY_CODE = 'SUBSCRIPTION_REQUIRED';

/**
 * Business-data write channels. Hyphenated verbs cover the bulk of the API
 * (insert-*, update-*, delete-*, ...); namespaced channels are listed explicitly.
 */
const WRITE_PREFIXES = [
  'insert-', 'update-', 'delete-', 'save-', 'create-', 'archive-', 'restore-',
  'void-', 'pay-', 'transfer-', 'restock-', 'adjust-', 'add-', 'duplicate-',
  'convert-', 'cancel-', 'complete-', 'reverse-', 'import-', 'reset-',
  'fix-', 'cleanup-', 'reactivate-',   'lock-user-account', 'unlock-user-account',
  'lock-employee-account', 'unlock-employee-account', 'force-pin-change',
  'open-cash-drawer', 'approve-payment',
  'reject-payment', 'simulate-scan', 'factory-reset',
] as const;

const WRITE_CHANNELS = new Set([
  'business:create', 'business:update', 'business:delete',
  'shift:open', 'shift:close', 'shift:mid-audit', 'shift:blind-count', 'shift:record-transaction',
  'ledger:reverse',
  'invites:create', 'invites:decide', 'invites:assign-identity',
  'join:accept', 'join:activate',
  'pairing:invite', 'pairing:decide', 'pairing:revoke', 'pairing:assign-identity',
  'item-barcodes:add', 'item-barcodes:remove', 'item-barcodes:set-primary',
  'p2p:approve', 'p2p:approve-one', 'p2p:revoke-device', 'p2p:rename-device',
  'p2p:persist-peer', 'p2p:record-counts',
  'cloud:save-config', 'cloud:set-enabled', 'cloud:sync',
  'demo:seed', 'demo:reset', 'demo:set-mode',
  'approval:resolve', 'approval:cancel',
  'mor:clear', 'tax:advance',
]);

/**
 * Reads, local UI state and subscription recovery that must keep working while
 * the account is read-only. Checked before WRITE_* so an explicit allow always
 * wins (e.g. `update:` updater channels vs `update-` business writes).
 */
const ALLOWED_PREFIXES = [
  'get-', 'list-', 'check-', 'print-', 'barcode-', 'verify-', 'export-data',
  'login', 'debug', 'mock-', 'update:', 'app:', 'pos:', 'reports:', 'etax:',
  'peripheral:', 'pair-beacon:', 'sync:', 'backend-', 'mock:',
] as const;

const ALLOWED_CHANNELS = new Set([
  'submit-payment', 'start-trial', 'check-trial-availability', 'check-premium-feature',
  'global-search', 'create-backup', 'restore-backup', 'delete-backup', 'list-backups',
  'set-setting', 'get-setting', 'device', 'device:name', 'set-printer-config', 'set-quiet-hours',
  'delete-quiet-hours', 'get-quiet-hours', 'mark-notification-read', 'mark-all-notifications-read',
  'snooze-notification', 'snooze-reminder', 'dismiss-notification', 'dismiss-banner',
  'clear-notifications', 'check-notifications', 'show-desktop-notification',
  'update-notification-preference', 'update-reminder', 'delete-reminder',
  'create-reminder', 'complete-reminder', 'run-reminder-engine', 'get-reminders',
  'get-notification-preferences', 'get-notifications', 'get-unread-notification-count',
  'get-notification-categories', 'open-external', 'parse-scale-reading',
  'print-test-page', 'generate-shega-code', 'generate-recovery-key', 'verify-recovery-key',
  'reset-pin-with-recovery',
  // business session/list reads
  'business:list', 'business:get', 'business:switch',
  // tax/ledger/mor read surfaces
  'tax:calculate', 'tax:mat', 'tax:paye', 'tax:pension', 'tax:tot-return',
  'tax:vat-return', 'tax:wht', 'mor:list', 'mor:get', 'mor:is-verified', 'mor:verify',
  'mor-qr:generate', 'mor-qr:print-receipt', 'mor-qr:validate',
  'ledger:balance', 'ledger:entries', 'ledger:shift-summary', 'ledger:verify',
  'shift:active', 'shift:by-id', 'shift:last-by-cashier', 'shift:summary', 'shift:transactions',
  'invites:list', 'invites:status', 'join:lookup', 'join:status', 'join:cancel',
  'pairing:list', 'pairing:qr-code', 'pairing:status', 'pairing:link-account',
  'pairing:unlink', 'item-barcodes:list', 'p2p:announce', 'p2p:devices', 'p2p:health',
  'cloud:status', 'cloud:verify', 'compliance:check', 'compliance:report',
  'compliance:validate-tin', 'compliance:log', 'peripheral:cancel',
]);

/** True when the channel mutates business data and must be gated. */
export function isWriteChannel(channel: string): boolean {
  if (ALLOWED_CHANNELS.has(channel)) return false;
  if (ALLOWED_PREFIXES.some((p) => channel.startsWith(p))) return false;
  if (WRITE_CHANNELS.has(channel)) return true;
  return WRITE_PREFIXES.some((p) => channel.startsWith(p));
}

type Verdict = { allowed: true } | { allowed: false; message: string };

let cached: { at: number; verdict: Verdict } | null = null;
const TTL_MS = 1000;

function messageFor(status: string | null): string {
  if (status === 'payment_rejected') {
    return `[${VIEW_ONLY_CODE}] Your payment was rejected. Submit a valid payment to resume editing your business data.`;
  }
  if (status === 'pending_payment') {
    return `[${VIEW_ONLY_CODE}] Your payment is still awaiting approval. Editing stays locked until it is approved.`;
  }
  if (status === 'active') {
    return `[${VIEW_ONLY_CODE}] Your account is currently read-only. Renew or upgrade your plan to resume editing your business data.`;
  }
  return `[${VIEW_ONLY_CODE}] Your Shega subscription has expired. Renew to edit your business data.`;
}

/**
 * Whether the linked account may mutate business data. Unlinked installs and
 * active/trial licenses always pass; everything else is view-only.
 */
export function canWriteNow(): Verdict {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.verdict;

  let verdict: Verdict = { allowed: true };
  try {
    const cloud = getCloudSubscription();
    if (cloud) {
      const status = cloud.status === 'trial' ? 'trial' : cloud.status;
      if (status !== 'active' && status !== 'trial') {
        verdict = { allowed: false, message: messageFor(status ?? null) };
      } else if (cloud.access === 'view_only') {
        verdict = { allowed: false, message: messageFor(status ?? null) };
      }
    }
  } catch {
    // A failed lookup must not lock a working install out of its own data.
    verdict = { allowed: true };
  }

  cached = { at: now, verdict };
  return verdict;
}

/** Drop the short-lived verdict cache (after a status sync or a payment). */
export function resetWriteGateCache(): void {
  cached = null;
}

let installed = false;

/**
 * Install the gate. Must run BEFORE any `ipcMain.handle` registration so every
 * handler is wrapped; calling it twice is a no-op.
 */
export function installViewOnlyGate(): void {
  if (installed) return;
  installed = true;

  const original = ipcMain.handle.bind(ipcMain);
  (ipcMain as unknown as { handle: typeof ipcMain.handle }).handle = ((
    channel: string,
    listener: (event: unknown, ...args: any[]) => any,
  ) => {
    if (!isWriteChannel(channel)) return original(channel, listener);
    return original(channel, async (event: unknown, ...args: any[]) => {
      const verdict = canWriteNow();
      if (!verdict.allowed) throw new Error(verdict.message);
      return listener(event, ...args);
    });
  }) as typeof ipcMain.handle;
}
