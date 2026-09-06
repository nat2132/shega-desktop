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
import db from './database';

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

let authPromise: ReturnType<typeof doAuthRequest> | null = null;

async function doAuthRequest(
  path: string,
  body?: any,
  {
    method = 'GET',
    auth = false,
    retried = false,
  }: { method?: string; body?: any; auth?: boolean; retried?: boolean } = {},
): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  let token = auth ? getSetting('pairing_access_token') : null;
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
    const refreshed = await refreshPairingToken();
    if (refreshed) return doAuthRequest(path, body, { method, body, auth, retried: true });
  }
  if (!res.ok) {
    const msg = data?.detail ?? data?.error ?? (typeof data === 'string' ? data : `HTTP ${res.status}`);
    const err: any = new Error(typeof msg === 'object' ? msg.detail ?? JSON.stringify(msg) : String(msg));
    err.status = res.status;
    err.detail = data?.detail ?? null;
    throw err;
  }
  // External pairing requests are unauthenticated shareable lookups.
  return data;
}

async function refreshPairingToken(): Promise<boolean> {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    try {
      const refresh = getSetting('pairing_refresh_token');
      if (!refresh) return false;
      const res = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { access?: string; refresh?: string };
      if (!data?.access) return false;
      setSetting('pairing_access_token', data.access);
      if (data.refresh) setSetting('pairing_refresh_token', data.refresh);
      return true;
    } catch {
      return false;
    } finally {
      authPromise = null;
    }
  })();
  return authPromise;
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

  ipcMain.handle('pairing:decide', async (_e, id: number, decision: 'approve' | 'reject') => {
    return doAuthRequest(`/api/sync/pairing/${id}/${decision}/`, {}, { method: 'POST', auth: true });
  });

  ipcMain.handle('pairing:qr-code', async (_e, text: string) => {
    if (!text?.trim()) throw new Error('Nothing to encode');
    return QRCode.toDataURL(text, { width: 340, margin: 2, errorCorrectionLevel: 'M' });
  });
}