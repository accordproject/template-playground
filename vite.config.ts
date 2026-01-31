import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [nodePolyfills(), react(), visualizer({
    emitFile: true,
    filename: "stats.html",
  })],
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
  },
});


// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/utils/testing/setup.ts",
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    alias: {
      "monaco-editor": path.resolve(__dirname, "src/utils/testing/__mocks__/monaco-editor.ts"),
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
