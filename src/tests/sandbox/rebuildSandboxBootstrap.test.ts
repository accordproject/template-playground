import { describe, it, expect, vi } from "vitest";
import { buildRebuildSandboxDocument } from "../../sandbox/rebuildSandboxDocument";
import {
  REBUILD_PING,
  REBUILD_PONG,
  REBUILD_REQUEST,
  REBUILD_RESTART,
  REBUILD_RESULT,
  REBUILD_SANDBOX_READY,
  REBUILD_WORKER_ERROR,
  REBUILD_WORKER_READY,
} from "../../constants/rebuildSandbox";
import { EXECUTION_RESULT, SANDBOX_READY } from "../../constants/sandbox";

/**
 * Runs the sandbox iframe's real bootstrap script against fake browser
 * objects, so its relaying rules are tested by behaviour rather than by
 * matching its source text.
 */

const WORKER_URL = "https://playground.example/assets/rebuild.worker-abc.js";

type Listener = (event: { source: unknown; data: unknown }) => void;

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message?: string; preventDefault: () => void }) => void) | null = null;
  received: unknown[] = [];
  terminated = false;
  constructor(readonly url: string) {}
  postMessage(message: unknown) {
    this.received.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  /** Simulates the worker posting to the iframe. */
  say(data: unknown) {
    this.onmessage?.({ data });
  }
}

function extractBootstrap(): string {
  const html = buildRebuildSandboxDocument({
    workerUrl: WORKER_URL,
    nonce: "n0nce",
  });
  const open = '<script nonce="n0nce">';
  return html.slice(html.indexOf(open) + open.length, html.lastIndexOf("</script>"));
}

function runBootstrap() {
  const toParent: Record<string, unknown>[] = [];
  const parent = { postMessage: (message: Record<string, unknown>) => toParent.push(message) };
  const listeners: Listener[] = [];
  const workers: FakeWorker[] = [];
  const blobs: string[] = [];
  const fakeWindow = {
    parent,
    addEventListener: (type: string, listener: Listener) => {
      if (type === "message") listeners.push(listener);
    },
  };
  const fakeUrl = {
    createObjectURL: (blob: { parts: string[] }) => {
      blobs.push(blob.parts.join(""));
      return `blob:null/${blobs.length}`;
    },
    revokeObjectURL: vi.fn(),
  };
  class FakeBlob {
    constructor(readonly parts: string[]) {}
  }
  class TrackedWorker extends FakeWorker {
    constructor(url: string) {
      super(url);
      workers.push(this);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const bootstrap = new Function("window", "Worker", "URL", "Blob", extractBootstrap()) as (
    ...args: unknown[]
  ) => void;
  bootstrap(fakeWindow, TrackedWorker, fakeUrl, FakeBlob);

  const fromParent = (data: unknown, source: unknown = parent) => {
    for (const listener of listeners) listener({ source, data });
  };
  return { toParent, workers, blobs, fromParent, revoke: fakeUrl.revokeObjectURL };
}

describe("rendering sandbox bootstrap", () => {
  it("starts generation 0 with a classic worker that importScripts the bundle, then reports ready", () => {
    const { toParent, workers, blobs } = runBootstrap();
    expect(workers).toHaveLength(1);
    expect(blobs[0]).toContain(`importScripts(${JSON.stringify(WORKER_URL)})`);
    expect(toParent).toEqual([{ type: REBUILD_SANDBOX_READY }]);
  });

  it("forwards a valid request to the worker, rebuilt from its checked fields", () => {
    const { workers, fromParent } = runBootstrap();
    fromParent({ type: REBUILD_REQUEST, requestId: 7, template: "t", model: "m", data: "{}", extra: "dropped" });
    expect(workers[0].received).toEqual([
      { type: REBUILD_REQUEST, requestId: 7, template: "t", model: "m", data: "{}" },
    ]);
  });

  it("ignores messages that are not from its parent, and malformed requests", () => {
    const { workers, fromParent } = runBootstrap();
    fromParent({ type: REBUILD_REQUEST, requestId: 1, template: "t", model: "m", data: "{}" }, { other: "window" });
    fromParent({ type: REBUILD_REQUEST, requestId: "1", template: "t", model: "m", data: "{}" });
    fromParent({ type: REBUILD_REQUEST, requestId: 1, template: 5, model: "m", data: "{}" });
    fromParent(null);
    expect(workers[0].received).toEqual([]);
  });

  it("relays rendering replies rebuilt and stamped with the worker's generation", () => {
    const { toParent, workers } = runBootstrap();
    toParent.length = 0;
    workers[0].say({ type: REBUILD_RESULT, requestId: 3, success: true, ciceroMark: { $class: "doc" }, sneaky: 1 });
    workers[0].say({ type: REBUILD_PONG, pingId: 4, sneaky: 1 });
    workers[0].say({ type: REBUILD_WORKER_READY, sneaky: 1 });
    workers[0].say({ type: REBUILD_WORKER_ERROR, error: "boom" });
    expect(toParent).toEqual([
      { type: REBUILD_RESULT, requestId: 3, success: true, ciceroMark: { $class: "doc" }, error: undefined, generation: 0 },
      { type: REBUILD_PONG, pingId: 4, generation: 0 },
      { type: REBUILD_WORKER_READY, generation: 0 },
      { type: REBUILD_WORKER_ERROR, error: "boom", generation: 0 },
    ]);
  });

  it("does not relay anything else a formula posts, such as forged logic-sandbox messages", () => {
    const { toParent, workers } = runBootstrap();
    toParent.length = 0;
    workers[0].say({ type: EXECUTION_RESULT, executionId: 1, success: true, result: { forged: true } });
    workers[0].say({ type: SANDBOX_READY });
    workers[0].say({ type: REBUILD_SANDBOX_READY });
    workers[0].say({ type: REBUILD_RESULT, requestId: "1", success: true });
    workers[0].say({ type: REBUILD_PONG, pingId: "x" });
    workers[0].say("text");
    expect(toParent).toEqual([]);
  });

  it("restarts with the generation the parent chooses and drops the old worker's messages", () => {
    const { toParent, workers, fromParent, revoke } = runBootstrap();
    fromParent({ type: REBUILD_RESTART, generation: 5 });
    expect(workers).toHaveLength(2);
    expect(workers[0].terminated).toBe(true);
    expect(revoke).toHaveBeenCalled();

    toParent.length = 0;
    workers[0].say({ type: REBUILD_RESULT, requestId: 1, success: true, ciceroMark: "stale" });
    workers[1].say({ type: REBUILD_RESULT, requestId: 1, success: true, ciceroMark: "fresh" });
    expect(toParent).toEqual([
      { type: REBUILD_RESULT, requestId: 1, success: true, ciceroMark: "fresh", error: undefined, generation: 5 },
    ]);
  });

  it("keeps a worker's blob URL alive until that worker is replaced", () => {
    // The worker fetches its script asynchronously; revoking the URL right
    // after construction could make that fetch fail.
    const { fromParent, revoke } = runBootstrap();
    expect(revoke).not.toHaveBeenCalled();
    fromParent({ type: REBUILD_RESTART, generation: 1 });
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith("blob:null/1");
  });

  it("ignores a restart without a numeric generation", () => {
    const { workers, fromParent } = runBootstrap();
    fromParent({ type: REBUILD_RESTART });
    fromParent({ type: REBUILD_RESTART, generation: "2" });
    expect(workers).toHaveLength(1);
  });

  it("forwards heartbeat pings to the current worker as a fresh message", () => {
    const { workers, fromParent } = runBootstrap();
    fromParent({ type: REBUILD_PING, pingId: 9, extra: "dropped" });
    fromParent({ type: REBUILD_PING, pingId: "9" });
    expect(workers[0].received).toEqual([{ type: REBUILD_PING, pingId: 9 }]);
  });

  it("reports a crash of the current worker only, and spawns a replacement on the next request", () => {
    const { toParent, workers, fromParent } = runBootstrap();
    fromParent({ type: REBUILD_RESTART, generation: 1 });
    toParent.length = 0;

    // A late error from the replaced worker is not reported.
    workers[0].onerror?.({ message: "old", preventDefault: vi.fn() });
    expect(toParent).toEqual([]);

    workers[1].onerror?.({ message: "crashed", preventDefault: vi.fn() });
    expect(workers[1].terminated).toBe(true);
    expect(toParent).toEqual([{ type: REBUILD_WORKER_ERROR, error: "crashed", generation: 1 }]);

    fromParent({ type: REBUILD_REQUEST, requestId: 2, template: "t", model: "m", data: "{}" });
    expect(workers).toHaveLength(3);
    expect(workers[2].received).toHaveLength(1);
  });
});
