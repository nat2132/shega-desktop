/**
 * P3 — the desktop hub's credential state.
 *
 * Wraps the shared HubAuthenticator with persistence: issued credentials and
 * revocations survive restarts, so a joiner that was approved once can reconnect
 * without being re-approved. The authenticator itself is stateless across
 * restarts (its pending sessions are in memory by design), so we persist only
 * the durable state.
 */

import { HubAuthenticator, type MembershipCredential, type Revocation, type AuthChallengeMessage, type ChallengeProof, type AuthHandshakeResult, type DevicePublicKey, type DeviceSecretKey } from '@shega/shared';
import db from '../database';
import { getDeviceIdentity } from './device-keys';

const CREDENTIALS_KEY = 'hub_credentials_v1';
const REVOCATIONS_KEY = 'hub_revocations_v1';

function hubDeviceId(): string {
  const row = db.prepare('SELECT device_id FROM sync_meta WHERE id = 1').get() as any;
  return row?.device_id ?? 'desktop';
}

function loadHubIdentity(): { deviceId: string; publicKey: DevicePublicKey; secretKey: DeviceSecretKey } {
  const deviceId = hubDeviceId();
  return getDeviceIdentity(deviceId);
}

function getCredentialsRow(): { credentials: string; revocations: string } {
  const row = db.prepare(`SELECT v FROM hub_auth WHERE k IN (?, ?)`).all(CREDENTIALS_KEY, REVOCATIONS_KEY) as any[];
  const result = { credentials: '{}', revocations: '[]' };
  for (const r of row) {
    if (r.k === CREDENTIALS_KEY) result.credentials = r.v;
    else if (r.k === REVOCATIONS_KEY) result.revocations = r.v;
  }
  return result;
}

function saveCredentials(credentials: Record<string, MembershipCredential>, revocations: Revocation[]): void {
  db.prepare(`INSERT OR REPLACE INTO hub_auth (k, v) VALUES (?, ?)`).run(CREDENTIALS_KEY, JSON.stringify(credentials));
  db.prepare(`INSERT OR REPLACE INTO hub_auth (k, v) VALUES (?, ?)`).run(REVOCATIONS_KEY, JSON.stringify(revocations));
}

function ensureHubAuthTable(): void {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS hub_auth (k TEXT PRIMARY KEY, v TEXT NOT NULL)`);
  } catch { /* ignore */ }
}

let authenticator: HubAuthenticator | null = null;
let initialized = false;

function ensureAuth(): HubAuthenticator {
  if (!initialized) {
    ensureHubAuthTable();
    const identity = loadHubIdentity();
    authenticator = new HubAuthenticator({
      deviceId: identity.deviceId,
      publicKey: identity.publicKey,
      secretKey: identity.secretKey,
    });
    // Hydrate persisted credentials and revocations
    const { credentials, revocations } = getCredentialsRow();
    try {
      const creds = JSON.parse(credentials) as Record<string, MembershipCredential>;
      for (const cred of Object.values(creds)) {
        authenticator.rememberCredential(cred);
      }
    } catch { /* corrupted — start fresh */ }
    try {
      const revs = JSON.parse(revocations) as Revocation[];
      for (const rev of revs) {
        authenticator.rememberRevocation(rev);
      }
    } catch { /* corrupted — start fresh */ }
    initialized = true;
  }
  return authenticator!;
}

/** Issue a membership credential for a joiner device that was approved. */
export function issueJoinerCredential(input: {
  businessId: string;
  deviceId: string;
  devicePublicKey: DevicePublicKey;
  role: string;
}): MembershipCredential | null {
  const auth = ensureAuth();
  try {
    const cred = auth.issueFor(input);
    // Persist the new credential
    const { credentials, revocations } = getCredentialsRow();
    const creds = JSON.parse(credentials) as Record<string, MembershipCredential>;
    creds[input.deviceId] = cred;
    saveCredentials(creds, JSON.parse(revocations) as Revocation[]);
    return cred;
  } catch (e) {
    console.warn('[hub-credentials] issueJoinerCredential failed:', e);
    return null;
  }
}

/** Get a previously issued credential for a device. */
export function getJoinerCredential(deviceId: string): MembershipCredential | null {
  const auth = ensureAuth();
  return auth.getCredentialFor(deviceId);
}

/** Begin a challenge for the given credential. Returns the challenge or an error. */
export function beginJoinChallenge(credential: MembershipCredential, businessId: string): { challenge: AuthChallengeMessage } | { error: string } {
  const auth = ensureAuth();
  return auth.beginChallenge(credential, businessId);
}

/** Complete the challenge with the joiner's proof. Returns the handshake result. */
export function completeJoinChallenge(credential: MembershipCredential, proof: ChallengeProof): AuthHandshakeResult {
  const auth = ensureAuth();
  const res = auth.completeChallenge(credential, proof);
  // Persist any revocation that might have been added during completion
  if (!res.ok && res.reason === 'revoked') {
    const { credentials, revocations } = getCredentialsRow();
    saveCredentials(JSON.parse(credentials), auth.getRevocation(credential.deviceId) ? [auth.getRevocation(credential.deviceId)!] : []);
  }
  return res;
}

/** Revoke a device's credential (owner unpairs or removes). */
export function revokeJoinerCredential(input: {
  businessId: string;
  deviceId: string;
  credentialSignature: string;
  reason?: string;
}): Revocation | null {
  const auth = ensureAuth();
  try {
    const rev = auth.revoke(input);
    const { credentials, revocations } = getCredentialsRow();
    const creds = JSON.parse(credentials) as Record<string, MembershipCredential>;
    delete creds[input.deviceId];
    const revs = (JSON.parse(revocations) as Revocation[]).filter(r => r.deviceId !== input.deviceId);
    revs.push(rev);
    saveCredentials(creds, revs);
    return rev;
  } catch (e) {
    console.warn('[hub-credentials] revokeJoinerCredential failed:', e);
    return null;
  }
}

/** Check if a device is currently revoked. */
export function isJoinerRevoked(deviceId: string): boolean {
  const auth = ensureAuth();
  return auth.isRevoked(deviceId);
}

/** Get the hub's public key (for beacons/QR). */
export function getHubPublicKey(): DevicePublicKey | null {
  try {
    return loadHubIdentity().publicKey;
  } catch {
    return null;
  }
}

/** Get the hub's device id. */
export function getHubDeviceId(): string {
  return hubDeviceId();
}

/** Clear all persisted credentials (testing / re-key). */
export function clearHubCredentials(): void {
  db.prepare(`DELETE FROM hub_auth WHERE k IN (?, ?)`).run(CREDENTIALS_KEY, REVOCATIONS_KEY);
  initialized = false;
  authenticator = null;
}