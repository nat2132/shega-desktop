import { describe, it, expect, vi, beforeEach } from 'vitest';

// `logger` reads `app.isPackaged` at module scope, so `electron` must be
// mocked before the module graph is imported. The same pattern is used by
// pin-change-gate.test.ts / view-only-gate.test.ts.
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: () => '',
  },
}));

type Diag = typeof import('./diagnostics');

async function load(): Promise<Diag> {
  vi.resetModules();
  return await import('./diagnostics');
}

describe('sync/diagnostics — connection-timing telemetry (P0)', () => {
  let diag: Diag;

  beforeEach(async () => {
    diag = await load();
    diag.__resetDiagnostics();
  });

  it('records time-to-first-peer from the cycle start', async () => {
    diag.beginCycle('startup');
    diag.markPeerFound('dev-a', { host: '192.168.1.20' });
    const cycle = diag.endCycle();

    expect(cycle).not.toBeNull();
    expect(cycle!.reason).toBe('startup');
    expect(cycle!.timeToFirstPeerMs).not.toBeNull();
    expect(cycle!.timeToFirstPeerMs!).toBeGreaterThanOrEqual(0);
    // Peers were seen but never connected, so the later marks must stay null
    // rather than being coerced to 0.
    expect(cycle!.timeToConnectedMs).toBeNull();
    expect(cycle!.timeToFirstSyncMs).toBeNull();
  });

  it('times only the FIRST of each mark within a cycle', async () => {
    diag.beginCycle('network-changed');
    diag.markPeerFound('dev-a');
    diag.markPeerFound('dev-a');
    diag.markPeerFound('dev-b');
    diag.markConnected('dev-a', { transport: 'lan-ws' });
    diag.markConnected('dev-b', { transport: 'lan-tcp' });
    diag.markFirstSync('dev-a');

    const cycle = diag.endCycle();
    expect(cycle!.timeToFirstPeerMs).not.toBeNull();
    expect(cycle!.timeToConnectedMs).not.toBeNull();
    expect(cycle!.timeToFirstSyncMs).not.toBeNull();
  });

  it('counts every peer found in the cycle, not just the first', async () => {
    // Discovery layers report volume through countPeerFound() (one call per
    // reconcile with the batch size) so a sweep of 3 hits reads as "3 peers",
    // while only the first hit is used for the latency figure.
    diag.beginCycle('interval');
    diag.markPeerFound('dev-a');
    diag.countPeerFound(3);
    diag.markPeerFound('dev-b');
    diag.countPeerFound(1);
    const cycle = diag.endCycle();

    expect(cycle!.peersFound).toBe(4);
    expect(cycle!.timeToFirstPeerMs).not.toBeNull();
  });

  it('ignores marks that arrive with no open cycle', async () => {
    // A background sweep or a late socket can mark outside any window. This
    // must not throw and must not fabricate a cycle.
    diag.markPeerFound('dev-a');
    diag.markConnected('dev-a', { transport: 'lan-ws' });
    diag.markFirstSync('dev-a');
    expect(diag.endCycle()).toBeNull();
    expect(diag.getDiagnosticsSnapshot().last).toBeNull();
  });

  it('is re-entrant: a burst of signals measures from the first one', async () => {
    diag.beginCycle('mdns-up');
    diag.beginCycle('network-changed'); // must be ignored
    diag.markPeerFound('dev-a');
    const cycle = diag.endCycle();

    expect(cycle!.reason).toBe('mdns-up');
  });

  it('tracks per-peer transport, addresses and heartbeat age', async () => {
    diag.markConnected('dev-a', { transport: 'lan-ws', addresses: ['192.168.1.20:5758'] });
    diag.markHeartbeat('dev-a', { transport: 'lan-ws' });
    diag.markFirstSync('dev-a');

    const snap = diag.getDiagnosticsSnapshot();
    const peer = snap.peers.find((p) => p.deviceId === 'dev-a');
    expect(peer).toBeDefined();
    expect(peer!.transport).toBe('lan-ws');
    expect(peer!.connected).toBe(true);
    expect(peer!.addresses).toEqual(['192.168.1.20:5758']);
    expect(peer!.lastHeartbeatAt).not.toBeNull();
    expect(peer!.lastSyncAt).not.toBeNull();
  });

  it('clears the connected flag on disconnect but keeps the record', async () => {
    diag.markConnected('dev-a', { transport: 'lan-ws' });
    diag.markDisconnected('dev-a');

    const peer = diag.getDiagnosticsSnapshot().peers.find((p) => p.deviceId === 'dev-a');
    expect(peer!.connected).toBe(false);
    expect(peer!.transport).toBe('none');
  });

  it('reports a cycle as in-flight while the window is open', async () => {
    diag.beginCycle('interval');
    expect(diag.isCycleOpen()).toBe(true);
    const snap = diag.getDiagnosticsSnapshot();
    expect(snap.current).not.toBeNull();
    expect(snap.current!.reason).toBe('interval');

    diag.endCycle();
    expect(diag.isCycleOpen()).toBe(false);
    expect(diag.getDiagnosticsSnapshot().current).toBeNull();
  });

  it('keeps a bounded history of recent cycles', async () => {
    for (let i = 0; i < 30; i += 1) {
      diag.beginCycle('interval');
      diag.markPeerFound('dev-a');
      diag.endCycle();
    }
    const snap = diag.getDiagnosticsSnapshot();
    // The ring buffer is capped; it must not grow without bound.
    expect(snap.recent.length).toBeLessThanOrEqual(20);
    expect(snap.recent.length).toBeGreaterThan(0);
    expect(snap.last).not.toBeNull();
  });

  it('caps the mark buffer', async () => {
    for (let i = 0; i < 500; i += 1) diag.mark(`probe-${i}`);
    const snap = diag.getDiagnosticsSnapshot();
    expect(snap.marks.length).toBeLessThanOrEqual(200);
  });

  it('drops peers unheard from for longer than the stale window', async () => {
    diag.markHeartbeat('dev-old');
    // Backdate the last signal past the 5-minute staleness window.
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(Date.now() + 10 * 60_000);
    try {
      expect(diag.getDiagnosticsSnapshot().peers.find((p) => p.deviceId === 'dev-old')).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });
});
