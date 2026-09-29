import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// The bare specifier plus a wildcard for subpath imports
// (`@shega/shared/peripherals/escpos-encoder`). The wildcard is required: an
// exact-match alias does not cover subpaths, and the e2e sync harness bundles
// main-process code with esbuild, so an unresolvable subpath fails the build.
const sharedAlias = [
  { find: /^@shega\/shared$/, replacement: resolve(__dirname, '../shega-shared/src/index.ts') },
  { find: /^@shega\/shared\/(.*)$/, replacement: resolve(__dirname, '../shega-shared/src/$1') },
]

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@shega/shared'] })],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['@shega/shared'] })],
    resolve: { alias: sharedAlias }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        ...sharedAlias
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    plugins: [react()]
  }
})