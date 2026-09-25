/* Employee QR pairing (backend half for the Desktop hub).
 *
 * The Desktop has no JWT by default (cloud sync uses device-key auth), so pairing
 * management requires linking the business' Shega account (email + password) once.
 * That grants a JWT used ONLY for the /api/sync/pairing/* endpoints (invite, list,
 * approve/reject, revoke). Tokens are stored in the local settings table; nothing
 * account-scoped is shipped elsewhere.
 */
import { ipcMain } from 'electron';
import QRCode from 'qrcode';
import crypto from 'crypto';
import db from './database';
import { ensureHubDeviceId } from './sync-hub';

const DEFAULT_BASE = 'https://shega-api-dah3.onrender.com';

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}
function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function getDefaultBusinessId(): number | null {
  try {
    const row = db.prepare('SELECT id FROM businesses WHERE isDefault = 1 ORDER BY id LIMIT 1').get() as any;
    if (row?.id != null) return Number(row.id);
    const first = db.prepare('SELECT id FROM businesses ORDER BY id LIMIT 1').get() as any;
    return first?.id != null ? Number(first.id) : null;
  } catch {
    return null;
  }
}

function getBaseUrl(): string {
  return (getSetting('cloud_sync_url') || process.env.SHEGA_API_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

/** Normalize an invite code so dashless/pastable variants still match. */
function normalizeCode(code: string): string {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
/** SQL fragment that compares a stored `code` column format-insensitively. */
const CODE_EQ = "replace(replace(upper(coalesce(code,'')), '-', ''), ' ', '') = ?";

// ── LAN pairing session ─────────────────────────────────────────────────────
// The code alone cannot accept an invite: the join request must go to the SAME
// hub that published the code, over that hub's transport (mobile owner = TCP
// 5759, desktop owner = HTTP 5757). A "session" records which hub a discovered
// invite belongs to so lookup → accept → status → activate all target that hub
// instead of a stale/missing local row or an unrelated cloud record ("invitation
// not found"). The active session is persisted so status/activate survive
// restarts.
interface JoinSession {
  host: string;
  platform: 'mobile' | 'desktop';
  port: number;
  businessId?: string;
  businessName?: string;
}

const JOIN_PORTS: Record<JoinSession['platform'], number> = { mobile: 5759, desktop: 5757 };

function saveJoinSession(session: JoinSession): void {
  setSetting('join_session_host', session.host);
  setSetting('join_session_platform', session.platform);
  setSetting('join_session_port', String(session.port));
  if (session.businessId) setSetting('join_session_business_id', session.businessId);
  if (session.businessName) setSetting('join_session_business_name', session.businessName);
}

function loadJoinSession(): JoinSession | null {
  const host = getSetting('join_session_host');
  if (!host) return null;
  const platform = (getSetting('join_session_platform') || 'desktop') as JoinSession['platform'];
  return {
    host,
    platform,
    port: Number(getSetting('join_session_port') || JOIN_PORTS[platform]),
    businessId: getSetting('join_session_business_id') ?? undefined,
    businessName: getSetting('join_session_business_name') ?? undefined,
  };
}

/** Resolve an invite code against a specific discovered owner hub. */
async function resolveInviteOnSession(session: JoinSession, code: string): Promise<any | null> {
  try {
    if (session.platform === 'mobile') {
      const { probeMobileHubJoin } = await import('./sync/mobile-join-client');
      const res = await probeMobileHubJoin(
        { host: session.host, addresses: [session.host], port: session.port, platform: 'mobile' } as any,
        code,
      );
      if (res) return res;
    } else {
      const { probeDesktopHubJoin } = await import('./sync/desktop-hub-join');
      const res = await probeDesktopHubJoin({ host: session.host, port: session.port }, code);
      if (res) return res;
    }
  } catch { /* hub unreachable or invite already consumed */ }
  return null;
}

/** Submit a join request to the owner hub identified by a session. */
async function submitJoinOnSession(session: JoinSession, payload: any): Promise<any> {
  if (session.platform === 'mobile') {
    const { submitJoinToMobileHub } = await import('./sync/mobile-join-client');
    return submitJoinToMobileHub(
      { host: session.host, addresses: [session.host], port: session.port, platform: 'mobile' } as any,
      payload,
    );
  }
  const { submitJoinToDesktopHub } = await import('./sync/desktop-hub-join');
  return submitJoinToDesktopHub({ host: session.host, port: session.port }, payload);
}

/** Poll the approval decision from the owner hub identified by a session. */
async function pollJoinStatusOnSession(session: JoinSession, code: string, joinerDeviceId: string): Promise<any> {
  if (session.platform === 'mobile') {
    const { pollJoinStatusOnMobileHub } = await import('./sync/mobile-join-client');
    return pollJoinStatusOnMobileHub(
      { host: session.host, addresses: [session.host], port: session.port, platform: 'mobile' } as any,
      code,
      joinerDeviceId,
    );
  }
  const { pollJoinStatusOnDesktopHub } = await import('./sync/desktop-hub-join');
  return pollJoinStatusOnDesktopHub({ host: session.host, port: session.port }, code, joinerDeviceId);
}

/**
 * Every owner hub currently visible on the LAN (mDNS `shega-pos` browse +
 * HTTP/HELLO port sweep), deduped. Mobile hubs answer on TCP 5759; desktop
 * hubs on HTTP 5757 — platform decides the transport.
 */
async function scanNearbySessions(): Promise<JoinSession[]> {
  const out: JoinSession[] = [];
  const seen = new Set<string>();
  const add = (host: string, platform: JoinSession['platform']) => {
    const h = String(host ?? '').trim();
    if (!h) return;
    const key = `${platform}:${h}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ host: h, platform, port: JOIN_PORTS[platform] });
  };
  try {
    const { mdnsDiscovery } = await import('./sync/discovery');
    const { isMobileHub } = await import('./sync/mobile-hub-client');
    for (const peer of mdnsDiscovery.getDiscoveredServices()) {
      const host = peer.host || peer.addresses?.[0];
      if (!host) continue;
      add(host, isMobileHub(peer) ? 'mobile' : 'desktop');
    }
  } catch { /* discovery unavailable */ }
  try {
    const { sweepLan } = await import('./sync/lan-discovery');
    for (const entry of await sweepLan()) {
      add(entry.host, entry.platform === 'mobile' ? 'mobile' : 'desktop');
    }
  } catch { /* sweep is best-effort */ }
  return out;
}

let authPromise: ReturnType<typeof doAuthRequest> | null = null;

async function doAuthRequest(
  path: string,
  body?: any,
  {
    method = 'GET',
    auth = false,
    retried = false,
    tokenKey = 'pairing_access_token',
  }: { method?: string; body?: any; auth?: boolean; retried?: boolean; tokenKey?: string } = {},
): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  let token = auth ? getSetting(tokenKey) : null;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (res.status === 401 && auth && !retried) {
    const refreshKey = tokenKey.replace('_access_', '_refresh_');
    const refreshed = await refreshAuthToken(refreshKey);
    if (refreshed) return doAuthRequest(path, body, { method, body, auth, retried: true, tokenKey });
  }
  if (!res.ok) {
    let msg = data?.detail ?? data?.error ?? (typeof data === 'string' ? data : `HTTP ${res.status}`);
    // A proxied/captive portal 404 returns HTML — never surface that raw.
    if (typeof msg === 'string' && /<!doctype|<html/i.test(msg)) {
      msg = res.status === 404
        ? 'This pairing service is not available on the server.'
        : `Server error (HTTP ${res.status}).`;
    }
    const err: any = new Error(typeof msg === 'object' ? msg.detail ?? JSON.stringify(msg) : String(msg));
    err.status = res.status;
    err.detail = data?.detail ?? null;
    throw err;
  }
  // External pairing requests are unauthenticated shareable lookups.
  return data;
}

async function refreshAuthToken(refreshKey: string): Promise<boolean> {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    try {
      const refresh = getSetting(refreshKey);
      if (!refresh) return false;
      const res = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { access?: string; refresh?: string };
      if (!data?.access) return false;
      const accessKey = refreshKey.replace('_refresh_', '_access_');
      setSetting(accessKey, data.access);
      if (data.refresh) setSetting(refreshKey, data.refresh);
      return true;
    } catch {
      return false;
    } finally {
      authPromise = null;
    }
  })();
  return authPromise;
}

async function refreshPairingToken(): Promise<boolean> {
  return refreshAuthToken('pairing_refresh_token');
}

export function registerPairingCloudHandlers(): void {
  ipcMain.handle('pairing:status', () => {
    const linked = !!getSetting('pairing_access_token');
    return {
      linked,
      email: getSetting('pairing_account_email') ?? null,
      businessName: getSetting('pairing_business_name') ?? null,
    };
  });

  ipcMain.handle('pairing:link-account', async (_e, email: string, password: string) => {
    if (!email?.trim() || !password) throw new Error('Email and password are required');
    const data = await doAuthRequest('/api/auth/login/', { email: email.trim().toLowerCase(), password }, { method: 'POST' });
    const access = data?.access ?? data?.token;
    if (!access) throw new Error('Could not obtain an access token');
    setSetting('pairing_access_token', access);
    if (data?.refresh) setSetting('pairing_refresh_token', data.refresh);
    setSetting('pairing_account_email', email.trim().toLowerCase());
    setSetting('pairing_business_name', String(data?.user?.business_name ?? ''));
    setSetting('pairing_last_error', '');
    return { linked: true, email: email.trim().toLowerCase(), businessName: String(data?.user?.business_name ?? '') };
  });

  ipcMain.handle('pairing:unlink', () => {
    db.prepare("DELETE FROM settings WHERE key LIKE 'pairing_%'").run();
    return { linked: false };
  });

  ipcMain.handle('pairing:list', async () => {
    const res = await doAuthRequest('/api/sync/pairing/', {}, { auth: true });
    return res?.invitations ?? [];
  });

  ipcMain.handle('pairing:invite', async (_e, input: { employeeName?: string; role?: string; register?: string; location?: string }) => {
    const body: Record<string, unknown> = { role: input?.role ?? 'cashier' };
    if (input?.employeeName) body.employee_name = input.employeeName;
    if (input?.register) body.register = input.register;
    if (input?.location) body.location = input.location;
    const invite = await doAuthRequest('/api/sync/pairing/invite/', body, { method: 'POST', auth: true });
    // Settings uses the cloud invite endpoint, but nearby pairing still needs
    // a local beacon and a local resolver row carrying this invite. Without
    // the resolver row, peers can see the beacon but /sync/invitations/resolve
    // rejects the code as "not found".
    try {
      const { startPairingBeaconForInvite } = await import('./sync/pairing-beacon');
      const { publishInvitation } = await import('./sync/device-requests');
      const businessId = invite.business_id ?? invite.businessId ?? getDefaultBusinessId();
      if (businessId && invite.code) {
        publishInvitation({
          id: String(invite.id),
          businessId: String(businessId),
          code: String(invite.code),
          name: invite.employee_name ?? invite.employeeName,
          role: invite.role ?? input?.role,
          platform: 'desktop',
          expiresAt: invite.expires_at ?? invite.expiresAt,
        });
      }
      startPairingBeaconForInvite({
        id: invite.id,
        code: invite.code,
        businessId: businessId ?? 1,
        role: invite.role ?? input?.role,
        expiresAt: invite.expires_at ?? invite.expiresAt,
      });
    } catch (e: any) {
      console.warn('[Discovery] Could not advertise cloud pairing invite:', e?.message);
    }
    return invite;
  });

  ipcMain.handle('pairing:revoke', async (_e, id: number) => {
    const result = await doAuthRequest(`/api/sync/pairing/${id}/revoke/`, {}, { method: 'POST', auth: true });
    try {
      const { pairingBeacon } = await import('./sync/pairing-beacon');
      pairingBeacon.stopPublishing();
    } catch { /* best-effort cleanup */ }
    return result;
  });

  ipcMain.handle('pairing:decide', async (_e, id: number, decision: 'approve' | 'reject', role?: string, permissions?: Record<string, unknown>) => {
    // Approval-time role assignment: the Owner picks Owner/Cashier/Custom when
    // approving. Body stays empty when no override is chosen (invite role wins).
    const body: Record<string, unknown> = {};
    if (role) body.role = role;
    if (permissions && typeof permissions === 'object') body.permissions = permissions;
    // Local (offline-first) path: apply the decision through the hub's join
    // channel — cloud is only a fallback for invites that came from the cloud.
    try {
      const dr = await import('./sync/device-requests');
      const rec = dr.decideDeviceJoinRequest({
        requestId: String(id),
        businessId: '',
        joinerDeviceId: '',
        decision: decision === 'approve' ? 'approved' : 'rejected',
        decidedBy: '',
        assignedRole: role,
        assignedPermissions: permissions,
      } as any);
      if (rec) return rec;
    } catch { /* fall through to cloud for cloud-sourced invites */ }
    return doAuthRequest(`/api/sync/pairing/${id}/${decision}/`, body, { method: 'POST', auth: true });
  });

  // Owner-assigned identity (name + avatar) for a joining member. Applied to
  // the pending/approved join record and materialized user row.
  ipcMain.handle('pairing:assign-identity', async (_e, id: number, identity: { name?: string; avatar?: string | null }) => {
    try {
      const { assignJoinIdentity } = await import('./sync/device-requests');
      return assignJoinIdentity(String(id), identity);
    } catch (e: any) {
      throw new Error(e?.message || 'Could not assign identity');
    }
  });

  ipcMain.handle('pairing:qr-code', async (_e, text: string) => {
    if (!text?.trim()) throw new Error('Nothing to encode');
    return QRCode.toDataURL(text, { width: 340, margin: 2, errorCorrectionLevel: 'M' });
  });

  // --- Join an existing business (Desktop is a full first-class platform) ---
  // Employee joins the owner's business from a fresh/other desktop using the
  // owner's 6-digit code. The employee's own account is linked (login, or signup
  // when they have no Shega account yet), the invite is accepted with THIS
  // machine's hub device id, and the one-time device key issued at accept time
  // becomes the cloud transport credential once the owner approves.
  // LAN resolve → joiner-friendly preview. `session` pins the lookup to ONE
  // discovered hub (the owner whose radar row was picked); without it every
  // visible hub is probed so manual code entry still works.
  const toLookupResult = (inv: any, source: string): any => ({
    business_id: inv.businessId ?? inv.business_id ?? '',
    business_name: inv.businessName ?? inv.business_name ?? 'Business',
    employee_name: inv.name ?? inv.employee_name ?? null,
    role: inv.role ?? 'cashier',
    register: null,
    location: null,
    expires_at: inv.expiresAt ?? inv.expires_at ?? null,
    source,
    invite_id: inv.id ?? inv.invite_id ?? null,
  });

  ipcMain.handle('join:lookup', async (_e, code: string, session?: JoinSession) => {
    const c = String(code ?? '').trim().toUpperCase();
    if (!c) throw new Error('Enter the 6-digit code');
    const n = normalizeCode(c);

    // 1) The discovered owner hub is the source of truth for a pairing beacon
    //    code. Resolving there — not in this device's (empty) store and not on
    //    the cloud — is exactly what fixes "invitation not found": the invite
    //    lives on the owner, and we now talk to the owner directly.
    const pinned = session ?? loadJoinSession();
    if (pinned && session) {
      const inv = await resolveInviteOnSession(pinned, c);
      if (inv) {
        saveJoinSession({ ...pinned, businessId: inv.businessId ?? pinned.businessId, businessName: inv.businessName ?? pinned.businessName });
        return toLookupResult(inv, pinned.platform === 'mobile' ? 'mobile-hub' : 'desktop-hub');
      }
      throw new Error('This invitation is no longer open on the owner\u2019s device. Ask them to open a fresh invite, or pick another nearby device.');
    }

    // 2) Local invitation store — pairing works fully offline. This desktop's
    //    hub keeps both its own user_invites and any invitations published to
    //    it by peers (DEVICE_JOIN.PUBLISH).
    try {
      const local = db.prepare(
        `SELECT * FROM user_invites WHERE ${CODE_EQ} AND status IN ('open','pending') ORDER BY created_at DESC LIMIT 1`
      ).get(n) as any;
      if (local) {
        const biz = db.prepare('SELECT uuid, businessName FROM businesses WHERE id = ?').get(local.business_id) as any;
        return {
          business_id: biz?.uuid ?? String(local.business_id),
          business_name: biz?.businessName ?? `Business ${local.business_id}`,
          employee_name: local.joiner_name ?? null,
          role: local.suggested_role ?? 'cashier',
          register: null,
          location: null,
          expires_at: local.expires_at ?? null,
          source: 'local',
          invite_id: local.id,
        };
      }
      const published = db.prepare(
        `SELECT * FROM invitations WHERE ${CODE_EQ} AND status = 'open' ORDER BY created_at DESC LIMIT 1`
      ).get(n) as any;
      if (published) {
        if (!published.expires_at || published.expires_at > new Date().toISOString()) {
          const biz = db.prepare('SELECT uuid, businessName FROM businesses WHERE id = ?').get(published.business_id) as any;
          return {
            business_id: published.business_id ?? biz?.uuid ?? '',
            business_name: biz?.businessName ?? published.name ?? 'Business',
            employee_name: published.name ?? null,
            role: published.role ?? 'cashier',
            register: null,
            location: null,
            expires_at: published.expires_at ?? null,
            source: 'local',
            invite_id: published.id,
          };
        }
      }
    } catch { /* tables may not exist on a brand-new install */ }

    // 3) Direct probe of every hub currently visible on the LAN (mDNS browse +
    //    port sweep): a phone or desktop that just created the business serves
    //    the DEVICE_JOIN channel on its own hub — no cloud, no prior pairing.
    try {
      for (const peer of await scanNearbySessions()) {
        try {
          const inv = await resolveInviteOnSession(peer, c);
          if (inv) {
            saveJoinSession({ ...peer, businessId: inv.businessId ?? peer.businessId, businessName: inv.businessName ?? peer.businessName });
            return toLookupResult(inv, peer.platform === 'mobile' ? 'mobile-hub' : 'desktop-hub');
          }
        } catch { /* try the next hub */ }
      }
    } catch { /* discovery unavailable */ }

    // 4) Cloud lookup fallback (backend pairing endpoints).
    try {
      return await doAuthRequest('/api/sync/pairing/lookup/', { code: c }, { method: 'POST' });
    } catch (err: any) {
      // The deployed backend does not (yet) ship /api/sync/pairing/*. Never
      // surface that as a generic failure — point the user at the offline path
      // that actually works (same network + invitation published to this hub).
      if (err?.status === 404 || /not available on the server/i.test(String(err?.message ?? ''))) {
        throw new Error(
          "That code isn't available on this device, and the cloud pairing service isn't reachable. " +
          "Make sure the owner's phone is on the same Wi-Fi, connected to this computer as its hub, " +
          'then generate a fresh invite code and try again.'
        );
      }
      throw err;
    }
  });

  ipcMain.handle('join:accept', async (_e, input: { code: string; email: string; password: string; name?: string; deviceName?: string }, session?: JoinSession) => {
    const code = String(input?.code ?? '').trim();
    const email = String(input?.email ?? '').trim().toLowerCase();
    const password = String(input?.password ?? '');
    if (!code || !email || !password) throw new Error('Code, email and password are required');

    // 0) LAN session path (owner discovered on the network — mobile or desktop).
    //    The join request is submitted straight to the owner's hub, the owner
    //    approves from their Business Center / Teams, and this joiner polls the
    //    hub for the decision. No cloud account is created for a LAN join.
    {
      const pinned = session ?? loadJoinSession();
      if (pinned) {
        const inv = await resolveInviteOnSession(pinned, code.toUpperCase());
        if (inv) {
          // Include the business snapshot in the session so status → activate
          // can read the owner's business identity without re-resolving.
          const live = { ...pinned, businessId: inv.businessId ?? pinned.businessId, businessName: inv.businessName ?? pinned.businessName };
          const deviceId0 = ensureHubDeviceId();
          const displayName = String(input?.name || '').trim() || String(input?.deviceName || '').trim() || 'Team Member';
          const role = String(inv.role ?? 'cashier');
          const payload = {
            businessId: inv.businessId ?? '',
            code: code.toUpperCase(),
            joinerDeviceId: deviceId0,
            joinerName: displayName,
            joinerModel: 'Desktop',
            joinerUser: displayName,
            role,
            platform: 'desktop',
          };
          try {
            await submitJoinOnSession(live, payload);
          } catch (err: any) {
            throw new Error(
              'Could not reach the owner\'s device to send the join request. ' +
              `Ask them to keep the app open on the same network, then try again. (${err?.message ?? 'network error'})`
            );
          }
          saveJoinSession(live);
          setSetting('join_source', 'lan');
          setSetting('join_code', code.toUpperCase());
          setSetting('join_device_id', deviceId0);
          setSetting('join_business_id', live.businessId ?? '');
          setSetting('join_business_name', live.businessName ?? '');
          setSetting('join_role', role);
          setSetting('join_display_name', displayName);
          setSetting('join_account_email', email);
          return {
            status: 'pending',
            invitation_id: null,
            device_key: null,
            device_id: deviceId0,
            business_name: live.businessName ?? null,
            role,
            email,
            source: 'lan',
          };
        }
        // An explicitly pinned owner (radar pick / auto-connect) but the code no
        // longer resolves there: fail loud — never silently fall into the cloud.
        if (session) {
          throw new Error('This invitation is no longer open on the owner\u2019s device. Ask them to open a fresh invite, or pick another nearby device.');
        }
      }
    }

    // 1) Preview the invitation (validation only — never consumes it).
    //    Local invitations (offline-first) skip the cloud entirely: the join
    //    request is staged in the hub's device_requests and the owner approves
    //    it from Connected Devices / Team — the same path mobile joiners use.
    const deviceId0 = ensureHubDeviceId();
    const localInvite = ((): any | null => {
      try {
        const n = normalizeCode(code);
        const li = db.prepare(
          `SELECT * FROM user_invites WHERE ${CODE_EQ} AND status IN ('open','pending') ORDER BY created_at DESC LIMIT 1`
        ).get(n) as any;
        if (li) return { kind: 'user_invite', id: li.id, businessId: li.business_id, role: li.suggested_role ?? 'cashier' };
        const pub = db.prepare(
          `SELECT * FROM invitations WHERE ${CODE_EQ} AND status = 'open' ORDER BY created_at DESC LIMIT 1`
        ).get(n) as any;
        if (pub && (!pub.expires_at || pub.expires_at > new Date().toISOString())) {
          return { kind: 'invitation', id: pub.id, businessId: pub.business_id, role: pub.role ?? 'cashier' };
        }
      } catch { /* tables may not exist yet */ }
      return null;
    })();
    if (localInvite) {
      const biz = db.prepare('SELECT uuid, businessName FROM businesses WHERE id = ?').get(localInvite.businessId) as any;
      const businessUuid = biz?.uuid ?? String(localInvite.businessId);
      const displayName = String(input?.name || '').trim() || 'Team Member';
      try {
        const { submitDeviceJoinRequest } = await import('./sync/device-requests');
        submitDeviceJoinRequest({
          businessId: businessUuid,
          code,
          joinerDeviceId: deviceId0,
          joinerName: displayName,
          joinerModel: 'Desktop',
          joinerUser: displayName,
          role: localInvite.role,
          platform: 'desktop',
        } as any);
      } catch { /* device_requests table may be missing — approval still possible via user_invites */ }
      setSetting('join_invitation_id', localInvite.id);
      setSetting('join_device_id', deviceId0);
      setSetting('join_business_name', String(biz?.businessName ?? ''));
      setSetting('join_role', String(localInvite.role));
      setSetting('join_display_name', displayName);
      setSetting('join_local', '1');
      setSetting('join_code', code.toUpperCase());
      return {
        status: 'pending',
        invitation_id: localInvite.id,
        device_key: null,
        device_id: deviceId0,
        business_name: biz?.businessName ?? null,
        role: localInvite.role,
        email: '',
      };
    }

    let preview: any;
    try {
      preview = await doAuthRequest('/api/sync/pairing/lookup/', { code }, { method: 'POST' });
    } catch (err: any) {
      throw err;
    }

    // 2) Link the employee's account: login first, sign up when they have no
    //    Shega account yet.
    let token: string | null = null;
    let refreshToken: string | null = null;
    try {
      const loginData = await doAuthRequest('/api/auth/login/', { email, password }, { method: 'POST' });
      token = loginData?.access ?? loginData?.token ?? null;
      refreshToken = loginData?.refresh ?? null;
    } catch (err: any) {
      if (err.status !== 400 && err.status !== 401) {
        throw new Error(`Could not sign in: ${err.message || 'network error'}`);
      }
    }
    if (!token) {
      try {
        const regData = await doAuthRequest(
          '/api/auth/register/',
          { email, password, name: input?.name || email.split('@')[0] },
          { method: 'POST' },
        );
        token = regData?.access ?? regData?.token ?? null;
        refreshToken = regData?.refresh ?? null;
      } catch (err: any) {
        if (/already exists/i.test(String(err.detail ?? err.message ?? ''))) {
          throw new Error('An account already exists for that email — sign in with its password instead.');
        }
        throw new Error(`Could not create an account: ${err.message || 'network error'}`);
      }
    }
    if (!token) throw new Error('Could not obtain an access token');
    setSetting('join_access_token', token);
    if (refreshToken) setSetting('join_refresh_token', refreshToken);

    // 3) Accept the invitation for THIS machine's hub device.
    const deviceName = String(input?.deviceName ?? '').trim() || 'Shega Desktop';
    const deviceId = ensureHubDeviceId();
    const acc = await doAuthRequest(
      '/api/sync/pairing/accept/',
      { code, device_id: deviceId, device_name: deviceName, platform: 'desktop' },
      { method: 'POST', auth: true, tokenKey: 'join_access_token' },
    );
    setSetting('join_invitation_id', String(acc?.invitation_id ?? ''));
    setSetting('join_device_id', deviceId);
    if (acc?.device_key) setSetting('join_device_key', acc.device_key);
    setSetting('join_business_name', String(preview?.business_name ?? ''));
    setSetting('join_role', String(preview?.role ?? ''));
    setSetting('join_account_email', email);
    setSetting('join_display_name', String(input?.name || email.split('@')[0]));
    return {
      status: acc?.status ?? 'pending',
      invitation_id: acc?.invitation_id ?? null,
      device_key: acc?.device_key ?? null,
      device_id: deviceId,
      business_name: preview?.business_name ?? null,
      role: preview?.role ?? null,
      email,
    };
  });

  ipcMain.handle('join:status', async (_e, invitationId?: number) => {
    const id = invitationId ?? Number(getSetting('join_invitation_id') || 0);
    const token = getSetting('join_access_token');

    // LAN join: poll the owner's hub (the session recorded at submit time) for
    // the approval decision — the mobile and desktop hubs both answer with
    // `{ record, pairingToken? }`. `record.status` is the source of truth.
    if (getSetting('join_source') === 'lan') {
      const session = loadJoinSession();
      const code = String(getSetting('join_code') || '');
      const joinerDeviceId = String(getSetting('join_device_id') || '');
      const businessName = getSetting('join_business_name') ?? '';
      const roleSetting = getSetting('join_role') ?? 'cashier';
      const email = getSetting('join_account_email') ?? '';
      if (!session || !code || !joinerDeviceId) {
        return { phase: 'error', error: 'Lost the pairing session. Rejoin and try again.' };
      }
      try {
        const res = await pollJoinStatusOnSession(session, code, joinerDeviceId);
        const record = res?.record ?? null;
        if (!record || record.status === 'pending') {
          return { phase: 'pending', status: 'pending', business_name: businessName, role: roleSetting, email };
        }
        if (record.status === 'approved') {
          // Owner-assigned identity + the LAN pairing grant ride the decision:
          // persist them so join:activate provisions the exact member identity.
          if (record.assignedName) setSetting('join_assigned_name', String(record.assignedName));
          if (record.assignedAvatar) setSetting('join_assigned_avatar', String(record.assignedAvatar));
          if (record.assignedRole) setSetting('join_role', String(record.assignedRole));
          if (record.assignedPermissions) setSetting('join_assigned_permissions', JSON.stringify(record.assignedPermissions));
          if (res?.pairingToken) setSetting('join_lan_token', String(res.pairingToken));
          // Keep the session's host/port so post-activation sync (and the P2P
          // manager's fallback) can reach the owner's hub without mDNS.
          if (session.host) setSetting('join_lan_host', String(session.host));
          if (session.port) setSetting('join_lan_port', String(session.port));
          return {
            phase: 'approved',
            status: 'approved',
            business_name: businessName,
            role: record.assignedRole || record.role || roleSetting,
            assigned_name: record.assignedName ?? null,
            assigned_avatar: record.assignedAvatar ?? null,
            assigned_permissions: record.assignedPermissions ?? null,
            device_status: null,
            email,
          };
        }
        return {
          phase: record.status,
          status: record.status,
          business_name: businessName,
          role: roleSetting,
          email,
        };
      } catch (err: any) {
        // The owner's device may have left the network — the joiner stays on the
        // join screen and can keep searching; never auto-terminate the session.
        return { phase: 'error', error: err?.message ?? 'Lost contact with the owner\u2019s device' };
      }
    }

    // Local join: poll the staged device_requests row for the owner's decision.
    if (getSetting('join_local') === '1') {
      const localDeviceId = String(getSetting('join_device_id') || '');
      try {
        const { getDeviceJoinRequestBy } = await import('./sync/device-requests');
        const rec = getDeviceJoinRequestBy(String(getSetting('join_code') || ''), localDeviceId);
        if (rec) {
          const st = String(rec.status);
          return {
            phase: st === 'approved' ? 'approved'
              : (st === 'rejected' || st === 'cancelled' || st === 'expired') ? st
              : 'pending',
            status: st,
            business_name: getSetting('join_business_name'),
            role: rec.assignedRole || rec.role || getSetting('join_role'),
            // Owner-assigned identity so the joiner is activated with exactly
            // the name/avatar/role/permissions the owner configured.
            assigned_name: rec.assignedName ?? null,
            assigned_avatar: rec.assignedAvatar ?? null,
            assigned_permissions: rec.assignedPermissions ?? null,
            device_status: null,
            email: '',
          };
        }
        return { phase: 'pending', business_name: getSetting('join_business_name'), role: getSetting('join_role'), email: '' };
      } catch {
        return { phase: 'pending', business_name: getSetting('join_business_name'), role: getSetting('join_role'), email: '' };
      }
    }

    if (!id || !token) return { phase: 'none', invitation: null };

    const fetchOnce = async (): Promise<any> => {
      const data = await doAuthRequest(
        `/api/sync/pairing/status/${id}/`,
        {},
        { auth: true, tokenKey: 'join_access_token' },
      );
      const status = data?.status ?? 'pending';
      return {
        phase: status === 'approved' ? 'approved'
          : (status === 'rejected' || status === 'cancelled' || status === 'expired') ? status
          : 'pending',
        status,
        business_name: data?.business_name ?? getSetting('join_business_name'),
        role: data?.role ?? getSetting('join_role'),
        device_status: data?.device_status ?? null,
        email: getSetting('join_account_email'),
      };
    };

    try {
      return await fetchOnce();
    } catch (err: any) {
      if (err?.status === 401) {
        const ok = await refreshAuthToken('join_refresh_token');
        if (ok) {
          try {
            return await fetchOnce();
          } catch (err2: any) {
            return { phase: 'error', error: err2?.message ?? 'network error' };
          }
        }
      }
      return { phase: 'error', error: err?.message ?? 'network error' };
    }
  });

  ipcMain.handle('join:activate', async (_e, pinOrProfile: string | { pin: string; name?: string; username?: string; avatar?: string | null }) => {
    const profile = typeof pinOrProfile === 'string' ? { pin: pinOrProfile } : (pinOrProfile ?? {});
    const pinStr = String(profile.pin ?? '');
    const joinName = profile.name ? String(profile.name).trim() : '';
    const joinUsername = profile.username ? String(profile.username).trim().toLowerCase() : '';
    const joinAvatar = profile.avatar !== undefined && profile.avatar !== null ? String(profile.avatar) : null;
    const key = getSetting('join_device_key');
    const email = getSetting('join_account_email');
    const id = getSetting('join_invitation_id');
    if (!/^\d{6}$/.test(pinStr)) throw new Error('PIN must be exactly 6 digits');

    // LAN join: the join request lived on the OWNER's hub (not this device's
    // device_requests), so activation mirrors the local path from the settings
    // snapshot recorded when the owner approved. Identity comes from the joiner's
    // own setup (name/avatar) while the ROLE comes from the owner's assignment.
    if (getSetting('join_source') === 'lan') {
      const bizKey = String(getSetting('join_business_id') || id || 'lan').replace(/[^a-zA-Z0-9_-]/g, '');
      const username = joinUsername || email || `lan-${bizKey}`;
      const displayName = joinName || getSetting('join_assigned_name') || getSetting('join_display_name') || 'Team Member';
      const role = getSetting('join_role') || 'cashier';
      const assignedAvatar = (joinAvatar || getSetting('join_assigned_avatar')) ?? null;
      const assignedPerms = getSetting('join_assigned_permissions') || null;
      const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
      if (!existing) {
        db.prepare('INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)').run(
          displayName,
          username,
          joinHashPin(pinStr),
          role,
          assignedPerms || JSON.stringify(['dashboard', 'inventory', 'sales', 'customers', 'analytics']),
          null,
        );
        if (assignedAvatar) {
          try { db.prepare('UPDATE admins SET avatar = ? WHERE username = ?').run(assignedAvatar, username); } catch { /* column-guarded */ }
        }
      } else {
        const sets: string[] = [];
        const vals: any[] = [];
        sets.push('name = ?'); vals.push(displayName);
        sets.push('role = ?'); vals.push(role);
        if (assignedPerms) { sets.push('permissions = ?'); vals.push(assignedPerms); }
        if (assignedAvatar) { sets.push('avatar = ?'); vals.push(assignedAvatar); }
        vals.push(username);
        db.prepare(`UPDATE admins SET ${sets.join(', ')} WHERE username = ?`).run(...vals);
      }
      // LAN pairing grant (owner hub token) is handed off where sync reads it.
      const lanToken = getSetting('join_lan_token');
      if (lanToken) setSetting('lan_pairing_token', lanToken);
      // Preserve the owner-hub endpoint for post-activation sync (the wipe
      // below clears every other join_ setting).
      const lanHost = getSetting('join_lan_host');
      const lanPort = getSetting('join_lan_port');
      db.prepare("DELETE FROM settings WHERE key LIKE 'join_%'").run();
      if (lanToken) setSetting('lan_pairing_token', lanToken);
      if (lanHost) setSetting('lan_owner_host', lanHost);
      if (lanPort) setSetting('lan_owner_port', lanPort);
      // Kick one immediate pull from the owner's hub so the joiner's data
      // arrives without waiting for the next mDNS-driven P2P cycle.
      if (lanHost && lanToken) {
        (async () => {
          try {
            const { syncWithMobileHub } = await import('./sync/mobile-hub-client');
            const host = String(lanHost);
            const port = Number(lanPort || 0);
            if (port === 5759) {
              // Mobile owner hub: TCP protocol with the granted pairing token.
              await syncWithMobileHub({ host, port, pairingToken: lanToken, deviceId: '', name: '', addresses: [host] } as any);
            }
          } catch (e: any) {
            console.warn('Post-activation pull from owner hub failed:', e?.message);
          }
        })();
      }
      return { success: true, username };
    }

    // Local join: create a local terminal identity bound to the joined
    // business. The business roster/sync arrives over LAN + P2P.
    if (getSetting('join_local') === '1') {
      const displayName = joinName || getSetting('join_display_name') || 'Team Member';
      const username = joinUsername || `local-${String(id)}`;
      const assignedAvatar = (joinAvatar || getSetting('join_assigned_avatar')) ?? null;
      // Owner-assigned identity from the approval: the role and permission set
      // come from the owner; the member's name/avatar come from their own setup.
      let assignedRole: string | null = null;
      let assignedPerms: string | null = null;
      try {
        const { getDeviceJoinRequestBy } = await import('./sync/device-requests');
        const rec = getDeviceJoinRequestBy(String(getSetting('join_code') || ''), String(getSetting('join_device_id') || ''));
        if (rec) {
          assignedRole = rec.assignedRole ?? rec.role ?? null;
          assignedPerms = rec.assignedPermissions ? JSON.stringify(rec.assignedPermissions) : null;
        }
      } catch { /* identity lookup is best-effort */ }
      const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
      if (!existing) {
        db.prepare('INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)').run(
          displayName,
          username,
          joinHashPin(pinStr),
          assignedRole || 'cashier',
          assignedPerms || JSON.stringify(['dashboard', 'inventory', 'sales', 'customers', 'analytics']),
          null,
        );
        if (assignedAvatar) {
          try { db.prepare('UPDATE admins SET avatar = ? WHERE username = ?').run(assignedAvatar, username); } catch { /* column-guarded */ }
        }
      } else {
        // Already created: upgrade identity in place.
        const sets: string[] = [];
        const vals: any[] = [];
        sets.push('name = ?'); vals.push(displayName);
        if (assignedRole) { sets.push('role = ?'); vals.push(assignedRole); }
        if (assignedPerms) { sets.push('permissions = ?'); vals.push(assignedPerms); }
        if (assignedAvatar) { sets.push('avatar = ?'); vals.push(assignedAvatar); }
        if (sets.length) { vals.push(username); db.prepare(`UPDATE admins SET ${sets.join(', ')} WHERE username = ?`).run(...vals); }
      }
      db.prepare("DELETE FROM settings WHERE key LIKE 'join_%'").run();
      return { success: true, username };
    }
    if (!key || !email || !id) throw new Error('No active join in progress');

    // Cloud transport config: this machine now authenticates with the device
    // key the backend issued exactly once at accept time (inert until then).
    const base = getBaseUrl();
    if (/^https?:\/\//.test(base)) {
      setSetting('cloud_sync_url', base);
    }
    setSetting('cloud_sync_device_key', key);
    setSetting('cloud_sync_enabled', 'true');

    // Terminal identity: the employee logs in with this app's normal PIN flow.
    // Once cloud sync delivers the roster `users` row, resolveRosterIdentity
    // upgrades role/permissions from the membership (matches on email).
    const username = joinUsername || email;
    const displayName = joinName || getSetting('join_display_name') || username.split('@')[0];
    const cloudAvatar = (joinAvatar || getSetting('join_assigned_avatar')) ?? null;
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
    if (!existing) {
      db.prepare('INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)').run(
        displayName,
        username,
        joinHashPin(pinStr),
        'admin',
        JSON.stringify(['dashboard', 'inventory', 'sales', 'expenses', 'customers', 'analytics', 'adjustments', 'warehouses', 'shipments']),
        null,
      );
      if (cloudAvatar) {
        try { db.prepare('UPDATE admins SET avatar = ? WHERE username = ?').run(cloudAvatar, username); } catch { /* column-guarded */ }
      }
    }

    // Join state consumed — clear tokens so nothing account-scoped lingers.
    db.prepare("DELETE FROM settings WHERE key LIKE 'join_%'").run();
    return { success: true, username };
  });

  ipcMain.handle('join:cancel', () => {
    db.prepare("DELETE FROM settings WHERE key LIKE 'join_%'").run();
    return { cancelled: true };
  });
}

function joinHashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${key}`;
}