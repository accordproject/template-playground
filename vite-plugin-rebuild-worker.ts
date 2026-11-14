import { createRequire } from "node:module";
import path from "node:path";
import * as esbuild from "esbuild";
import type { Plugin, ViteDevServer } from "vite";

/**
 * Dev-server support for the template rendering sandbox worker.
 *
 * The sandbox (see `src/sandbox/rebuildSandboxDocument.ts`) is a null-origin
 * iframe that runs the Template Engine in a *classic* Web Worker loaded with
 * `importScripts()`. Two browser constraints force that shape:
 *
 * - Chrome cannot start a module worker from a `blob:` URL inside a
 *   null-origin document, so the worker must be classic.
 * - A null origin is cross-origin to everything, and module scripts need
 *   CORS headers while `importScripts()` does not. The production host
 *   (static S3/CloudFront) sends none, so `importScripts()` it is.
 *
 * In production Vite's worker build (`worker.format: "iife"`) already emits
 * the self-contained classic script that `importScripts()` needs. The dev
 * server, however, serves the worker as an ES module with live imports,
 * which a classic worker cannot load. This plugin fills that gap in dev:
 *
 * 1. It intercepts the `?worker&url` import of `rebuild.worker.ts` and
 *    points it at a virtual `/__rebuild-worker.js` instead.
 * 2. It serves that path by bundling the worker with esbuild into a single
 *    classic script, using the same Node polyfill shim as the app bundle.
 *
 * The bundle is cached and rebuilt when a file under `src/` changes.
 */

const WORKER_ENTRY = "src/sandbox/rebuild.worker.ts";
const DEV_WORKER_PATH = "/__rebuild-worker.js";
const VIRTUAL_URL_ID = "\0rebuild-worker-dev-url";

const require = createRequire(import.meta.url);
const stdLibBrowser = require("node-stdlib-browser") as Record<string, string>;
const stdLibEsbuildPlugin = require("node-stdlib-browser/helpers/esbuild/plugin") as (
  lib: Record<string, string>,
) => esbuild.Plugin;
const nodeGlobalsShim = require.resolve("node-stdlib-browser/helpers/esbuild/shim");

/** Mirrors Vite's `?raw` import (used for the bundled .cto models) for esbuild. */
const rawImportPlugin: esbuild.Plugin = {
  name: "vite-raw-import",
  setup(build) {
    build.onResolve({ filter: new RegExp("[?]raw$") }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.slice(0, -"?raw".length)),
      namespace: "raw-text",
    }));
    build.onLoad({ filter: new RegExp(".*"), namespace: "raw-text" }, async (args) => ({
      contents: await import("node:fs/promises").then((fs) => fs.readFile(args.path, "utf8")),
      loader: "text",
    }));
  },
};

function isWorkerUrlImport(id: string): boolean {
  const [file, query] = id.split("?");
  return (
    typeof query === "string" &&
    query.split("&").includes("worker") &&
    query.split("&").includes("url") &&
    (file.endsWith("/sandbox/rebuild.worker") || file.endsWith("/sandbox/rebuild.worker.ts"))
  );
}

export default function rebuildWorkerDevPlugin(): Plugin {
  let root = process.cwd();
  let bundle: Promise<string> | null = null;

  const buildWorker = async (): Promise<string> => {
    const result = await esbuild.build({
      entryPoints: [path.resolve(root, WORKER_ENTRY)],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      target: "es2020",
      logLevel: "silent",
      // Same globals as vite-plugin-node-stdlib-browser gives the app bundle.
      inject: [nodeGlobalsShim],
      define: {
        global: "global",
        process: "process",
        Buffer: "Buffer",
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
      plugins: [stdLibEsbuildPlugin(stdLibBrowser), rawImportPlugin],
    });
    return result.outputFiles[0].text;
  };

  return {
    name: "rebuild-worker-dev",
    apply: "serve",
    enforce: "pre",

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      return isWorkerUrlImport(id) ? VIRTUAL_URL_ID : null;
    },

    load(id) {
      return id === VIRTUAL_URL_ID ? `export default ${JSON.stringify(DEV_WORKER_PATH)};` : null;
    },

    configureServer(server: ViteDevServer) {
      const srcDir = path.resolve(root, "src");
      const invalidate = (file: string) => {
        // path.relative, not startsWith: on Windows it ignores drive-letter case.
        const relative = path.relative(srcDir, path.resolve(file));
        if (!relative.startsWith("..") && !path.isAbsolute(relative)) bundle = null;
      };
      server.watcher.on("change", invalidate);
      server.watcher.on("add", invalidate);
      server.watcher.on("unlink", invalidate);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || req.url.split("?")[0] !== DEV_WORKER_PATH) {
          next();
          return;
        }
        try {
          bundle = bundle ?? buildWorker();
          const code = await bundle;
          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(code);
        } catch (error) {
          bundle = null;
          server.config.logger.error(
            `[rebuild-worker-dev] failed to bundle ${WORKER_ENTRY}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("rebuild worker bundle failed; see the dev server log");
        }
      });
    },
  };
}
