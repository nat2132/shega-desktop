// approval.ts — Desktop runtime for spec §15 "Manager PIN approval".
//
// Mobile already ships the full request → PIN entry → verify → approve flow
// against an approver's salted scrypt hash. This module brings the same model
// to the Desktop main process, keeping verification server-side (never trust a
// compromised renderer).
//
// Flow (mirrors Mobile):
//   1. A sensitive action calls gateSensitiveAction(webContents, ctx).
//   2. If the acting user is an approver (Owner/Administrator/Manager/super_admin)
//      the action proceeds directly — same bypass Mobile applies for owner/manager.
//   3. Otherwise we resolve an approval-capable user (owner/manager with a PIN),
//      prompt the renderer for that PIN, and verify it here in main with scrypt.
//   4. 'approved'  -> the caller executes the action and audits it.
//      'denied'    -> the action does NOT run.
//      'cancelled' -> the approver dismissed the prompt; action does NOT run.

import crypto from 'crypto';
import type { WebContents } from 'electron';
import db from './database';

export type ApprovalOutcome = 'approved' | 'denied' | 'cancelled';

export interface ApprovalPromptPayload {
  requestId: string;
  title?: string;
  message?: string;
  approverName?: string;
  context: string;
}

export interface Approver {
  source: 'admin' | 'employee';
  id: number;
  name: string;
  role: string;
  pin: string | null;
}

export type ApproverVerifier = (pin: string, stored: string) => boolean;

const APPROVER_ROLES = new Set(['Owner', 'Administrator', 'Manager', 'super_admin', 'admin']);

export function isApproverRole(role: string | null | undefined): boolean {
  return !!role && APPROVER_ROLES.has(role);
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

export function verifyStoredPin(pin: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) {
    const legacy = crypto.createHash('sha256').update(pin).digest('hex');
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto.scryptSync(pin, salt, 64).toString('hex');
  return check === key;
}

/**
 * Resolve an approval-capable user for the active business: an Owner/Manager/
 * Administrator with a configured PIN (preferring the highest role), falling
 * back to any approver-role user even without a PIN (so the gate can report a
 * clear "no approver configured" denial rather than silently approving).
 */
export function resolveApprover(businessId: number | null): Approver | undefined {
  const admins = db
    .prepare(
      `SELECT id, name, role, pin FROM admins
       WHERE (businessId IS NULL OR businessId = ?) AND isActive = 1`
    )
    .all(businessId) as any[];
  const employees = db
    .prepare(
      `SELECT ea.id, e.firstName, e.lastName, r.name AS role, ea.pin
       FROM employee_accounts ea
       JOIN employees e ON ea.employeeId = e.id
       JOIN employee_roles r ON e.roleId = r.id
       WHERE ea.isActive = 1`
    )
    .all() as any[];

  const candidates: Approver[] = [
    ...admins.map((a) => ({
      source: 'admin' as const,
      id: a.id,
      name: a.name || 'Admin',
      role: a.role || 'admin',
      pin: a.pin ?? null,
    })),
    ...employees.map((s) => ({
      source: 'employee' as const,
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Employee',
      role: s.role || 'employee',
      pin: s.pin ?? null,
    })),
  ].filter((c) => isApproverRole(c.role));

  const ranking = ['Owner', 'super_admin', 'Administrator', 'Manager', 'admin'];
  const byRank = (a: Approver, b: Approver) => {
    const ad = ranking.indexOf(a.role);
    const bd = ranking.indexOf(b.role);
    return (ad === -1 ? 99 : ad) - (bd === -1 ? 99 : bd);
  };
  const withPin = candidates.filter((c) => c.pin).sort(byRank);
  return withPin[0] ?? candidates.sort(byRank)[0];
}

/**
 * A single in-flight PIN prompt. The renderer resolves it via `approval:resolve`
 * (or `approval:cancel`) IPC; the actual scrypt verification happens in the
 * `approval:resolve` handler below, in the main process.
 */
interface PendingPrompt {
  resolveGate: (o: ApprovalOutcome) => void;
  approver: Approver | undefined;
  verifier: ApproverVerifier;
  timer: NodeJS.Timeout;
}

const pending = new Map<string, PendingPrompt>();

const PROMPT_TIMEOUT_MS = 2 * 60 * 1000;

export function registerApprovalResolvers(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ipcMain } = require('electron') as typeof import('electron');

  ipcMain.handle('approval:resolve', (e, payload: { requestId: string; pin: string }) => {
    const p = pending.get(payload?.requestId);
    if (!p) return false;
    const pin = String(payload.pin ?? '');
    if (!p.approver?.pin || pin.length === 0) {
      // No approver or empty PIN — fail closed immediately.
      pending.delete(payload.requestId);
      clearTimeout(p.timer);
      p.resolveGate('denied');
      return false;
    }
    // Verify the typed PIN against the approver's stored hash HERE, in main.
    if (p.verifier(pin, p.approver.pin)) {
      pending.delete(payload.requestId);
      clearTimeout(p.timer);
      p.resolveGate('approved');
      return true;
    }
    // Wrong PIN — keep the prompt open so the approver can retry (mirrors
    // Mobile's inline error + retry). Notify the renderer, do not resolve.
    try {
      e.sender.send('approval:pin-invalid', { requestId: payload.requestId });
    } catch {
      /* noop */
    }
    return false;
  });

  ipcMain.handle('approval:cancel', (_e, requestId: string) => {
    const p = pending.get(requestId);
    if (!p) return false;
    pending.delete(requestId);
    clearTimeout(p.timer);
    p.resolveGate('cancelled');
    return true;
  });
}

/**
 * Prompt the renderer for a manager PIN and await the decision. Verification is
 * performed in main via `verifier` against the resolved approver's stored hash.
 */
export function promptForPin(
  webContents: WebContents,
  ctx: Omit<ApprovalPromptPayload, 'requestId'>,
  approver: Approver | undefined,
  verifier: ApproverVerifier = verifyStoredPin
): Promise<ApprovalOutcome> {
  const requestId = crypto.randomUUID();
  return new Promise<ApprovalOutcome>((resolveGate) => {
    const timer = setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        resolveGate('cancelled');
      }
    }, PROMPT_TIMEOUT_MS);
    pending.set(requestId, { resolveGate, approver, verifier, timer });

    const payload: ApprovalPromptPayload = { ...ctx, requestId };
    try {
      webContents.send('approval:prompt', payload);
    } catch {
      // Prompt could not be delivered — fail closed (deny).
      clearTimeout(timer);
      pending.delete(requestId);
      resolveGate('denied');
    }
  });
}
