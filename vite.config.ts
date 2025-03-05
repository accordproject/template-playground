import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";

async function getPlugins() {
  const chunkSplitPlugin = await import('vite-plugin-chunk-split');
  return [chunkSplitPlugin.chunkSplitPlugin()];
}
// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [nodePolyfills(), react(), visualizer({
    emitFile: true,
    filename: "stats.html",
  }), getPlugins()],
  optimizeDeps: {
    include: ["immer", "zustand"],
    needsInterop: ['@accordproject/template-engine'],
  },
});


// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/utils/testing/setup.ts",
  },
});

export default mergeConfig(viteConfig, vitestConfig);
