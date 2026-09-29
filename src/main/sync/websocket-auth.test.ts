/**
 * P3 — the authenticated handshake over the real WebSocket server.
 *
 * ## Why this is its own file
 *
 * The existing `websocket-server.test.ts` closes the module-level `database`
 * singleton in its `afterAll`. A second `describe` in the same file therefore
 * inherits a closed handle and every query silently fails, which looks exactly
 * like a protocol bug. Splitting into a separate file gives this suite its own
 * database and module graph.
 *
 * ## What it covers
 *
 * These drive the actual `WsSyncServer` with real `ws` clients and real Ed25519
 * credentials, so they cover the wiring the shared unit tests cannot: that
 * approval actually mints a credential, that the credential reaches the joiner,
 * and that the challenge round trip completes over a real socket. Each
 * rejection asserts a specific reason, because a hub that denied everything for
 * the wrong reason would still pass a bare "rejected" check while being
 * impossible to use.
 *
 * Requires Electron's ABI (better-sqlite3 is built against it), so it is run
 * with:
 *
 *   $env:ELECTRON_RUN_AS_NODE = "1"
 *   .\node_modules\electron\dist\electron.exe .\node_modules\vitest\vitest.mjs run --config vitest.e2e.config.ts
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import WebSocket from 'ws';

vi.mock('electron', () => {
  const tmp = () => process.env.SHEGA_E2E_TMP || process.cwd();
  return {
    app: { isPackaged: false, getPath: () => tmp(), on: () => {}, once: () => {}, emit: () => true, removeListener: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  };
});

describe('Sync hub — P3 credential handshake over WS', () => {
  let dbm: any;
  let db: any;
  let hubModule: any;
  let server: any;
  let tmp: string;
  let token: string;
  let wsUrl: string;
  let shared: any;
  let hubCreds: any;
  const wsPort = 59755;
  let seq = 0;

  const BIZ_UUID = '7c3d9e21-4b88-4f1a-9d55-888888888888';

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-auth-e2e-'));
    process.env.SHEGA_E2E_TMP = tmp;
    process.chdir(tmp);
    vi.resetModules();
    dbm = await import('../database');
    dbm.initDB();
    db = dbm.getDb();
    hubModule = await import('../sync-hub');
    hubModule.ensureHubDeviceId();
    token = hubModule.getPairingToken();
    shared = await import('@shega/shared');
    hubCreds = await import('./hub-credentials');

    const { WsSyncServer } = await import('./websocket-server');
    server = new WsSyncServer();
    server.start(wsPort);
    wsUrl = `ws://127.0.0.1:${wsPort}`;

    db.prepare(
      `INSERT INTO businesses (businessName, storeName, currency, isDefault, uuid, device_id, row_version, updated_at, is_synced)
       VALUES ('Auth E2E', 'Auth E2E Store', 'ETB', 1, ?, 'hub', 1, '2026-09-15 08:00:00', 1)`
    ).run(BIZ_UUID);
  });

  afterAll(() => {
    try { server?.stop(); } catch {}
    try { db?.close?.(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  });

  /**
   * A real WS client with a `next()` that also records everything it saw, so a
   * timeout reports the traffic that actually arrived instead of a bare
   * "timeout waiting for X" with no context.
   */
  function openClient(): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.on('open', () => {
        const events: any[] = [];
        const send = (type: string, payload: any, requestId?: string) => {
          const id = requestId || `a${++seq}`;
          ws.send(JSON.stringify({ type, payload, requestId: id }));
        };
        const client: any = {
          ws,
          events,
          send,
          next: (type: string, timeoutMs = 6000) =>
            new Promise<any>((res, rej) => {
              const t = setTimeout(
                () => rej(new Error(
                  `timeout waiting for ${type}; saw: ${events
                    .map((e) => `${e.type}${e.type === 'ERROR' ? `(${JSON.stringify(e.payload)})` : ''}`)
                    .join(', ') || 'nothing'}`,
                )),
                timeoutMs,
              );
              const onMsg = (raw: Buffer) => {
                const msg = JSON.parse(raw.toString());
                events.push(msg);
                if (msg.type !== type) return;
                clearTimeout(t);
                ws.off('message', onMsg);
                res(msg);
              };
              ws.on('message', onMsg);
            }),
          close: () => ws.close(),
        };
        resolve(client);
      });
      ws.on('error', reject);
    });
  }

  /** A joiner with a real Ed25519 identity, exactly as the phone would have. */
  function makeJoiner(deviceId: string) {
    const kp = shared.generateDeviceKeyPair(deviceId);
    return {
      kp,
      joiner: new shared.JoinerAuthenticator({ deviceId: kp.deviceId, publicKey: kp.publicKey, secretKey: kp.secretKey }),
    };
  }

  /** Stage a join, approve it, and return the credential the owner issued. */
  async function approveJoiner(deviceId: string, role = 'cashier'): Promise<any> {
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    expect(bizId, 'test business must exist').toBeTruthy();
    // Alphanumeric so it survives invite-code normalization.
    const code = `P3${deviceId.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
       VALUES (?, ?, ?, 'P3 Joiner', ?, 'mobile', NULL, NULL, 'open', ?)`
    ).run(`inv-${deviceId}`, String(bizId), code, role, new Date().toISOString());

    const j = makeJoiner(deviceId);
    const joiner = await openClient();
    // next() must be armed BEFORE send(): the hub can answer in the same tick,
    // and a listener attached afterwards misses the reply entirely.
    const ackP = joiner.next('DEVICE_JOIN_ACK');
    joiner.send('DEVICE_JOIN_SUBMIT', {
      code,
      joinerDeviceId: deviceId,
      joinerName: deviceId,
      joinerUser: `${deviceId}@e2e`,
      role,
      platform: 'mobile',
      // The public key is what lets the hub mint a credential on approval.
      joinerPublicKey: j.kp.publicKey,
    }, `sub-${deviceId}`);
    const ack = await ackP;
    // The submitter is the only party that receives this; it authorises
    // collecting the grant on the status poll below.
    const pollToken = String(ack.payload?.pollToken ?? '');
    expect(pollToken, 'submit ACK must carry a poll token').toBeTruthy();

    const owner = await openClient();
    const ownerPairP = owner.next('PAIR_RESPONSE');
    owner.send('PAIR_REQUEST', { device_id: 'p3-owner', name: 'owner', token });
    await ownerPairP;
    const reqId = (db.prepare("SELECT id FROM device_requests WHERE joiner_device_id = ? AND status = 'pending'").get(deviceId) as any)?.id;
    expect(reqId, 'join request must be staged').toBeTruthy();
    const decideP = owner.next('DEVICE_JOIN_RESPONSE');
    owner.send('DEVICE_JOIN_DECIDE', { requestId: reqId, decision: 'approved' }, `dec-${deviceId}`);
    await decideP;
    owner.close();

    // The joiner learns its credential on the status poll, presenting its token.
    const statusP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('DEVICE_JOIN_STATUS', { code, joinerDeviceId: deviceId, pollToken }, `st-${deviceId}`);
    const status = await statusP;
    joiner.close();
    return { credential: status.payload.credential, joiner: j, code, pollToken };
  }

  it('approval mints a signed credential bound to the joiner key and role', async () => {
    const { credential } = await approveJoiner('p3-mint-1', 'manager');
    expect(credential).toBeTruthy();
    expect(credential.deviceId).toBe('p3-mint-1');
    expect(credential.role).toBe('manager');
    expect(credential.signature).toBeTruthy();

    // It is a real credential: verifies against the hub's own key.
    const hubKey = hubCreds.getHubPublicKey();
    const check = shared.verifyMembershipCredential(credential, {
      issuerPublicKey: hubKey,
      businessId: credential.businessId,
    });
    expect(check.valid).toBe(true);
  });

  it('a joiner completes PAIR_REQUEST → AUTH_CHALLENGE → AUTH_PROOF → AUTH_OK', async () => {
    const { credential, joiner } = await approveJoiner('p3-happy-1', 'manager');
    joiner.joiner.acceptCredential(credential);

    const c = await openClient();
    const challengeP = c.next('AUTH_CHALLENGE');
    // No token at all: the credential alone must be enough.
    c.send('PAIR_REQUEST', { device_id: 'p3-happy-1', name: 'happy', platform: 'mobile', credential }, 'pr1');
    const challenge = await challengeP;
    expect(challenge.payload.type).toBe('AUTH_CHALLENGE');
    expect(challenge.payload.sessionId).toBeTruthy();
    expect(challenge.payload.nonce).toBeTruthy();
    // The challenge advertises the hub key, which must be the credential issuer.
    expect(challenge.payload.verifierPublicKey).toBe(credential.issuerPublicKey);

    // Arm BOTH listeners before sending: the hub answers AUTH_OK and
    // PAIR_RESPONSE back-to-back in one handler, so a listener attached after
    // awaiting AUTH_OK has already missed the PAIR_RESPONSE frame.
    const okP = c.next('AUTH_OK');
    const pairRespP = c.next('PAIR_RESPONSE');
    c.send('AUTH_PROOF', joiner.joiner.answer(challenge.payload), 'ap1');
    const ok = await okP;
    expect(ok.payload.role).toBe('manager');
    expect(ok.payload.businessId).toBe(credential.businessId);

    // And the socket is now usable: PAIR_RESPONSE arrives.
    expect((await pairRespP).payload.success).toBe(true);
    c.close();
  });

  it('rejects a device the owner never approved', async () => {
    const c = await openClient();
    const denyP = c.next('AUTH_DENY');
    c.send('PAIR_REQUEST', {
      device_id: 'p3-stranger',
      name: 'stranger',
      platform: 'mobile',
      credential: { deviceId: 'p3-stranger', devicePublicKey: 'x', signature: 'y', businessId: '1' },
    }, 'pr-stranger');
    const deny = await denyP;
    expect(deny.payload.reason).toBe('no_credential');
    c.close();
  });

  it('rejects a tampered credential (role escalated after signing)', async () => {
    const { credential } = await approveJoiner('p3-tamper-1', 'cashier');
    // Same signature, different role: the swap is only detectable by verifying
    // the signature over the PRESENTED body.
    const forged = { ...credential, role: 'admin' };
    const c = await openClient();
    const denyP = c.next('AUTH_DENY');
    c.send('PAIR_REQUEST', { device_id: 'p3-tamper-1', name: 'tamper', platform: 'mobile', credential: forged }, 'pr-tamper');
    const deny = await denyP;
    expect(deny.payload.reason).toBe('bad_signature');
    c.close();
  });

  it('rejects a proof signed by a key the owner never approved', async () => {
    const { credential, joiner } = await approveJoiner('p3-wrongkey-1');
    joiner.joiner.acceptCredential(credential);
    // A second key pair for the SAME device id. It deliberately never gets to
    // acceptCredential — that guard would reject it, which is itself correct —
    // it only supplies the private key used to forge a signature below.
    const impostor = makeJoiner('p3-wrongkey-1');

    const c = await openClient();
    const challengeP = c.next('AUTH_CHALLENGE');
    c.send('PAIR_REQUEST', { device_id: 'p3-wrongkey-1', name: 'wk', platform: 'mobile', credential }, 'pr-wk');
    const challenge = await challengeP;

    // Sign the correct transcript, but with a key the owner never approved.
    const genuine = joiner.joiner.answer(challenge.payload);
    const forgedSig = shared.signBytes(impostor.kp.secretKey, shared.decodeBase64Url(genuine.signature)!);
    const denyP = c.next('AUTH_DENY');
    c.send('AUTH_PROOF', { ...genuine, signature: forgedSig }, 'ap-wk');
    const deny = await denyP;
    expect(deny.payload.reason).toBe('bad_signature');
    c.close();
  });

  it('rejects a replayed proof', async () => {
    const { credential, joiner } = await approveJoiner('p3-replay-1');
    joiner.joiner.acceptCredential(credential);

    const c = await openClient();
    const chP = c.next('AUTH_CHALLENGE');
    c.send('PAIR_REQUEST', { device_id: 'p3-replay-1', name: 'rp', platform: 'mobile', credential }, 'pr-rp');
    const proof = joiner.joiner.answer((await chP).payload);
    const okP = c.next('AUTH_OK');
    c.send('AUTH_PROOF', proof, 'ap-rp1');
    await okP;
    c.close();

    // Same proof, brand new connection. The hub binds each challenge to a fresh
    // session, so the stale proof's sessionId cannot match — the replay is
    // refused before the signature is even considered. Which of the two
    // replay guards fires is an implementation detail; that it is refused is
    // the property under test.
    const c2 = await openClient();
    const ch2P = c2.next('AUTH_CHALLENGE');
    c2.send('PAIR_REQUEST', { device_id: 'p3-replay-1', name: 'rp', platform: 'mobile', credential }, 'pr-rp2');
    await ch2P;
    const denyP = c2.next('AUTH_DENY');
    c2.send('AUTH_PROOF', proof, 'ap-rp2');
    const deny = await denyP;
    expect(deny.payload.reason).toMatch(/session_mismatch|unknown_or_expired_session/);
    c2.close();
  });

  it('refuses a revoked device on the credential path', async () => {
    const { credential } = await approveJoiner('p3-revoke-1');
    hubCreds.revokeJoinerCredential({
      businessId: credential.businessId,
      deviceId: 'p3-revoke-1',
      credentialSignature: credential.signature,
      reason: 'unpaired by owner',
    });
    const c = await openClient();
    const denyP = c.next('AUTH_DENY');
    c.send('PAIR_REQUEST', { device_id: 'p3-revoke-1', name: 'rv', platform: 'mobile', credential }, 'pr-rv');
    const deny = await denyP;
    // Revocation removes the issued credential, so a revoked device is
    // indistinguishable from one that was never approved — by design.
    expect(deny.payload.reason).toBe('no_credential');
    c.close();
  });

  it('the legacy token path still works while both paths are live', async () => {
    // Migration guard: this test failing is the explicit signal that the
    // fallback can finally be deleted.
    const c = await openClient();
    const p = c.next('PAIR_RESPONSE');
    c.send('PAIR_REQUEST', { device_id: 'p3-legacy-1', name: 'legacy', token }, 'pr-legacy');
    expect((await p).payload.success).toBe(true);
    c.close();
  });

  it('a P3-capable joiner is granted a credential and NOT a bearer token', async () => {
    // The point of the grant rule: withholding the token from a device that can
    // do the handshake is what actually shrinks the blast radius of a captured
    // secret. Handing out both would leave every modern device holding a
    // network-wide shared secret it keeps using.
    const { credential, pollToken } = await approveJoiner('p3-nogrant-1');
    const c = await openClient();
    const statusP = c.next('DEVICE_JOIN_RESPONSE');
    c.send('DEVICE_JOIN_STATUS', { joinerDeviceId: 'p3-nogrant-1', pollToken }, 'st-nogrant');
    const status = await statusP;
    expect(status.payload.credential).toBeTruthy();
    expect(status.payload.credential.signature).toBe(credential.signature);
    expect(status.payload.pairingToken).toBeUndefined();
    c.close();
  });

  it('an approved join polled WITHOUT its poll token gets no credential', async () => {
    // The join channel is unauthenticated by design, so "approved" alone must
    // not authorise collecting a grant. Otherwise anyone who learns an approved
    // device id could poll for its credential — and, for a legacy device, the
    // hub-wide pairing token. Device ids are advertised in mDNS and shown in
    // the owner UI, so they are not secret.
    const { credential } = await approveJoiner('p3-nopoll-1');
    expect(credential).toBeTruthy();

    const c = await openClient();
    const statusP = c.next('DEVICE_JOIN_RESPONSE');
    // No pollToken at all.
    c.send('DEVICE_JOIN_STATUS', { joinerDeviceId: 'p3-nopoll-1' }, 'st-nopoll');
    const status = await statusP;
    // The decision itself is still visible (the join screen renders it)...
    expect(status.payload.record.status).toBe('approved');
    // ...but no authentication material is handed over.
    expect(status.payload.credential).toBeUndefined();
    expect(status.payload.pairingToken).toBeUndefined();
    c.close();
  });

  it('an approved join polled with a WRONG poll token gets no credential', async () => {
    await approveJoiner('p3-badpoll-1');
    const c = await openClient();
    const statusP = c.next('DEVICE_JOIN_RESPONSE');
    c.send('DEVICE_JOIN_STATUS', { joinerDeviceId: 'p3-badpoll-1', pollToken: 'f'.repeat(64) }, 'st-badpoll');
    const status = await statusP;
    expect(status.payload.record.status).toBe('approved');
    expect(status.payload.credential).toBeUndefined();
    expect(status.payload.pairingToken).toBeUndefined();
    c.close();
  });
});

/**
 * P3 — the desktop↔desktop HTTP flow.
 *
 * This transport is structurally different from the socket paths: the pull is a
 * plain `GET` with a bearer in the query string, so there is nowhere to carry a
 * proof. The handshake therefore happens out of band and buys a short-lived
 * grant. That makes the grant's own properties security-relevant, so they are
 * tested directly rather than assumed.
 */
describe('Sync hub — P3 credential handshake over HTTP (desktop↔desktop)', () => {
  let dbm: any;
  let db: any;
  let hubModule: any;
  let server: any;
  let tmp: string;
  let token: string;
  let baseUrl: string;
  let shared: any;
  const port = 59756;

  const BIZ_UUID = '5b2e8f40-1c3d-4a77-9b21-777777777777';

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-authhttp-e2e-'));
    process.env.SHEGA_E2E_TMP = tmp;
    process.chdir(tmp);
    vi.resetModules();
    dbm = await import('../database');
    dbm.initDB();
    db = dbm.getDb();
    hubModule = await import('../sync-hub');
    hubModule.ensureHubDeviceId();
    token = hubModule.getPairingToken();
    shared = await import('@shega/shared');

    const { SyncHub } = hubModule;
    server = new SyncHub();
    server.start(port);
    baseUrl = `http://127.0.0.1:${port}`;

    // initDB already created a default business; give it a known uuid so the
    // credential's businessId is deterministic.
    db.prepare(
      `UPDATE businesses SET uuid = ?, device_id = 'hub', row_version = 1, updated_at = '2026-09-15 08:00:00', is_synced = 1
       WHERE isDefault = 1 ORDER BY id LIMIT 1`
    ).run(BIZ_UUID);
  });

  afterAll(() => {
    try { server?.stop(); } catch {}
    try { db?.close?.(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  });

  function makeJoiner(deviceId: string) {
    const kp = shared.generateDeviceKeyPair(deviceId);
    return {
      kp,
      joiner: new shared.JoinerAuthenticator({ deviceId: kp.deviceId, publicKey: kp.publicKey, secretKey: kp.secretKey }),
    };
  }

  const post = async (route: string, body: any) => {
    const res = await fetch(`${baseUrl}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) as any };
  };

  /** Issue a credential directly (the join flow itself is covered above). */
  async function credentialFor(deviceId: string, role = 'cashier') {
    const { issueJoinerCredential } = await import('./hub-credentials');
    const j = makeJoiner(deviceId);
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    const credential = issueJoinerCredential({
      businessId: String(bizId),
      deviceId,
      devicePublicKey: j.kp.publicKey,
      role,
    });
    expect(credential).toBeTruthy();
    j.joiner.acceptCredential(credential!);
    // `joiner` is the authenticator itself (j.joiner), not the wrapper.
    return { credential: credential!, joiner: j.joiner };
  }

  it('challenge → verify → grant → pull succeeds without the pairing token', async () => {
    const { credential, joiner } = await credentialFor('p3http-happy-1', 'manager');

    const ch = await post('/sync/auth/challenge', { deviceId: 'p3http-happy-1', credential });
    expect(ch.status).toBe(200);
    expect(ch.body.challenge.sessionId).toBeTruthy();
    expect(ch.body.challenge.verifierPublicKey).toBe(credential.issuerPublicKey);

    const proof = joiner.answer(ch.body.challenge);
    const vf = await post('/sync/auth/verify', { deviceId: 'p3http-happy-1', credential, proof });
    expect(vf.status).toBe(200);
    expect(vf.body.role).toBe('manager');
    expect(typeof vf.body.accessToken).toBe('string');
    // 192 bits of CSPRNG entropy, not a short human-typable secret.
    expect(vf.body.accessToken.length).toBeGreaterThanOrEqual(32);

    // The grant — and only the grant — authorises the pull.
    const pullRes = await fetch(`${baseUrl}/sync/pull?device=p3http-happy-1&since=0&token=${encodeURIComponent(vf.body.accessToken)}`);
    expect(pullRes.status).toBe(200);
    expect(((await pullRes.json()) as { ok?: boolean }).ok).toBe(true);
  });

  it('a grant is single-use: the same token cannot be replayed', async () => {
    const { credential, joiner } = await credentialFor('p3http-replay-1');
    const ch = await post('/sync/auth/challenge', { deviceId: 'p3http-replay-1', credential });
    const vf = await post('/sync/auth/verify', {
      deviceId: 'p3http-replay-1', credential, proof: joiner.answer(ch.body.challenge),
    });
    const grant = vf.body.accessToken;

    const first = await fetch(`${baseUrl}/sync/pull?device=p3http-replay-1&since=0&token=${encodeURIComponent(grant)}`);
    expect(first.status).toBe(200);
    // Second use of the same grant must fail, or a captured one is a standing
    // credential rather than a one-shot.
    const second = await fetch(`${baseUrl}/sync/pull?device=p3http-replay-1&since=0&token=${encodeURIComponent(grant)}`);
    expect(second.status).toBe(403);
  });

  it('a grant is bound to one device and cannot be spent by another', async () => {
    const { credential, joiner } = await credentialFor('p3http-scope-1');
    const ch = await post('/sync/auth/challenge', { deviceId: 'p3http-scope-1', credential });
    const vf = await post('/sync/auth/verify', {
      deviceId: 'p3http-scope-1', credential, proof: joiner.answer(ch.body.challenge),
    });
    const grant = vf.body.accessToken;

    // Same grant, a different device id: must not authorise.
    const res = await fetch(`${baseUrl}/sync/pull?device=p3http-someone-else&since=0&token=${encodeURIComponent(grant)}`);
    expect(res.status).toBe(403);
  });

  it('rejects a challenge for a device the hub never approved', async () => {
    const j = makeJoiner('p3http-stranger-1');
    const res = await post('/sync/auth/challenge', {
      deviceId: 'p3http-stranger-1',
      credential: { deviceId: 'p3http-stranger-1', devicePublicKey: j.kp.publicKey, signature: 'nope', businessId: '1' },
    });
    expect(res.status).toBe(403);
    expect(res.body.reason).toBe('no_credential');
  });

  it('rejects a tampered credential (role escalated after signing)', async () => {
    const { credential } = await credentialFor('p3http-tamper-1', 'cashier');
    const res = await post('/sync/auth/challenge', {
      deviceId: 'p3http-tamper-1',
      credential: { ...credential, role: 'admin' },
    });
    expect(res.status).toBe(403);
    // Same signature, different body: only verifying the presented body catches
    // this, which is why the hub does not settle for a signature comparison.
    expect(res.body.reason).toBe('bad_signature');
  });

  it('rejects a proof signed by a key that was never approved', async () => {
    const { credential, joiner } = await credentialFor('p3http-wrongkey-1');
    const ch = await post('/sync/auth/challenge', { deviceId: 'p3http-wrongkey-1', credential });
    const genuine = joiner.answer(ch.body.challenge);
    const impostor = makeJoiner('p3http-wrongkey-1');
    const forged = shared.signBytes(impostor.kp.secretKey, shared.decodeBase64Url(genuine.signature)!);
    const res = await post('/sync/auth/verify', {
      deviceId: 'p3http-wrongkey-1',
      credential,
      proof: { ...genuine, signature: forged },
    });
    expect(res.status).toBe(403);
    expect(res.body.reason).toBe('bad_signature');
  });

  it('rejects a replayed proof', async () => {
    const { credential, joiner } = await credentialFor('p3http-replayproof-1');
    const ch1 = await post('/sync/auth/challenge', { deviceId: 'p3http-replayproof-1', credential });
    const proof = joiner.answer(ch1.body.challenge);
    const first = await post('/sync/auth/verify', { deviceId: 'p3http-replayproof-1', credential, proof });
    expect(first.status).toBe(200);

    // Same proof against a new challenge: the session is gone.
    const ch2 = await post('/sync/auth/challenge', { deviceId: 'p3http-replayproof-1', credential });
    const again = await post('/sync/auth/verify', {
      deviceId: 'p3http-replayproof-1', credential, proof: { ...proof, sessionId: ch2.body.challenge.sessionId },
    });
    expect(again.status).toBe(403);
    expect(again.body.reason).toBe('nonce_mismatch');
  });

  it('a revoked device is refused at the challenge step', async () => {
    const { credential } = await credentialFor('p3http-revoked-1');
    const { revokeJoinerCredential } = await import('./hub-credentials');
    revokeJoinerCredential({
      businessId: credential.businessId,
      deviceId: 'p3http-revoked-1',
      credentialSignature: credential.signature,
    });
    const res = await post('/sync/auth/challenge', { deviceId: 'p3http-revoked-1', credential });
    expect(res.status).toBe(403);
    expect(res.body.reason).toBe('revoked');
  });

  it('the legacy pairing token still authorises a pull while both paths are live', async () => {
    // Migration guard for the HTTP path specifically.
    const res = await fetch(`${baseUrl}/sync/pull?device=p3http-legacy-1&since=0&token=${encodeURIComponent(token)}`);
    expect(res.status).toBe(200);
  });
});
