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
                  `timeout waiting for ${type}; saw: [${events.map((e) => e.type).join(', ') || 'nothing'}]`,
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
    await ackP;

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

    // The joiner learns its credential on the status poll.
    const statusP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('DEVICE_JOIN_STATUS', { code, joinerDeviceId: deviceId }, `st-${deviceId}`);
    const status = await statusP;
    joiner.close();
    return { credential: status.payload.credential, joiner: j, code };
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
    const { credential, joiner } = await approveJoiner('p3-happy-1');
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

    const okP = c.next('AUTH_OK');
    c.send('AUTH_PROOF', joiner.joiner.answer(challenge.payload), 'ap1');
    const ok = await okP;
    expect(ok.payload.role).toBe('manager');
    expect(ok.payload.businessId).toBe(credential.businessId);

    // And the socket is now usable: PAIR_RESPONSE arrives.
    const pairRespP = c.next('PAIR_RESPONSE');
    expect((await pairRespP).payload.success).toBe(true);
    c.close();
  });

  it('rejects a device the owner never approved', async () => {
    const c = await openClient();
    const errP = c.next('ERROR');
    c.send('PAIR_REQUEST', {
      device_id: 'p3-stranger',
      name: 'stranger',
      platform: 'mobile',
      credential: { deviceId: 'p3-stranger', devicePublicKey: 'x', signature: 'y', businessId: '1' },
    }, 'pr-stranger');
    const err = await errP;
    expect(err.payload.code).toBe('PAIR_FAILED');
    expect(String(err.payload.message)).toMatch(/no credential found/i);
    c.close();
  });

  it('rejects a tampered credential (role escalated after signing)', async () => {
    const { credential } = await approveJoiner('p3-tamper-1', 'cashier');
    const forged = { ...credential, role: 'admin' };
    const c = await openClient();
    const errP = c.next('ERROR');
    c.send('PAIR_REQUEST', { device_id: 'p3-tamper-1', name: 'tamper', platform: 'mobile', credential: forged }, 'pr-tamper');
    const err = await errP;
    expect(err.payload.code).toBe('PAIR_FAILED');
    // The signature covers the original body, so the swap cannot verify.
    expect(String(err.payload.message)).toMatch(/credential mismatch|bad_signature|untrusted_issuer/i);
    c.close();
  });

  it('rejects a proof signed by a key the owner never approved', async () => {
    const { credential, joiner } = await approveJoiner('p3-wrongkey-1');
    joiner.joiner.acceptCredential(credential);
    const impostor = makeJoiner('p3-wrongkey-1');
    impostor.joiner.acceptCredential(credential);

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

    // Same proof, brand new connection: the session is gone, so it cannot be reused.
    const c2 = await openClient();
    const ch2P = c2.next('AUTH_CHALLENGE');
    c2.send('PAIR_REQUEST', { device_id: 'p3-replay-1', name: 'rp', platform: 'mobile', credential }, 'pr-rp2');
    await ch2P;
    const denyP = c2.next('AUTH_DENY');
    c2.send('AUTH_PROOF', proof, 'ap-rp2');
    const deny = await denyP;
    expect(deny.payload.reason).toBe('unknown_or_expired_session');
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
    const errP = c.next('ERROR');
    c.send('PAIR_REQUEST', { device_id: 'p3-revoke-1', name: 'rv', platform: 'mobile', credential }, 'pr-rv');
    const err = await errP;
    expect(err.payload.code).toBe('PAIR_FAILED');
    expect(String(err.payload.message)).toMatch(/no credential found|revoked/i);
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
});
