import { defineConfig as defineViteConfig, mergeConfig, type Plugin } from "vite";
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
/*
 * @anthropic-ai/sdk lazily imports its Node-only agent toolset (fs/promises,
 * child_process, ...) from lib/environments/worker. The playground never
 * uses it, and bundling it fails because node:fs/promises cannot be
 * polyfilled. Replace it, in both the build and the dev server's dependency
 * pre-bundling, with a module that fails to load, as it would in a browser.
 */
const ANTHROPIC_NODE_TOOLSET = /\/tools\/agent-toolset\/node\.m?js$/;
const ANTHROPIC_NODE_TOOLSET_STUB = "\0anthropic-node-toolset-stub";
const ANTHROPIC_NODE_TOOLSET_STUB_CODE =
  'throw new Error("The Anthropic agent toolset requires Node.js");';
const isAnthropicNodeToolset = (source: string, importer?: string) =>
  Boolean(importer?.replace(/\\/g, "/").includes("/node_modules/@anthropic-ai/sdk/")) &&
  ANTHROPIC_NODE_TOOLSET.test(source);

function stubAnthropicNodeToolset(): Plugin {
  return {
    name: "stub-anthropic-node-toolset",
    enforce: "pre",
    config: () => ({
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            {
              name: "stub-anthropic-node-toolset",
              setup(build) {
                build.onResolve({ filter: ANTHROPIC_NODE_TOOLSET }, ({ path, importer }) =>
                  isAnthropicNodeToolset(path, importer)
                    ? { path, namespace: "anthropic-node-toolset-stub" }
                    : undefined
                );
                build.onLoad({ filter: /.*/, namespace: "anthropic-node-toolset-stub" }, () => ({
                  contents: ANTHROPIC_NODE_TOOLSET_STUB_CODE,
                }));
              },
            },
          ],
        },
      },
    }),
    resolveId(source, importer) {
      return isAnthropicNodeToolset(source, importer) ? ANTHROPIC_NODE_TOOLSET_STUB : null;
    },
    load(id) {
      return id === ANTHROPIC_NODE_TOOLSET_STUB ? ANTHROPIC_NODE_TOOLSET_STUB_CODE : null;
    },
  };
}

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [rebuildWorkerDevPlugin(), stubAnthropicNodeToolset(), nodePolyfills(), react(), visualizer({
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
          // Likewise Vite's preload helper and the Node globals (process,
          // Buffer) the polyfill plugin injects, which the SDK chunks share
          // with the entry.
          if (id.includes("vite/preload-helper")) return "preload-helper";
          if (
            id.includes("/node_modules/node-stdlib-browser/helpers/esbuild/shim") ||
            id.includes("/node_modules/node-stdlib-browser/cjs/proxy/process") ||
            id.includes("/node_modules/node-stdlib-browser/node_modules/buffer/")
          ) {
            return "node-globals";
          }
          const groups: Record<string, string[]> = {
            "template-engine": ["@accordproject/template-engine"],
            "markdown-transform": ["@accordproject/markdown-transform"],
            "markdown-template": ["@accordproject/markdown-template"],
            concerto: ["@accordproject/concerto-core", "@accordproject/concerto-cto"],
            anthropic: ["@anthropic-ai/sdk"],
            "google-genai": ["@google/genai"],
            mistral: ["@mistralai/mistralai"],
            openai: ["openai"],
            groq: ["groq-sdk"],
            openrouter: ["@openrouter/sdk"],
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