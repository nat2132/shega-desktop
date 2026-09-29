import { describe, it, expect, beforeEach } from 'vitest';
import {
  PIN_CHANGE_GRANT_MS,
  issuePinChangeGrant,
  consumePinChangeGrant,
  isPinChangeGrantValid,
  clearPinChangeGrant,
  peekPinChangeGrant,
} from './pin-change-grant';

// The grant is a module-level singleton, so each test starts from a clean slate.
beforeEach(() => {
  clearPinChangeGrant();
});

describe('legacy PIN upgrade grant', () => {
  it('starts with no grant', () => {
    expect(peekPinChangeGrant()).toBeNull();
    expect(consumePinChangeGrant('admin', 1)).toBe(false);
  });

  it('authorises exactly the account that authenticated', () => {
    issuePinChangeGrant('employee', 42);
    expect(peekPinChangeGrant()).toMatchObject({ source: 'employee', id: 42 });
    expect(consumePinChangeGrant('employee', 42)).toBe(true);
  });

  it('is single-use: a second redemption fails', () => {
    issuePinChangeGrant('admin', 1);
    expect(consumePinChangeGrant('admin', 1)).toBe(true);
    expect(consumePinChangeGrant('admin', 1)).toBe(false);
    expect(peekPinChangeGrant()).toBeNull();
  });

  it('rejects a different id, so a renderer cannot reset someone else', () => {
    issuePinChangeGrant('admin', 1);
    expect(consumePinChangeGrant('admin', 2)).toBe(false);
  });

  it('rejects a different source, even for the same numeric id', () => {
    // id 1 as a roster user and id 1 as an admin are different accounts; the
    // grant must not carry across the two tables.
    issuePinChangeGrant('admin', 1);
    expect(consumePinChangeGrant('roster', 1)).toBe(false);
    expect(consumePinChangeGrant('employee', 1)).toBe(false);
  });

  it('leaves the grant intact after a mismatched attempt', () => {
    // A wrong guess must not destroy the legitimate user's upgrade right.
    issuePinChangeGrant('roster', 7);
    expect(consumePinChangeGrant('roster', 8)).toBe(false);
    expect(consumePinChangeGrant('roster', 7)).toBe(true);
  });

  it('expires after its window and stays spent', () => {
    const issued = 1_000_000;
    issuePinChangeGrant('admin', 5, issued);
    // Just inside the window.
    expect(consumePinChangeGrant('admin', 5, issued + PIN_CHANGE_GRANT_MS - 1)).toBe(true);

    issuePinChangeGrant('admin', 5, issued);
    // Past expiry: rejected, and the grant is discarded.
    expect(consumePinChangeGrant('admin', 5, issued + PIN_CHANGE_GRANT_MS + 1)).toBe(false);
    expect(peekPinChangeGrant()).toBeNull();
    // ...and cannot be retried.
    expect(consumePinChangeGrant('admin', 5, issued)).toBe(false);
  });

  it('issues a 10-minute window', () => {
    const issued = 5_000;
    issuePinChangeGrant('employee', 3, issued);
    expect(peekPinChangeGrant()!.expiresAt).toBe(issued + 10 * 60 * 1000);
    expect(PIN_CHANGE_GRANT_MS).toBe(10 * 60 * 1000);
  });

  it('replaces an earlier grant when a new login authenticates', () => {
    issuePinChangeGrant('admin', 1);
    issuePinChangeGrant('roster', 2);
    // Only the most recent account holds an upgrade right.
    expect(consumePinChangeGrant('admin', 1)).toBe(false);
    expect(consumePinChangeGrant('roster', 2)).toBe(true);
  });

  it('is dropped on session teardown so a logout cannot be replayed', () => {
    issuePinChangeGrant('admin', 9);
    clearPinChangeGrant();
    expect(consumePinChangeGrant('admin', 9)).toBe(false);
  });
});

describe('isPinChangeGrantValid — pre-flight check that does not spend the grant', () => {
  it('reports a live grant for its own account', () => {
    issuePinChangeGrant('roster', 4);
    expect(isPinChangeGrantValid('roster', 4)).toBe(true);
  });

  it('reports false for a different account without spending it', () => {
    // This is the whole point: set-own-pin pre-flights, writes, and only then
    // spends. A failed write must leave the user able to try again.
    issuePinChangeGrant('roster', 4);
    expect(isPinChangeGrantValid('roster', 5)).toBe(false);
    expect(peekPinChangeGrant()).not.toBeNull();
    expect(consumePinChangeGrant('roster', 4)).toBe(true);
  });

  it('reports false for a different source with the same id', () => {
    issuePinChangeGrant('admin', 1);
    expect(isPinChangeGrantValid('employee', 1)).toBe(false);
    expect(isPinChangeGrantValid('roster', 1)).toBe(false);
  });

  it('reports false when no grant is outstanding', () => {
    expect(isPinChangeGrantValid('admin', 1)).toBe(false);
  });

  it('reports false and discards an expired grant', () => {
    const issued = 2_000_000;
    issuePinChangeGrant('admin', 1, issued);
    expect(isPinChangeGrantValid('admin', 1, issued + PIN_CHANGE_GRANT_MS + 1)).toBe(false);
    expect(peekPinChangeGrant()).toBeNull();
    expect(consumePinChangeGrant('admin', 1)).toBe(false);
  });

  it('agrees with consume at the expiry boundary', () => {
    const issued = 3_000_000;
    issuePinChangeGrant('employee', 2, issued);
    // Same instant, both paths must reach the same conclusion.
    const at = issued + PIN_CHANGE_GRANT_MS;
    expect(isPinChangeGrantValid('employee', 2, at)).toBe(true);
    expect(consumePinChangeGrant('employee', 2, at)).toBe(true);
  });
});
