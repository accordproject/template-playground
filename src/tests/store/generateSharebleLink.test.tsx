import useAppStore, { DecompressedData } from "../../store/store";
import { compress } from "../../utils/compression/compression";
import { vi } from "vitest";

vi.mock("../../utils/compression/compression");

describe("useAppStore", () => {
  it("should generate a shareable link", async () => {
    const initialState: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "Sample Model",
      data: '{"key": "value"}',
    };

    // Mock compress function to return a sample compressed string
    const compressedData = "compressed-string";
    vi.mocked(compress).mockReturnValue(compressedData);

    const store = useAppStore.getState();

    await store.setTemplateMarkdown(initialState.templateMarkdown);
    await store.setModelCto(initialState.modelCto);
    await store.setData(initialState.data);

    const shareableLink = store.generateShareableLink();

    expect(shareableLink).toContain(`data=${compressedData}`);
  });
});
