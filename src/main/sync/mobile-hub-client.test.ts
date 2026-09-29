/**
 * Regression tests for the LAN-hub (phone-as-hub) push receipt path.
 *
 * The failure these guard against is silent data loss: when the client_seq
 * contract breaks, every pushed row looks "applied" to the desktop, becomes
 * eligible for pruning, and is deleted while the phone never actually merged it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const rows: any[] = [];
const tableRows: Record<string, any> = {};

vi.mock('../database', () => ({
  default: {
    prepare(sql: string) {
      return {
        all: (hubId: string) => rows.filter((r) => r.device_id === hubId || r.device_id === null),
        get: (id: number) => tableRows[sql]?.[id] ?? null,
      };
    },
  },
}));

// mobile-hub-client transitively imports electron (via sync-hub) and the real
// logger; neither is exercised by the pure functions under test.
vi.mock('../sync-hub', () => ({
  ensureHubDeviceId: () => 'hub-1',
  applyRemoteChanges: () => ({ applied: 0, conflicts: 0, skipped: 0, pending: 0 }),
  persistPeerDevice: () => {},
}));
vi.mock('../logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

import { buildPushChanges, contiguousAppliedPrefix } from './mobile-hub-client';

describe('mobile-hub-client — push receipt', () => {
  beforeEach(() => {
    rows.length = 0;
    for (const k of Object.keys(tableRows)) delete tableRows[k];
  });

  describe('buildPushChanges', () => {
    it('carries the outbox seq as client_seq so per-change results can be matched', () => {
      rows.push(
        { seq: 7, entity: 'items', entity_uuid: 'a', op: 'INSERT', row_id: 1, device_id: 'hub-1' },
        { seq: 9, entity: 'items', entity_uuid: 'b', op: 'INSERT', row_id: 2, device_id: 'hub-1' },
      );
      tableRows['SELECT * FROM items WHERE id = ?'] = { 1: { id: 1, uuid: 'a' }, 2: { id: 2, uuid: 'b' } };

      const { changes, pushedSeqs } = buildPushChanges('hub-1');

      expect(pushedSeqs).toEqual([7, 9]);
      // Every change must expose client_seq, otherwise applyPush on the hub
      // reports client_seq: null and nothing can be correlated.
      expect(changes.map((c) => c.client_seq)).toEqual([7, 9]);
      expect(changes.every((c) => c.client_seq !== null && c.client_seq !== undefined)).toBe(true);
    });

    it('still stamps client_seq on DELETE changes', () => {
      rows.push({ seq: 3, entity: 'items', entity_uuid: 'c', op: 'DELETE', row_id: 5, device_id: 'hub-1' });

      const { changes } = buildPushChanges('hub-1');

      expect(changes).toHaveLength(1);
      expect(changes[0].client_seq).toBe(3);
      expect(changes[0].payload.uuid).toBe('c');
    });

    it('skips a row whose entity table is missing rather than pushing an empty payload', () => {
      rows.push({ seq: 1, entity: 'not_a_table', entity_uuid: 'z', op: 'INSERT', row_id: 1, device_id: 'hub-1' });

      const { changes, pushedSeqs } = buildPushChanges('hub-1');

      expect(changes).toHaveLength(0);
      expect(pushedSeqs).toEqual([]);
    });
  });

  describe('contiguousAppliedPrefix', () => {
    it('stops at a pending row so it cannot be pruned', () => {
      // seq 3 could not merge yet (FK ordering); 4 and 5 are fine. The watermark
      // must stay at 2 so row 3 keeps its slot.
      const { prefix, failed } = contiguousAppliedPrefix([2, 3, 4, 5], [
        { client_seq: 2, status: 'applied' },
        { client_seq: 3, status: 'pending' },
        { client_seq: 4, status: 'applied' },
        { client_seq: 5, status: 'applied' },
      ]);

      expect(prefix).toBe(2);
      expect(failed).toContain(3);
    });

    it('treats an unmatched result as not applied', () => {
      // A null client_seq is what the hub reports when the client_seq contract
      // is broken. Matching must not silently fall through to "applied".
      const { prefix, failed } = contiguousAppliedPrefix([1, 2], [
        { client_seq: null, status: 'applied' },
        { client_seq: null, status: 'applied' },
      ]);

      expect(prefix).toBe(0);
      expect(failed).toEqual([1, 2]);
    });

    it('counts a conflict as merged (both sides converged, nothing to retry)', () => {
      const { prefix } = contiguousAppliedPrefix([1, 2], [
        { client_seq: 1, status: 'applied' },
        { client_seq: 2, status: 'conflict' },
      ]);

      expect(prefix).toBe(2);
    });

    it('does not advance across a skipped row', () => {
      const { prefix } = contiguousAppliedPrefix([1, 2, 3], [
        { client_seq: 1, status: 'applied' },
        { client_seq: 2, status: 'skipped' },
        { client_seq: 3, status: 'applied' },
      ]);

      expect(prefix).toBe(1);
    });

    it('falls back to trusting the hub when it returns no per-change results', () => {
      const { prefix, failed } = contiguousAppliedPrefix([1, 2], null);

      expect(prefix).toBe(2);
      expect(failed).toEqual([]);
    });

    it('reports nothing applied when every row failed', () => {
      const { prefix } = contiguousAppliedPrefix([1, 2], [
        { client_seq: 1, status: 'pending' },
        { client_seq: 2, status: 'pending' },
      ]);

      expect(prefix).toBe(0);
    });

    it('advances past a sparse batch instead of stalling on another author’s row', () => {
      // The desktop outbox interleaves rows from every device. Rows 3 and 5 are
      // other authors' and were never pushed here, so they are not holes. Before
      // this was fixed the prefix stopped at 2 forever and the phone's receipt
      // never advanced again, so the outbox never drained on this transport.
      const { prefix } = contiguousAppliedPrefix(
        [6, 7, 8],
        [
          { client_seq: 6, status: 'applied' },
          { client_seq: 7, status: 'applied' },
          { client_seq: 8, status: 'applied' },
        ],
        { lastReceipt: 4, unpushedSeqs: [] }
      );

      expect(prefix).toBe(8);
    });

    it('refuses to claim past a row that was never pushed to this peer', () => {
      // Row 9 is still in the outbox but belongs to another author, so this
      // phone cannot vouch for it — and because a receipt is a prefix claim it
      // cannot claim 10 either.
      const { prefix } = contiguousAppliedPrefix(
        [6, 7, 8, 10],
        [
          { client_seq: 6, status: 'applied' },
          { client_seq: 7, status: 'applied' },
          { client_seq: 8, status: 'applied' },
          { client_seq: 10, status: 'applied' },
        ],
        { lastReceipt: 4, unpushedSeqs: [9] }
      );

      expect(prefix).toBe(8);
    });

    it('never regresses a receipt it has already reported', () => {
      const { prefix } = contiguousAppliedPrefix(
        [3, 4],
        [
          { client_seq: 3, status: 'applied' },
          { client_seq: 4, status: 'applied' },
        ],
        { lastReceipt: 40, unpushedSeqs: [] }
      );

      expect(prefix).toBe(40);
    });
  });
});
