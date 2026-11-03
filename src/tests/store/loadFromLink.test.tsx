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

    await useAppStore.getState().loadFromLink("some-compressed-data");

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
      requestJson: '{"test":"request"}'
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    useAppStore.setState({ rebuild: vi.fn(), compileLogic: vi.fn(), isLogicPanelVisible: false });

    await useAppStore.getState().loadFromLink("some-compressed-data-with-logic");

    const state = useAppStore.getState();
    expect(state.logicTs).toBe(mockData.logicTs);
    expect(state.editorLogicTs).toBe(mockData.logicTs);
    expect(state.requestJson).toBe(mockData.requestJson);
    expect(state.isLogicPanelVisible).toBe(true);
    expect(state.isLogicFeatureEnabled).toBe(true);
    expect(localStorage.getItem("ui-panels")).toContain('"isLogicPanelVisible":true');
  });

  it("should set an error when mandatory fields are missing", async () => {
    const mockData: Partial<DecompressedData> = {
      templateMarkdown: "Sample Template",
    };

    vi.mocked(decompress).mockReturnValue(mockData as DecompressedData);

    await useAppStore.getState().loadFromLink("invalid-data");

    const state = useAppStore.getState();
    expect(state.isProblemPanelVisible).toBe(true);
    expect(state.error).toContain("Invalid share link data");
  });

  it("should fallback to the default request if requestJson is absent (backwards compatibility)", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
      logicTs: "console.log('logic code');",
      // requestJson is omitted
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    useAppStore.setState({ rebuild: vi.fn(), compileLogic: vi.fn(), isLogicPanelVisible: false });

    await useAppStore.getState().loadFromLink("some-compressed-data-without-request");

    const state = useAppStore.getState();
    expect(state.requestJson).toBe('{\n  "$class": "org.acme.counter@1.0.0.CounterRequest",\n  "increment": 1\n}');
  });

  it("should preserve an explicitly empty requestJson", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
      requestJson: "",
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    useAppStore.setState({ rebuild: vi.fn(), compileLogic: vi.fn() });

    await useAppStore.getState().loadFromLink("some-compressed-empty-request");

    const state = useAppStore.getState();
    expect(state.requestJson).toBe("");
  });
});
