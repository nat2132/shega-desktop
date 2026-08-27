/* Pre-seed an empty DB with just the `settings` table so database.ts's top-level
   integrity check (which INSERTs into settings BEFORE initDB creates the rest)
   doesn't crash on a fresh DB. Run under electron.exe (better-sqlite3 = Electron ABI). */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dir = path.join(process.cwd(), 'db');
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, 'shega_desktop.db'));
db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)');
db.close();
process.exit(0);
