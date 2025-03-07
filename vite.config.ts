import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    nodePolyfills(), 
    react(), 
    visualizer({
      emitFile: true,
      filename: "stats.html",
    })
  ],
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      "@samples": path.resolve(__dirname, "src/samples"),
      "@editors": path.resolve(__dirname, "src/editors"),
      "@pages": path.resolve(__dirname, "src/pages"),
    },
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
