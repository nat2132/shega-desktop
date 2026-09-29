/* Enforcement for a pending legacy-PIN replacement.
 *
 * A legacy account authenticates with its old 4-digit PIN, and the main process
 * builds the full session at that point — otherwise nothing would know who the
 * replacement belongs to. The renderer then holds that person on the forced
 * PIN-change screen, but the renderer is NOT a security boundary: anything that
 * can reach an IPC channel (a devtools console, a stale window, a queued sync)
 * could otherwise use business data before the upgrade is done.
 *
 * So the main process blocks business-data writes for as long as an upgrade grant
 * is outstanding. Reads stay available so the pre-launch screen still boots, and
 * the auth channels — `login`, `set-own-pin`, `clear-session`,
 * `reset-pin-with-recovery` — are never business writes and so keep working.
 *
 * The gate lifts the moment the grant is consumed (successful replacement), or is
 * dropped by `clear-session` on sign-out.
 */
import { ipcMain } from 'electron';
import { isWriteChannel } from './view-only-gate';
import { PIN_LENGTH } from './pin';
import { peekPinChangeGrant } from './pin-change-grant';

/** Marker the renderer can recognise if it ever surfaces this. */
export const PIN_CHANGE_REQUIRED_CODE = 'PIN_CHANGE_REQUIRED';

/** True while a legacy account must still replace its PIN. */
export function isPinChangePending(): boolean {
  return peekPinChangeGrant() !== null;
}

/**
 * Whether `channel` may run right now. Business writes are refused only while an
 * upgrade is outstanding; everything else is untouched.
 */
export function isChannelAllowedDuringPinChange(channel: string): boolean {
  if (!isPinChangePending()) return true;
  if (!isWriteChannel(channel)) return true;
  return false;
}

let installed = false;

/**
 * Install the gate. Must run BEFORE any `ipcMain.handle` registration so every
 * handler is wrapped; calling it twice is a no-op.
 */
export function installPinChangeGate(): void {
  if (installed) return;
  installed = true;

  const original = ipcMain.handle.bind(ipcMain);
  (ipcMain as unknown as { handle: typeof ipcMain.handle }).handle = ((
    channel: string,
    listener: (event: unknown, ...args: any[]) => any,
  ) => {
    if (!isWriteChannel(channel)) return original(channel, listener);
    return original(channel, async (event: unknown, ...args: any[]) => {
      if (!isChannelAllowedDuringPinChange(channel)) {
        throw new Error(
          `[${PIN_CHANGE_REQUIRED_CODE}] Choose a new ${PIN_LENGTH}-digit PIN before using your business data.`,
        );
      }
      return listener(event, ...args);
    });
  }) as typeof ipcMain.handle;
}
