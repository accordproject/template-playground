import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import useAppStore, { resetRebuildTicketForTests } from "../../store/store";
import { rebuildInSandbox } from "../../store/rebuildSandbox";
import { transform } from "@accordproject/markdown-transform";

vi.mock("../../store/rebuildSandbox", () => ({
  rebuildInSandbox: vi.fn(),
}));

vi.mock("@accordproject/markdown-transform", () => ({
  transform: vi.fn(),
}));

const VALID_MODEL = `namespace org.acme@1.0.0
concept Person {
  o String name
}`;

describe("rebuild order / stale render race conditions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    resetRebuildTicketForTests?.();
    (transform as unknown as Mock).mockImplementation((ciceroMark: unknown) => {
      return Promise.resolve(`<p>${JSON.stringify(ciceroMark)}</p>`);
    });
    useAppStore.setState({
      templateMarkdown: "Hello {{name}}",
      modelCto: VALID_MODEL,
      data: JSON.stringify({ name: "World" }),
      agreementHtml: "",
      error: undefined,
      isProblemPanelVisible: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not clear a newer validation error when an older render finishes after it (setData)", async () => {
    let resolveFirstRender!: (val: unknown) => void;
    const firstRenderPromise = new Promise((resolve) => {
      resolveFirstRender = resolve;
    });

    vi.mocked(rebuildInSandbox).mockImplementationOnce(() => firstRenderPromise);

    // 1. Start an older, valid render
    void useAppStore.getState().setData(JSON.stringify({ name: "Alice" }));
    await vi.advanceTimersByTimeAsync(500);

    // Verify first render reached sandbox and is pending
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    // 2. While the first render is pending, make a newer edit that fails validation
    void useAppStore.getState().setData("{invalid json");
    await vi.advanceTimersByTimeAsync(500);

    // The newer edit failed validation immediately and set the error
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);
    expect(useAppStore.getState().isProblemPanelVisible).toBe(true);

    // 3. Now let the older render finish
    resolveFirstRender({ text: "Alice" });
    await vi.runAllTimersAsync();

    // 4. The error from the newer edit must NOT be cleared by the older render
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);
    expect(useAppStore.getState().agreementHtml).not.toBe('<p>{"text":"Alice"}</p>');
  });

  it("does not clear a newer validation error when an older render finishes after it (setModelCto)", async () => {
    let resolveFirstRender!: (val: unknown) => void;
    const firstRenderPromise = new Promise((resolve) => {
      resolveFirstRender = resolve;
    });

    vi.mocked(rebuildInSandbox).mockImplementationOnce(() => firstRenderPromise);

    // 1. Start an older, valid render
    void useAppStore.getState().setModelCto(`namespace org.acme@1.0.0
concept Person {
  o String name
  o Integer age optional
}`);
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    // 2. Make a newer edit with invalid CTO syntax
    void useAppStore.getState().setModelCto("invalid cto syntax {{{");
    await vi.advanceTimersByTimeAsync(500);

    // The newer edit failed validation immediately
    expect(useAppStore.getState().error).toMatch(/Invalid CTO model/);

    // 3. Let older render finish
    resolveFirstRender({ text: "ModelUpdated" });
    await vi.runAllTimersAsync();

    // 4. The error must remain visible and not be wiped out
    expect(useAppStore.getState().error).toMatch(/Invalid CTO model/);
    expect(useAppStore.getState().agreementHtml).not.toBe('<p>{"text":"ModelUpdated"}</p>');
  });

  it("does not clear a newer validation error when an older render finishes after it (setTemplateMarkdown)", async () => {
    let resolveFirstRender!: (val: unknown) => void;
    const firstRenderPromise = new Promise((resolve) => {
      resolveFirstRender = resolve;
    });

    vi.mocked(rebuildInSandbox).mockImplementationOnce(() => firstRenderPromise);

    // 1. Start an older, valid render
    void useAppStore.getState().setTemplateMarkdown("Hello {{name}}!");
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    // 2. Make a newer data edit that fails validation
    void useAppStore.getState().setData("not json");
    await vi.advanceTimersByTimeAsync(500);
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);

    // 3. Let older render finish
    resolveFirstRender({ text: "TemplateUpdated" });
    await vi.runAllTimersAsync();

    // 4. The error must remain
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);
    expect(useAppStore.getState().agreementHtml).not.toBe('<p>{"text":"TemplateUpdated"}</p>');
  });

  it("does not overwrite a newer render output when an older render finishes later", async () => {
    let resolveFirstRender!: (val: unknown) => void;
    const firstRenderPromise = new Promise((resolve) => {
      resolveFirstRender = resolve;
    });

    let resolveSecondRender!: (val: unknown) => void;
    const secondRenderPromise = new Promise((resolve) => {
      resolveSecondRender = resolve;
    });

    vi.mocked(rebuildInSandbox)
      .mockImplementationOnce(() => firstRenderPromise)
      .mockImplementationOnce(() => secondRenderPromise);

    // 1. Start first edit (render A)
    void useAppStore.getState().setData(JSON.stringify({ name: "RenderA" }));
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    // 2. Start second edit (render B)
    void useAppStore.getState().setData(JSON.stringify({ name: "RenderB" }));
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(2);

    // 3. Second render finishes FIRST
    resolveSecondRender({ text: "RenderB" });
    await vi.runAllTimersAsync();
    expect(useAppStore.getState().agreementHtml).toBe('<p>{"text":"RenderB"}</p>');

    // 4. First render finishes LATER
    resolveFirstRender({ text: "RenderA" });
    await vi.runAllTimersAsync();

    // 5. agreementHtml should still be RenderB, NOT overwritten by RenderA
    expect(useAppStore.getState().agreementHtml).toBe('<p>{"text":"RenderB"}</p>');
  });

  it("does not overwrite a newer error when an older render fails later", async () => {
    let rejectFirstRender!: (err: unknown) => void;
    const firstRenderPromise = new Promise((_, reject) => {
      rejectFirstRender = reject;
    });

    vi.mocked(rebuildInSandbox).mockImplementationOnce(() => firstRenderPromise);

    // 1. Start first edit
    void useAppStore.getState().setData(JSON.stringify({ name: "RenderA" }));
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    // 2. Second edit fails validation immediately
    void useAppStore.getState().setData("{invalid json");
    await vi.advanceTimersByTimeAsync(500);
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);

    // 3. First render fails later with an older runtime error
    rejectFirstRender("Old sandbox crash");
    await vi.runAllTimersAsync();

    // 4. The error must still be the newer validation error, not replaced by the older failure
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);
  });
});
