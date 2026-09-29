import { defineConfig } from 'vitest/config';

/**
 * E2E suites that the default `vitest.config.ts` deliberately skips: they bind
 * real ports and need better-sqlite3 built against Electron's ABI, so they are
 * opt-in rather than part of `npm run test:unit`.
 *
 *   npm run test:e2e
 *
 * KNOWN PRE-EXISTING FAILURES in the two older files (NOT regressions, and not
 * caused by the P3 work — they have been excluded from CI since before it):
 *   - `websocket-server.test.ts` hardcodes `schemaVersion === 21` while
 *     PROTOCOL_VERSION is 22, and two tests insert the same invite code
 *     (`K2M-4NP-QW8`), tripping a UNIQUE constraint.
 *   - `sync-hub.test.ts` asserts on business-uuid values that have since been
 *     re-generated.
 * `websocket-auth.test.ts` is the suite that is current and fully green.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/main/sync-hub.test.ts',
      'src/main/sync/websocket-server.test.ts',
      'src/main/sync/websocket-auth.test.ts',
    ],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Both suites bind a fixed port and chdir() into a temp dir, so they must
    // not run concurrently with each other.
    fileParallelism: false,
  },
});
