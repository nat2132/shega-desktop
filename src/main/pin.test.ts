import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  PIN_LENGTH,
  LEGACY_PIN_LENGTHS,
  LEGACY_PIN_NOTICE,
  isValidPin,
  isPinAcceptedFor,
  pinFormatError,
  hashPin,
  verifyPin,
  needsRehash,
} from './pin';

describe('isValidPin — a terminal PIN is exactly 6 digits', () => {
  it('accepts exactly 6 digits', () => {
    expect(isValidPin('000000')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('987654')).toBe(true);
  });

  it('rejects the legacy 4-digit PIN that must be replaced', () => {
    // A 4-digit value is the legacy case: acceptable at LOGIN time, never
    // acceptable as a newly-set PIN.
    expect(isValidPin('1234')).toBe(false);
  });

  it('rejects every length other than 6', () => {
    for (const bad of ['', '1', '12', '123', '12345', '1234567', '12345678']) {
      expect(isValidPin(bad)).toBe(false);
    }
  });

  it('rejects non-digits even at length 6', () => {
    expect(isValidPin('12345a')).toBe(false);
    expect(isValidPin('12 456')).toBe(false);
    expect(isValidPin('12345.')).toBe(false);
    expect(isValidPin('12-456')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidPin(undefined)).toBe(false);
    expect(isValidPin(null)).toBe(false);
    expect(isValidPin(123456)).toBe(false);
    expect(isValidPin(['123456'])).toBe(false);
  });
});

describe('isPinAcceptedFor — what each stored pinLength tolerates', () => {
  it('demands exactly 6 digits once a row records the current length', () => {
    expect(isPinAcceptedFor('123456', PIN_LENGTH)).toBe(true);
    expect(isPinAcceptedFor('1234', PIN_LENGTH)).toBe(false);
    expect(isPinAcceptedFor('1234567', PIN_LENGTH)).toBe(false);
    expect(isPinAcceptedFor('12345a', PIN_LENGTH)).toBe(false);
  });

  it('tolerates a shorter entry for a legacy row (pinLength NULL)', () => {
    // The whole point of the legacy path: a 4-digit PIN still signs in, and
    // pinLength stays NULL because the hash cannot reveal the real length.
    expect(isPinAcceptedFor('1234', null)).toBe(true);
    expect(isPinAcceptedFor('123456', null)).toBe(true);
  });

  it('rejects a length outside the legacy window', () => {
    expect(isPinAcceptedFor('123', null)).toBe(false);
    expect(isPinAcceptedFor('1234567', null)).toBe(false);
    expect(isPinAcceptedFor('12ab', null)).toBe(false);
  });

  it('treats 0 the same as NULL (pre-column rows report 0)', () => {
    expect(isPinAcceptedFor('1234', 0)).toBe(true);
    expect(isPinAcceptedFor('123456', 0)).toBe(true);
    expect(isPinAcceptedFor('123', 0)).toBe(false);
  });

  it('rejects an invite placeholder (empty PIN) for every row shape', () => {
    // Invites are stored with pin = '' and pinLength NULL; they must never
    // authenticate.
    expect(isPinAcceptedFor('', null)).toBe(false);
    expect(isPinAcceptedFor('', 0)).toBe(false);
    expect(isPinAcceptedFor('', PIN_LENGTH)).toBe(false);
  });

  it('honours some other explicitly recorded length exactly', () => {
    expect(isPinAcceptedFor('12345', 5)).toBe(true);
    expect(isPinAcceptedFor('1234', 5)).toBe(false);
    expect(isPinAcceptedFor('123456', 5)).toBe(false);
  });

  it('rejects non-string input regardless of stored length', () => {
    expect(isPinAcceptedFor(undefined, null)).toBe(false);
    expect(isPinAcceptedFor(1234, 4)).toBe(false);
    expect(isPinAcceptedFor(null, PIN_LENGTH)).toBe(false);
  });
});

describe('pin policy constants', () => {
  it('pins the current length to 6 and the legacy window to 4..6', () => {
    expect(PIN_LENGTH).toBe(6);
    expect(LEGACY_PIN_LENGTHS).toEqual([4, 5, 6]);
  });

  it('names the required length in the format error', () => {
    expect(pinFormatError()).toContain('6');
  });

  it('tells the user their PIN predates the 6-digit rule', () => {
    expect(LEGACY_PIN_NOTICE).toMatch(/6/);
    expect(LEGACY_PIN_NOTICE.length).toBeGreaterThan(0);
  });
});

describe('hashPin / verifyPin round trip', () => {
  it('verifies a freshly hashed PIN', () => {
    const stored = hashPin('123456');
    expect(verifyPin('123456', stored)).toBe(true);
  });

  it('rejects a wrong PIN against the same hash', () => {
    const stored = hashPin('123456');
    expect(verifyPin('123457', stored)).toBe(false);
    expect(verifyPin('1234', stored)).toBe(false);
    expect(verifyPin('', stored)).toBe(false);
  });

  it('salts every hash, so identical PINs never collide in storage', () => {
    const a = hashPin('123456');
    const b = hashPin('123456');
    expect(a).not.toBe(b);
    // ...but both still verify.
    expect(verifyPin('123456', a)).toBe(true);
    expect(verifyPin('123456', b)).toBe(true);
  });

  it('stores salt:hash and never the plaintext', () => {
    const stored = hashPin('123456');
    expect(stored.split(':')).toHaveLength(2);
    expect(stored).not.toContain('123456');
  });

  it('rejects an empty stored value', () => {
    expect(verifyPin('123456', '')).toBe(false);
  });

  it('still accepts a pre-scrypt SHA-256 row', () => {
    const legacy = crypto.createHash('sha256').update('123456').digest('hex');
    expect(verifyPin('123456', legacy)).toBe(true);
    expect(verifyPin('654321', legacy)).toBe(false);
  });
});

describe('needsRehash — detecting the pre-scrypt format', () => {
  it('flags an unsalted SHA-256 hash for upgrade', () => {
    const legacy = crypto.createHash('sha256').update('123456').digest('hex');
    expect(needsRehash(legacy)).toBe(true);
  });

  it('does not flag a salted scrypt hash', () => {
    expect(needsRehash(hashPin('123456'))).toBe(false);
  });

  it('does not flag an empty value', () => {
    expect(needsRehash('')).toBe(false);
  });
});
