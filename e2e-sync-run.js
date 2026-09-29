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
    // `usb` ships a compiled .node binding that esbuild cannot load, and the
    // sync e2e never touches USB. Marking it external keeps the bundle buildable
    // and lets the hardware layer degrade gracefully.
    external: ['electron', 'better-sqlite3', 'usb', '@serialport/parser-delimiter'],
    // Mirror electron.vite.config.ts: an exact-match alias does not cover
    // `@shega/shared/*` subpath imports, which the hardware layer uses.
    alias: {
      '@shega/shared': path.resolve(ROOT, '..', 'shega-shared', 'src', 'index.ts'),
    },
    plugins: [{
      // Resolve `@shega/shared/<subpath>` against the shared source tree. The
      // .ts extension is appended explicitly because esbuild does not do
      // extension probing for an absolute path we hand it.
      name: 'shega-shared-subpath',
      setup(build) {
        build.onResolve({ filter: /^@shega\/shared\// }, (args) => ({
          path: path.resolve(ROOT, '..', 'shega-shared', 'src', args.path.replace('@shega/shared/', '')) + '.ts',
        }));
      },
    }],
    logLevel: 'silent'
  });

  // 3. run the real-entry E2E
  const code = await runElectron(path.join(OUT, 'verify.js'), TEMP);
  fs.writeFileSync(path.join(OUT, 'PASS'), String(code === 0 ? 1 : 0));
  process.exit(code ?? 1);
})();
