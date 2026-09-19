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

function getBaseUrl(): string {
  return (getSetting('cloud_sync_url') || process.env.SHEGA_API_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

/** Normalize an invite code so dashless/pastable variants still match. */
function normalizeCode(code: string): string {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
/** SQL fragment that compares a stored `code` column format-insensitively. */
const CODE_EQ = "replace(replace(upper(coalesce(code,'')), '-', ''), ' ', '') = ?";

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
    return doAuthRequest('/api/sync/pairing/invite/', body, { method: 'POST', auth: true });
  });

  ipcMain.handle('pairing:revoke', async (_e, id: number) => {
    return doAuthRequest(`/api/sync/pairing/${id}/revoke/`, {}, { method: 'POST', auth: true });
  });

  ipcMain.handle('pairing:decide', async (_e, id: number, decision: 'approve' | 'reject', role?: string, permissions?: Record<string, unknown>) => {
    // Approval-time role assignment: the Owner picks Owner/Cashier/Custom when
    // approving. Body stays empty when no override is chosen (invite role wins).
    const body: Record<string, unknown> = {};
    if (role) body.role = role;
    if (permissions && typeof permissions === 'object') body.permissions = permissions;
    return doAuthRequest(`/api/sync/pairing/${id}/${decision}/`, body, { method: 'POST', auth: true });
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
  ipcMain.handle('join:lookup', async (_e, code: string) => {
    const c = String(code ?? '').trim().toUpperCase();
    if (!c) throw new Error('Enter the 6-digit code');

    // 1) Local invitation store first — pairing works fully offline. The
    //    desktop hub keeps both its own user_invites and any invitations
    //    published to it by mobile peers (DEVICE_JOIN.PUBLISH).
    const n = normalizeCode(c);
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

    // 2) Cloud lookup fallback (backend pairing endpoints).
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

  ipcMain.handle('join:accept', async (_e, input: { code: string; email: string; password: string; name?: string; deviceName?: string }) => {
    const code = String(input?.code ?? '').trim();
    const email = String(input?.email ?? '').trim().toLowerCase();
    const password = String(input?.password ?? '');
    if (!code || !email || !password) throw new Error('Code, email and password are required');

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
            role: rec.role ?? getSetting('join_role'),
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

  ipcMain.handle('join:activate', (_e, pin: string) => {
    const key = getSetting('join_device_key');
    const email = getSetting('join_account_email');
    const id = getSetting('join_invitation_id');
    const pinStr = String(pin ?? '');
    if (!/^\d{4}$/.test(pinStr)) throw new Error('PIN must be 4 digits');

    // Local join: create a local terminal identity bound to the joined
    // business. The business roster/sync arrives over LAN + P2P.
    if (getSetting('join_local') === '1') {
      const displayName = getSetting('join_display_name') || 'Team Member';
      const username = `local-${String(id)}`;
      const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
      if (!existing) {
        db.prepare('INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)').run(
          displayName,
          username,
          joinHashPin(pinStr),
          'cashier',
          JSON.stringify(['dashboard', 'inventory', 'sales', 'customers', 'analytics']),
          null,
        );
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
    const username = email;
    const displayName = getSetting('join_display_name') || email.split('@')[0];
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