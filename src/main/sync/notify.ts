/**
 * Push a "data changed" signal to every open renderer window.
 *
 * Every inbound replication path (LAN HTTP applyPush, WS handleSyncPush,
 * desktop↔desktop peer pull, P2P/Yjs applyRecord) funnels through SQLite.
 * This notifier is the single place that tells the UI "the DATABASE changed —
 * re-query", so screens refresh automatically without manual reload.
 */
import { BrowserWindow } from 'electron';

export interface DataAppliedStats {
  /** Number of changes successfully persisted. */
  applied: number;
  conflicts: number;
  /** Total changes examined in this batch (including skipped/pending). */
  changes: number;
  /** Which transport applied them: http | ws | peer | p2p | local */
  source: string;
}

export function notifyDataApplied(stats: DataAppliedStats): void {
  const payload = { ...stats, at: new Date().toISOString() };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('data:changed', payload);
    }
  }
}