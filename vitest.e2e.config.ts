import { defineConfig } from 'vitest/config';

/**
 * Config used ONLY for the sync-hub integration suite (real HTTP hub against
 * a throwaway DB). It aliases `better-sqlite3` to a Node-ABI copy installed in
 * the temp dir, because the repo copy is built for Electron's ABI and cannot
 * load under plain Node.
 */
const abmel = 'C:/Users/Natol/AppData/Local/Temp/opencode/abmel/node_modules/better-sqlite3';

export default defineConfig({
  resolve: {
    alias: {
      'better-sqlite3': abmel,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/main/sync-hub.test.ts', 'src/main/sync/websocket-server.test.ts'],
  },
});