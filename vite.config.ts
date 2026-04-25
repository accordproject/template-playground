import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [nodePolyfills(), react(), visualizer({
    emitFile: true,
    filename: "stats.html",
  })],
  define: {
    'process.browser': true,
    'process.env': {},
  },
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
  },
});
