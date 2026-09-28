import {
  REBUILD_PING,
  REBUILD_PONG,
  REBUILD_REQUEST,
  REBUILD_RESTART,
  REBUILD_RESULT,
  REBUILD_SANDBOX_READY,
  REBUILD_WORKER_ERROR,
  REBUILD_WORKER_READY,
} from "../constants/rebuildSandbox";

/**
 * The Template Engine compiles formulas with the TypeScript compiler, which
 * fetches its `lib.*.d.ts` files from this CDN. It is the only network
 * destination the sandbox may reach.
 */
export const TYPESCRIPT_CDN_ORIGIN = "https://playgroundcdn.typescriptlang.org";

/**
 * Serialises a value for embedding inside an inline `<script>`. JSON alone
 * is not enough: the HTML parser ends the script at the first `</script`,
 * whatever the JavaScript context, so `<` is escaped as well.
 */
export function toScriptLiteral(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export interface RebuildSandboxDocumentOptions {
  /** Origin of the playground page, e.g. `https://playground.accordproject.org`. */
  origin: string;
  /** Absolute URL of the bundled `rebuild.worker.ts` script. */
  workerUrl: string;
  /** Per-document nonce authorising the inline bootstrap script. */
  nonce: string;
}

/**
 * Builds the Content Security Policy for the rendering sandbox document.
 *
 * The policy is generated at runtime because it must name the playground's
 * own origin: a sandboxed iframe has an opaque origin, so `'self'` would
 * match nothing. Blob workers inherit their creator's policy, which is how
 * these rules reach the code the engine evaluates:
 *
 * - `default-src 'none'` blocks everything not listed below, including
 *   images, frames, fonts and form submissions that could carry data out.
 * - `script-src` allows only the nonced bootstrap script, the worker bundle
 *   served from the playground origin, and `'unsafe-eval'` for the
 *   `new Function` the engine uses to run formulas.
 * - `worker-src blob:` allows the bootstrap to spawn the worker.
 * - `connect-src` allows only the TypeScript CDN.
 *
 * The worker can post anything back to the page, so the page treats every
 * reply as untrusted data: results only become HTML through
 * markdown-transform and are sanitised with DOMPurify before display.
 */
export function buildRebuildSandboxCsp(origin: string, nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' ${origin} 'unsafe-eval'`,
    "worker-src blob:",
    `connect-src ${TYPESCRIPT_CDN_ORIGIN}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

/**
 * Builds the HTML document loaded into the rendering sandbox iframe via
 * `srcdoc`. Rendered with `sandbox="allow-scripts"` (and no
 * `allow-same-origin`) the document gets a null origin.
 *
 * The bootstrap script spawns a classic `blob:` worker whose only statement
 * is `importScripts(<worker bundle URL>)`. It has to be a classic worker:
 * Chrome cannot start a module worker from a `blob:` URL inside a
 * null-origin document. And it has to be `importScripts()`: a null origin
 * is cross-origin to the playground, module scripts would need CORS headers
 * the static production host does not send, while `importScripts()` needs
 * none.
 *
 * Messages from the parent are rebuilt and forwarded to the worker. The
 * worker's replies are forwarded back only if they are one of the rendering
 * reply types, rebuilt from checked fields and stamped with the generation
 * of the worker that sent them; replies from a replaced worker are dropped.
 */
export function buildRebuildSandboxDocument({
  origin,
  workerUrl,
  nonce,
}: RebuildSandboxDocumentOptions): string {
  const csp = buildRebuildSandboxCsp(origin, nonce);
  const bootstrap = `
(function () {
  "use strict";
  var WORKER_URL = ${toScriptLiteral(workerUrl)};
  var T = {
    request: ${toScriptLiteral(REBUILD_REQUEST)},
    result: ${toScriptLiteral(REBUILD_RESULT)},
    ping: ${toScriptLiteral(REBUILD_PING)},
    pong: ${toScriptLiteral(REBUILD_PONG)},
    restart: ${toScriptLiteral(REBUILD_RESTART)},
    workerReady: ${toScriptLiteral(REBUILD_WORKER_READY)},
    workerError: ${toScriptLiteral(REBUILD_WORKER_ERROR)},
    sandboxReady: ${toScriptLiteral(REBUILD_SANDBOX_READY)}
  };
  var worker = null;
  var workerBlobUrl = null;
  // Chosen by the parent on every restart; the first worker is generation 0.
  var generation = 0;

  function post(message) {
    window.parent.postMessage(message, "*");
  }

  // Formula code runs in the worker and can post anything, so only the
  // rendering replies are relayed, rebuilt from checked fields.
  function relayable(data) {
    if (!data || typeof data !== "object") return null;
    if (data.type === T.result && typeof data.requestId === "number" && typeof data.success === "boolean") {
      return { type: T.result, requestId: data.requestId, success: data.success, ciceroMark: data.ciceroMark, error: data.error };
    }
    if (data.type === T.pong && typeof data.pingId === "number") {
      return { type: T.pong, pingId: data.pingId };
    }
    if (data.type === T.workerReady) {
      return { type: T.workerReady };
    }
    if (data.type === T.workerError) {
      return { type: T.workerError, error: String(data.error) };
    }
    return null;
  }

  function spawn(nextGeneration) {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    if (workerBlobUrl) {
      URL.revokeObjectURL(workerBlobUrl);
      workerBlobUrl = null;
    }
    generation = nextGeneration;
    var instanceGeneration = nextGeneration;
    var loader =
      "try {" +
      "  importScripts(" + JSON.stringify(WORKER_URL) + ");" +
      "} catch (error) {" +
      "  self.postMessage({ type: " + JSON.stringify(T.workerError) + "," +
      "    error: String(error && error.message ? error.message : error) });" +
      "}";
    // The blob URL stays valid until the worker is replaced, so a worker
    // that is still starting can never lose its script.
    workerBlobUrl = URL.createObjectURL(
      new Blob([loader], { type: "text/javascript" })
    );
    var instance = new Worker(workerBlobUrl);
    worker = instance;
    instance.onmessage = function (event) {
      // Anything from a worker that has since been replaced is dropped.
      if (worker !== instance) return;
      var message = relayable(event.data);
      if (!message) return;
      message.generation = instanceGeneration;
      post(message);
    };
    instance.onerror = function (event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (worker !== instance) return;
      // The worker is unusable; drop it so the next request spawns a new one.
      instance.terminate();
      worker = null;
      post({
        type: T.workerError,
        error: String((event && event.message) || "The rendering worker crashed"),
        generation: instanceGeneration
      });
    };
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var msg = event.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === T.request) {
      if (
        typeof msg.requestId !== "number" ||
        typeof msg.template !== "string" ||
        typeof msg.model !== "string" ||
        typeof msg.data !== "string"
      ) {
        return;
      }
      if (!worker) spawn(generation);
      worker.postMessage({
        type: T.request,
        requestId: msg.requestId,
        template: msg.template,
        model: msg.model,
        data: msg.data
      });
    } else if (msg.type === T.ping) {
      // Heartbeat: only meaningful for a running worker.
      if (worker && typeof msg.pingId === "number") {
        worker.postMessage({ type: T.ping, pingId: msg.pingId });
      }
    } else if (msg.type === T.restart) {
      if (typeof msg.generation !== "number") return;
      spawn(msg.generation);
    }
  });

  spawn(0);
  post({ type: T.sandboxReady });
})();
`;
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    "<title>Template Rendering Sandbox</title>",
    "</head>",
    "<body>",
    `<script nonce="${nonce}">${bootstrap}</script>`,
    "</body>",
    "</html>",
  ].join("\n");
}

/**
 * Generates a random nonce for the sandbox document's bootstrap script.
 * Falls back to `Math.random` where Web Crypto is unavailable (jsdom).
 */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
