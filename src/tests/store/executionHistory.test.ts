import { describe, it, expect, beforeEach, vi } from "vitest";
import useAppStore from "../../store/store";

/**
 * initContract / triggerContract keep a run-by-run history (executionHistory)
 * that the design-v2 Simulate step renders. These tests drive the store with a
 * mocked sandbox, the same way sandbox.test.tsx does.
 */
describe("useAppStore - executionHistory", () => {
  beforeEach(() => {
    useAppStore.setState({
      compiledLogicJs: "some_code",
      data: '{"$class": "org.acme.counter@1.0.0.CounterContract", "owner": "Alice", "maxCount": 10}',
      requestJson: '{"$class": "org.acme.counter@1.0.0.CounterRequest", "increment": 2}',
      executionState: "",
      executionEvents: "",
      executionResponse: "",
      executionHistory: [],
      compilationErrors: [],
      isProblemPanelVisible: false,
    });
  });

  it("initContract starts a fresh history with an 'init' run", async () => {
    useAppStore.setState({
      executionHistory: [{ id: "#1", method: "trigger" } as never],
      executeInSandbox: vi.fn().mockResolvedValue({ state: { count: 0, owner: "Alice" }, events: [] }),
    });

    await useAppStore.getState().initContract();

    const history = useAppStore.getState().executionHistory;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: "init",
      method: "init",
      request: { owner: "Alice", maxCount: 10 },
      response: { state: { count: 0, owner: "Alice" }, events: [] },
      stateBefore: null,
      stateAfter: { count: 0, owner: "Alice" },
      events: [],
      error: null,
    });
    expect(typeof history[0].durationMs).toBe("number");
    expect(new Date(history[0].executedAt).toString()).not.toBe("Invalid Date");
    expect(useAppStore.getState().executionResponse).toBe("");
  });

  it("initContract records a failed init with its error", async () => {
    useAppStore.setState({ executeInSandbox: vi.fn().mockRejectedValue(new Error("Init failed")) });

    await useAppStore.getState().initContract();

    const history = useAppStore.getState().executionHistory;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: "init", response: null, stateAfter: null, error: "Error: Init failed" });
  });

  it("triggerContract appends numbered runs with state before / after", async () => {
    const executeInSandbox = vi
      .fn()
      .mockResolvedValueOnce({ state: { count: 0 }, events: [] })
      .mockResolvedValueOnce({
        result: { message: "count is now 2" },
        state: { count: 2 },
        events: [{ $class: "org.acme.counter@1.0.0.CounterUpdated" }],
      })
      .mockResolvedValueOnce({ result: { message: "count is now 4" }, state: { count: 4 }, events: [] });
    useAppStore.setState({ executeInSandbox });

    const store = useAppStore.getState();
    await store.initContract();
    await store.triggerContract();
    await store.triggerContract();

    const history = useAppStore.getState().executionHistory;
    expect(history.map((r) => r.id)).toEqual(["init", "#1", "#2"]);
    expect(history[1]).toMatchObject({
      method: "trigger",
      request: { increment: 2 },
      response: { message: "count is now 2" },
      stateBefore: { count: 0 },
      stateAfter: { count: 2 },
      events: [{ $class: "org.acme.counter@1.0.0.CounterUpdated" }],
      error: null,
    });
    expect(history[2]).toMatchObject({ stateBefore: { count: 2 }, stateAfter: { count: 4 } });
  });

  it("triggerContract keeps a failed run and leaves the state unchanged", async () => {
    const executeInSandbox = vi
      .fn()
      .mockResolvedValueOnce({ state: { count: 0 }, events: [] })
      .mockRejectedValueOnce(new Error("Count 11 exceeds the maximum"));
    useAppStore.setState({ executeInSandbox });

    const store = useAppStore.getState();
    await store.initContract();
    await store.triggerContract();

    const state = useAppStore.getState();
    expect(state.executionHistory).toHaveLength(2);
    expect(state.executionHistory[1]).toMatchObject({
      id: "#1",
      response: null,
      stateBefore: { count: 0 },
      stateAfter: { count: 0 },
      events: [],
      error: "Error: Count 11 exceeds the maximum",
    });
    expect(state.executionState).toContain('"count": 0');
    expect(state.isProblemPanelVisible).toBe(true);
  });

  it("triggerContract records a request that is not valid JSON as a 'parse' run without calling the logic", async () => {
    const executeInSandbox = vi.fn().mockResolvedValueOnce({ state: { count: 0 }, events: [] });
    useAppStore.setState({ executeInSandbox });

    const store = useAppStore.getState();
    await store.initContract();
    useAppStore.setState({ requestJson: '{ "increment": 2 }}' });
    await store.triggerContract();

    const state = useAppStore.getState();
    expect(executeInSandbox).toHaveBeenCalledTimes(1);
    expect(state.executionHistory).toHaveLength(2);
    expect(state.executionHistory[1]).toMatchObject({
      id: "#1",
      stage: "parse",
      request: {},
      response: null,
      stateBefore: { count: 0 },
      stateAfter: { count: 0 },
    });
    expect(state.executionHistory[1].error).toMatch(/JSON/);
    expect(state.executionHistory[0].stage).toBe("run");
    expect(state.isProblemPanelVisible).toBe(true);
  });

  it("triggerContract numbers runs after failed ones too", async () => {
    const executeInSandbox = vi
      .fn()
      .mockResolvedValueOnce({ state: { count: 0 }, events: [] })
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce({ result: {}, state: { count: 2 }, events: [] });
    useAppStore.setState({ executeInSandbox });

    const store = useAppStore.getState();
    await store.initContract();
    await store.triggerContract();
    await store.triggerContract();

    expect(useAppStore.getState().executionHistory.map((r) => r.id)).toEqual(["init", "#1", "#2"]);
  });

  it("triggerContract does not record anything when the contract is not initialised", async () => {
    await useAppStore.getState().triggerContract();
    expect(useAppStore.getState().executionHistory).toEqual([]);
  });

  it("clearExecutionHistory empties the list", () => {
    useAppStore.setState({ executionHistory: [{ id: "init" } as never] });
    useAppStore.getState().clearExecutionHistory();
    expect(useAppStore.getState().executionHistory).toEqual([]);
  });
});
