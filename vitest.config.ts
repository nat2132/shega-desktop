import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // E2E suites: they bind real ports and need better-sqlite3 built against
    // Electron's ABI, so they only run under `vitest.e2e.config.ts`.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/main/sync-hub.test.ts',
      'src/main/sync/websocket-server.test.ts',
      'src/main/sync/websocket-auth.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});