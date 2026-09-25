import { describe, it, expect, vi, beforeEach } from 'vitest';

const cloudState = { row: null as any, throwOnRead: false };

const handlers = new Map<string, (event: unknown, ...args: any[]) => any>();

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
  getCloudSubscription: () => {
    if (cloudState.throwOnRead) throw new Error('database unavailable');
    return cloudState.row;
  },
}));

const ipcMainRef = { handle: vi.fn() };

type GateModule = typeof import('./view-only-gate');

async function loadGate(): Promise<GateModule> {
  vi.resetModules();
  return import('./view-only-gate');
}

beforeEach(() => {
  cloudState.row = null;
  cloudState.throwOnRead = false;
  handlers.clear();
  vi.clearAllMocks();
});

describe('view-only gate — channel classification', () => {
  it('never blocks read, report, print or device channels', async () => {
    const { isWriteChannel } = await loadGate();
    const reads = [
      'get-sales', 'get-item-by-barcode', 'get-dashboard-stats', 'get-renewal-info',
      'get-current-subscription', 'list-backups', 'get-employees', 'check-stock-consistency',
      'print-receipt', 'print-label', 'barcode-png', 'verify-audit-chain',
      'reports:z-report', 'pos:products', 'pos:shift-by-register', 'ledger:balance',
      'ledger:shift-summary', 'shift:active', 'shift:summary', 'shift:transactions',
      'tax:calculate', 'tax:vat-return', 'etax:export-sales', 'compliance:report',
      'mor:list', 'mor:is-verified', 'p2p:devices', 'p2p:health', 'cloud:status',
      'business:list', 'business:switch', 'invites:list', 'pairing:list',
      'join:lookup', 'item-barcodes:list', 'update:check', 'update:install',
      'app:quit', 'mock:scan', 'mock:status', 'mock:print-receipt', 'mock:decode',
      'peripheral:phones', 'peripheral:scan', 'export-data', 'get-setting',
      'set-setting', 'get-notifications', 'mark-notification-read',
      'device:name', 'device', 'pair-beacon:nearby', 'join:status',
      // local reminder/notification state is not business data
      'create-reminder', 'complete-reminder', 'run-reminder-engine', 'get-reminders',
    ];
    for (const channel of reads) {
      expect(isWriteChannel(channel), `${channel} must stay readable`).toBe(false);
    }
  });

  it('never blocks subscription billing or recovery channels', async () => {
    const { isWriteChannel } = await loadGate();
    const recovery = [
      'backend-login', 'backend-logout', 'backend-sync', 'backend-session',
      'backend-plans', 'backend-submit-payment', 'backend-start-trial',
      'submit-payment', 'start-trial', 'check-trial-availability',
      'check-premium-feature', 'get-subscription-plans', 'get-subscription-history',
      'reset-pin-with-recovery', 'create-backup', 'restore-backup', 'delete-backup',
    ];
    for (const channel of recovery) {
      expect(isWriteChannel(channel), `${channel} must stay available`).toBe(false);
    }
  });

  it('blocks every business-data mutation channel', async () => {
    const { isWriteChannel } = await loadGate();
    const writes = [
      'insert-sale', 'insert-item', 'insert-customer', 'insert-supplier-payment',
      'update-business', 'update-item', 'update-sale', 'update-employee-role',
      'delete-customer', 'delete-sale',
      'save-draft-sale', 'delete-draft-sale', 'archive-customer',
      'restore-item', 'void-sale', 'pay-debt', 'transfer-stock', 'restock-item',
      'convert-order-to-sale', 'cancel-order', 'reverse-debt-payment',
      'import-data', 'reset-data-foo', 'fix-stock-consistency', 'cleanup-stock-movements',
      'reactivate-employee', 'lock-user-account', 'unlock-employee-account',
      'force-pin-change', 'open-cash-drawer', 'approve-payment', 'reject-payment',
      'add-customer-note', 'duplicate-employee-role', 'factory-reset', 'simulate-scan',
      'business:create', 'business:update', 'shift:open', 'shift:close',
      'shift:mid-audit', 'shift:blind-count', 'shift:record-transaction', 'ledger:reverse',
      'invites:create', 'invites:decide', 'join:accept', 'pairing:revoke',
      'item-barcodes:add', 'item-barcodes:remove', 'p2p:approve-one', 'p2p:revoke-device',
      'cloud:sync', 'cloud:save-config', 'demo:seed', 'approval:resolve', 'tax:advance',
    ];
    for (const channel of writes) {
      expect(isWriteChannel(channel), `${channel} must be gated`).toBe(true);
    }
  });
});

describe('view-only gate — access verdicts', () => {
  it('allows an unlinked install to keep using its own data', async () => {
    const { canWriteNow } = await loadGate();
    expect(canWriteNow()).toEqual({ allowed: true });
  });

  it('allows an active license', async () => {
    cloudState.row = { status: 'active', access: 'full' };
    const { canWriteNow } = await loadGate();
    expect(canWriteNow()).toEqual({ allowed: true });
  });

  it('allows an active trial', async () => {
    cloudState.row = { status: 'trial', access: 'full', isTrial: 1 };
    const { canWriteNow } = await loadGate();
    expect(canWriteNow()).toEqual({ allowed: true });
  });

  it('locks an expired license with an actionable message', async () => {
    cloudState.row = { status: 'expired', access: 'view_only' };
    const { canWriteNow, VIEW_ONLY_CODE } = await loadGate();
    const verdict = canWriteNow();
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.message).toContain(VIEW_ONLY_CODE);
      expect(verdict.message).toMatch(/expired/i);
    }
  });

  it('locks while a payment is still pending approval', async () => {
    cloudState.row = { status: 'pending_payment', access: 'view_only' };
    const { canWriteNow, VIEW_ONLY_CODE } = await loadGate();
    const verdict = canWriteNow();
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.message).toContain(VIEW_ONLY_CODE);
  });

  it('locks a rejected payment and tells the user to resubmit', async () => {
    cloudState.row = { status: 'payment_rejected', access: 'view_only' };
    const { canWriteNow } = await loadGate();
    const verdict = canWriteNow();
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.message).toMatch(/rejected/i);
  });

  it('honours the backend access flag even when the status says active', async () => {
    cloudState.row = { status: 'active', access: 'view_only' };
    const { canWriteNow } = await loadGate();
    expect(canWriteNow().allowed).toBe(false);
  });

  it('explains a read-only flag without claiming the subscription expired', async () => {
    cloudState.row = { status: 'active', access: 'view_only' };
    const { canWriteNow } = await loadGate();
    const verdict = canWriteNow();
    if (!verdict.allowed) {
      expect(verdict.message).toMatch(/read-only/i);
      expect(verdict.message).not.toMatch(/expired/i);
    }
  });

  it('caches the verdict until the cache is reset, then re-reads the status', async () => {
    cloudState.row = { status: 'expired', access: 'view_only' };
    const { canWriteNow, resetWriteGateCache } = await loadGate();
    expect(canWriteNow().allowed).toBe(false);

    cloudState.row = { status: 'active', access: 'full' };
    expect(canWriteNow().allowed).toBe(false); // still cached

    resetWriteGateCache();
    expect(canWriteNow().allowed).toBe(true);
  });

  it('fails open when the status lookup throws', async () => {
    cloudState.throwOnRead = true;
    const { canWriteNow } = await loadGate();
    expect(canWriteNow().allowed).toBe(true);
  });
});

describe('view-only gate — handler wrapping', () => {
  it('blocks writes while read-only, still serves reads, and resumes writes after renewal', async () => {
    cloudState.row = { status: 'expired', access: 'view_only' };
    const { installViewOnlyGate, resetWriteGateCache, VIEW_ONLY_CODE } = await loadGate();
    installViewOnlyGate();

    const write = vi.fn().mockResolvedValue('written');
    const read = vi.fn().mockResolvedValue('read');
    const { ipcMain } = await import('electron');
    ipcMain.handle('insert-sale', write);
    ipcMain.handle('get-sales', read);

    await expect(handlers.get('insert-sale')!({})).rejects.toThrow(VIEW_ONLY_CODE);
    expect(write).not.toHaveBeenCalled();

    await expect(handlers.get('get-sales')!({})).resolves.toBe('read');
    expect(read).toHaveBeenCalledTimes(1);

    // Renewal flips the backend status; the same wrapper must let writes through.
    cloudState.row = { status: 'active', access: 'full' };
    resetWriteGateCache();
    await expect(handlers.get('insert-sale')!({}, { total: 10 })).resolves.toBe('written');
    expect(write).toHaveBeenCalledWith({}, { total: 10 });
  });

  it('does not double-wrap when installed twice', async () => {
    cloudState.row = { status: 'active', access: 'full' };
    const { installViewOnlyGate } = await loadGate();
    installViewOnlyGate();
    const first = (await import('electron')).ipcMain.handle;
    installViewOnlyGate();
    expect((await import('electron')).ipcMain.handle).toBe(first);
  });
});
