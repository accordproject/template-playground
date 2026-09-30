import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import {
  attachRebuildSandbox,
  currentRebuildWorkerGeneration,
  detachRebuildSandbox,
  handleRebuildSandboxMessage,
  isRebuildSandboxReady,
  pendingRebuildCount,
  rebuildInSandbox,
  resetRebuildSandboxForTests,
  restartRebuildSandbox,
  templateMayRunCode,
  REBUILD_HEARTBEAT_INTERVAL_MS,
  REBUILD_REQUEST_CEILING_MS,
  REBUILD_SANDBOX_READY_TIMEOUT_MS,
  REBUILD_STALL_TIMEOUT_MS,
} from "../../store/rebuildSandbox";
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

type PostMessageMock = Mock<[message: unknown, targetOrigin: string], void>;

const PLAIN = "Hello {{name}}.";
const WITH_CODE = "{{name}} has {{% return name.length %}} letters.";

/** An iframe whose contentWindow records what is posted to it. */
function mockFrame() {
  const postMessage: PostMessageMock = vi.fn();
  const iframe = document.createElement("iframe");
  Object.defineProperty(iframe, "contentWindow", {
    value: { postMessage },
    writable: false,
  });
  return { iframe, postMessage };
}

/** Delivers a message as the iframe relays it: stamped with the current worker's generation. */
function fromWorker(message: Record<string, unknown>) {
  handleRebuildSandboxMessage({ ...message, generation: currentRebuildWorkerGeneration() });
}

function result(requestId: number, ciceroMark: unknown) {
  fromWorker({ type: REBUILD_RESULT, requestId, success: true, ciceroMark });
}

function posted(postMessage: PostMessageMock) {
  return postMessage.mock.calls.map(([message]) => message as { type: string; [key: string]: unknown });
}

function postedTypes(postMessage: PostMessageMock): string[] {
  return posted(postMessage).map((message) => message.type);
}

/** Mounts a frame whose iframe is ready and whose worker has loaded. */
function readySandbox() {
  const parts = mockFrame();
  attachRebuildSandbox(parts.iframe);
  handleRebuildSandboxMessage({ type: REBUILD_SANDBOX_READY });
  fromWorker({ type: REBUILD_WORKER_READY });
  return parts;
}

describe("rebuildSandbox bridge", () => {
  beforeEach(() => {
    resetRebuildSandboxForTests();
  });

  afterEach(() => {
    resetRebuildSandboxForTests();
    vi.useRealTimers();
  });

  describe("requests and results", () => {
    it("rejects when no sandbox is mounted", async () => {
      await expect(rebuildInSandbox("t", "m", "{}")).rejects.toThrow(
        "The rendering sandbox is not mounted",
      );
    });

    it("waits for the ready signal before posting a request", async () => {
      const { iframe, postMessage } = mockFrame();
      attachRebuildSandbox(iframe);
      expect(isRebuildSandboxReady()).toBe(false);

      const promise = rebuildInSandbox(PLAIN, "model", '{"a":1}');
      expect(postMessage).not.toHaveBeenCalled();

      handleRebuildSandboxMessage({ type: REBUILD_SANDBOX_READY });
      await Promise.resolve();
      expect(isRebuildSandboxReady()).toBe(true);

      const [request, targetOrigin] = postMessage.mock.calls[0];
      expect(targetOrigin).toBe("*");
      expect(request).toEqual({
        type: REBUILD_REQUEST,
        requestId: 1,
        template: PLAIN,
        model: "model",
        data: '{"a":1}',
      });

      result(1, { $class: "doc" });
      await expect(promise).resolves.toEqual({ $class: "doc" });
      expect(pendingRebuildCount()).toBe(0);
    });

    it("routes results to their requests by id", async () => {
      const { postMessage } = readySandbox();
      const first = rebuildInSandbox(PLAIN, "m", "{}");
      const second = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      expect(posted(postMessage).map((message) => message.requestId)).toEqual([1, 2]);

      result(2, "two");
      result(1, "one");
      await expect(first).resolves.toBe("one");
      await expect(second).resolves.toBe("two");
    });

    it("passes the sandbox's serialised error through unchanged", async () => {
      readySandbox();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      const error = { code: "E1", renderedMessage: "bad template", errors: ["x"] };
      fromWorker({ type: REBUILD_RESULT, requestId: 1, success: false, error });
      await expect(promise).rejects.toEqual(error);
    });

    it("ignores results for unknown or already settled requests", async () => {
      readySandbox();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      result(99, "x");
      expect(pendingRebuildCount()).toBe(1);
      result(1, "y");
      fromWorker({ type: REBUILD_RESULT, requestId: 1, success: false, error: "late" });
      await expect(promise).resolves.toBe("y");
    });

    it("ignores malformed messages", () => {
      const { iframe } = mockFrame();
      attachRebuildSandbox(iframe);
      handleRebuildSandboxMessage(null);
      handleRebuildSandboxMessage("ready");
      handleRebuildSandboxMessage({ type: "something-else" });
      expect(isRebuildSandboxReady()).toBe(false);
    });

    it("ignores worker messages that carry no generation or another one", async () => {
      readySandbox();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      handleRebuildSandboxMessage({ type: REBUILD_RESULT, requestId: 1, success: true, ciceroMark: "unstamped" });
      handleRebuildSandboxMessage({
        type: REBUILD_RESULT,
        requestId: 1,
        success: true,
        ciceroMark: "other worker",
        generation: currentRebuildWorkerGeneration() + 1,
      });
      expect(pendingRebuildCount()).toBe(1);

      result(1, "genuine");
      await expect(promise).resolves.toBe("genuine");
    });
  });

  describe("templateMayRunCode", () => {
    it.each([
      ["a formula", "x {{% return 1 %}}", true],
      ["a formula with whitespace after the braces", "{{  % return 1 %}}", true],
      ["a condition attribute", '{{#clause c condition="return true"}}', true],
      ["a condition attribute in capitals, spaced", '{{#clause c CONDITION = "x"}}', true],
      ["a plain variable", "Hello {{name}}", false],
      ["the word condition in prose", "subject to the condition that", false],
      ["an optional block", "{{#optional x}}y{{/optional}}", false],
      ["a percentage in prose", "{{name}} is 50% done", false],
    ])("%s -> %s", (_label, template, expected) => {
      expect(templateMayRunCode(template)).toBe(expected);
    });
  });

  describe("code isolation", () => {
    it("runs a template with code on the clean worker, then replaces that worker", async () => {
      const { postMessage } = readySandbox();

      const promise = rebuildInSandbox(WITH_CODE, "m", "{}");
      await Promise.resolve();
      expect(postedTypes(postMessage)).toEqual([REBUILD_REQUEST]);

      result(1, "rendered");
      await expect(promise).resolves.toBe("rendered");

      // Replaced as soon as it answered, so a clean worker is already starting.
      expect(posted(postMessage).at(-1)).toEqual({ type: REBUILD_RESTART, generation: 1 });
      expect(currentRebuildWorkerGeneration()).toBe(1);
    });

    it("ignores the replaced worker afterwards", async () => {
      const { postMessage } = readySandbox();
      const first = rebuildInSandbox(WITH_CODE, "m", "{}");
      await Promise.resolve();
      result(1, "first");
      await first;

      const second = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      // The replacement is clean, so no further restart is needed.
      expect(postedTypes(postMessage)).toEqual([REBUILD_REQUEST, REBUILD_RESTART, REBUILD_REQUEST]);

      // The tampered worker answering for the new request is ignored...
      handleRebuildSandboxMessage({ type: REBUILD_RESULT, requestId: 2, success: true, ciceroMark: "forged", generation: 0 });
      expect(pendingRebuildCount()).toBe(1);
      // ...and only the replacement's answer counts.
      result(2, "genuine");
      await expect(second).resolves.toBe("genuine");
    });

    it("never runs code beside another render: that render adopts the newer outcome", async () => {
      const { postMessage } = readySandbox();
      const plain = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      const code = rebuildInSandbox(WITH_CODE, "m", "{}");
      await Promise.resolve();
      expect(postedTypes(postMessage)).toEqual([REBUILD_REQUEST, REBUILD_RESTART, REBUILD_REQUEST]);
      expect(pendingRebuildCount()).toBe(1);

      result(2, "newest");
      await expect(code).resolves.toBe("newest");
      await expect(plain).resolves.toBe("newest");
    });

    it("replaces a worker that is running code when a newer render arrives", async () => {
      const { postMessage } = readySandbox();
      const code = rebuildInSandbox(WITH_CODE, "m", "{}");
      await Promise.resolve();

      const plain = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      expect(postedTypes(postMessage)).toEqual([REBUILD_REQUEST, REBUILD_RESTART, REBUILD_REQUEST]);

      // The superseded render shares the newer outcome, failures included.
      fromWorker({ type: REBUILD_RESULT, requestId: 2, success: false, error: "bad data" });
      await expect(plain).rejects.toBe("bad data");
      await expect(code).rejects.toBe("bad data");
    });

    it("lets templates without code share the warm worker", async () => {
      const { postMessage } = readySandbox();
      for (let id = 1; id <= 3; id += 1) {
        const promise = rebuildInSandbox(PLAIN, "m", "{}");
        await Promise.resolve();
        result(id, `render ${id}`);
        await expect(promise).resolves.toBe(`render ${id}`);
      }
      expect(postedTypes(postMessage)).not.toContain(REBUILD_RESTART);
      expect(currentRebuildWorkerGeneration()).toBe(0);
    });
  });

  describe("crashes and restarts", () => {
    it("fails pending renders when the worker reports a boot error", async () => {
      readySandbox();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      fromWorker({ type: REBUILD_WORKER_ERROR, error: "ReferenceError: Buffer" });
      await expect(promise).rejects.toThrow("The rendering sandbox failed: ReferenceError: Buffer");
    });

    it("replaces a crashed worker before the next request, only once", async () => {
      const { postMessage } = readySandbox();
      fromWorker({ type: REBUILD_WORKER_ERROR, error: "boot failure" });
      expect(postMessage).not.toHaveBeenCalled();

      const first = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      expect(posted(postMessage)[0]).toEqual({ type: REBUILD_RESTART, generation: 1 });
      expect(postedTypes(postMessage)).toEqual([REBUILD_RESTART, REBUILD_REQUEST]);

      result(1, "ok");
      await expect(first).resolves.toBe("ok");
      const second = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();
      expect(postedTypes(postMessage)).toEqual([REBUILD_RESTART, REBUILD_REQUEST, REBUILD_REQUEST]);
      result(2, "ok again");
      await expect(second).resolves.toBe("ok again");
    });

    it("rejects pending renders with the given reason when restarted", async () => {
      const { postMessage } = readySandbox();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      restartRebuildSandbox(new Error("because"));
      await expect(promise).rejects.toThrow("because");
      expect(posted(postMessage).at(-1)).toEqual({ type: REBUILD_RESTART, generation: 1 });
    });

    it("rejects everything when the sandbox is unmounted", async () => {
      readySandbox();
      const inFlight = rebuildInSandbox(PLAIN, "m", "{}");
      await Promise.resolve();

      detachRebuildSandbox();
      await expect(inFlight).rejects.toThrow("The rendering sandbox was unmounted");
      expect(isRebuildSandboxReady()).toBe(false);
      await expect(rebuildInSandbox(PLAIN, "m", "{}")).rejects.toThrow("not mounted");
    });

    it("gives up waiting for a sandbox that never becomes ready", async () => {
      vi.useFakeTimers();
      const { iframe } = mockFrame();
      attachRebuildSandbox(iframe);
      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      const rejection = expect(promise).rejects.toThrow("did not start within");
      await vi.advanceTimersByTimeAsync(REBUILD_SANDBOX_READY_TIMEOUT_MS);
      await rejection;
    });
  });

  describe("heartbeat", () => {
    /** A loaded worker that answers every ping, like one waiting on the network. */
    function responsiveWorker() {
      const parts = readySandbox();
      parts.postMessage.mockImplementation((message) => {
        const msg = message as { type: string; pingId?: number };
        if (msg.type === REBUILD_PING) fromWorker({ type: REBUILD_PONG, pingId: msg.pingId });
      });
      return parts;
    }

    it("keeps waiting on a slow render while the worker answers pings", async () => {
      vi.useFakeTimers();
      const { postMessage } = responsiveWorker();

      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await vi.advanceTimersByTimeAsync(REBUILD_STALL_TIMEOUT_MS * 3);

      expect(pendingRebuildCount()).toBe(1);
      expect(postedTypes(postMessage)).toContain(REBUILD_PING);
      expect(postedTypes(postMessage)).not.toContain(REBUILD_RESTART);
      result(1, "late");
      await expect(promise).resolves.toBe("late");
    });

    it("does not ping a worker that is still loading its bundle", async () => {
      vi.useFakeTimers();
      const { iframe, postMessage } = mockFrame();
      attachRebuildSandbox(iframe);
      handleRebuildSandboxMessage({ type: REBUILD_SANDBOX_READY });

      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await vi.advanceTimersByTimeAsync(REBUILD_STALL_TIMEOUT_MS * 3);
      expect(postedTypes(postMessage)).toEqual([REBUILD_REQUEST]);

      fromWorker({ type: REBUILD_WORKER_READY });
      result(1, "ok");
      await expect(promise).resolves.toBe("ok");
    });

    it("replaces a loaded worker that leaves a ping unanswered and fails the render clearly", async () => {
      vi.useFakeTimers();
      const { postMessage } = readySandbox();

      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      const rejection = expect(promise).rejects.toThrow(
        `Rendering stopped responding for ${REBUILD_STALL_TIMEOUT_MS / 1000}s`,
      );
      await vi.advanceTimersByTimeAsync(REBUILD_STALL_TIMEOUT_MS + REBUILD_HEARTBEAT_INTERVAL_MS * 2);
      await rejection;

      expect(posted(postMessage).at(-1)).toEqual({ type: REBUILD_RESTART, generation: 1 });
      expect(pendingRebuildCount()).toBe(0);
    });

    it("does not mistake throttled timers in a background tab for a stall", async () => {
      vi.useFakeTimers();
      responsiveWorker();
      const promise = rebuildInSandbox(PLAIN, "m", "{}");

      // Browsers can delay background timers to about once a minute. Each
      // check then sees a long gap, but every ping it sent was answered.
      for (let tick = 0; tick < 5; tick += 1) {
        vi.setSystemTime(Date.now() + 60_000);
        await vi.advanceTimersToNextTimerAsync();
      }
      expect(pendingRebuildCount()).toBe(1);

      result(1, "fine");
      await expect(promise).resolves.toBe("fine");
    });

    it("stops pinging once nothing is waiting", async () => {
      vi.useFakeTimers();
      const { postMessage } = responsiveWorker();

      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      await vi.advanceTimersByTimeAsync(REBUILD_HEARTBEAT_INTERVAL_MS * 2);
      result(1, "done");
      await expect(promise).resolves.toBe("done");

      const postedSoFar = postMessage.mock.calls.length;
      await vi.advanceTimersByTimeAsync(REBUILD_STALL_TIMEOUT_MS * 2);
      expect(postMessage.mock.calls.length).toBe(postedSoFar);
    });

    it("fails a render that never finishes even if the worker keeps answering", async () => {
      vi.useFakeTimers();
      const { postMessage } = responsiveWorker();

      const promise = rebuildInSandbox(PLAIN, "m", "{}");
      const rejection = expect(promise).rejects.toThrow("Rendering did not finish within 5 minutes");
      await vi.advanceTimersByTimeAsync(REBUILD_REQUEST_CEILING_MS);
      await rejection;
      expect(postedTypes(postMessage)).toContain(REBUILD_RESTART);
    });
  });
});
