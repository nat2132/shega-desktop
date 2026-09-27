/**
 * DESTRUCTIVE development helper — deletes all local data for this device.
 *
 * This is NEVER run automatically. `npm start` and `npm run dev` launch the app
 * normally and keep every database, device ID, session, business and setting.
 * Run this only when you deliberately want to test a true first-run install:
 *
 *     npm run reset:device
 *
 * The app must be closed first; this script force-kills any running instance.
 * It is equivalent to deleting the app's data folder, so anything not already
 * synced to the backend is lost. The in-app Settings screen has the same
 * capability behind "Fresh Install Reset (DEV)".
 *
 * Paths removed:
 *   - %APPDATA%\<app>       userData: SQLite (packaged builds), window-state.json,
 *                           updater.log, Local Storage, Chromium caches
 *   - <project>\db          dev SQLite database (database.ts uses cwd in dev)
 *   - <project>\shega-yjs-docs
 *                           Yjs/CRDT sync documents — real app data, per device
 *   - <project>\logs        dev logs (logger.ts uses cwd in dev)
 *   - %LOCALAPPDATA%\shega-desktop-updater
 *                           electron-updater download cache
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Resolve from this file so the reset works no matter where npm was invoked.
const projectRoot = path.resolve(__dirname, '..');
const appData = path.join(os.homedir(), 'AppData', 'Roaming');
const localAppData = path.join(os.homedir(), 'AppData', 'Local');

// Electron names userData after productName ("Shega") in packaged builds and
// after the package name ("shega-desktop") in dev, so both are listed.
const TARGETS = [
  [path.join(appData, 'Shega'), 'userData: %APPDATA%\\Shega'],
  [path.join(appData, 'shega-desktop'), 'userData: %APPDATA%\\shega-desktop'],
  [path.join(projectRoot, 'db'), 'dev database: <project>\\db'],
  [path.join(projectRoot, 'shega-yjs-docs'), 'sync documents: <project>\\shega-yjs-docs'],
  [path.join(projectRoot, 'logs'), 'dev logs: <project>\\logs'],
  [path.join(localAppData, 'shega-desktop-updater'), 'updater cache: %LOCALAPPDATA%\\shega-desktop-updater'],
];

/** Non-interactive callers must opt in explicitly, so this never runs by surprise. */
const FORCE = process.argv.includes('--yes') || process.argv.includes('-y');

/**
 * Refuse to delete anything without deliberate confirmation. `npm start` and
 * `npm run dev` do not invoke this script at all, so a normal launch can never
 * reach this point.
 */
async function confirm() {
  if (FORCE) return true;

  const present = TARGETS.filter(([target]) => fs.existsSync(target));
  if (!present.length) {
    console.log('Nothing to reset — this device has no local app data.');
    return false;
  }

  console.log('WARNING: this permanently deletes local data for this device.\n');
  for (const [, label] of present) console.log('  -', label);
  console.log('\nAnything not already synced to the backend cannot be recovered.');

  if (!process.stdin.isTTY) {
    console.error('\nRefusing to run non-interactively. Re-run with --yes to confirm.');
    process.exitCode = 1;
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question('\nType RESET to confirm: ', resolve));
  rl.close();
  return answer.trim() === 'RESET';
}

/**
 * Windows releases file locks lazily, so a single delete can fail while the OS
 * is still tearing the old process down. Retry a few times.
 * Returns 'cleared', 'missing', or 'failed'.
 */
function remove(target) {
  if (!fs.existsSync(target)) return 'missing';
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return 'cleared';
    } catch (e) {
      if (attempt === 5) {
        console.error(`Failed to remove ${target}:`, e.message);
        process.exitCode = 1;
        return 'failed';
      }
      try {
        execSync('ping -n 2 127.0.0.1 > nul', { stdio: 'ignore' });
      } catch {
        /* wait anyway */
      }
    }
  }
  return 'failed';
}

async function main() {
  if (!(await confirm())) return;

  // Kill any running instance so it cannot hold a lock on its data folder.
  for (const image of ['electron.exe', 'shega-desktop.exe', 'Shega.exe']) {
    try {
      execSync(`taskkill /F /IM ${image} /T`, { stdio: 'ignore' });
      console.log('Killed running process:', image);
    } catch {
      /* not running */
    }
  }

  const cleared = [];
  const missing = [];
  for (const [target, label] of TARGETS) {
    const result = remove(target);
    if (result === 'cleared') cleared.push(label);
    else if (result === 'missing') missing.push(label);
  }

  console.log('');
  console.log('Reset to a fresh device:');
  for (const label of cleared) console.log('  - cleared', label);
  if (missing.length) {
    console.log('Already absent:');
    for (const label of missing) console.log('  -', label);
  }
  console.log('\nStart the app again to test a genuine first run.');
}

main();
