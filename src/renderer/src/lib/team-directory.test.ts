import { describe, it, expect } from 'vitest';
import { uniqueSyncedTeam, isDesktopProjection } from './team-directory';

/**
 * Reproduces the live state behind the reported bug: one admin named
 * "yenenake kebede" (`yene@gmail.com`) whose synced `users` mirror existed as
 * three rows, only one of which fell inside the active business. The Teams page
 * listed the admin from `admins` and then listed its mirror again, so the owner
 * showed up as both "Super Admin" and "Owner".
 */
const DESKTOP = [{ id: 1, username: 'yene@gmail.com' }];

const SYNCED = [
  { id: 1, name: 'yenenake kebede', role: 'owner', roleName: 'Owner', isOwner: 1, sourceType: 'admin', sourceId: null },
  { id: 2, name: 'yenenake kebede', username: 'yene@gmail.com', role: 'owner', roleName: 'Owner', isOwner: 1, sourceType: 'admin', sourceId: 1 },
  { id: 3, name: 'yenenake kebede', role: 'owner', roleName: 'Owner', isOwner: 1, sourceType: 'admin', sourceId: 1 },
];

describe('synced team rows vs desktop staff', () => {
  it('drops every mirror of a desktop admin, however its id is spaced', () => {
    // The mirror ids are unrelated to the admin id, which is exactly why the
    // previous id-based dedup let them through.
    expect(uniqueSyncedTeam(SYNCED, DESKTOP)).toEqual([]);
  });

  it('drops a mirror even when sourceId is null', () => {
    expect(isDesktopProjection({ sourceType: 'admin', username: null }, new Set())).toBe(true);
    expect(isDesktopProjection({ sourceType: 'employee', username: null }, new Set())).toBe(true);
  });

  it('keeps a genuine team member created on another device', () => {
    const mobile = [
      { id: 7, name: 'Abebe', username: 'abebe', role: 'cashier', sourceType: null, sourceId: null },
    ];
    expect(uniqueSyncedTeam(mobile, DESKTOP)).toHaveLength(1);
    expect(uniqueSyncedTeam(mobile, DESKTOP)[0].name).toBe('Abebe');
  });

  it('drops a synced row that carries a desktop admin username', () => {
    // The sourceType can be lost in transit; the unique username still ties the
    // row to the same person.
    const orphan = [{ id: 9, name: 'yenenake kebede', username: 'YENE@gmail.com', sourceType: null }];
    expect(uniqueSyncedTeam(orphan, DESKTOP)).toEqual([]);
  });

  it('keeps two different people who happen to share a display name', () => {
    const rows = [
      { id: 10, name: 'yenenake kebede', username: 'other@x.test', sourceType: null },
      { id: 11, name: 'yenenake kebede', username: 'third@x.test', sourceType: null },
    ];
    expect(uniqueSyncedTeam(rows, DESKTOP)).toHaveLength(2);
  });

  it('collapses repeated ids within the synced list', () => {
    const rows = [
      { id: 12, name: 'Abebe', sourceType: null },
      { id: 12, name: 'Abebe', sourceType: null },
    ];
    expect(uniqueSyncedTeam(rows, DESKTOP)).toHaveLength(1);
  });

  it('tolerates missing inputs', () => {
    expect(uniqueSyncedTeam(null, DESKTOP)).toEqual([]);
    expect(uniqueSyncedTeam(SYNCED, null)).toEqual([]);
    expect(uniqueSyncedTeam(undefined, undefined)).toEqual([]);
  });
});
