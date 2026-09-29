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
import { randomBytes } from 'crypto';
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

/**
 * What an approved joiner is handed back on the join channel.
 *
 * ## The rule
 *
 * A joiner that sent a public key gets the signed credential and NOTHING else.
 * A joiner that sent no key — a build too old to do the handshake — gets the
 * legacy pairing token, because that is the only thing it can use.
 *
 * ## Why not just "issue the token as well"
 *
 * Handing a modern device both means it has a shared, replayable, network-wide
 * secret that it will keep using (and keep in mDNS/AsyncStorage) even after the
 * credential path works. The token is the weaker of the two mechanisms, so
 * withholding it from capable clients is what actually shrinks the blast radius
 * of a captured secret. Old clients keep working, so a mixed fleet is fine.
 *
 * ## The awkward case, stated plainly
 *
 * A joiner that sent a public key but has no credential stored — approved
 * before it sent one, or issuance failed — receives NEITHER. Falling back to the
 * token there would hand a P3-capable device the weaker secret, and it would
 * then present that token to a hub that may already be refusing tokens. Such a
 * device re-approves and gets a credential; that is the intended repair.
 */
export function approvalGrant(
  deviceId: string,
  rec: { status?: string | null; joinerPublicKey?: string | null } | null,
): Record<string, unknown> {
  if (!rec || rec.status !== 'approved') return {};
  const credential = getJoinerCredential(deviceId);
  if (credential) return { credential };
  if (rec.joinerPublicKey) return {};
  return { pairingToken: getPairingTokenRef() };
}

/** Late-bound to avoid a cycle: sync-hub owns the token, hub-credentials the keys. */
let getPairingTokenRef: () => string = () => '';
export function bindPairingTokenSource(fn: () => string): void {
  getPairingTokenRef = fn;
}

// ─── Access grants (HTTP transports) ─────────────────────────────────────────

/**
 * Short-lived, device-scoped bearer for a transport that has no place to carry
 * a proof.
 *
 * ## Why this exists
 *
 * The WebSocket and TCP paths both complete a challenge *on the same
 * connection* the data then flows over, so the proof is all that is needed. The
 * desktop↔desktop HTTP pull does not: it is a plain `GET` with a token in the
 * query string, which is exactly the thing being replaced. Rather than invent a
 * signed-URL format for a LAN pull, the challenge happens once out-of-band and
 * buys a grant that authorises the following request.
 *
 * ## Properties, and why each one
 *
 * - **Unguessable** (192 bits from the CSPRNG) — it is a credential, so it must
 *   not be brute-forceable the way the old 6-character pairing token was.
 * - **Bound to one device id** — a stolen grant is useless to any other peer, so
 *   it cannot be used to widen access.
 * - **Short-lived (60s)** — long enough for the request it was minted for.
 * - **Consumed on use** — a grant is good for exactly one request. A retried or
 *   replayed pull therefore fails, and the client re-runs the challenge (it
 *   still holds the credential). This is a deliberate trade: a strict
 *   single-use grant breaks proxy retries, so it is only safe because the
 *   client can re-authenticate cheaply.
 *
 * Grants are intentionally NOT persisted: they are seconds long, and a
 * surviving one across a restart would outlive the credential it came from.
 */
export interface AccessGrant {
  deviceId: string;
  businessId: string;
  expiresAt: number;
}

const ACCESS_GRANT_TTL_MS = 60_000;
const MAX_LIVE_GRANTS = 64;
const grants = new Map<string, AccessGrant>();

function pruneGrants(now = Date.now()): void {
  for (const [t, g] of grants) {
    if (g.expiresAt <= now) grants.delete(t);
  }
}

/** Mint a grant for a device that has just proven possession of its credential. */
export function issueAccessGrant(deviceId: string, businessId: string, ttlMs = ACCESS_GRANT_TTL_MS): string {
  const now = Date.now();
  pruneGrants(now);
  // Bounded so an authenticated-but-hostile peer cannot accumulate grants
  // faster than they expire.
  while (grants.size >= MAX_LIVE_GRANTS) {
    const oldest = grants.keys().next();
    if (oldest.done) break;
    grants.delete(oldest.value);
  }
  const token = randomBytes(24).toString('base64url');
  grants.set(token, { deviceId, businessId, expiresAt: now + ttlMs });
  return token;
}

/** Redeem a grant for a specific device. Consumes it; a second use fails. */
export function consumeAccessGrant(token: string, deviceId: string): AccessGrant | null {
  const now = Date.now();
  pruneGrants(now);
  const grant = grants.get(token);
  if (!grant) return null;
  grants.delete(token);
  if (grant.expiresAt <= now) return null;
  // Scope check: a grant minted for one peer must not authenticate another.
  if (deviceId && grant.deviceId !== deviceId) return null;
  return grant;
}