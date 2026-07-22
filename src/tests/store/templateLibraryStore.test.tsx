import { describe, it, expect, vi, beforeEach } from "vitest";
import useAppStore from "../../store/store";
import * as templateLibrary from "../../utils/templateLibrary";
import * as counterLogic from "../../samples/counterLogic";
import type { Sample } from "../../samples";

vi.mock("../../utils/templateLibrary", () => ({
  fetchTemplateIndex: vi.fn(),
  fetchTemplate: vi.fn(),
  clearTemplateCache: vi.fn(),
}));

// Prevent real rebuild from firing during tests
const rebuildMock = vi.fn().mockResolvedValue(undefined);

const SAMPLE_ENTRIES = [
  { NAME: "Hello World", dirName: "helloworld" },
  { NAME: "NDA", dirName: "nda" },
];

const HELLO_SAMPLE: Sample = {
  NAME: "Hello World",
  TEMPLATE: "Hello {{name}}",
  MODEL: "namespace test@1.0.0\n@template\nconcept Hello { o String name }",
  DATA: { name: "Alice" },
};

const LOGIC_SAMPLE: Sample = {
  NAME: "Counter Contract (with Logic)",
  TEMPLATE: "Counter {{count}}",
  MODEL: "namespace test@1.0.0\n@template\nconcept Counter { o Integer count }",
  DATA: { count: 0 },
  LOGIC: "export function main() {}",
};

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    samples: [],
    lastLoadedSample: null,
    isLoadingIndex: false,
    isLoadingTemplate: false,
    templateLibraryError: null,
    sampleName: "",
    templateMarkdown: "",
    editorValue: "",
    modelCto: "",
    editorModelCto: "",
    data: "",
    editorAgreementData: "",
    logicTs: "",
    editorLogicTs: "",
    isLogicFeatureEnabled: false,
    isLogicPanelVisible: false,
    isContractRunnerVisible: false,
    isPreviewVisible: true,
    rebuild: rebuildMock,
  });
});

// ---------------------------------------------------------------------------
// fetchTemplateLibrary
// ---------------------------------------------------------------------------

describe("fetchTemplateLibrary", () => {
  it("sets isLoadingIndex:true while fetching and false when done", async () => {
    let resolveIndex!: (v: typeof SAMPLE_ENTRIES) => void;
    vi.mocked(templateLibrary.fetchTemplateIndex).mockReturnValue(
      new Promise((res) => (resolveIndex = res)),
    );

    const promise = useAppStore.getState().fetchTemplateLibrary();
    expect(useAppStore.getState().isLoadingIndex).toBe(true);

    resolveIndex(SAMPLE_ENTRIES);
    await promise;
    expect(useAppStore.getState().isLoadingIndex).toBe(false);
  });

  it("populates samples with the index entries on success", async () => {
    vi.mocked(templateLibrary.fetchTemplateIndex).mockResolvedValue(
      SAMPLE_ENTRIES,
    );

    await useAppStore.getState().fetchTemplateLibrary();

    expect(useAppStore.getState().samples).toEqual(SAMPLE_ENTRIES);
    expect(useAppStore.getState().templateLibraryError).toBeNull();
  });

  it("sets templateLibraryError and clears isLoadingIndex on failure", async () => {
    vi.mocked(templateLibrary.fetchTemplateIndex).mockRejectedValue(
      new Error("Network error"),
    );

    await useAppStore.getState().fetchTemplateLibrary();

    const state = useAppStore.getState();
    expect(state.isLoadingIndex).toBe(false);
    expect(state.templateLibraryError).toBe("Network error");
    expect(state.samples).toEqual([]);
  });

  it("uses a fallback message for non-Error rejections", async () => {
    vi.mocked(templateLibrary.fetchTemplateIndex).mockRejectedValue(
      "unexpected string error",
    );

    await useAppStore.getState().fetchTemplateLibrary();

    expect(useAppStore.getState().templateLibraryError).toBe(
      "Failed to load template library",
    );
  });
});

// ---------------------------------------------------------------------------
// loadSample — dynamic remote templates
// ---------------------------------------------------------------------------

describe("loadSample — remote template", () => {
  it("sets isLoadingTemplate:true while fetching and false when done", async () => {
    let resolveSample!: (s: Sample) => void;
    vi.mocked(templateLibrary.fetchTemplate).mockReturnValue(
      new Promise((res) => (resolveSample = res)),
    );

    const promise = useAppStore.getState().loadSample("Hello World");
    expect(useAppStore.getState().isLoadingTemplate).toBe(true);

    resolveSample(HELLO_SAMPLE);
    await promise;
    expect(useAppStore.getState().isLoadingTemplate).toBe(false);
  });

  it("populates store state from the fetched sample", async () => {
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(HELLO_SAMPLE);

    await useAppStore.getState().loadSample("Hello World");

    const state = useAppStore.getState();
    expect(state.sampleName).toBe("Hello World");
    expect(state.templateMarkdown).toBe(HELLO_SAMPLE.TEMPLATE);
    expect(state.editorValue).toBe(HELLO_SAMPLE.TEMPLATE);
    expect(state.modelCto).toBe(HELLO_SAMPLE.MODEL);
    expect(state.editorModelCto).toBe(HELLO_SAMPLE.MODEL);
    expect(state.data).toBe(JSON.stringify(HELLO_SAMPLE.DATA, null, 2));
    expect(state.editorAgreementData).toBe(
      JSON.stringify(HELLO_SAMPLE.DATA, null, 2),
    );
    expect(state.lastLoadedSample).toEqual(HELLO_SAMPLE);
  });

  it("hides logic panel and shows preview for a non-logic template", async () => {
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(HELLO_SAMPLE);

    await useAppStore.getState().loadSample("Hello World");

    const state = useAppStore.getState();
    expect(state.isLogicPanelVisible).toBe(false);
    expect(state.isContractRunnerVisible).toBe(false);
    expect(state.isPreviewVisible).toBe(true);
  });

  it("shows logic panel and hides preview for a logic template when logic feature is enabled", async () => {
    useAppStore.setState({ isLogicFeatureEnabled: true });
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(LOGIC_SAMPLE);

    await useAppStore.getState().loadSample(LOGIC_SAMPLE.NAME);

    const state = useAppStore.getState();
    expect(state.isLogicPanelVisible).toBe(true);
    expect(state.isContractRunnerVisible).toBe(true);
    expect(state.isPreviewVisible).toBe(false);
  });

  it("does not show logic panel for logic template when logic feature is disabled", async () => {
    useAppStore.setState({ isLogicFeatureEnabled: false });
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(LOGIC_SAMPLE);

    await useAppStore.getState().loadSample(LOGIC_SAMPLE.NAME);

    const state = useAppStore.getState();
    expect(state.isLogicPanelVisible).toBe(false);
    expect(state.isPreviewVisible).toBe(true);
  });

  it("clears error and agreementHtml from previous state", async () => {
    useAppStore.setState({ error: "old error", agreementHtml: "<p>old</p>" });
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(HELLO_SAMPLE);

    await useAppStore.getState().loadSample("Hello World");

    const state = useAppStore.getState();
    expect(state.error).toBeUndefined();
    expect(state.agreementHtml).toBeUndefined();
  });

  it("resets logic state when loading a non-logic template", async () => {
    useAppStore.setState({ logicTs: "old logic", editorLogicTs: "old logic" });
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(HELLO_SAMPLE);

    await useAppStore.getState().loadSample("Hello World");

    const state = useAppStore.getState();
    expect(state.logicTs).toBe("");
    expect(state.editorLogicTs).toBe("");
  });

  it("calls rebuild after loading", async () => {
    vi.mocked(templateLibrary.fetchTemplate).mockResolvedValue(HELLO_SAMPLE);

    await useAppStore.getState().loadSample("Hello World");

    expect(rebuildMock).toHaveBeenCalledOnce();
  });

  it("clears isLoadingTemplate and re-throws when fetchTemplate fails", async () => {
    vi.mocked(templateLibrary.fetchTemplate).mockRejectedValue(
      new Error("zip error"),
    );

    await expect(
      useAppStore.getState().loadSample("Hello World"),
    ).rejects.toThrow("zip error");

    expect(useAppStore.getState().isLoadingTemplate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadSample — counterLogic (local, no fetch)
// ---------------------------------------------------------------------------

describe("loadSample — counterLogic", () => {
  it("loads counterLogic directly without calling fetchTemplate", async () => {
    await useAppStore
      .getState()
      .loadSample(counterLogic.NAME);

    expect(templateLibrary.fetchTemplate).not.toHaveBeenCalled();

    const state = useAppStore.getState();
    expect(state.sampleName).toBe(counterLogic.NAME);
    expect(state.templateMarkdown).toBe(counterLogic.TEMPLATE);
  });

  it("does not set isLoadingTemplate for the counterLogic sample", async () => {
    const loadPromise = useAppStore
      .getState()
      .loadSample(counterLogic.NAME);

    // isLoadingTemplate should never have been set to true
    expect(useAppStore.getState().isLoadingTemplate).toBe(false);
    await loadPromise;
    expect(useAppStore.getState().isLoadingTemplate).toBe(false);
  });
});
