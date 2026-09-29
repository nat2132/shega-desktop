/**
 * Authorises exactly one PIN replacement for the account that just authenticated
 * a legacy PIN.
 *
 * The grant lives in the main process only and is bound to the authenticating
 * account's `(source, id)`, so a renderer cannot reset someone else's PIN by
 * passing a different id. It is single-use and short-lived, so a stale window
 * cannot be replayed later, and issuing a new one replaces any previous grant —
 * a fresh login is the only way to obtain a new upgrade right.
 *
 * Extracted from ipc-handlers so the single-use / expiry / target-binding
 * properties are directly testable instead of hidden in a 7k-line module.
 */

export type PinChangeSource = 'admin' | 'employee' | 'roster';

export type PinChangeGrant = {
  source: PinChangeSource;
  id: number;
  expiresAt: number;
};

/** How long a freshly issued grant stays redeemable. */
export const PIN_CHANGE_GRANT_MS = 10 * 60 * 1000;

let pendingPinChange: PinChangeGrant | null = null;

/** Records a replacement right for `source`/`id`, discarding any earlier grant. */
export function issuePinChangeGrant(source: PinChangeSource, id: number, now = Date.now()): void {
  pendingPinChange = { source, id, expiresAt: now + PIN_CHANGE_GRANT_MS };
}

/**
 * Redeems the grant for `source`/`id`.
 *
 * Returns true only on a live grant for exactly that account, and spending it
 * is irreversible. An expired grant is dropped here so it cannot be retried.
 * A mismatched source/id leaves the grant intact — a wrong guess should not
 * destroy the legitimate user's upgrade right.
 */
export function consumePinChangeGrant(source: string, id: number, now = Date.now()): boolean {
  const grant = pendingPinChange;
  if (!grant) return false;
  if (now > grant.expiresAt) {
    pendingPinChange = null;
    return false;
  }
  if (grant.source !== source || grant.id !== id) return false;
  pendingPinChange = null;
  return true;
}

/**
 * Non-consuming validity check.
 *
 * Used to pre-flight an upgrade before the row is written, so a missing account
 * or a zero-row update cannot burn a single-use grant and strand the user with
 * no way to finish. An expired grant is dropped here, matching `consume`.
 */
export function isPinChangeGrantValid(source: string, id: number, now = Date.now()): boolean {
  const grant = pendingPinChange;
  if (!grant) return false;
  if (now > grant.expiresAt) {
    pendingPinChange = null;
    return false;
  }
  return grant.source === source && grant.id === id;
}

/** Drops any outstanding grant (used when a session is torn down). */
export function clearPinChangeGrant(): void {
  pendingPinChange = null;
}

/** Test/introspection helper: the live grant, or null. */
export function peekPinChangeGrant(): PinChangeGrant | null {
  return pendingPinChange;
}
