import useAppStore, { DecompressedData } from "../../store/store";
import { compress } from "../../utils/compression/compression";
import { vi } from "vitest";

vi.mock("../../utils/compression/compression");

describe("useAppStore", () => {
  it("should generate a shareable link", () => {
    const initialState: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: `namespace test@1.0.0

@template
concept SampleModel {
  o String key
}`,
      data: '{"$class": "test@1.0.0.SampleModel", "key": "value"}',
      agreementHtml: "<p>Sample Agreement</p>",
      logicTs: "console.log('test')",
      requestJson: '{"test":"request"}',
    };

    // Mock compress function to return a sample compressed string
    const compressedData = "compressed-string";
    vi.mocked(compress).mockReturnValue(compressedData);

    // Set state directly to avoid triggering expensive rebuild operations
    useAppStore.setState({
      templateMarkdown: initialState.templateMarkdown,
      modelCto: initialState.modelCto,
      data: initialState.data,
      agreementHtml: initialState.agreementHtml,
      logicTs: initialState.logicTs,
      requestJson: initialState.requestJson,
    });

    const shareableLink = useAppStore.getState().generateShareableLink();

    expect(shareableLink).toContain(`data=${compressedData}`);
    expect(compress).toHaveBeenCalledWith(expect.objectContaining({
      requestJson: '{"test":"request"}'
    }));
  });

  it("should preserve an explicitly empty requestJson", () => {
    const initialState: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: `namespace test@1.0.0
@template
concept SampleModel {
  o String key
}`,
      data: '{"$class": "test@1.0.0.SampleModel", "key": "value"}',
      agreementHtml: "<p>Sample Agreement</p>",
      requestJson: "",
    };

    const compressedData = "compressed-empty-string";
    vi.mocked(compress).mockReturnValue(compressedData);

    useAppStore.setState({
      templateMarkdown: initialState.templateMarkdown,
      modelCto: initialState.modelCto,
      data: initialState.data,
      agreementHtml: initialState.agreementHtml,
      requestJson: initialState.requestJson,
    });

    useAppStore.getState().generateShareableLink();

    expect(compress).toHaveBeenCalledWith(expect.objectContaining({
      requestJson: ""
    }));
  });
});
