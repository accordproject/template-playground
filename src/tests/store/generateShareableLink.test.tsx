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
    });

    const shareableLink = useAppStore.getState().generateShareableLink();

    expect(shareableLink).toContain(`data=${compressedData}`);
  });

  it("carries an export's fresh agreement and edited logic instead of the store's", () => {
    vi.mocked(compress).mockClear();
    useAppStore.setState({ templateMarkdown: "T", modelCto: "M", data: "{}", agreementHtml: "<p>stale</p>", logicTs: "compiled" });

    useAppStore.getState().generateShareableLink({ agreementHtml: "<p>fresh</p>", logicTs: "edited" });
    expect(vi.mocked(compress)).toHaveBeenLastCalledWith({ templateMarkdown: "T", modelCto: "M", data: "{}", agreementHtml: "<p>fresh</p>", logicTs: "edited" });

    // Sources that don't render: no agreement at all, not the stale one; an emptied logic editor: no logic.
    useAppStore.getState().generateShareableLink({ agreementHtml: undefined, logicTs: "  " });
    expect(vi.mocked(compress)).toHaveBeenLastCalledWith({ templateMarkdown: "T", modelCto: "M", data: "{}" });
  });
});
