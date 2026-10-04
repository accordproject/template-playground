import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";
import inject from "@rollup/plugin-inject";
import { createRequire } from "node:module";
import rebuildWorkerDevPlugin from "./vite-plugin-rebuild-worker";

const require = createRequire(import.meta.url);
// The same shim vite-plugin-node-stdlib-browser injects into the main bundle.
const nodeGlobalsShim = require.resolve("node-stdlib-browser/helpers/esbuild/shim");
// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [rebuildWorkerDevPlugin(), nodePolyfills(), react(), visualizer({
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
  /*
   * The template rendering sandbox worker (src/sandbox/rebuild.worker.ts)
   * is bundled by a separate Rollup run that does not see the plugins above,
   * so the Node globals the Accord Project libraries expect are injected
   * here explicitly. They must be listed under `worker.plugins`: Vite
   * replaces any `plugins` given in `worker.rollupOptions` with this list.
   * `enforce: "post"` runs the injection after the CommonJS conversion, as
   * it does for the main bundle; injected earlier, its `import` statements
   * make the libraries' CommonJS files look like ES modules and their
   * exports are lost. The IIFE format produces the single self-contained
   * classic script that the sandbox loads with importScripts(); see
   * vite-plugin-rebuild-worker.ts for why it must be classic, and for the
   * dev-server equivalent.
   */
  worker: {
    format: "iife",
    plugins: [
      {
        ...inject({
          global: [nodeGlobalsShim, "global"],
          process: [nodeGlobalsShim, "process"],
          Buffer: [nodeGlobalsShim, "Buffer"],
        }),
        enforce: "post",
      },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Rollup's shared CommonJS interop helpers must not live inside a
          // heavy vendor chunk, or every importer is forced to preload it.
          if (id.includes("commonjsHelpers")) return "cjs-helpers";
          const groups: Record<string, string[]> = {
            "template-engine": ["@accordproject/template-engine"],
            "markdown-transform": ["@accordproject/markdown-transform"],
            "markdown-template": ["@accordproject/markdown-template"],
            concerto: ["@accordproject/concerto-core", "@accordproject/concerto-cto"],
            anthropic: ["@anthropic-ai/sdk"],
            "google-genai": ["@google/genai"],
            mistral: ["@mistralai/mistralai"],
            openai: ["openai"],
          };
          for (const [name, pkgs] of Object.entries(groups)) {
            if (pkgs.some((pkg) => id.includes(`/node_modules/${pkg}/`))) return name;
          }
          return undefined;
        },
      },
    },
  },
});


// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
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