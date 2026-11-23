import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "contractRunnerChain";

const validInitStep = {
  label: "Init",
  request: null,
  priorState: null,
  result: null,
  state: { count: 0 },
  events: [],
  edited: false,
};

describe("useAppStore - execution chain persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const loadStore = async () => {
    const { default: useAppStore } = await import("../../store/store");
    return useAppStore;
  };

  it("restores a valid persisted execution chain", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validInitStep]));

    const useAppStore = await loadStore();
    const state = useAppStore.getState();

    expect(state.executionChain).toEqual([validInitStep]);
    expect(state.selectedChainIndex).toBe(0);
    expect(state.isContractInitialized).toBe(true);
  });

  it("starts with an empty chain when persisted JSON is malformed", async () => {
    localStorage.setItem(STORAGE_KEY, "[invalid json");

    const useAppStore = await loadStore();
    const state = useAppStore.getState();

    expect(state.executionChain).toEqual([]);
    expect(state.selectedChainIndex).toBe(-1);
    expect(state.isContractInitialized).toBe(false);
  });

  it("rejects persisted JSON that is not an array", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ label: "Init" }));

    const useAppStore = await loadStore();
    const state = useAppStore.getState();

    expect(state.executionChain).toEqual([]);
    expect(state.selectedChainIndex).toBe(-1);
    expect(state.isContractInitialized).toBe(false);
  });

  it("rejects a chain containing a null entry", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([null]));

    const useAppStore = await loadStore();
    const state = useAppStore.getState();

    expect(state.executionChain).toEqual([]);
    expect(state.selectedChainIndex).toBe(-1);
    expect(state.isContractInitialized).toBe(false);
  });

  it("rejects a chain containing an incomplete step", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ label: "Init", edited: false }]),
    );

    const useAppStore = await loadStore();
    const state = useAppStore.getState();

    expect(state.executionChain).toEqual([]);
    expect(state.selectedChainIndex).toBe(-1);
    expect(state.isContractInitialized).toBe(false);
  });
});
