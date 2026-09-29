/**
 * Regression tests: the device-join channel must keep the receipt roster in sync
 * with pairing decisions.
 *
 * The join channel is a second, independent way a device gains access to synced
 * data (the LAN/WAN transports register peers on connect). If approval does not
 * register the peer, that device does not gate pruning, so the hub can discard
 * rows it never pulled — and since its cursor is already non-zero, it will never
 * ask for them again. Symmetrically, a rejection must release the hold, or the
 * outbox is pinned forever by a device that can no longer authenticate.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const requestRow: any = {
  id: 'req-1',
  business_id: 'biz-1',
  code: 'ABC234',
  joiner_device_id: 'phone-JOIN',
  joiner_name: 'Phone Join',
  joiner_model: 'Pixel',
  role: 'cashier',
  platform: 'android',
  status: 'pending',
  created_at: '2026-01-01T00:00:00.000Z',
};

const registerPeer = vi.fn();
const releasePeer = vi.fn();
const pruneAckedOutbox = vi.fn();

vi.mock('./ack-store', () => ({
  registerPeer: (id: string, opts?: any) => registerPeer(id, opts),
  releasePeer: (id: string) => releasePeer(id),
  pruneAckedOutbox: () => pruneAckedOutbox(),
}));

vi.mock('../database', () => ({
  default: {
    exec: () => {},
    prepare(sql: string) {
      return {
        get: () => (sql.includes('FROM device_requests') ? requestRow : null),
        all: () => [],
        run: () => ({ changes: 1, lastInsertRowid: 1 }),
      };
    },
  },
}));

import { decideDeviceJoinRequest } from './device-requests';

describe('device-requests — receipt roster wiring', () => {
  beforeEach(() => {
    registerPeer.mockClear();
    releasePeer.mockClear();
    pruneAckedOutbox.mockClear();
    requestRow.status = 'pending';
  });

  it('registers the peer on approval so it gates pruning', () => {
    decideDeviceJoinRequest({ requestId: 'req-1', decision: 'approved' } as any);

    expect(registerPeer).toHaveBeenCalledTimes(1);
    expect(registerPeer.mock.calls[0][0]).toBe('phone-JOIN');
  });

  it('passes the joiner identity along to the roster row', () => {
    decideDeviceJoinRequest({ requestId: 'req-1', decision: 'approved' } as any);

    expect(registerPeer.mock.calls[0][1]).toMatchObject({ name: 'Phone Join', platform: 'android' });
  });

  it('releases the peer on rejection and lets the outbox drain', () => {
    decideDeviceJoinRequest({ requestId: 'req-1', decision: 'rejected' } as any);

    expect(releasePeer).toHaveBeenCalledWith('phone-JOIN');
    expect(pruneAckedOutbox).toHaveBeenCalledTimes(1);
    expect(registerPeer).not.toHaveBeenCalled();
  });

  it('ignores an unknown decision without touching the roster', () => {
    const result = decideDeviceJoinRequest({ requestId: 'req-1', decision: 'maybe' } as any);

    expect(result).toBeNull();
    expect(registerPeer).not.toHaveBeenCalled();
    expect(releasePeer).not.toHaveBeenCalled();
  });
});
