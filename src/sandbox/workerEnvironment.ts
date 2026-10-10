/**
 * Makes the rendering worker look like the browser environment the Template
 * Engine expects. It must be the first import of `rebuild.worker.ts`, so it
 * runs before the engine module is evaluated.
 *
 * The engine picks between its browser and Node code paths by looking for
 * `window`, which a Web Worker does not have:
 *
 * - `TemplateMarkInterpreter` uses `browser-or-node`'s `isBrowser`
 *   (`window` and `window.document` both defined). Otherwise it configures
 *   a child-process evaluator at load time by calling
 *   `os.availableParallelism()`, which the browser `os` polyfill lacks, so
 *   the worker crashes before handling a single request.
 * - `TypeScriptToJavaScriptCompiler` checks `typeof window`. Otherwise it
 *   reads TypeScript's `lib.*.d.ts` files from `node_modules` on disk
 *   instead of fetching them from the TypeScript CDN.
 *
 * A worker is a browser environment, so both checks should succeed. This
 * exposes the worker global as `window`, as on the main thread, and adds an
 * empty, frozen `document`. The libraries bundled into the worker only read
 * `document` behind `typeof`/`&&` guards (`debug`'s colour detection and
 * `is-callable`'s `document.all` check), so an empty object leaves them on
 * their "no DOM" paths.
 *
 * @param scope - the global object to prepare; the worker passes `self`
 */
export function prepareWorkerEnvironment(scope: Record<string, unknown>): void {
  if (typeof scope.window === "undefined") {
    scope.window = scope;
  }
  if (typeof scope.document === "undefined") {
    scope.document = Object.freeze({});
  }
}

prepareWorkerEnvironment(globalThis as unknown as Record<string, unknown>);
