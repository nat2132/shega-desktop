import { describe, it, expect, vi, beforeEach } from 'vitest';

const handlers = new Map<string, (event: unknown, ...args: any[]) => any>();
const ipcMainRef = { handle: vi.fn() };

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: any) => {
      handlers.set(channel, listener);
      return ipcMainRef;
    },
    removeHandler: vi.fn(),
  },
}));

vi.mock('./subscription-backend', () => ({
  getCloudSubscription: () => null,
  getLocalSubscription: () => null,
}));

type GateModule = typeof import('./pin-change-gate');
type GrantModule = typeof import('./pin-change-grant');

async function load(): Promise<{ gate: GateModule; grant: GrantModule }> {
  vi.resetModules();
  const grant = await import('./pin-change-grant');
  const gate = await import('./pin-change-gate');
  // Start every case from a clean slate: the grant is a module singleton.
  grant.clearPinChangeGrant();
  return { gate, grant };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pin-change gate — nothing is blocked before a legacy login', () => {
  it('allows every channel when no upgrade is pending', async () => {
    const { gate } = await load();
    expect(gate.isPinChangePending()).toBe(false);
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(true);
    expect(gate.isChannelAllowedDuringPinChange('update-item')).toBe(true);
  });
});

describe('pin-change gate — business writes blocked while an upgrade is outstanding', () => {
  it('refuses a business write and names the reason', async () => {
    const { gate, grant } = await load();
    grant.issuePinChangeGrant('admin', 1);
    expect(gate.isPinChangePending()).toBe(true);
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(false);
    expect(gate.PIN_CHANGE_REQUIRED_CODE).toBe('PIN_CHANGE_REQUIRED');
  });

  it('keeps reads available so the pre-launch screen still boots', async () => {
    const { gate, grant } = await load();
    grant.issuePinChangeGrant('admin', 1);
    expect(gate.isChannelAllowedDuringPinChange('get-sales')).toBe(true);
    expect(gate.isChannelAllowedDuringPinChange('get-current-admin')).toBe(true);
  });

  it('keeps the auth channels working so the replacement itself can complete', async () => {
    const { gate, grant } = await load();
    grant.issuePinChangeGrant('admin', 1);
    for (const channel of ['set-own-pin', 'clear-session', 'login', 'login-by-user', 'reset-pin-with-recovery']) {
      expect(gate.isChannelAllowedDuringPinChange(channel)).toBe(true);
    }
  });

  it('lifts as soon as the grant is consumed by a successful replacement', async () => {
    const { gate, grant } = await load();
    grant.issuePinChangeGrant('admin', 1);
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(false);
    expect(grant.consumePinChangeGrant('admin', 1)).toBe(true);
    expect(gate.isPinChangePending()).toBe(false);
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(true);
  });

  it('lifts on sign-out, so a cancelled replacement restores access', async () => {
    const { gate, grant } = await load();
    grant.issuePinChangeGrant('admin', 1);
    grant.clearPinChangeGrant();
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(true);
  });

  it('stays closed when an expired grant is only discovered on redemption', async () => {
    const { gate, grant } = await load();
    const issued = 1_000_000;
    grant.issuePinChangeGrant('admin', 1, issued);
    expect(gate.isChannelAllowedDuringPinChange('insert-sale')).toBe(false);
    // A redemption attempt after expiry fails and discards the grant, which is
    // the only path that re-opens writes.
    expect(grant.consumePinChangeGrant('admin', 1, issued + grant.PIN_CHANGE_GRANT_MS + 1)).toBe(false);
  });
});

describe('pin-change gate — wraps ipcMain.handle', () => {
  it('throws on a business write while pending, and passes it through when clear', async () => {
    const { gate, grant } = await load();
    gate.installPinChangeGate();

    const write = vi.fn().mockResolvedValue('written');
    const read = vi.fn().mockResolvedValue('read');
    const { ipcMain } = await import('electron');
    ipcMain.handle('insert-sale', write);
    ipcMain.handle('get-sales', read);

    // No legacy login yet: the write runs normally.
    await expect(handlers.get('insert-sale')!({})).resolves.toBe('written');
    expect(write).toHaveBeenCalledTimes(1);

    // A legacy account signs in: the very same call is refused in main.
    grant.issuePinChangeGrant('employee', 7);
    await expect(handlers.get('insert-sale')!({})).rejects.toThrow(gate.PIN_CHANGE_REQUIRED_CODE);
    expect(write).toHaveBeenCalledTimes(1);

    // Reads are untouched throughout, so the pre-launch screen still boots.
    await expect(handlers.get('get-sales')!({})).resolves.toBe('read');
    expect(read).toHaveBeenCalledTimes(1);

    // Completing the replacement lifts the block on the same channel.
    expect(grant.consumePinChangeGrant('employee', 7)).toBe(true);
    await expect(handlers.get('insert-sale')!({})).resolves.toBe('written');
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('does not double-wrap when installed twice', async () => {
    const { gate } = await load();
    gate.installPinChangeGate();
    const first = (await import('electron')).ipcMain.handle;
    gate.installPinChangeGate();
    expect((await import('electron')).ipcMain.handle).toBe(first);
  });
});
