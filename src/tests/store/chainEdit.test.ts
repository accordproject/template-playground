import { describe, it, expect, beforeEach, vi } from "vitest";
import useAppStore, { type ChainStep } from "../../store/store";
import { SAMPLES } from "../../samples";

const step = (label: string, state: object): ChainStep => ({
  label,
  request: null,
  priorState: null,
  result: null,
  state,
  events: [],
  edited: false,
});

describe("useAppStore - editing chain steps", () => {
  beforeEach(() => {
    useAppStore.setState({
      executionChain: [step("Init", { count: 0 }), step("Trigger 1", { count: 1 })],
      selectedChainIndex: 1,
    });
  });

  it("edits the state of the latest step", () => {
    expect(useAppStore.getState().editChainStepState('{"count": 5}')).toBeNull();

    const chain = useAppStore.getState().executionChain;
    expect(chain[1]).toMatchObject({ state: { count: 5 }, edited: true });
    expect(chain[0]).toMatchObject({ state: { count: 0 }, edited: false });
  });

  it("refuses to edit a step that a later step was computed from", () => {
    useAppStore.setState({ selectedChainIndex: 0 });

    expect(useAppStore.getState().editChainStepState('{"count": 5}')).toMatch(/latest/);
    expect(useAppStore.getState().executionChain[0]).toMatchObject({ state: { count: 0 }, edited: false });
  });
});

describe("useAppStore - triggerContract when the template is replaced mid-run", () => {
  it("does not add the old template's trigger to the new template's chain", async () => {
    useAppStore.setState({
      compiledLogicJs: "some_code",
      data: "{}",
      requestJson: "{}",
      executionState: "{}",
      executionHistory: [],
      executionChain: [step("Init", {})],
      selectedChainIndex: 0,
      isTemplateStateful: true,
      isContractInitialized: true,
      compilationErrors: [],
      executeInSandbox: vi.fn().mockImplementation(() => {
        // Loading a sample replaces the template (and clears the chain) while the run is in flight.
        void useAppStore.getState().loadSample(SAMPLES[0].NAME);
        return Promise.resolve({ result: { ok: true }, state: { count: 1 }, events: [] });
      }),
    });

    await useAppStore.getState().triggerContract();

    const state = useAppStore.getState();
    expect(state.executionChain).toEqual([]);
    expect(state.executionHistory).toEqual([]);
  });
});
