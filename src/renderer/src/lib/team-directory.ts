/**
 * The Teams directory merges three sources: the local `employees` and `admins`
 * tables, and the synced `users` table that `user-bridge` writes as a mirror of
 * those same two tables.
 *
 * The synced rows are therefore not extra people. They are the same humans seen
 * through the sync layer, so rendering them alongside the desktop rows showed
 * one person twice — the owner appearing as both "Owner" and "Super Admin".
 * Anything carrying a `sourceType` of admin or employee is that mirror and must
 * be dropped; the desktop table already lists them.
 */

export interface SyncedTeamRow {
  id: number | string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  roleName?: string | null;
  isOwner?: boolean | number | null;
  isActive?: boolean | number | null;
  avatar?: string | null;
  /** Which desktop table this row mirrors, when it is a mirror. */
  sourceType?: string | null;
  sourceId?: number | string | null;
}

const DESKTOP_SOURCE_TYPES = new Set(['admin', 'employee']);

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

/**
 * True when a synced row is a mirror of a desktop admin/employee rather than a
 * team member in its own right.
 *
 * `sourceId` is deliberately not required: rows that arrived from the sync side
 * can carry a `sourceType` with a null `sourceId`, and they are still the same
 * person. The source row is guaranteed to exist because a removed admin or
 * employee is soft-deleted in `users` by `bridgeDeleteBySource`, and those rows
 * are already excluded from the query.
 */
export function isDesktopProjection(
  row: Pick<SyncedTeamRow, 'sourceType' | 'username'>,
  desktopUsernames: Set<string>,
): boolean {
  if (row.sourceType && DESKTOP_SOURCE_TYPES.has(norm(row.sourceType))) return true;
  // Safety net for a synced row that lost its sourceType but still carries the
  // username of a desktop admin, which is unique per account.
  const username = norm(row.username);
  if (username && desktopUsernames.has(username)) return true;
  return false;
}

export interface DesktopPerson {
  id: number | string;
  username?: string | null;
}

/**
 * The synced rows that represent people the desktop tables do not already list.
 */
export function uniqueSyncedTeam<T extends SyncedTeamRow>(
  rows: T[] | null | undefined,
  desktop: DesktopPerson[] | null | undefined,
): T[] {
  const usernames = new Set(
    (desktop || []).map((d) => norm(d.username)).filter(Boolean),
  );
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows || []) {
    if (isDesktopProjection(row, usernames)) continue;
    const key = String(row.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
