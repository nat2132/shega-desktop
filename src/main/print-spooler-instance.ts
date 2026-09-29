/**
 * Print spooler singleton — binds the transport-agnostic queue in
 * `print-spooler.ts` to the real database and printer transport.
 *
 * Kept separate so the queue logic itself has no Electron/better-sqlite3
 * import and can be unit-tested against node:sqlite in plain Node.
 */

import db from './database';
import { getPrinterConfig, printRaw } from './print-service';
import { PrintSpooler, type SpoolerDb } from './print-spooler';

export const printSpooler = new PrintSpooler({
  // better-sqlite3's Database satisfies SpoolerDb structurally.
  db: db as unknown as SpoolerDb,
  print: (bytes) => printRaw(bytes),
  isEnabled: () => getPrinterConfig().enabled,
});
