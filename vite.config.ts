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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "**/e2e/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/tests/**",
        "src/utils/testing/**",
        "*.config.{js,ts}",
        "vite.config.ts",
      ],
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
