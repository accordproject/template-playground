import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import {
  defineConfig as defineVitestConfig,
  configDefaults,
} from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    nodePolyfills(),
    react(),
    visualizer({
      emitFile: true,
      filename: "stats.html",
    }),
  ],
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ["@accordproject/template-engine"],
  },
  define: {
    "process.env.TYPESCRIPT_URL": JSON.stringify(
      "https://cdn.jsdelivr.net/npm/typescript@5.1.6/+esm",
    ),
  },
});

// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
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
    alias: process.env.VITEST
      ? {
          "monaco-editor": "monaco-editor/esm/vs/editor/editor.api",
        }
      : {},
  },
});

export default mergeConfig(viteConfig, vitestConfig);
