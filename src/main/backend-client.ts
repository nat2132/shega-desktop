/* Shega backend (Node API) client — the subscription source of truth.
 *
 * The desktop talks to the SAME backend as Shega Mobile and Shega Admin so a
 * business uses one account, one subscription and one business_id across all
 * apps.
 *
 * The base URL is CONFIGURATION, never baked into call sites. Resolution order:
 *   1. the `backend_api_url` row in the local settings table (a value the user
 *      or a device pair can change at runtime),
 *   2. the SHEGA_BACKEND_URL environment variable (set it in `shega-desktop/.env`
 *      for a build/run-time default,
 *   3. the current public testing endpoint below.
 *
 * Session tokens follow the existing cloud-sync pattern in this app: they are
 * stored in the local settings table and refreshed transparently on 401.
 */
import db from './database';

const DEFAULT_BASE = 'https://8b70-196-188-178-187.ngrok-free.app';

const TOKEN_KEY = 'backend_access_token';
const REFRESH_KEY = 'backend_refresh_token';
const EMAIL_KEY = 'backend_account_email';

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}
function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getBackendBaseUrl(): string {
  return (getSetting('backend_api_url') || process.env.SHEGA_BACKEND_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

export function hasSession(): boolean {
  return !!getSetting(TOKEN_KEY);
}

export function getSessionEmail(): string | null {
  return getSetting(EMAIL_KEY);
}

let inMemoryAccess: string | null = null;
let inMemoryRefresh: string | null = null;

function currentAccess(): string | null {
  return inMemoryAccess || getSetting(TOKEN_KEY);
}

export class BackendError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail || `Backend request failed (HTTP ${status}).`);
    this.name = 'BackendError';
    this.status = status;
    this.detail = detail;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
}

async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const attempt = (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${getBackendBaseUrl()}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
  };

  let res: Response;
  try {
    res = await attempt(currentAccess());
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      throw new BackendError(0, `The Shega server timed out. Check the backend URL (${getBackendBaseUrl()}).`);
    }
    throw new BackendError(0, `Cannot reach the Shega server at ${getBackendBaseUrl()}. Check your connection.`);
  }

  if (res.status === 401 && getSetting(REFRESH_KEY) && !options.body) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      try {
        res = await attempt(currentAccess());
      } catch (err: any) {
        throw new BackendError(0, `Cannot reach the Shega server at ${getBackendBaseUrl()}. Check your connection.`);
      }
    }
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail =
      (typeof data?.detail === 'string' && data.detail) ||
      (typeof data?.error === 'string' && data.error) ||
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data) ? data.map((d) => JSON.stringify(d)).join(', ') : '') ||
      `Request failed (HTTP ${res.status}).`;
    throw new BackendError(res.status, detail);
  }

  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getSetting(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json()) as { access?: string; refresh?: string | null } | null;
    if (!res.ok || !data?.access) return false;
    inMemoryAccess = data.access;
    if (data.refresh) {
      inMemoryRefresh = data.refresh;
      setSetting(REFRESH_KEY, data.refresh);
    } else {
      inMemoryRefresh = refresh;
    }
    setSetting(TOKEN_KEY, inMemoryAccess);
    return true;
  } catch {
    return false;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<any> {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  inMemoryAccess = data.access;
  inMemoryRefresh = data.refresh;
  setSetting(TOKEN_KEY, data.access);
  setSetting(REFRESH_KEY, data.refresh);
  setSetting(EMAIL_KEY, data.user?.email || username);
  return data;
}

export async function logout(): Promise<void> {
  const refresh = getSetting(REFRESH_KEY);
  if (refresh) {
    try {
      await fetch(`${getBackendBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      /* best effort */
    }
  }
  inMemoryAccess = null;
  inMemoryRefresh = null;
  db.prepare('DELETE FROM settings WHERE key IN (?, ?, ?)').run(TOKEN_KEY, REFRESH_KEY, EMAIL_KEY);
  db.prepare('DELETE FROM cloud_subscription').run();
}

// ── Subscriptions (source of truth) ────────────────────────────────────────

export const getSubscriptionStatus = (): Promise<any> => api('/api/subscription/status');

export const getPlans = (): Promise<any[]> => api('/api/plans');

export const startTrial = (planId: number): Promise<any> =>
  api('/api/subscription/trial', { method: 'POST', body: { plan_id: planId } });

export const submitPayment = (payload: {
  plan_id: number;
  transaction_id: string;
  payment_method?: string;
  payment_type?: string;
  description?: string;
  quantity?: number;
}): Promise<any> =>
  // The server contract is `{ plan, payment_method, payment_type, quantity,
  // transaction_id }` — it derives the add-on amount from the customer's active
  // license and the plan's own add-on prices, so it ignores any client amount.
  api('/api/customers/payments', {
    method: 'POST',
    body: {
      plan: Number(payload.plan_id),
      payment_method: payload.payment_method || 'telebirr',
      payment_type: payload.payment_type || 'subscription',
      transaction_id: payload.transaction_id,
      ...(payload.quantity ? { quantity: Number(payload.quantity) } : {}),
    },
  });

export const getMemberships = (): Promise<{ owned: any[]; memberships: any[] }> => api('/api/auth/memberships');