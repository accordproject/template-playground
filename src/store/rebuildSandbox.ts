/**
 * Main-window side of the template rendering sandbox.
 *
 * `rebuild()` in `store.ts` calls `rebuildInSandbox()`, which posts the
 * template, model and data to the sandbox iframe mounted by
 * `RebuildSandboxFrame.tsx` and resolves with the CiceroMark JSON the
 * sandbox sends back. The iframe component feeds every message it receives
 * into `handleRebuildSandboxMessage()`.
 *
 * Three rules keep formula code contained even though it runs in a worker
 * that the page reuses:
 *
 * - **One worker per template that runs code.** Formula code executes in
 *   the worker's global scope and could tamper with it (for example,
 *   replace its message handler to fake every later preview). A render
 *   whose template may run code therefore gets a worker that has never run
 *   code, runs alone on it, and the worker is replaced as soon as it
 *   answers. Templates without code share the current worker.
 * - **Generations.** Every worker the page asks for gets a number, which
 *   the iframe stamps on everything that worker says. Messages from any
 *   other worker are ignored.
 * - **Heartbeat.** Rendering has no fixed time limit, because the first
 *   render downloads TypeScript type definitions and can legitimately take
 *   a long time. While a render is in progress the worker is pinged; a
 *   worker waiting on the network still answers, one stuck in a formula
 *   that never returns cannot, and is replaced. A generous per-render
 *   ceiling catches everything else.
 *
 * This module is deliberately free of React and Zustand so it can be unit
 * tested on its own and so the store does not need to know how the sandbox
 * is hosted.
 */
import {
  REBUILD_PING,
  REBUILD_PONG,
  REBUILD_REQUEST,
  REBUILD_RESTART,
  REBUILD_RESULT,
  REBUILD_SANDBOX_READY,
  REBUILD_WORKER_ERROR,
  REBUILD_WORKER_READY,
  type RebuildPingMessage,
  type RebuildRequestMessage,
  type RebuildRestartMessage,
  type RebuildSandboxMessage,
} from "../constants/rebuildSandbox";

/**
 * How long a loaded worker may leave a ping unanswered while a render is in
 * progress before it is considered stuck. It has to exceed the longest
 * legitimate synchronous stretch of a render (the TypeScript type-check of
 * the template's formulas), during which pings queue up unanswered.
 */
export const REBUILD_STALL_TIMEOUT_MS = 30_000;

/** How often the heartbeat is checked while a render is in progress. */
export const REBUILD_HEARTBEAT_INTERVAL_MS = 2_000;

/**
 * Upper bound for a single render, whatever the worker says. Catches a
 * worker that never finishes loading its bundle and one that keeps
 * answering pings but never answers the request.
 */
export const REBUILD_REQUEST_CEILING_MS = 5 * 60_000;

/** How long to wait for the sandbox iframe to signal readiness. */
export const REBUILD_SANDBOX_READY_TIMEOUT_MS = 30_000;

/*
 * The Template Engine evaluates code from exactly two TemplateMark
 * constructs: formulas (`{{% ... %}}`) and `condition="..."` attributes.
 * The patterns are deliberately loose (`[^!-~]*` allows any whitespace or
 * non-ASCII character in between, and the attribute match ignores case): a
 * false positive only costs a worker restart, a miss would let code share a
 * worker with later renders.
 */
const FORMULA_OPENING = /[{][{][^!-~]*%/;
const CONDITION_ATTRIBUTE = /condition[^!-~]*=/i;

/**
 * Whether rendering this template might run code in the worker. Used to
 * give such templates a fresh worker that is discarded afterwards.
 */
export function templateMayRunCode(template: string): boolean {
  return FORMULA_OPENING.test(template) || CONDITION_ATTRIBUTE.test(template);
}

interface PendingRebuild {
  resolve: (ciceroMark: unknown) => void;
  reject: (reason: unknown) => void;
  ceiling: ReturnType<typeof setTimeout>;
}

interface ReadyWaiter {
  resolve: () => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let frame: HTMLIFrameElement | null = null;
let isReady = false;
/** The generation of the worker the page is currently talking to. */
let workerGeneration = 0;
/** True once code may have run in the current worker; it must not be reused. */
let workerTainted = false;
/** Set when the worker reported a crash; the next request replaces it first. */
let workerNeedsRestart = false;
/**
 * True once the current worker has loaded its bundle. Before that it is
 * blocked in `importScripts()` and cannot answer pings, so the heartbeat
 * leaves it alone.
 */
let workerLoaded = false;
/** When the ping still awaiting an answer was sent, or null if none is outstanding. */
let outstandingPingSince: number | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let nextRequestId = 0;
let nextPingId = 0;
const pending = new Map<number, PendingRebuild>();
const readyWaiters: ReadyWaiter[] = [];

/** Registers the mounted sandbox iframe. Until it signals ready, requests wait. */
export function attachRebuildSandbox(iframe: HTMLIFrameElement): void {
  frame = iframe;
  isReady = false;
  // A newly mounted iframe starts its first worker as generation 0.
  workerGeneration = 0;
  workerTainted = false;
  workerNeedsRestart = false;
  workerLoaded = false;
}

/**
 * Forgets the sandbox iframe, e.g. on unmount. Every in-flight request is
 * rejected because its result can no longer arrive.
 */
export function detachRebuildSandbox(): void {
  frame = null;
  isReady = false;
  workerTainted = false;
  workerNeedsRestart = false;
  workerLoaded = false;
  rejectAllPending(new Error("The rendering sandbox was unmounted"));
  rejectReadyWaiters(new Error("The rendering sandbox was unmounted"));
}

/** True once the sandbox has signalled it can accept requests. */
export function isRebuildSandboxReady(): boolean {
  return isReady;
}

/** Number of renders currently awaiting a result. Exposed for tests. */
export function pendingRebuildCount(): number {
  return pending.size;
}

/** The generation messages must carry to be accepted. Exposed for tests. */
export function currentRebuildWorkerGeneration(): number {
  return workerGeneration;
}

/**
 * Routes a message posted by the sandbox iframe. The caller is responsible
 * for having verified the message really came from the sandbox iframe;
 * this function additionally ignores worker messages from any worker other
 * than the current one.
 */
export function handleRebuildSandboxMessage(message: unknown): void {
  if (!message || typeof message !== "object") return;
  const msg = message as Partial<RebuildSandboxMessage> & { generation?: unknown };

  if (msg.type === REBUILD_SANDBOX_READY) {
    isReady = true;
    for (const waiter of readyWaiters.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
    return;
  }

  // Everything else comes from a worker: only the current one counts.
  if (msg.generation !== workerGeneration) return;

  switch (msg.type) {
    case REBUILD_WORKER_READY:
      workerLoaded = true;
      outstandingPingSince = null;
      break;

    case REBUILD_PONG:
      outstandingPingSince = null;
      break;

    case REBUILD_RESULT: {
      if (typeof msg.requestId !== "number") return;
      outstandingPingSince = null;
      const entry = pending.get(msg.requestId);
      if (!entry) return;
      pending.delete(msg.requestId);
      clearTimeout(entry.ceiling);
      if (msg.success) {
        entry.resolve(msg.ciceroMark);
      } else {
        /*
         * The sandbox already reduced the error to the plain shape that
         * `formatError()` understands, so it is passed through untouched
         * rather than wrapped in a new Error (which would prefix the text).
         */
        entry.reject(msg.error ?? "Rendering failed");
      }
      if (pending.size === 0) {
        stopHeartbeat();
        // Code has run in this worker: replace it now, so a clean one is
        // already starting up by the time the next render arrives.
        if (workerTainted) replaceWorker();
      }
      break;
    }

    case REBUILD_WORKER_ERROR:
      /*
       * The worker could not be started or crashed. Nothing queued on it
       * will ever answer. It is replaced lazily, on the next request, so a
       * bundle that keeps failing to load does not spin in a restart loop.
       */
      workerNeedsRestart = true;
      workerLoaded = false;
      rejectAllPending(
        new Error(
          `The rendering sandbox failed: ${
            typeof msg.error === "string" ? msg.error : "unknown error"
          }`,
        ),
      );
      break;

    default:
      break;
  }
}

/**
 * Renders a template inside the sandbox.
 *
 * Resolves with the CiceroMark document as JSON. Rejects with the
 * sandbox's serialised error (string, array or `{code, errors,
 * renderedMessage}` object) or with an `Error` for transport problems such
 * as a stuck worker or a missing sandbox. If a newer render has to replace
 * the worker while this one is still running, this one settles with the
 * newer render's outcome instead: its own result is stale by then and may
 * no longer be trustworthy.
 */
export async function rebuildInSandbox(
  template: string,
  model: string,
  data: string,
): Promise<unknown> {
  await waitForRebuildSandbox();
  const target = frame?.contentWindow;
  if (!target) {
    throw new Error("The rendering sandbox is not available");
  }

  const runsCode = templateMayRunCode(template);
  nextRequestId += 1;
  const requestId = nextRequestId;

  let entry: PendingRebuild | undefined;
  const result = new Promise<unknown>((resolve, reject) => {
    entry = {
      resolve,
      reject,
      ceiling: setTimeout(() => onCeiling(requestId), REBUILD_REQUEST_CEILING_MS),
    };
  });
  if (!entry) throw new Error("unreachable: Promise executors run synchronously");

  /*
   * Code must not run on a worker that has already run code, nor beside
   * other renders that could then be tampered with. Renders still waiting
   * on the old worker settle with this render's outcome.
   */
  if (workerNeedsRestart || workerTainted || (runsCode && pending.size > 0)) {
    replaceWorker({ supersededBy: result });
  }

  pending.set(requestId, entry);
  if (runsCode) workerTainted = true;
  startHeartbeat();

  const request: RebuildRequestMessage = {
    type: REBUILD_REQUEST,
    requestId,
    template,
    model,
    data,
  };
  /*
   * '*' is required because the sandboxed iframe has an opaque origin
   * that cannot be named. The iframe accepts messages from its parent
   * window only.
   */
  target.postMessage(request, "*");
  return result;
}

/**
 * Asks the sandbox to terminate its worker and spawn a fresh one, failing
 * every request that was still waiting on the old worker.
 *
 * @param reason - the error the waiting requests are rejected with
 */
export function restartRebuildSandbox(
  reason: Error = new Error("The rendering sandbox was restarted"),
): void {
  replaceWorker({ reason });
}

/** Clears every piece of module state. Intended for tests. */
export function resetRebuildSandboxForTests(): void {
  rejectAllPending(new Error("The rendering sandbox was reset"));
  rejectReadyWaiters(new Error("The rendering sandbox was reset"));
  stopHeartbeat();
  frame = null;
  isReady = false;
  workerGeneration = 0;
  workerTainted = false;
  workerNeedsRestart = false;
  workerLoaded = false;
  outstandingPingSince = null;
  nextRequestId = 0;
  nextPingId = 0;
}

/**
 * Replaces the current worker with a fresh one under a new generation.
 * Requests still waiting on the old worker either adopt a newer render's
 * outcome (`supersededBy`) or are rejected (`reason`).
 */
function replaceWorker(
  outcome?: { supersededBy: Promise<unknown> } | { reason: Error },
): void {
  const waiting = [...pending.values()];
  pending.clear();
  stopHeartbeat();

  workerGeneration += 1;
  workerTainted = false;
  workerNeedsRestart = false;
  workerLoaded = false;
  outstandingPingSince = null;
  const message: RebuildRestartMessage = { type: REBUILD_RESTART, generation: workerGeneration };
  frame?.contentWindow?.postMessage(message, "*");

  for (const entry of waiting) {
    clearTimeout(entry.ceiling);
    if (outcome && "supersededBy" in outcome) {
      entry.resolve(outcome.supersededBy);
    } else {
      entry.reject(outcome?.reason ?? new Error("The rendering sandbox was restarted"));
    }
  }
}

function onCeiling(requestId: number): void {
  if (!pending.has(requestId)) return;
  restartRebuildSandbox(
    new Error(
      `Rendering did not finish within ${
        REBUILD_REQUEST_CEILING_MS / 60_000
      } minutes. Check your network connection and the template's formulas.`,
    ),
  );
}

function startHeartbeat(): void {
  if (heartbeat) return;
  outstandingPingSince = null;
  heartbeat = setInterval(checkHeartbeat, REBUILD_HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

/*
 * Stalls are measured from when an unanswered ping was sent, not from the
 * last sign of life: browsers throttle timers in background tabs (down to
 * about one run a minute), so the gap between checks alone says nothing
 * about the worker.
 */
function checkHeartbeat(): void {
  if (pending.size === 0) {
    stopHeartbeat();
    return;
  }
  // Still loading its bundle: silence is expected until it reports ready.
  if (!workerLoaded) return;

  const now = Date.now();
  if (outstandingPingSince !== null) {
    if (now - outstandingPingSince >= REBUILD_STALL_TIMEOUT_MS) {
      /*
       * The worker is single-threaded, so a formula that never returns
       * keeps it from answering anything, including the other queued
       * renders: replace it and fail them all.
       */
      restartRebuildSandbox(
        new Error(
          `Rendering stopped responding for ${
            REBUILD_STALL_TIMEOUT_MS / 1000
          }s. Check the template for a formula that never returns.`,
        ),
      );
    }
    return;
  }

  nextPingId += 1;
  outstandingPingSince = now;
  const ping: RebuildPingMessage = { type: REBUILD_PING, pingId: nextPingId };
  frame?.contentWindow?.postMessage(ping, "*");
}

function waitForRebuildSandbox(): Promise<void> {
  if (isReady && frame) return Promise.resolve();
  if (!frame) {
    return Promise.reject(new Error("The rendering sandbox is not mounted"));
  }
  return new Promise<void>((resolve, reject) => {
    const waiter: ReadyWaiter = {
      resolve,
      reject,
      timer: setTimeout(() => {
        const index = readyWaiters.indexOf(waiter);
        if (index >= 0) readyWaiters.splice(index, 1);
        reject(
          new Error(
            `The rendering sandbox did not start within ${REBUILD_SANDBOX_READY_TIMEOUT_MS}ms`,
          ),
        );
      }, REBUILD_SANDBOX_READY_TIMEOUT_MS),
    };
    readyWaiters.push(waiter);
  });
}

function rejectAllPending(reason: Error): void {
  for (const [id, entry] of pending) {
    pending.delete(id);
    clearTimeout(entry.ceiling);
    entry.reject(reason);
  }
  stopHeartbeat();
}

function rejectReadyWaiters(reason: Error): void {
  for (const waiter of readyWaiters.splice(0)) {
    clearTimeout(waiter.timer);
    waiter.reject(reason);
  }
}
