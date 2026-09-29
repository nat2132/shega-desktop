/**
 * P2 — this device's Ed25519 identity key (desktop).
 *
 * The secret key goes through the existing `secure-settings` layer, so it is
 * encrypted at rest with Electron's `safeStorage` (DPAPI on Windows, Keychain
 * on macOS, libsecret on Linux) and never lands in the `settings` table as
 * plaintext. Reusing that layer rather than inventing a second one means the key
 * inherits the existing migration path and the existing "secrets must be read
 * through `getEncryptedSetting`" rule.
 *
 * `deviceId` is deliberately not stored here. It is the stable business identity
 * — outbox seqs, receipts and every synced row key off it — so it stays in
 * `sync_meta.device_id` where it already lives. Deriving an id from a key would
 * orphan all of that history on rotation. The public key travels alongside it.
 */

import {
  derivePublicKey,
  generateDeviceKeyPair,
  isValidPublicKey,
  type DevicePublicKey,
  type DeviceSecretKey,
} from '@shega/shared';
import { getEncryptedSetting, setEncryptedSetting, deleteSetting } from '../secure-settings';

const SECRET_KEY_SETTING = 'device_ed25519_secret_v1';
const PUBLIC_KEY_SETTING = 'device_ed25519_public_v1';

export interface DeviceIdentity {
  deviceId: string;
  publicKey: DevicePublicKey;
  secretKey: DeviceSecretKey;
}

let cached: DeviceIdentity | null = null;

/**
 * Load this install's key pair, generating one on first run.
 *
 * Synchronous because the desktop hub's request handlers are synchronous and
 * this sits in the hot path of every authenticated request.
 */
export function getDeviceIdentity(deviceId: string): DeviceIdentity {
  if (cached && cached.deviceId === deviceId) return cached;
  if (!deviceId) throw new Error('getDeviceIdentity: deviceId is required');

  const storedSecret = getEncryptedSetting(SECRET_KEY_SETTING);
  const storedPublic = getEncryptedSetting(PUBLIC_KEY_SETTING);

  if (storedSecret && storedPublic && isValidPublicKey(storedPublic)) {
    try {
      // A public key that does not match the secret beside it would produce a
      // hub that can never complete a handshake, and the failure would surface
      // as a peer bug. Derive and compare rather than trusting the pair.
      if (derivePublicKey(storedSecret) === storedPublic) {
        cached = { deviceId, publicKey: storedPublic, secretKey: storedSecret };
        return cached;
      }
      console.warn('[deviceKeys] stored public key does not match the secret key; re-keying');
    } catch {
      // Malformed secret — fall through and re-key.
    }
  }

  const fresh = generateDeviceKeyPair(deviceId);
  // The public key is not a secret; it is published in beacons and handshakes.
  setEncryptedSetting(PUBLIC_KEY_SETTING, fresh.publicKey);
  setEncryptedSetting(SECRET_KEY_SETTING, fresh.secretKey);
  cached = { deviceId, publicKey: fresh.publicKey, secretKey: fresh.secretKey };
  return cached;
}

/** True when this install already has a key pair (i.e. has been through pairing). */
export function hasDeviceIdentity(): boolean {
  if (cached) return true;
  const p = getEncryptedSetting(PUBLIC_KEY_SETTING);
  return !!p && isValidPublicKey(p);
}

/** The public key alone — safe to publish in beacons and handshakes. */
export function getDevicePublicKey(deviceId: string): DevicePublicKey | null {
  try {
    return getDeviceIdentity(deviceId).publicKey;
  } catch {
    return null;
  }
}

/**
 * Replace the key pair. The caller is responsible for revoking the old
 * credential; this only guarantees the new key is what future handshakes use.
 */
export function rotateDeviceKey(deviceId: string): DeviceIdentity {
  const fresh = generateDeviceKeyPair(deviceId);
  setEncryptedSetting(PUBLIC_KEY_SETTING, fresh.publicKey);
  setEncryptedSetting(SECRET_KEY_SETTING, fresh.secretKey);
  cached = { deviceId, publicKey: fresh.publicKey, secretKey: fresh.secretKey };
  return cached;
}

/** Forget the key entirely. The device will re-key and must re-pair. */
export function clearDeviceIdentity(): void {
  deleteSetting(SECRET_KEY_SETTING);
  deleteSetting(PUBLIC_KEY_SETTING);
  cached = null;
}

/** Drop the in-memory cache; the stored values are left alone. */
export function clearIdentityCache(): void {
  cached = null;
}
