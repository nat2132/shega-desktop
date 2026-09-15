/* IPC surface for MoR taxpayer verification (Section U). */
import { ipcMain } from 'electron';
import { clearVerification, getVerification, listVerifications, verifyTin } from './verifier';
import { isMorVerified } from '@shega/shared';

export function registerMorHandlers(): void {
  ipcMain.handle('mor:verify', (_e, tin: string, subTin?: string | null, force = false) =>
    verifyTin(tin, subTin, force),
  );

  ipcMain.handle('mor:get', (_e, tin: string, subTin?: string | null) =>
    getVerification(tin, subTin),
  );

  ipcMain.handle('mor:list', () => listVerifications());

  ipcMain.handle('mor:clear', (_e, tin: string) => {
    clearVerification(tin);
    return { cleared: true };
  });

  // Compliance-assistant hook: is the supplier's TIN currently MoR-verified?
  ipcMain.handle('mor:is-verified', (_e, tin: string, subTin?: string | null) => {
    const v = getVerification(tin, subTin);
    return { verified: isMorVerified(v) };
  });
}