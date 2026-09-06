import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const sharedAlias = {
  '@shega/shared': resolve(__dirname, '../shega-shared/src/index.ts')
}

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
    plugins: [react()]
  }
})