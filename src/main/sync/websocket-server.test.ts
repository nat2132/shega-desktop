/**
 * Integration tests for the WebSocket sync path (mobile wsSyncClient ↔ desktop
 * WsSyncServer). Exercises the real server bound to an ephemeral port with
 * real `ws` clients, covering the exact message exchange the phone performs:
 *
 *   - PAIR_REQUEST  → PAIR_RESPONSE (token REQUIRED, hubId, no token echo)
 *   - empty/wrong token  → PAIR_FAILED
 *   - unpaired joiner resolves + submits a join request with only the code
 *   - unpaired P2P_SIGNAL is refused (NOT_PAIRED)
 *   - SYNC_PUSH     → SYNC_ACK (phone-shaped camelCase payload lands in SQLite)
 *   - DATA_CHANGED  : a paired second client is notified the moment a push applies
 *   - SYNC_PULL     → SYNC_CHANGES (mobile-shaped payload comes back with UUIDs)
 *   - checksum skip : bad-checksum change is ACK'd as skipped, never written
 *
 * Uses the same throwaway-DB harness as sync-hub.test.ts; the desktop app DB
 * is never touched.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createHash } from 'crypto';
import WebSocket from 'ws';
import { p2pSync } from './p2p-sync-manager';
import { mdnsDiscovery } from './discovery';

vi.mock('electron', () => {
  const tmp = () => process.env.SHEGA_E2E_TMP || process.cwd();
  return {
    app: { isPackaged: false, getPath: () => tmp(), on: () => {}, once: () => {}, emit: () => true, removeListener: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  };
});

describe('Sync hub — WebSocket path (real WsSyncServer + ws clients)', () => {
  let dbm: any;
  let db: any;
  let hubModule: any;
  let server: any;
  let tmp: string;
  let token: string;
  let wsUrl: string;
  const wsPort = 59744;
  let seq = 0;

  const BIZ_UUID = '3f2b6c1e-8f10-4c6d-9c3a-222222222222';
  const CAT_UUID = 'a1c4e7f2-0000-4000-8000-333333333331';

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-ws-e2e-'));
    process.env.SHEGA_E2E_TMP = tmp;
    process.chdir(tmp);
    vi.resetModules();
    hubModule = await import('../sync-hub');
    dbm = await import('../database');
    const lateTables: Record<string, string[]> = {
      orders: ['id', 'businessId', 'orderNumber', 'customerName', 'customerPhone', 'notes', 'status', 'totalAmount', 'createdBy', 'createdByName', 'createdAt', 'convertedAt', 'convertedBy', 'cancelledAt', 'cancelledBy', 'cancelReason', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      order_items: ['id', 'orderId', 'itemId', 'itemName', 'quantity', 'unit', 'unitType', 'unitPrice', 'totalPrice', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      order_history: ['id', 'orderId', 'status', 'changedBy', 'notes', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      subscriptions: ['id', 'businessId', 'planId', 'tier', 'status', 'startedAt', 'expiresAt', 'trialStartedAt', 'trialEndsAt', 'isTrial', 'autoRenew', 'createdAt', 'updatedAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      notifications: ['id', 'type', 'title', 'message', 'category', 'priority', 'isRead', 'groupKey', 'actionUrl', 'actionLabel', 'expiresAt', 'businessId', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      employees: ['id', 'businessId', 'employeeCode', 'firstName', 'lastName', 'phone', 'email', 'address', 'emergencyContact', 'gender', 'dateOfBirth', 'roleId', 'department', 'warehouseId', 'isActive', 'employmentStatus', 'avatar', 'hireDate', 'notes', 'createdAt', 'updatedAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
    };
    const preCreate = Object.entries(lateTables)
      .map(([table, cols]) => {
        const defs = cols.map((c) => (c === 'id' ? `${c} INTEGER PRIMARY KEY AUTOINCREMENT` : `${c} TEXT`));
        return `CREATE TABLE IF NOT EXISTS ${table} (${defs.join(', ')});`;
      })
      .join('\n');
    dbm.getDb().exec(preCreate);
    dbm.initDB();
    const db2 = dbm.getDb();
    const missingSync = ['is_deleted', 'deleted_at', 'is_synced', 'uuid', 'device_id', 'row_version', 'updated_at'];
    for (const t of hubModule.SHARED_TABLES) {
      const cols = (db2.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
      for (const col of missingSync) {
        const def = col === 'is_deleted' || col === 'is_synced' ? 'INTEGER DEFAULT 1' : 'TEXT';
        if (!cols.includes(col)) { try { db2.exec(`ALTER TABLE ${t} ADD COLUMN ${col} ${def}`); } catch {} }
      }
    }
    db = dbm.getDb();
    hubModule.ensureHubDeviceId();
    token = hubModule.getPairingToken();

    const { WsSyncServer } = await import('./websocket-server');
    server = new WsSyncServer();
    server.start(wsPort);
    wsUrl = `ws://127.0.0.1:${wsPort}`;

    db.prepare(
      `INSERT INTO businesses (businessName, storeName, currency, isDefault, uuid, device_id, row_version, updated_at, is_synced)
       VALUES ('E2E WS', 'E2E WS Store', 'ETB', 1, ?, 'hub', 1, '2026-09-15 08:00:00', 1)`
    ).run(BIZ_UUID);
  });

  afterAll(() => {
    try { server?.stop(); } catch {}
    try { db?.close?.(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  });

  /** Minimal request/response WS client shaped like the phone's wsSyncClient. */
  function openPhone(deviceId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const pending = new Map<string, (payload: any) => void>();
      const events: any[] = [];
      ws.on('open', () => {
        const send = (type: string, payload: any, requestId?: string) => {
          const id = requestId || `r${++seq}`;
          return new Promise<any>((res) => {
            pending.set(id, (p) => res({ ...p, _requestId: id }));
            ws.send(JSON.stringify({ type, payload, requestId: id }));
          });
        };
        const phone = {
          ws,
          events,
          next: (type: string, timeoutMs = 4000) =>
            new Promise<any>((res, rej) => {
              const t = setTimeout(() => rej(new Error(`timeout waiting for ${type}`)), timeoutMs);
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
          send,
          close: () => ws.close(),
        };
        resolve(phone);
      });
      ws.on('error', reject);
    });
  }

  async function pair(phone: any, deviceId: string): Promise<void> {
    const p = phone.next('PAIR_RESPONSE');
    phone.send('PAIR_REQUEST', { device_id: deviceId, name: deviceId, token });
    const resp = await p;
    expect(resp.payload.success).toBe(true);
    expect(resp.payload.hubId).toBeTruthy();
  }

  it('PAIR_REQUEST requires the hub token; PAIR_RESPONSE never echoes it', async () => {
    const phone = await openPhone('ws-phone-A');
    await pair(phone, 'ws-phone-A');
    expect(phone.events[0].payload.schemaVersion).toBe(21);
    expect(phone.events[0].payload.pairingToken).toBeUndefined();
    phone.close();
  });

  it('PAIR_REQUEST with a missing or wrong token is rejected', async () => {
    const bad = await openPhone('ws-phone-TOKLESS');
    const rejP = bad.next('ERROR');
    bad.send('PAIR_REQUEST', { device_id: 'ws-phone-TOKLESS', name: 'no token' });
    const rej = await rejP;
    expect(rej.payload.code).toBe('PAIR_FAILED');

    const wrong = await openPhone('ws-phone-BADTOK');
    const wrongP = wrong.next('ERROR');
    wrong.send('PAIR_REQUEST', { device_id: 'ws-phone-BADTOK', name: 'bad token', token: 'WRONG-TOKEN' });
    const wrongResp = await wrongP;
    expect(wrongResp.payload.code).toBe('PAIR_FAILED');
    bad.close();
    wrong.close();
  });

  it('Unpaired joiner can resolve + submit a join request using only the invite code', async () => {
    // Seed the hub with an open invitation (like a published invite).
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    const inviteCode = 'K2M-4NP-QW8';
    db.prepare(
      `INSERT INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
       VALUES ('inv-sec-1', ?, ?, 'Security E2E', 'cashier', 'desktop', NULL, NULL, 'open', ?)`
    ).run(String(bizId), inviteCode, new Date().toISOString());

    const joiner = await openPhone('ws-phone-JOIN');
    // Joiner is NOT paired — resolve must still work.
    const resolveP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('INVITE_RESOLVE', { code: inviteCode });
    const resolved = await resolveP;
    expect(resolved.payload.invitation).toBeTruthy();
    expect(resolved.payload.invitation.code.toUpperCase()).toBe(inviteCode);

    // And submit must stage the request for the invite's business.
    const ackP = joiner.next('DEVICE_JOIN_ACK');
    joiner.send('DEVICE_JOIN_SUBMIT', {
      code: inviteCode,
      joinerDeviceId: 'ws-phone-JOIN',
      joinerName: 'New Joiner',
      joinerUser: 'joiner@e2e',
      role: 'cashier',
      platform: 'mobile',
    });
    const ack = await ackP;
    expect(ack.payload.status).toBe('pending');

    const row = db.prepare('SELECT * FROM device_requests WHERE joiner_device_id = ?').get('ws-phone-JOIN') as any;
    expect(row).toBeTruthy();
    expect(row.business_id).toBe(String(bizId));

    // J1: the submit also surfaces the joiner as a *pending roster device* so
    // the desktop owner's BusinessCenter "Pending device approvals" list and
    // the mobile owner's Connected Devices both show it before any decision.
    const dev = db.prepare('SELECT * FROM devices WHERE device_id = ?').get('ws-phone-JOIN') as any;
    expect(dev).toBeTruthy();
    expect(dev.status).toBe('pending');
    expect(Number(dev.businessId)).toBe(bizId);
    expect(dev.uuid).toBe('ws-phone-JOIN');
    joiner.close();
  });

  it('J1: approving a join provisions the member user + active device, consumes the invite, grants the pairing token', async () => {
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    const inviteCode = 'J1P-000-001';
    db.prepare(
      `INSERT INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
       VALUES ('inv-j1p', ?, ?, 'J1 Provision', 'cashier', 'mobile', NULL, NULL, 'open', ?)`
    ).run(String(bizId), inviteCode, new Date().toISOString());

    // Unpaired joiner submits (same as the real phone flow).
    const joiner = await openPhone('ws-phone-J1P');
    const ackP = joiner.next('DEVICE_JOIN_ACK');
    joiner.send('DEVICE_JOIN_SUBMIT', {
      code: inviteCode,
      joinerDeviceId: 'ws-phone-J1P',
      joinerName: 'J1 Device',
      joinerUser: 'j1p-user@e2e',
      role: 'cashier',
      platform: 'mobile',
    }, 'rj1-submit');
    const ack = await ackP;
    expect(ack.payload.status).toBe('pending');

    const pendingDev = db.prepare("SELECT * FROM devices WHERE device_id = ? AND status = 'pending'").get('ws-phone-J1P') as any;
    expect(pendingDev).toBeTruthy();

    // A paired owner decides: approved.
    const owner = await openPhone('ws-phone-OWN1');
    await pair(owner, 'ws-phone-OWN1');
    const reqId = (db.prepare("SELECT id FROM device_requests WHERE joiner_device_id = ? AND status = 'pending'").get('ws-phone-J1P') as any)?.id;
    const decideP = owner.next('DEVICE_JOIN_RESPONSE');
    owner.send('DEVICE_JOIN_DECIDE', { requestId: reqId, decision: 'approved' }, 'rj1-decide');
    const decided = await decideP;
    expect(decided.payload.record.status).toBe('approved');

    // Provisioning happened: member user row + active device + invite consumed.
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get('j1p-user@e2e') as any;
    expect(user).toBeTruthy();
    expect(Number(user.businessId)).toBe(bizId);
    expect(user.isOwner).toBe(0);
    const dev = db.prepare('SELECT * FROM devices WHERE device_id = ?').get('ws-phone-J1P') as any;
    expect(dev.status).toBe('active');
    expect(Number(dev.userId)).toBe(Number(user.id));
    expect(dev.role).toBe('cashier');
    const invite = db.prepare('SELECT * FROM invitations WHERE id = ?').get('inv-j1p') as any;
    expect(invite.status).toBe('used');

    // The joiner's STATUS poll now reports approved AND carries the hub token
    // so the admitted device can pair/sync on the LAN.
    const statusP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('DEVICE_JOIN_STATUS', { code: inviteCode, joinerDeviceId: 'ws-phone-J1P' }, 'rj1-status');
    const status = await statusP;
    expect(status.payload.record.status).toBe('approved');
    expect(status.payload.pairingToken).toBe(token);

    joiner.close();
    owner.close();
  });

  it('J2: an invite stored with the desktop INTEGER business_id resolves to the canonical business UUID, never the int or a biz- sentinel', async () => {
    // Simulate a desktop-created business: exists by int id, no uuid yet (the
    // 5.7 migration backfilled older rows, but pre-J2 `business:create` inserts
    // ran without one — exactly the origin of the business-uuid split).
    db.prepare("INSERT INTO businesses (id, businessName, storeName) VALUES (900, 'J2 Split Biz', 'J2 Store')").run();

    const inviteCode = 'J2S-901-222';
    db.prepare(
      `INSERT INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
       VALUES ('inv-j2s', '900', ?, 'J2 Joiner', 'cashier', 'mobile', NULL, NULL, 'open', ?)`
    ).run(inviteCode, new Date().toISOString());

    const joiner = await openPhone('ws-phone-J2S');
    const resolveP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('INVITE_RESOLVE', { code: inviteCode }, 'rj2-resolve');
    const resolved = await resolveP;
    const invitation = resolved.payload.invitation;

    expect(invitation).toBeTruthy();
    expect(invitation.businessId).not.toBe('900');
    expect(invitation.businessId).not.toMatch(/^biz-/);
    expect(invitation.businessId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(invitation.businessName).toBe('J2 Split Biz');

    // The boundary healed the row: the relay's int→uuid now maps to the SAME uuid.
    const healed = db.prepare('SELECT uuid FROM businesses WHERE id = 900').get() as any;
    expect(healed.uuid).toBe(invitation.businessId);

    // A joiner submitting against it stages the request under the canonical uuid.
    const ackP = joiner.next('DEVICE_JOIN_ACK');
    joiner.send('DEVICE_JOIN_SUBMIT', {
      code: inviteCode,
      joinerDeviceId: 'ws-phone-J2S',
      joinerName: 'J2 Device',
      joinerUser: 'j2-user@e2e',
      role: 'cashier',
      platform: 'mobile',
    }, 'rj2-submit');
    const ack = await ackP;
    expect(ack.payload.status).toBe('pending');
    const row = db.prepare("SELECT business_id FROM device_requests WHERE joiner_device_id = 'ws-phone-J2S'").get() as any;
    expect(row.business_id).toBe(invitation.businessId);

    joiner.close();
  });

  it('J4: approveIncoming persists a discovered desktop peer as an active trusted device + business roster grant (not a broadcast-only placebo)', async () => {
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    p2pSync.start('hub', BIZ_UUID, Number(bizId));

    const fakePeer: any = {
      deviceId: 'desk-two',
      host: '10.0.0.7',
      pairingToken: 'ABC123',
      schemaVersion: 21,
      port: 5757,
      hostname: 'staff-pos-2.local',
      addresses: ['10.0.0.7'],
      capabilities: ['desktop'],
      discoveredAt: Date.now(),
      platform: 'desktop',
    };
    const spy = vi.spyOn(mdnsDiscovery, 'getDiscoveredServices').mockReturnValue([fakePeer]);

    const granted = p2pSync.approveIncoming('Staff POS 2');
    spy.mockRestore();

    expect(granted).toEqual(['desk-two']);

    // Hub pairing registry row (trusted device, business-scoped).
    const reg = db.prepare("SELECT * FROM devices WHERE device_id = 'desk-two'").get() as any;
    expect(reg).toBeTruthy();
    expect(Number(reg.businessId)).toBe(bizId);

    // Business roster row surfaced by Connected Devices; revocable.
    const roster = db.prepare("SELECT * FROM roster_devices WHERE device_id = 'desk-two'").get() as any;
    expect(roster).toBeTruthy();
    expect(roster.status).toBe('active');
    expect(roster.platform).toBe('desktop');
    expect(Number(roster.businessId)).toBe(bizId);
    expect(roster.isPrimary).toBe(0);

    // Idempotent: re-approving must not duplicate the grant.
    const spy2 = vi.spyOn(mdnsDiscovery, 'getDiscoveredServices').mockReturnValue([fakePeer]);
    const again = p2pSync.approveIncoming('Staff POS 2');
    spy2.mockRestore();
    expect(again).toEqual(['desk-two']);
    expect((db.prepare("SELECT COUNT(*) AS c FROM roster_devices WHERE device_id = 'desk-two'").get() as any)?.c).toBe(1);

    // "Enter pairing code": the code resolves to the single peer whose
    // advertised token matches (case-insensitive) — never decorative.
    const spy4 = vi.spyOn(mdnsDiscovery, 'getDiscoveredServices').mockReturnValue([fakePeer]);
    expect(p2pSync.approveIncoming(undefined, 'abc123')).toEqual(['desk-two']);
    expect(p2pSync.approveIncoming(undefined, 'WRONG-CODE')).toEqual([]);
    spy4.mockRestore();

    // No desktop peers → no-op ([]), never an error.
    const spy3 = vi.spyOn(mdnsDiscovery, 'getDiscoveredServices').mockReturnValue([]);
    expect(p2pSync.approveIncoming()).toEqual([]);
    spy3.mockRestore();
  });

  it('J5: an unpaired joiner claims a desktop SHG user-invite; the owner approving it grants the pairing token + materializes the user', async () => {
    const bizId = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id;
    const { createUserInvite, decideUserInvite } = await import('./user-invites');
    const inv = createUserInvite(bizId, { suggestedRole: 'cashier' });
    expect(inv.code.startsWith('SHG-')).toBe(true);

    const joiner = await openPhone('ws-phone-J5S');

    // Claim (unpaired — the code is the ticket, same as DEVICE_JOIN).
    const claimP = joiner.next('INVITE_RESPONSE');
    joiner.send('INVITE_CLAIM', { code: inv.code, name: 'J5 Hana', joinerDeviceId: 'ws-phone-J5S' }, 'rj5-claim');
    const claim = await claimP;
    expect(claim.payload.invite.status).toBe('pending');
    expect(claim.payload.invite.businessId).toBe(BIZ_UUID);
    expect(claim.payload.invite.businessName).toBe('E2E WS');

    // Owner approves (desktop Teams → Add User review).
    decideUserInvite(String(claim.payload.invite.id), 'approved', { role: 'cashier' });

    // Joiner polls → approved + hub pairing credential (so it can pair/sync).
    const stP = joiner.next('INVITE_RESPONSE');
    joiner.send('INVITE_STATUS', { code: inv.code }, 'rj5-status');
    const st = await stP;
    expect(st.payload.invite.status).toBe('approved');
    expect(st.payload.invite.pairingToken).toBe(token);

    // The approved join materialized the user inside the target business.
    const admin = db.prepare("SELECT * FROM admins WHERE businessId = ? AND name = ?").get(bizId, 'J5 Hana') as any;
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('cashier');
    expect(admin.pin).toBe('');

    joiner.close();
  });

  it('Unpaired P2P_SIGNAL is refused (NOT_PAIRED)', async () => {
    const rogue = await openPhone('ws-phone-ROGUE');
    const errP = rogue.next('ERROR');
    rogue.send('P2P_SIGNAL', { to: 'somedevice', signal: { type: 'offer', sdp: 'x' } });
    const err = await errP;
    expect(err.payload.code).toBe('NOT_PAIRED');
    rogue.close();
  });

  it('PAIR_REQUEST with a missing or wrong token is rejected', async () => {
    const missing = await openPhone('ws-phone-TOKLESS');
    const r1P = missing.next('ERROR');
    missing.send('PAIR_REQUEST', { device_id: 'ws-phone-TOKLESS', name: 'no token' });
    const r1 = await r1P;
    expect(r1.payload.code).toBe('PAIR_FAILED');
    expect(r1.payload.message).toMatch(/token/i);

    const bad = await openPhone('ws-phone-BADTOK');
    const r2P = bad.next('ERROR');
    bad.send('PAIR_REQUEST', { device_id: 'ws-phone-BADTOK', name: 'bad token', token: 'DEFINITELY-NOT-IT' });
    const r2 = await r2P;
    expect(r2.payload.code).toBe('PAIR_FAILED');
    missing.close();
    bad.close();
  });

  it('Unpaired joiner can resolve + submit a join request using only the invite code', async () => {
    const bizId = String((db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(BIZ_UUID) as any)?.id);
    db.prepare(
      `INSERT INTO invitations (id, business_id, code, name, role, platform, expires_at, status, created_at)
       VALUES ('inv-e2e-1', ?, 'K2M-4NP-QW8', 'E2E Invite', 'cashier', 'desktop', NULL, 'open', '2026-09-15T08:00:00.000Z')`
    ).run(bizId);

    const joiner = await openPhone('ws-phone-JOIN');
    const resolveP = joiner.next('DEVICE_JOIN_RESPONSE');
    joiner.send('INVITE_RESOLVE', { code: 'K2M-4NP-QW8' }, 'rjoin-resolve');
    const resolved = await resolveP;
    expect(resolved.payload.invitation).toBeTruthy();
    expect(resolved.payload.invitation.code).toMatch(/K2M-4NP-QW8/i);

    const ackP = joiner.next('DEVICE_JOIN_ACK');
    joiner.send('DEVICE_JOIN_SUBMIT', {
      code: 'K2M-4NP-QW8',
      joinerDeviceId: 'ws-phone-JOIN',
      joinerName: 'Join E2E',
      joinerUser: 'join-user@e2e',
      role: 'cashier',
      platform: 'mobile',
    }, 'rjoin-submit');
    const ack = await ackP;
    expect(ack.payload.requestId).toBeTruthy();
    expect(ack.payload.status).toBe('pending');

    // The request is staged for the business the invite resolves to, even
    // though the joiner never supplied a businessId.
    const req = db.prepare('SELECT * FROM device_requests WHERE joiner_device_id = ? ORDER BY created_at DESC LIMIT 1').get('ws-phone-JOIN') as any;
    expect(req).toBeTruthy();
    expect(String(req.business_id)).toBe(bizId);
    joiner.close();
  });

  it('P2P_SIGNAL from an unpaired socket is refused', async () => {
    const rogue = await openPhone('ws-phone-ROGUE');
    const errP = rogue.next('ERROR');
    rogue.send('P2P_SIGNAL', { to: 'whoever', signal: { type: 'offer', sdp: 'x' } }, 'rrogue');
    const err = await errP;
    expect(err.payload.code).toBe('NOT_PAIRED');
    rogue.close();
  });

  it('SYNC_PUSH applies a phone-shaped change; SYNC_ACK reports it', async () => {
    const phone = await openPhone('ws-phone-B');
    await pair(phone, 'ws-phone-B');
    const ackP = phone.next('SYNC_ACK');
    phone.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: CAT_UUID,
        op: 'INSERT',
        client_seq: 41,
        payload: {
          businessId: BIZ_UUID,
          name: 'WS Snacks',
          is_deleted: 0,
          uuid: CAT_UUID,
          created_at: '2026-09-15T10:00:00.000Z',
          updated_at: '2026-09-15T10:00:00.000Z',
        },
      }],
      client_seq: 41,
    }, 'rpush1');
    const ack = await ackP;
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0]).toMatchObject({ client_seq: 41, status: 'applied' });

    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(CAT_UUID) as any;
    expect(row).toBeTruthy();
    expect(row.name).toBe('WS Snacks');
    expect(row.device_id).toBe('ws-phone-B');
    phone.close();
  });

  it('A paired second client receives DATA_CHANGED when a push applies', async () => {
    const observer = await openPhone('ws-phone-C');
    await pair(observer, 'ws-phone-C');

    const producer = await openPhone('ws-phone-D');
    await pair(producer, 'ws-phone-D');

    const changed = observer.next('DATA_CHANGED');
    const ackP = producer.next('SYNC_ACK');
    const otherUuid = 'a1c4e7f2-0000-4000-8000-444444444444';
    producer.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: otherUuid,
        op: 'INSERT',
        client_seq: 50,
        payload: {
          businessId: BIZ_UUID,
          name: 'WS Drinks',
          is_deleted: 0,
          uuid: otherUuid,
          created_at: '2026-09-15T11:00:00.000Z',
          updated_at: '2026-09-15T11:00:00.000Z',
        },
      }],
      client_seq: 50,
    }, 'rpush2');
    await ackP;

    const dc = await changed;
    expect(dc.type).toBe('DATA_CHANGED');
    expect(typeof dc.payload.serverSeq).toBe('number');
    expect(dc.payload.serverSeq).toBeGreaterThan(0);
    observer.close();
    producer.close();
  });

  it('SYNC_PULL since=0 returns the snapshot in mobile shape (UUID businessId)', async () => {
    const phone = await openPhone('ws-phone-E');
    await pair(phone, 'ws-phone-E');
    const changesP = phone.next('SYNC_CHANGES');
    phone.send('SYNC_PULL', { since: 0 }, 'rpull1');
    const resp = await changesP;
    expect(resp.payload.snapshot).toBe(true);
    const cat = (resp.payload.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(cat).toBeTruthy();
    expect(cat.payload.businessId).toBe(BIZ_UUID);
    phone.close();
  });

  it('Delta pull after the snapshot returns only newer rows', async () => {
    const phone = await openPhone('ws-phone-F');
    await pair(phone, 'ws-phone-F');
    const changesP = phone.next('SYNC_CHANGES');
    phone.send('SYNC_PULL', { since: 999999 }, 'rpull2');
    const resp = await changesP;
    const dup = (resp.payload.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(dup).toBeUndefined();
    phone.close();
  });

  function phoneChecksum(change: {
    entity: string;
    entity_uuid: string;
    op: string;
    payload: Record<string, any>;
  }): string {
    const canonical = `${change.entity}|${change.entity_uuid}|${change.op}|${JSON.stringify(change.payload)}`;
    return createHash('sha256').update(canonical).digest('hex');
  }

  it('A change with a phone-computed checksum is accepted (applied, not skipped)', async () => {
    const phone = await openPhone('ws-phone-CHK');
    await pair(phone, 'ws-phone-CHK');
    const ackP = phone.next('SYNC_ACK');
    const goodUuid = 'a1c4e7f2-0000-4000-8000-666666666666';
    const payload = {
      businessId: BIZ_UUID,
      name: 'WS Checked Snacks',
      is_deleted: 0,
      uuid: goodUuid,
      created_at: '2026-09-15T12:30:00.000Z',
      updated_at: '2026-09-15T12:30:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'categories', entity_uuid: goodUuid, op: 'INSERT', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [{ entity: 'categories', entity_uuid: goodUuid, op: 'INSERT', client_seq: 70, checksum, payload }],
        client_seq: 70,
      },
      'rpush-chk'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(goodUuid) as any;
    expect(row).toBeTruthy();
    expect(row.name).toBe('WS Checked Snacks');
    phone.close();
  });

  it('Phone-shaped UPDATE subscriptions with businessId null lands on default business (was NOT NULL error)', async () => {
    const phone = await openPhone('ws-phone-SUB');
    await pair(phone, 'ws-phone-SUB');
    const ackP = phone.next('SYNC_ACK');
    const subUuid = 'a1c4e7f2-0000-4000-8000-777777777777';
    const payload = {
      plan: 'premium',
      planId: null,
      tier: 'premium',
      status: 'active',
      businessId: null, // phone rows predating the multi-business model
      startedAt: '2026-09-15T09:00:00.000Z',
      expiresAt: '2026-09-16T09:00:00.000Z',
      trialStartedAt: null,
      trialEndsAt: null,
      isTrial: 0,
      autoRenew: 1,
      currency: 'ETB',
      is_deleted: 0,
      uuid: subUuid,
      created_at: '2026-09-15T08:00:00.000Z',
      updated_at: '2026-09-15T09:00:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [
          { entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', client_seq: 80, checksum, payload },
        ],
        client_seq: 80,
      },
      'rpush-sub'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(subUuid) as any;
    expect(row).toBeTruthy();
    expect(row.tier).toBe('premium');
    expect(row.status).toBe('active');
    // businessId must be resolved to the hub's default business, not null
    expect(Number(row.businessId)).toBe(db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get()?.id);
    phone.close();
  });

  it('A phone re-push of the same subscriptions row with null businessId is idempotent (no NOT NULL error)', async () => {
    const phone = await openPhone('ws-phone-SUB2');
    await pair(phone, 'ws-phone-SUB2');
    const ackP = phone.next('SYNC_ACK');
    const subUuid = 'a1c4e7f2-0000-4000-8000-777777777777';
    const payload = {
      plan: 'premium',
      planId: null,
      tier: 'premium',
      status: 'expired',
      businessId: null,
      startedAt: '2026-09-15T09:00:00.000Z',
      expiresAt: '2026-09-16T09:00:00.000Z',
      trialStartedAt: null,
      trialEndsAt: null,
      isTrial: 0,
      autoRenew: 1,
      currency: 'ETB',
      is_deleted: 0,
      uuid: subUuid,
      created_at: '2026-09-15T08:00:00.000Z',
      updated_at: '2026-09-15T10:00:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [
          { entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', client_seq: 81, checksum, payload },
        ],
        client_seq: 81,
      },
      'rpush-sub2'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(subUuid) as any;
    expect(row).toBeTruthy();
    expect(row.status).toBe('expired');
    expect(Number(row.businessId)).toBe(db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get()?.id);
    phone.close();
  });

  it('A change with an invalid checksum is ACK skipped, never written', async () => {
    const phone = await openPhone('ws-phone-G');
    await pair(phone, 'ws-phone-G');
    const ackP = phone.next('SYNC_ACK');
    const badUuid = 'a1c4e7f2-0000-4000-8000-555555555555';
    phone.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: badUuid,
        op: 'INSERT',
        client_seq: 60,
        checksum: 'deadbeef',
        payload: {
          businessId: BIZ_UUID,
          name: 'Should Not Land',
          is_deleted: 0,
          uuid: badUuid,
          created_at: '2026-09-15T12:00:00.000Z',
          updated_at: '2026-09-15T12:00:00.000Z',
        },
      }],
      client_seq: 60,
    }, 'rpush3');
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(1);
    expect(ack.payload.results[0].status).toBe('skipped');
    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(badUuid) as any;
    expect(row).toBeUndefined();
    phone.close();
  });
});