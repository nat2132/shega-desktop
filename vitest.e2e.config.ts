import { defineConfig } from 'vitest/config';

/**
 * E2E suites that the default `vitest.config.ts` deliberately skips: they bind
 * real ports and open a real (throwaway) database, so they are opt-in rather
 * than part of `npm run test:unit`.
 *
 *   npx vitest run --config vitest.e2e.config.ts
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
