/**
 * Tests for the shared delivery-receipt watermark math.
 *
 * This is the single source of truth for what a peer may claim to hold. Every
 * implementation error here either deletes data a peer still needs (claiming a
 * receipt it never earned) or pins the outbox forever (under-claiming), so the
 * edge cases are spelled out rather than left to the call sites.
 */

import { describe, it, expect } from 'vitest';
import { computeReceiptWatermark, pruneableSeqs, unconfirmedCap } from '@shega/shared';

describe('computeReceiptWatermark', () => {
  it('advances across a fully applied contiguous batch', () => {
    const { ackedUpto, failedSeqs } = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'applied' },
      { seq: 3, outcome: 'applied' },
    ], 3);

    expect(ackedUpto).toBe(3);
    expect(failedSeqs).toEqual([]);
  });

  it('stops before a failed change so its row keeps gating', () => {
    const { ackedUpto, failedSeqs } = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'pending' },
      { seq: 3, outcome: 'applied' },
    ], 3);

    expect(ackedUpto).toBe(1);
    expect(failedSeqs).toEqual([2]);
  });

  it('treats a skipped change as a hole, not as merged', () => {
    const { ackedUpto } = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'skipped' },
      { seq: 3, outcome: 'applied' },
    ], 3);

    expect(ackedUpto).toBe(1);
  });

  it('counts a conflict as merged — both sides converged, nothing to retry', () => {
    const { ackedUpto, failedSeqs } = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'conflict' },
    ], 2);

    expect(ackedUpto).toBe(2);
    expect(failedSeqs).toEqual([]);
  });

  it('bridges a sparse batch: gaps owned by other devices must not stall the prefix', () => {
    // Seq 5 belongs to a row this peer was never asked about (it was already
    // settled, or the hub simply never had a row there). Walking strictly from
    // the last receipt would stop at 4 forever and no receipt would ever be
    // emitted again.
    const { ackedUpto } = computeReceiptWatermark(4, [
      { seq: 6, outcome: 'applied' },
      { seq: 7, outcome: 'applied' },
    ], 7);

    expect(ackedUpto).toBe(7);
  });

  it('still stops at a real hole inside a sparse batch', () => {
    // 7 is a genuine failure, so 8 must not be claimed even though 9 applied.
    const { ackedUpto, failedSeqs } = computeReceiptWatermark(4, [
      { seq: 6, outcome: 'applied' },
      { seq: 7, outcome: 'failed' },
      { seq: 8, outcome: 'applied' },
    ], 8);

    expect(ackedUpto).toBe(6);
    expect(failedSeqs).toEqual([7]);
  });

  it('resumes from a persisted prefix after a restart', () => {
    // The regression this guards: restarting the walk from 0 meant the first
    // seq never lined up, so a restarted client emitted no receipts at all and
    // the hub retained the outbox forever.
    const { ackedUpto } = computeReceiptWatermark(500, [
      { seq: 501, outcome: 'applied' },
      { seq: 502, outcome: 'applied' },
    ], 502);

    expect(ackedUpto).toBe(502);
  });

  it('never regresses below the previous receipt', () => {
    const { ackedUpto } = computeReceiptWatermark(10, [
      { seq: 4, outcome: 'applied' },
      { seq: 5, outcome: 'applied' },
    ], 5);

    expect(ackedUpto).toBe(10);
  });

  it('never claims more than the hub actually offered', () => {
    // A buggy or hostile client could report a seq beyond the batch ceiling.
    const { ackedUpto } = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'applied' },
      { seq: 3, outcome: 'applied' },
    ], 2);

    expect(ackedUpto).toBe(2);
  });

  it('advances on an empty batch — the hub had nothing outstanding', () => {
    const { ackedUpto } = computeReceiptWatermark(7, [], 9);

    expect(ackedUpto).toBe(9);
  });

  it('does not advance on an empty batch when the ceiling is not known', () => {
    const { ackedUpto } = computeReceiptWatermark(7, [], 0);

    expect(ackedUpto).toBe(7);
  });

  it('holds nothing back for a full snapshot', () => {
    // A snapshot is rebuilt from live tables, so a superseded row cannot be
    // missing from it; the whole range is genuinely present.
    const { ackedUpto } = computeReceiptWatermark(3, [
      { seq: 4, outcome: 'applied' },
      { seq: 5, outcome: 'failed' },
    ], 5, { isSnapshot: true });

    expect(ackedUpto).toBe(5);
  });

  it('ignores malformed seq values instead of reporting a bogus watermark', () => {
    const { ackedUpto } = computeReceiptWatermark(4, [
      { seq: Number.NaN, outcome: 'applied' },
      { seq: 0, outcome: 'applied' },
      { seq: 5.9, outcome: 'applied' },
    ], 6);

    expect(ackedUpto).toBe(5);
  });

  it('returns the previous receipt when no entry has a usable seq', () => {
    const { ackedUpto } = computeReceiptWatermark(4, [
      { seq: Number.NaN, outcome: 'applied' },
    ], 6);

    expect(ackedUpto).toBe(4);
  });

  it('is order-independent', () => {
    const ordered = computeReceiptWatermark(0, [
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'applied' },
      { seq: 3, outcome: 'applied' },
    ], 3);
    const shuffled = computeReceiptWatermark(0, [
      { seq: 3, outcome: 'applied' },
      { seq: 1, outcome: 'applied' },
      { seq: 2, outcome: 'applied' },
    ], 3);

    expect(shuffled.ackedUpto).toBe(ordered.ackedUpto);
  });
});

describe('unconfirmedCap', () => {
  it('caps at the lowest unconfirmed row', () => {
    // Row 3 has not been confirmed, so the peer can claim at most 2 — claiming
    // past it would unlock a row the hub may not even have sent it.
    expect(unconfirmedCap(0, [3, 4])).toBe(2);
  });

  it('reports no cap when nothing is outstanding', () => {
    expect(unconfirmedCap(8, [])).toBe(Number.POSITIVE_INFINITY);
  });

  it('ignores malformed seqs', () => {
    expect(unconfirmedCap(5, [Number.NaN, 0, -3])).toBe(Number.POSITIVE_INFINITY);
  });

  it('never drops below the previously reported receipt', () => {
    // A late or duplicate ack for older rows must not walk the peer backwards.
    expect(unconfirmedCap(9, [3, 4])).toBe(9);
  });

  it('yields zero when the very first row is unconfirmed', () => {
    expect(unconfirmedCap(0, [1])).toBe(0);
  });
});

describe('pruneableSeqs', () => {
  it('prunes a fully confirmed batch', () => {
    const results = new Map([[1, 'applied'], [2, 'applied'], [3, 'conflict']]);
    expect(pruneableSeqs([1, 2, 3], results)).toEqual([1, 2, 3]);
  });

  it('keeps rows the hub never reported, even when later ones landed', () => {
    // The regression: a truncated `results` array used to read as "all good" for
    // every seq it did not mention, and those rows were deleted unrecoverably.
    const results = new Map([[1, 'applied'], [3, 'applied']]);
    expect(pruneableSeqs([1, 2, 3], results)).toEqual([1]);
  });

  it('caps the prune at the lowest unconfirmed row', () => {
    // Seq 2 can never land (unresolved FK). Per-row filtering would keep
    // deleting 3 and 4 and punch a permanent hole in the outbox.
    const results = new Map([[1, 'applied'], [2, 'pending'], [3, 'applied'], [4, 'applied']]);
    expect(pruneableSeqs([1, 2, 3, 4], results)).toEqual([1]);
  });

  it('prunes nothing when the hub reports no per-change outcomes', () => {
    // Absence of results is not evidence of success. Re-pushing is idempotent by
    // client_seq; deleting on a bare 200 is how changes disappeared.
    expect(pruneableSeqs([1, 2, 3], null)).toEqual([]);
  });

  it('treats a non-merged status as a hole', () => {
    for (const status of ['pending', 'skipped', 'failed', 'rejected']) {
      const results = new Map<number, string>([[1, 'applied'], [2, status]]);
      expect(pruneableSeqs([1, 2], results)).toEqual([1]);
    }
  });

  it('handles a sparse batch left by earlier prunes', () => {
    // Rows 2-4 were already pruned, so the batch is 1,5,6,7. The gap is not a
    // hole and must not stall the prune.
    const results = new Map([[1, 'applied'], [5, 'applied'], [6, 'applied'], [7, 'applied']]);
    expect(pruneableSeqs([1, 5, 6, 7], results)).toEqual([1, 5, 6, 7]);
  });

  it('ignores malformed seqs and empty batches', () => {
    const results = new Map([[1, 'applied']]);
    expect(pruneableSeqs([], results)).toEqual([]);
    expect(pruneableSeqs([Number.NaN, 0, -2], results)).toEqual([]);
  });
});
