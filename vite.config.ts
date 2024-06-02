import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'
import nodePolyfills from 'vite-plugin-node-stdlib-browser'

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    nodePolyfills(),
    react()],
});

// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './utils/testing/setup.ts',
  },
});

export default mergeConfig(viteConfig, vitestConfig);