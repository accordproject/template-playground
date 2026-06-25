import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import useAppStore from "../../store/store";
import { sandboxResolvers } from "../../store/sandboxResolvers";
import { EXECUTION_RESULT } from "../../constants/sandbox";

describe("useAppStore - Sandbox State", () => {
  beforeEach(() => {
    localStorage.clear();
    sandboxResolvers.clear();
    useAppStore.setState({
      sandboxIframe: null,
      isSandboxReady: false,
      isExecuting: false,
      executionId: 0,
    });
  });

  afterEach(() => {
    sandboxResolvers.clear();
  });

  describe("setSandboxRef", () => {
    it("should store the iframe reference", () => {
      const mockIframe = document.createElement("iframe");
      useAppStore.getState().setSandboxRef(mockIframe);
      expect(useAppStore.getState().sandboxIframe).toBe(mockIframe);
    });

    it("should accept null to clear the reference", () => {
      const mockIframe = document.createElement("iframe");
      useAppStore.getState().setSandboxRef(mockIframe);
      useAppStore.getState().setSandboxRef(null);
      expect(useAppStore.getState().sandboxIframe).toBeNull();
    });
  });

  describe("setSandboxReady", () => {
    it("should update the readiness flag", () => {
      expect(useAppStore.getState().isSandboxReady).toBe(false);
      useAppStore.getState().setSandboxReady(true);
      expect(useAppStore.getState().isSandboxReady).toBe(true);
    });
  });

  describe("executeInSandbox", () => {
    it("should reject when sandbox is not ready", async () => {
      await expect(
        useAppStore.getState().executeInSandbox("code", "trigger", []),
      ).rejects.toThrow("Sandbox is not ready");
    });

    it("should reject when iframe ref is null", async () => {
      useAppStore.setState({ isSandboxReady: true, sandboxIframe: null });
      await expect(
        useAppStore.getState().executeInSandbox("code", "trigger", []),
      ).rejects.toThrow("Sandbox is not ready");
    });

    it("should reject when an execution is already in progress", async () => {
      const mockIframe = document.createElement("iframe");
      Object.defineProperty(mockIframe, "contentWindow", {
        value: { postMessage: vi.fn() },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        isExecuting: true,
        executionId: 0,
      });

      await expect(
        useAppStore.getState().executeInSandbox("code", "trigger", []),
      ).rejects.toThrow("An execution is already in progress");
    });

    it("should increment executionId and set isExecuting on dispatch", () => {
      // Create a mock iframe with a contentWindow that has postMessage
      const mockIframe = document.createElement("iframe");
      Object.defineProperty(mockIframe, "contentWindow", {
        value: { postMessage: vi.fn() },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        executionId: 0,
      });

      // Fire and forget — we just want to verify state transitions
      void useAppStore.getState().executeInSandbox("code", "trigger", []);

      const state = useAppStore.getState();
      expect(state.executionId).toBe(1);
      expect(state.isExecuting).toBe(true);
    });

    it("should resolve when the resolver is called with success", async () => {
      const mockPostMessage = vi.fn();
      const mockIframe = document.createElement("iframe");
      Object.defineProperty(mockIframe, "contentWindow", {
        value: { postMessage: mockPostMessage },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        executionId: 0,
      });

      const promise = useAppStore
        .getState()
        .executeInSandbox("code", "init", [{ data: "test" }]);

      // The resolver should now be registered with executionId = 1
      expect(sandboxResolvers.has(1)).toBe(true);

      // Simulate the sandbox resolving
      const resolver = sandboxResolvers.get(1);
      if (!resolver) throw new Error("Resolver not found");
      resolver({ success: true, result: { count: 5 }, type: EXECUTION_RESULT });

      const result = await promise;
      expect(result).toEqual({ count: 5 });
      expect(useAppStore.getState().isExecuting).toBe(false);
    });

    it("should reject when the resolver is called with failure", async () => {
      const mockIframe = document.createElement("iframe");
      Object.defineProperty(mockIframe, "contentWindow", {
        value: { postMessage: vi.fn() },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        executionId: 0,
      });

      const promise = useAppStore
        .getState()
        .executeInSandbox("code", "trigger", []);

      // Simulate the sandbox reporting an error
      const resolver = sandboxResolvers.get(1);
      if (!resolver) throw new Error("Resolver not found");
      resolver({
        success: false,
        error: "Logic threw an error",
        type: EXECUTION_RESULT,
      });

      await expect(promise).rejects.toThrow("Logic threw an error");
      expect(useAppStore.getState().isExecuting).toBe(false);
    });

    it("should reject if the client-side timeout is reached", async () => {
      vi.useFakeTimers();

      const mockIframe = document.createElement("iframe");
      Object.defineProperty(mockIframe, "contentWindow", {
        value: { postMessage: vi.fn() },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        executionId: 0,
      });

      const promise = useAppStore
        .getState()
        .executeInSandbox("code", "trigger", []);

      // Advance time by the 6000ms client timeout
      vi.advanceTimersByTime(6000);

      await expect(promise).rejects.toThrow(
        "Execution timed out after 6000ms (client-side fallback)",
      );
      expect(useAppStore.getState().isExecuting).toBe(false);
      expect(sandboxResolvers.has(1)).toBe(false);

      vi.useRealTimers();
    });
  });
});
