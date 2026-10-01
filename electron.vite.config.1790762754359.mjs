// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
var __electron_vite_injected_dirname = "C:\\Users\\Natol\\Desktop\\Projects\\shega-desktop";
var sharedAlias = [
  { find: /^@shega\/shared$/, replacement: resolve(__electron_vite_injected_dirname, "../shega-shared/src/index.ts") },
  { find: /^@shega\/shared\/(.*)$/, replacement: resolve(__electron_vite_injected_dirname, "../shega-shared/src/$1") }
];
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ["@shega/shared"] })],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        external: ["better-sqlite3"]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ["@shega/shared"] })],
    resolve: { alias: sharedAlias }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        ...sharedAlias
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: void 0
        }
      }
    },
    plugins: [react()]
  }
});
export {
  electron_vite_config_default as default
};
