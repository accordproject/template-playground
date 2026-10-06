/**
 * Message protocol for the template rendering sandbox.
 *
 * The playground renders the agreement preview by running the Template
 * Engine, which evaluates TemplateMark formulas (`{{% ... %}}`) with
 * `new Function`. To keep that user-authored code away from the page, the
 * whole rendering pipeline runs inside a null-origin iframe that hosts a
 * Web Worker (see `RebuildSandboxFrame.tsx` and `rebuild.worker.ts`).
 *
 * The main window and the sandbox only exchange the plain-data messages
 * defined here. Everything that crosses the boundary is JSON-serialisable.
 *
 * Formula code runs inside the worker and can post anything it likes, so
 * the iframe relays only the worker message types below, rebuilt from
 * validated fields and stamped with the `generation` of the worker instance
 * that sent them. The main window numbers each worker it asks for (see
 * `RebuildRestartMessage`) and ignores messages from any other generation.
 */

/** Sent by the iframe once its worker has been spawned and it can accept requests. */
export const REBUILD_SANDBOX_READY = "rebuild-sandbox-ready";

/** Sent by the main window to ask the sandbox to render a template. */
export const REBUILD_REQUEST = "rebuild-request";

/** Sent by the sandbox with the rendered CiceroMark JSON, or the error. */
export const REBUILD_RESULT = "rebuild-result";

/**
 * Sent by the main window to terminate the current worker and spawn a fresh
 * one, e.g. after it stopped answering heartbeats because a formula never
 * returned, or after it crashed.
 */
export const REBUILD_RESTART = "rebuild-restart";

/** Sent by the sandbox when the worker itself failed to start or crashed. */
export const REBUILD_WORKER_ERROR = "rebuild-worker-error";

/**
 * Sent by the worker once its bundle has loaded and it is handling
 * messages. Until then the worker is silent by design (`importScripts()`
 * blocks it while the bundle downloads), so it is not held to the
 * heartbeat.
 */
export const REBUILD_WORKER_READY = "rebuild-worker-ready";

/**
 * Heartbeat sent by the main window while a render is in progress. A worker
 * waiting on the network still answers; a worker stuck in a formula that
 * never returns cannot, which is how a runaway formula is told apart from a
 * slow first render.
 */
export const REBUILD_PING = "rebuild-ping";

/** The worker's answer to `REBUILD_PING`. */
export const REBUILD_PONG = "rebuild-pong";

export interface RebuildRequestMessage {
  type: typeof REBUILD_REQUEST;
  requestId: number;
  /** TemplateMark markdown source. */
  template: string;
  /** Concerto CTO model source. */
  model: string;
  /** JSON data, as a string. */
  data: string;
}

/**
 * A rebuild error, reduced to plain data so it survives `postMessage` and
 * can be rendered by the store's `formatError()` exactly like an in-process
 * error would have been.
 */
export type SerializedRebuildError =
  | string
  | SerializedRebuildError[]
  | {
      code?: unknown;
      errors?: SerializedRebuildError;
      renderedMessage?: unknown;
      message?: string;
    };

export interface RebuildResultMessage {
  type: typeof REBUILD_RESULT;
  requestId: number;
  success: boolean;
  /** CiceroMark document (JSON) when `success` is true. */
  ciceroMark?: unknown;
  error?: SerializedRebuildError;
}

export interface RebuildRestartMessage {
  type: typeof REBUILD_RESTART;
  /** The number the iframe stamps on every message from the new worker. */
  generation: number;
}

export interface RebuildWorkerErrorMessage {
  type: typeof REBUILD_WORKER_ERROR;
  error: string;
}

export interface RebuildSandboxReadyMessage {
  type: typeof REBUILD_SANDBOX_READY;
}

export interface RebuildWorkerReadyMessage {
  type: typeof REBUILD_WORKER_READY;
}

export interface RebuildPingMessage {
  type: typeof REBUILD_PING;
  pingId: number;
}

export interface RebuildPongMessage {
  type: typeof REBUILD_PONG;
  pingId: number;
}

/** Messages the worker posts to the iframe. */
export type RebuildWorkerMessage =
  | RebuildResultMessage
  | RebuildWorkerReadyMessage
  | RebuildPongMessage
  | RebuildWorkerErrorMessage;

/** A worker message as relayed by the iframe: stamped with its sender's generation. */
export type RebuildRelayedMessage = RebuildWorkerMessage & { generation: number };

/** Every message the main window can receive from the sandbox iframe. */
export type RebuildSandboxMessage = RebuildSandboxReadyMessage | RebuildRelayedMessage;

export function isRebuildPingMessage(value: unknown): value is RebuildPingMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as Partial<RebuildPingMessage>;
  return msg.type === REBUILD_PING && typeof msg.pingId === "number";
}

export function isRebuildRequestMessage(value: unknown): value is RebuildRequestMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as Partial<RebuildRequestMessage>;
  return (
    msg.type === REBUILD_REQUEST &&
    typeof msg.requestId === "number" &&
    typeof msg.template === "string" &&
    typeof msg.model === "string" &&
    typeof msg.data === "string"
  );
}
