/**
 * Single source of truth for terminal PINs.
 *
 * A terminal PIN is ALWAYS exactly 6 digits. The length used to be 4, and the
 * value is stored as a salted scrypt hash — so the original length cannot be
 * recovered from the hash itself. `pinLength` records what was set:
 *
 *   6      -> current PIN, exactly 6 digits, nothing to do
 *   NULL/0 -> set before the 6-digit rule existed (a 4-digit PIN, most likely)
 *
 * Legacy rows must stay NULL: backfilling them with 6 would lock those users
 * out. The login handler accepts a shorter entry for a legacy row, then forces
 * the user to choose a 6-digit PIN.
 */

import crypto from 'crypto';

/** The only PIN length Shega accepts today. */
export const PIN_LENGTH = 6;

/** Lengths still honoured for a legacy row that has no `pinLength`. */
export const LEGACY_PIN_LENGTHS = [4, 5, 6];

const EXACT_RE = /^\d{6}$/;
const LEGACY_RE = /^\d{4,6}$/;

/** True when `value` is exactly 6 digits. */
export function isValidPin(value: unknown): value is string {
  return typeof value === 'string' && EXACT_RE.test(value);
}

/**
 * True when `value` is acceptable for a row whose `pinLength` is `storedLength`.
 * A stored length of 6 (or any unknown-but-present value) demands 6 digits; a
 * missing length is legacy and tolerates a shorter entry.
 */
export function isPinAcceptedFor(value: unknown, storedLength: number | null | undefined): boolean {
  if (typeof value !== 'string') return false;
  if (storedLength === PIN_LENGTH) return EXACT_RE.test(value);
  if (!storedLength) return LEGACY_RE.test(value);
  // Some other recorded length: only allow it if it is the exact recorded one.
  return new RegExp(`^\\d{${storedLength}}$`).test(value);
}

/** Human-readable error for a rejected PIN entry. */
export function pinFormatError(): string {
  return `PIN must be exactly ${PIN_LENGTH} digits`;
}

/** Message shown when a legacy PIN was accepted but must now be replaced. */
export const LEGACY_PIN_NOTICE = `Your PIN was set before 6-digit PINs. Please choose a new ${PIN_LENGTH}-digit PIN.`;

/** Hashes a PIN for storage. Always use alongside writing `PIN_LENGTH`. */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

/**
 * Verifies a PIN against a stored value. Tolerates the pre-scrypt SHA-256
 * format so old rows keep working; a successful legacy check should be followed
 * by a re-hash (see rehashPinIfLegacy).
 */
export function verifyPin(pin: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split(':');
  if (parts.length !== 2) {
    // legacy SHA-256 fallback
    const legacy = crypto.createHash('sha256').update(pin).digest('hex');
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto.scryptSync(pin, salt, 64).toString('hex');
  return check === key;
}

/**
 * True when `stored` uses the old unsalted SHA-256 format and should be
 * upgraded. (The `admins` table has such a migration; this helper lets the
 * other PIN-bearing tables opt in.)
 */
export function needsRehash(stored: string): boolean {
  return !!stored && !stored.includes(':');
}
