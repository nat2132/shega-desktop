/* Desktop ↔ Shega backend subscription bridge.
 *
 * The backend is the source of truth for access level. When the desktop is
 * linked to a Shega account, the latest backend status is persisted in the
 * `cloud_subscription` table and merged into the values the renderer reads via
 * get-current-subscription / get-renewal-info. This keeps the renderer (and its
 * premium/view-only gates) correct without touching the legacy local
 * subscription rows or their schema (whose status CHECK cannot express
 * 'pending'/'rejected' cleanly).
 */
import { randomUUID } from 'crypto';
import db from './database';

// Tolerates the table not existing yet (first migration-less run).
export function ensureCloudTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_subscription (
      businessId INTEGER PRIMARY KEY,
      accountEmail TEXT,
      status TEXT,
      access TEXT,
      tier TEXT,
      planName TEXT,
      planId INTEGER,
      licenseKey TEXT,
      isTrial INTEGER DEFAULT 0,
      startedAt TEXT,
      expiresAt TEXT,
      daysRemaining INTEGER DEFAULT 0,
      devicesJson TEXT,
      businessesJson TEXT,
      monthlyJson TEXT,
      pendingJson TEXT,
      lastPaymentJson TEXT,
      syncedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getActiveBusinessId(): number | null {
  try {
    const row = db.prepare('SELECT id FROM businesses WHERE isDefault = 1 ORDER BY id LIMIT 1').get() as any;
    if (row?.id != null) return Number(row.id);
    const first = db.prepare('SELECT id FROM businesses ORDER BY id LIMIT 1').get() as any;
    return first?.id != null ? Number(first.id) : null;
  } catch {
    return null;
  }
}

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}

/** True when this desktop is linked to a Shega backend account. */
export function isCloudLinked(): boolean {
  ensureCloudTable();
  const bizId = getActiveBusinessId();
  if (!bizId) return false;
  const row = db.prepare('SELECT businessId FROM cloud_subscription WHERE businessId = ?').get(bizId) as any;
  return !!row;
}

/** The canonical snapshot the backend reported for the active business. */
export function getCloudSubscription(): any | null {
  ensureCloudTable();
  const bizId = getActiveBusinessId();
  if (!bizId) return null;
  const row = db.prepare('SELECT * FROM cloud_subscription WHERE businessId = ?').get(bizId) as any;
  return row ?? null;
}

/**
 * Canonical plan edition for a backend plan name — the local `tier` records
 * WHICH platforms the plan unlocks, not a capability level.
 *
 *   "Mobile"           → mobile
 *   "Desktop"          → desktop
 *   "Mobile + Desktop" → both
 *
 * Anything unrecognised keeps the widest access so a backend rename can never
 * silently lock a paying subscriber out of the app.
 */
export function mapTier(planName: string | null, isTrial: boolean): string {
  if (isTrial) return 'trial';
  const name = (planName || '').toLowerCase();
  if (name.includes('mobile') && name.includes('desktop')) return 'both';
  if (name.includes('desktop')) return 'desktop';
  if (name.includes('mobile')) return 'mobile';
  if (name.includes('premium')) return 'both';
  if (name.includes('basic')) return 'mobile';
  return 'both';
}

/**
 * Persist the backend subscription status for the active business. Returns the
 * mapped canonical fields for the caller; the renderer picks these up through
 * the merged getters below.
 */
export function applyBackendStatus(status: any): any {
  ensureCloudTable();
  const bizId = getActiveBusinessId();
  if (!bizId) {
    throw new Error('No active business exists yet. Set up the business before linking your account.');
  }

  const canonical =
    status?.status === 'none' ? null : (status?.status ?? null);
  const isTrial = canonical === 'trial' || Boolean(status?.is_trial);
  const tier = isTrial ? 'trial' : mapTier(status?.plan_name, false);

  const mapped = {
    status: canonical, // active | trial | pending_payment | payment_rejected | expired
    access: status?.access ?? 'view_only',
    tier,
    planName: status?.plan_name ?? null,
    planId: status?.plan_id ?? null,
    licenseKey: status?.license_key ?? null,
    isTrial: isTrial ? 1 : 0,
    startedAt: status?.started_at ?? null,
    expiresAt: status?.expires_at ?? null,
    daysRemaining: status?.days_remaining ?? 0,
  };

  if (!canonical) {
    // The backend reports NO subscription for this account. Drop the snapshot so
    // a previously active license cannot keep granting full access locally.
    db.prepare('DELETE FROM cloud_subscription WHERE businessId = ?').run(bizId);
    return { ...mapped, status: 'none' };
  }

  db.prepare(`
    INSERT OR REPLACE INTO cloud_subscription
    (businessId, accountEmail, status, access, tier, planName, planId, licenseKey,
     isTrial, startedAt, expiresAt, daysRemaining, devicesJson, businessesJson,
     monthlyJson, pendingJson, lastPaymentJson, syncedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bizId,
    getSetting('backend_account_email') ?? '',
    canonical,
    mapped.access,
    mapped.tier,
    mapped.planName,
    mapped.planId ?? null,
    mapped.licenseKey ?? null,
    mapped.isTrial,
    mapped.startedAt,
    mapped.expiresAt,
    mapped.daysRemaining,
    JSON.stringify(status?.devices ?? {}),
    JSON.stringify(status?.businesses ?? {}),
    JSON.stringify(status?.monthly ?? {}),
    JSON.stringify(status?.pending_payment ?? null),
    JSON.stringify(status?.last_payment ?? null),
    new Date().toISOString(),
  );

  return mapped;
}

/** Clear the cloud snapshot (logout / unlink). */
export function clearCloud(): void {
  ensureCloudTable();
  db.prepare('DELETE FROM cloud_subscription').run();
}

/**
 * Merge the cloud snapshot into the local subscription shape. Used by
 * get-current-subscription so the renderer sees backend truth.
 */
export function mergeIntoSubscription(local: any): any {
  const cloud = getCloudSubscription();
  if (!cloud) return local;
  const base = local ?? {};
  return {
    ...base,
    id: base.id ?? cloud.businessId,
    businessId: base.businessId ?? cloud.businessId,
    planId: cloud.planId ?? base.planId ?? null,
    tier: cloud.tier ?? base.tier,
    status: cloud.status === 'trial' ? 'active' : cloud.status ?? base.status,
    isTrial: cloud.isTrial ? 1 : cloud.isTrial ?? base.isTrial ?? 0,
    startedAt: cloud.startedAt ?? base.startedAt ?? null,
    expiresAt: cloud.expiresAt ?? base.expiresAt ?? null,
    trialStartedAt: cloud.isTrial ? cloud.startedAt ?? base.trialStartedAt ?? null : base.trialStartedAt ?? null,
    trialEndsAt: cloud.isTrial ? cloud.expiresAt ?? base.trialEndsAt ?? null : base.trialEndsAt ?? null,
    autoRenew: base.autoRenew ?? 0,
    plan: base.plan ?? null,
    cloudSyncedAt: cloud.syncedAt,
    cloudStatus: cloud.status,
    cloudAccess: cloud.access,
    cloudPlanName: cloud.planName,
    cloudLicenseKey: cloud.licenseKey,
  };
}

/** Merge the cloud snapshot into the renewal-info shape. */
export function mergeIntoRenewal(local: any): any {
  const cloud = getCloudSubscription();
  if (!cloud) return local;
  if (!cloud.expiresAt) return local;

  const now = new Date();
  const expiry = new Date(cloud.expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    ...(local ?? {}),
    daysRemaining,
    expiresAt: cloud.expiresAt,
    isExpired: cloud.status === 'expired' || cloud.status === 'payment_rejected' || daysRemaining <= 0,
    needsRenewal: daysRemaining <= 7 && cloud.status !== 'payment_rejected',
    tier: cloud.tier,
    status: cloud.status,
    isTrial: cloud.isTrial === 1,
  };
}

/**
 * Mirror the account's backend businesses (owned + memberships) into the local
 * `businesses` table so the desktop switcher lists every business the linked
 * account can operate — matching Shega Mobile's `ensureRemoteBusinessSeeded`.
 *
 * Businesses already present are matched by the backend `business_id` recorded
 * in `businesses.cloud_business_id`, then by name. Every seeded business gets a
 * minimal warehouse/location/register so POS features stay usable, and the
 * membership role is stamped onto the local owner row.
 */
export function seedBusinessesFromMemberships(memberships: {
  owned?: Array<{ business_name?: string; name?: string; full_name?: string }>;
  memberships?: Array<{ business_id?: number; business_name?: string; role?: string; user_name?: string; permissions?: string[] | null }>;
}): number[] {
  const seeded: number[] = [];
  const owned = memberships?.owned ?? [];
  const members = memberships?.memberships ?? [];
  if (!owned.length && !members.length) return seeded;

  const ensureChildStores = (bizId: number) => {
    const hasWarehouse = db.prepare('SELECT COUNT(*) c FROM warehouses WHERE businessId = ?').get(bizId) as any;
    if (!hasWarehouse?.c) {
      db.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)')
        .run(bizId, 'Main Warehouse', 'Headquarters', 'Operations Manager');
    }
    const hasLocation = db.prepare('SELECT COUNT(*) c FROM locations WHERE businessId = ? AND is_deleted = 0').get(bizId) as any;
    if (!hasLocation?.c) {
      const loc = db.prepare('INSERT INTO locations (businessId, name, address) VALUES (?, ?, ?)').run(bizId, 'Main Location', null);
      db.prepare('INSERT INTO registers (businessId, locationId, name, isActive) VALUES (?, ?, ?, 1)')
        .run(bizId, loc.lastInsertRowid as number, 'Main Register');
    }
  };

  const findLocal = (remoteId: number | null, name: string) => {
    if (remoteId != null) {
      try {
        const byId = db.prepare('SELECT id FROM businesses WHERE cloud_business_id = ?').get(remoteId) as any;
        if (byId?.id != null) return Number(byId.id);
      } catch { /* column added by a later migration */ }
    }
    const byName = db.prepare('SELECT id FROM businesses WHERE businessName = ? OR storeName = ?').get(name, name) as any;
    return byName?.id != null ? Number(byName.id) : null;
  };

  const linkCloudId = (remoteId: number | null, bizId: number) => {
    if (remoteId == null) return;
    try {
      const taken = db.prepare('SELECT id FROM businesses WHERE cloud_business_id = ? AND id != ?').get(remoteId, bizId) as any;
      if (taken) return; // already mapped to another local row — never hijack it
      db.prepare('UPDATE businesses SET cloud_business_id = ? WHERE id = ?').run(remoteId, bizId);
    } catch { /* pre-migration schema */ }
  };

  const adopt = (remoteId: number | null, name: string, role: string, memberName?: string, permissions?: string[] | null) => {
    const clean = name.trim();
    if (!clean) return;
    const existing = findLocal(remoteId, clean);
    if (existing != null) {
      linkCloudId(remoteId, existing);
      ensureChildStores(existing);
      stampRole(existing, role, memberName, permissions);
      seeded.push(existing);
      return;
    }
    const res = db.prepare('INSERT INTO businesses (businessName, storeName, currency, isDefault, uuid) VALUES (?, ?, ?, 0, ?)')
      .run(clean, clean, 'ETB', randomUUID());
    const bizId = res.lastInsertRowid as number;
    linkCloudId(remoteId, bizId);
    ensureChildStores(bizId);
    stampRole(bizId, role, memberName, permissions);
    seeded.push(bizId);
  };

  // Memberships first: they are the only entries that carry a real business_id,
  // so they establish the mapping. `owned` is the serialized USER (no business
  // id) and is matched afterwards by name, adopting the row above instead of
  // duplicating it. Its `id` must never be written as a business id.
  for (const m of members) {
    const name = m.business_name || '';
    if (!name) continue;
    adopt(m.business_id ?? null, name, m.role || 'staff', m.user_name, m.permissions);
  }
  for (const entry of owned) {
    const name = entry.business_name || entry.name || '';
    if (!name) continue;
    adopt(null, name, 'owner', entry.full_name || entry.name);
  }

  // Unique business ids: one business can be reached by both an owned entry and
  // its membership, and must be reported once.
  return [...new Set(seeded)];
}

function stampRole(bizId: number, role: string, memberName?: string, permissions?: string[] | null) {
  const isOwner = role === 'owner' || role === 'admin' || role === 'super_admin';
  // Owners/admins get the full set; a member's permissions come from the backend
  // membership so a staff login never inherits wildcard access locally.
  const perms = isOwner ? ['*'] : (Array.isArray(permissions) && permissions.length ? permissions : []);
  try {
    const exists = db.prepare('SELECT id FROM users WHERE businessId = ? AND is_deleted = 0').get(bizId) as any;
    const now = new Date().toISOString();
    if (!exists) {
      db.prepare(`
        INSERT INTO users (businessId, name, username, email, role, roleName, permissions, isActive, isOwner, sourceType, created_at, updated_at)
        VALUES (?, ?, NULL, NULL, ?, ?, ?, 1, ?, 'admin', ?, ?)
      `).run(
        bizId,
        memberName || 'Owner',
        role,
        role.charAt(0).toUpperCase() + role.slice(1),
        JSON.stringify(perms),
        isOwner ? 1 : 0,
        now, now,
      );
      return;
    }
    db.prepare('UPDATE users SET role = ?, roleName = ?, permissions = ?, isOwner = ? WHERE businessId = ? AND is_deleted = 0 AND isOwner = 1')
      .run(role, role.charAt(0).toUpperCase() + role.slice(1), JSON.stringify(perms), isOwner ? 1 : 0, bizId);
  } catch { /* roster table unavailable on old installs */ }
}