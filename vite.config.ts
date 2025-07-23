import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";

// Get the API server URL from environment variable, with a fallback
const API_SERVER_URL = process.env.VITE_API_SERVER_URL || 'http://ec2-3-80-94-40.compute-1.amazonaws.com:9000';

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [nodePolyfills(), visualizer({
    emitFile: true,
    filename: "stats.html",
  })],
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
    exclude: ['for-each']
  },
  server: {
    proxy: {
      '/api': {
        target: API_SERVER_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          accord: ['@accordproject/template-engine', '@accordproject/concerto-core'],
        },
      },
    },
  },
});

const vitestConfig = defineVitestConfig({
  plugins: [nodePolyfills(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/utils/testing/setup.ts"],
  },
});

export default mergeConfig(viteConfig, vitestConfig);
