import useAppStore, { DecompressedData } from "../../store/store";
import { decompress } from "../../utils/compression/compression";
import { vi } from "vitest";

vi.mock("../../utils/compression/compression");

describe("useAppStore loadFromLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({
      logicTs: "",
      editorLogicTs: "",
      isLogicPanelVisible: false,
      isLogicFeatureEnabled: false,
      isProblemPanelVisible: false,
      error: undefined,
    });
  });

  it("should load data from a valid shareable link without logic", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    // Mock rebuild to avoid side effects
    useAppStore.setState({ rebuild: vi.fn() });

    const result = await useAppStore.getState().loadFromLink("some-compressed-data");

    expect(result).toBe(true);
    const state = useAppStore.getState();
    expect(state.templateMarkdown).toBe(mockData.templateMarkdown);
    expect(state.modelCto).toBe(mockData.modelCto);
    expect(state.logicTs).toBe("");
    expect(state.isLogicPanelVisible).toBe(false);
  });

  it("should load data and trigger logic panel when logic is present", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
      logicTs: "console.log('logic code');",
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    useAppStore.setState({ rebuild: vi.fn(), compileLogic: vi.fn(), isLogicPanelVisible: false });

    const result = await useAppStore.getState().loadFromLink("some-compressed-data-with-logic");

    expect(result).toBe(true);
    const state = useAppStore.getState();
    expect(state.logicTs).toBe(mockData.logicTs);
    expect(state.editorLogicTs).toBe(mockData.logicTs);
    expect(state.isLogicPanelVisible).toBe(true);
    expect(state.isLogicFeatureEnabled).toBe(true);
    expect(localStorage.getItem("ui-panels")).toContain('"isLogicPanelVisible":true');
  });

  it("should set an error and return false when mandatory fields are missing", async () => {
    const mockData: Partial<DecompressedData> = {
      templateMarkdown: "Sample Template",
    };

    vi.mocked(decompress).mockReturnValue(mockData as DecompressedData);

    const result = await useAppStore.getState().loadFromLink("invalid-data");

    expect(result).toBe(false);
    const state = useAppStore.getState();
    expect(state.isProblemPanelVisible).toBe(true);
    expect(state.error).toContain("Invalid share link data");
  });

  it("should set an error and return false when decompression fails", async () => {
    vi.mocked(decompress).mockImplementation(() => {
      throw new Error("Failed to decompress data");
    });

    const result = await useAppStore.getState().loadFromLink("corrupted-compressed-data");

    expect(result).toBe(false);
    const state = useAppStore.getState();
    expect(state.isProblemPanelVisible).toBe(true);
    expect(state.error).toContain("Failed to decompress data");
  });
});

