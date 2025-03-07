import { compress, decompress } from "@utils/compression/compression";

describe("Compression Utilities", () => {
  it("should correctly compress and decompress data", () => {
    const data = {
      templateMarkdown: "Sample Template",
      modelCto: "Sample Model",
      data: '{"sample": "data"}',
    };

    const compressed = compress(data);
    const decompressed = decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  it("should throw an error if decompression fails", () => {
    expect(() => {
      decompress("invalid data");
    }).toThrow("Failed to decompress data");
  });
});
