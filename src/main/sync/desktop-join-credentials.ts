/**
 * P3 — the desktop joiner side of the authenticated handshake.
 *
 * The twin of the hub-side `hub-credentials.ts`: when this desktop has been
 * APPROVED by another device's hub, the credential it was handed lives here so
 * later connections can prove possession instead of presenting the shared
 * bearer token.
 *
 * ## Storage
 *
 * The credential is a signed *public* assertion — device id, business, role,
 * expiry, and the hub's signature. It is not a secret, so it goes in the normal
 * settings table. (The token it replaces IS a secret and stays in
 * `secure-settings`; the two are stored differently on purpose, because
 * conflating them is how a "public" value ends up in a keystar and an actual
 * secret ends up in a world-readable settings row.)
 *
 * The signing key stays in `device-keys.ts` (safeStorage) and is only used to
 * answer a challenge.
 */

import { JoinerAuthenticator, type AuthChallengeMessage, type ChallengeProof, type MembershipCredential } from '@shega/shared';
import { getSetting, setSetting, deleteSetting } from '../secure-settings';
import { getDeviceIdentity } from './device-keys';

const CREDENTIAL_KEY = 'join_membership_credential_v1';

/** True when a value looks like a real credential rather than junk. */
function isUsable(value: unknown): value is MembershipCredential {
  const c = value as MembershipCredential | null;
  return !!c && typeof c.signature === 'string' && typeof c.deviceId === 'string' && typeof c.issuerPublicKey === 'string';
}

export function loadJoinerCredential(): MembershipCredential | null {
  try {
    const raw = getSetting(CREDENTIAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isUsable(parsed)) return null;
    if (Number.isFinite(parsed.expiresAt) && parsed.expiresAt < Date.now()) {
      // Expired: drop it so the next approval can issue a fresh one.
      deleteSetting(CREDENTIAL_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveJoinerCredential(cred: MembershipCredential): boolean {
  if (!isUsable(cred)) return false;
  try {
    setSetting(CREDENTIAL_KEY, JSON.stringify(cred));
    return true;
  } catch {
    return false;
  }
}

export function clearJoinerCredential(): void {
  try { deleteSetting(CREDENTIAL_KEY); } catch { /* already gone */ }
}

export interface DesktopJoinerHandle {
  joiner: JoinerAuthenticator;
  credential: MembershipCredential;
}

/**
 * A ready-to-answer authenticator, or null when this desktop holds no
 * credential (it has not been approved by a remote hub, or the credential no
 * longer matches this install's key). Callers fall back to the token path in
 * that case rather than failing the connection.
 */
export function getDesktopJoinerHandle(): DesktopJoinerHandle | null {
  const cred = loadJoinerCredential();
  if (!cred) return null;
  let identity: ReturnType<typeof getDeviceIdentity>;
  try {
    identity = getDeviceIdentity(cred.deviceId);
  } catch {
    return null;
  }
  const joiner = new JoinerAuthenticator({
    deviceId: identity.deviceId,
    publicKey: identity.publicKey,
    secretKey: identity.secretKey,
  });
  try {
    joiner.acceptCredential(cred);
  } catch {
    // The stored credential no longer matches our key (identity was re-keyed).
    // It cannot be presented usefully, so drop it and let the next approval
    // re-issue rather than sending something that is guaranteed to be refused.
    clearJoinerCredential();
    return null;
  }
  return { joiner, credential: cred };
}

/**
 * Validate a credential arriving from a remote hub and keep it.
 *
 * `acceptCredential`'s device/key binding is the load-bearing part: it stops a
 * hub from steering this desktop into authenticating as a different device.
 */
export function acceptJoinerCredential(cred: unknown): boolean {
  if (!isUsable(cred)) return false;
  let identity: ReturnType<typeof getDeviceIdentity>;
  try {
    identity = getDeviceIdentity(cred.deviceId);
  } catch {
    return false;
  }
  const joiner = new JoinerAuthenticator({
    deviceId: identity.deviceId,
    publicKey: identity.publicKey,
    secretKey: identity.secretKey,
  });
  try {
    joiner.acceptCredential(cred);
  } catch (e) {
    console.warn('[desktopJoiner] rejected credential:', e);
    return false;
  }
  return saveJoinerCredential(cred);
}

/** Sign a hub's challenge. Throws if the hub is not the credential's issuer. */
export function answerHubChallenge(challenge: AuthChallengeMessage): ChallengeProof | null {
  const handle = getDesktopJoinerHandle();
  if (!handle) return null;
  return handle.joiner.answer(challenge);
}
