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
 * Tokens are encrypted at rest using Electron's safeStorage (DPAPI on Windows,
 * Keychain on macOS, libsecret on Linux).
 */
import { getSetting, setSetting, getEncryptedSetting, setEncryptedSetting } from './secure-settings';

const DEFAULT_BASE = 'https://afran.et';

const TOKEN_KEY = 'backend_access_token';
const REFRESH_KEY = 'backend_refresh_token';
const EMAIL_KEY = 'backend_account_email';

export function getBackendBaseUrl(): string {
  return (getSetting('backend_api_url') || process.env.SHEGA_BACKEND_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

export function hasSession(): boolean {
  return !!getEncryptedSetting(TOKEN_KEY);
}

export function getSessionEmail(): string | null {
  return getSetting(EMAIL_KEY);
}

let inMemoryAccess: string | null = null;
let inMemoryRefresh: string | null = null;

function currentAccess(): string | null {
  return inMemoryAccess || getEncryptedSetting(TOKEN_KEY);
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

  if (res.status === 401 && getEncryptedSetting(REFRESH_KEY) && !options.body) {
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
  const refresh = getEncryptedSetting(REFRESH_KEY);
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
      setEncryptedSetting(REFRESH_KEY, data.refresh);
    } else {
      inMemoryRefresh = refresh;
    }
    setEncryptedSetting(TOKEN_KEY, inMemoryAccess);
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
  setEncryptedSetting(TOKEN_KEY, data.access);
  setEncryptedSetting(REFRESH_KEY, data.refresh);
  setSetting(EMAIL_KEY, data.user?.email || username);
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  businessName?: string;
}): Promise<any> {
  const data = await api('/api/auth/register', {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      password2: payload.password,
      name: payload.name,
      phone: payload.phone,
      business_name: payload.businessName,
      // This build is Shega Desktop, so the backend records a Desktop signup
      // and offers/trials the Desktop plan rather than Mobile.
      platform: 'desktop',
    },
  });
  if (data?.access) {
    inMemoryAccess = data.access;
    inMemoryRefresh = data.refresh;
    setEncryptedSetting(TOKEN_KEY, data.access);
    setEncryptedSetting(REFRESH_KEY, data.refresh);
    setSetting(EMAIL_KEY, data.user?.email || payload.email);
  }
  return data;
}

export async function logout(): Promise<void> {
  const refresh = getEncryptedSetting(REFRESH_KEY);
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

/**
 * Every payment this customer has submitted, newest first.
 *
 * The subscription status endpoint reports only the single most recent pending
 * payment, so a customer who has a renewal AND a device add-on awaiting review
 * would see just one of them. The Subscription page reads this list to show each
 * outstanding request, and to keep a second submission from being made while one
 * is still pending.
 */
export const getMyPayments = (): Promise<any[]> => api('/api/customers/payments');

export const getMemberships = (): Promise<{ owned: any[]; memberships: any[] }> => api('/api/auth/memberships');

// ── Device registration & Business creation (require approved entitlements) ──

export const registerDevice = (licenseId: number, payload: {
  device_id: string;
  device_name?: string;
  operating_system?: string;
  device_type: 'MOBILE' | 'DESKTOP';
  idempotency_key?: string;
}): Promise<any> =>
  api(`/api/customers/licenses/${licenseId}/devices/register`, {
    method: 'POST',
    body: payload,
  });

export const createBusiness = (licenseId: number, payload: {
  name: string;
  idempotency_key?: string;
}): Promise<any> =>
  api(`/api/customers/licenses/${licenseId}/businesses/create`, {
    method: 'POST',
    body: payload,
  });

export const getCostBreakdown = (licenseId: number): Promise<any> =>
  api(`/api/customers/licenses/${licenseId}/cost-breakdown`);

export const getDeviceEntitlements = (licenseId: number): Promise<any[]> =>
  api(`/api/customers/licenses/${licenseId}/entitlements/devices`);

export const getBusinessEntitlements = (licenseId: number): Promise<any[]> =>
  api(`/api/customers/licenses/${licenseId}/entitlements/businesses`);