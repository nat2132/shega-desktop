/* Settings-table helpers with transparent at-rest encryption for secrets.
 *
 * Every reader of a secret MUST go through `getEncryptedSetting`. Reading with
 * the plain `getSetting` returns the base64 ciphertext, which silently breaks
 * auth (a Bearer header built from ciphertext 401s) while the rest of the app
 * still reports the account as linked.
 *
 * Storage format: a value is encrypted with Electron's safeStorage (DPAPI on
 * Windows, Keychain on macOS, libsecret on Linux) and base64-encoded. Values
 * written before encryption was introduced are still plaintext; decryptToken
 * detects that (decryptString throws) and passes them through unchanged, so
 * there is no forced re-login. `isEncryptedSetting` lets a caller migrate.
 */
import { safeStorage } from 'electron';
import db from './database';

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function deleteSetting(key: string): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(key);
}

function encryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

export function encryptToken(token: string): string {
  if (!encryptionAvailable()) return token;
  try {
    return `enc:${safeStorage.encryptString(token).toString('base64')}`;
  } catch {
    return token;
  }
}

export function decryptToken(stored: string): string {
  if (!encryptionAvailable()) return stored;
  // New values carry an `enc:` prefix. Values written before the prefix existed
  // are bare base64 ciphertext, and tokens from before encryption was introduced
  // are bare plaintext — try to decrypt, and pass the value through untouched if
  // that fails. That keeps every historical value readable without a re-login.
  const payload = stored.startsWith('enc:') ? stored.slice(4) : stored;
  try {
    return safeStorage.decryptString(Buffer.from(payload, 'base64'));
  } catch {
    return stored;
  }
}

export function isEncryptedSetting(key: string): boolean {
  return (getSetting(key) ?? '').startsWith('enc:');
}

export function getEncryptedSetting(key: string): string | null {
  const stored = getSetting(key);
  if (!stored) return null;
  return decryptToken(stored);
}

export function setEncryptedSetting(key: string, value: string): void {
  setSetting(key, encryptToken(value));
}

/** Re-encrypt a legacy plaintext value in place, if encryption is available. */
export function migrateEncryptedSetting(key: string): boolean {
  const stored = getSetting(key);
  if (!stored || stored.startsWith('enc:') || !encryptionAvailable()) return false;
  // Distinguish legacy CIPHERTEXT (bare base64, no prefix) from legacy PLAINTEXT.
  // Re-encrypting already-encrypted data would double-wrap it.
  try {
    safeStorage.decryptString(Buffer.from(stored, 'base64'));
    return false;
  } catch {
    /* genuine plaintext — fall through and encrypt it */
  }
  try {
    setEncryptedSetting(key, stored);
    return true;
  } catch {
    return false;
  }
}

/** Secret settings that must never be read with the plaintext getter. */
export const SECRET_SETTING_KEYS = [
  'pairing_access_token',
  'pairing_refresh_token',
  'join_access_token',
  'join_refresh_token',
  'join_lan_token',
  'lan_pairing_token',
  'backend_access_token',
  'backend_refresh_token',
  // P2 device identity — the signing key must be encrypted at rest like every
  // other secret, or a copied settings table yields the device's identity.
  'device_ed25519_secret_v1',
] as const;

/** One-shot migration of any secret still stored as plaintext. */
export function migrateAllSecretSettings(): string[] {
  const migrated: string[] = [];
  for (const key of SECRET_SETTING_KEYS) {
    if (migrateEncryptedSetting(key)) migrated.push(key);
  }
  return migrated;
}
