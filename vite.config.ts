import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";
// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [nodePolyfills(), react(), visualizer({
    emitFile: true,
    filename: "stats.html",
  })],
  resolve: {
    alias: {
      // Defensive safeguard: forces axios to use the browser-safe XHR adapter
      // instead of the Node http adapter (which pulls in zlib, crashing in browser builds).
      // Primary fix is offline:true + removing updateExternalModels() in store.ts —
      // this alias is an extra precaution for any indirect axios usage.
      // Note: relies on axios internals — revisit if axios is upgraded.
      './adapters/http.js': 'axios/lib/adapters/xhr.js',
    },
  },
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
  },
});


// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/utils/testing/setup.ts",
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    server: {
      deps: {
        inline: ["monaco-editor"],
      },
    },
  },
  resolve: {
    alias: process.env.VITEST ? {
      "monaco-editor": "monaco-editor/esm/vs/editor/editor.api",
    } : {},
  },
});

export default mergeConfig(viteConfig, vitestConfig);
