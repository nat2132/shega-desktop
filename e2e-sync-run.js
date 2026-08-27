/* E2E launcher: (1) seed an empty DB with a `settings` table under electron,
   (2) esbuild-bundle e2e-sync-entry.ts (externalizing electron+better-sqlite3),
   (3) run the bundle under electron.exe with the temp cwd so the REAL
   database.ts + sync-hub.ts initialize against <temp>/db/shega_desktop.db. */
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const esbuild = require('esbuild');

const ROOT = __dirname;
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-sync-e2e-'));
const OUT = path.join(ROOT, 'e2e-sync-out');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const electronExe = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe');

function runElectron(script, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(electronExe, [script], {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: '1', ELECTRON_HEADLESS: '1' }
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code));
  });
}

(async () => {
  // 1. seed settings table (fresh DB avoids database.ts top-level crash)
  const seed = path.join(ROOT, 'e2e-sync-seed.js');
  const seedCode = await runElectron(seed, TEMP);
  if (seedCode !== 0) { console.error('seed failed', seedCode); process.exit(seedCode); }

  // 2. bundle the real-entry E2E
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'e2e-sync-entry.ts')],
    outfile: path.join(OUT, 'verify.js'),
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    external: ['electron', 'better-sqlite3'],
    logLevel: 'silent'
  });

  // 3. run the real-entry E2E
  const code = await runElectron(path.join(OUT, 'verify.js'), TEMP);
  fs.writeFileSync(path.join(OUT, 'PASS'), String(code === 0 ? 1 : 0));
  process.exit(code ?? 1);
})();
