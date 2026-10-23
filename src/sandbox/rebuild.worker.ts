/**
 * Template rendering sandbox worker.
 *
 * Runs inside a classic `blob:` Worker spawned by the null-origin sandbox
 * iframe (see `rebuildSandboxDocument.ts`), which loads this bundle with
 * `importScripts()`. Because the worker is created from a blob URL it
 * inherits the iframe's Content Security Policy, so the code evaluated here
 * cannot reach the playground's DOM, storage or network beyond the
 * TypeScript CDN the engine needs for type definitions.
 *
 * Each request renders a template and posts the CiceroMark JSON back. The
 * iframe relays the result to the main window, where `rebuildInSandbox()`
 * in `store/rebuildSandbox.ts` settles the matching Promise. The worker also
 * answers heartbeat pings, so the main window can tell a render that is
 * waiting on the network from one stuck in a formula that never returns.
 */
// Must stay first: it sets up the globals the engine inspects when it loads.
import "./workerEnvironment";
import {
  REBUILD_PONG,
  REBUILD_RESULT,
  REBUILD_WORKER_READY,
  isRebuildPingMessage,
  isRebuildRequestMessage,
  type RebuildResultMessage,
  type RebuildWorkerMessage,
  type SerializedRebuildError,
} from "../constants/rebuildSandbox";
import { generateCiceroMark, serializeRebuildError } from "./rebuildPipeline";

/**
 * The worker global, typed minimally so this file compiles under the app's
 * DOM `lib` without pulling in the conflicting WebWorker declarations.
 */
interface WorkerScope {
  postMessage: (message: RebuildWorkerMessage) => void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event: MessageEvent<unknown>) => {
  const msg = event.data;
  if (isRebuildPingMessage(msg)) {
    scope.postMessage({ type: REBUILD_PONG, pingId: msg.pingId });
    return;
  }
  if (!isRebuildRequestMessage(msg)) return;
  void handleRequest(msg.requestId, msg.template, msg.model, msg.data);
};

/**
 * Renders one template and always posts exactly one reply, so the main
 * window never waits on a request that has silently gone nowhere.
 */
async function handleRequest(
  requestId: number,
  template: string,
  model: string,
  data: string,
): Promise<void> {
  let reply: RebuildResultMessage;
  try {
    const ciceroMark = await generateCiceroMark(template, model, data);
    reply = { type: REBUILD_RESULT, requestId, success: true, ciceroMark };
  } catch (error: unknown) {
    reply = { type: REBUILD_RESULT, requestId, success: false, error: serializeSafely(error) };
  }
  try {
    scope.postMessage(reply);
  } catch (postError: unknown) {
    // e.g. the result holds a value that structured clone cannot copy.
    scope.postMessage({ type: REBUILD_RESULT, requestId, success: false, error: describe(postError) });
  }
}

/** A thrown value may be hostile (throwing getters or `toString`), so every step is guarded. */
function serializeSafely(error: unknown): SerializedRebuildError {
  try {
    return serializeRebuildError(error);
  } catch {
    return describe(error);
  }
}

function describe(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "Rendering failed with an error that could not be described";
  }
}

// The bundle has loaded and the handler is installed: from here on the
// worker is expected to answer heartbeats.
scope.postMessage({ type: REBUILD_WORKER_READY });
