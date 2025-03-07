import LZString from "lz-string";
import { DecompressedData } from "@store/store";

export const compress = (data: object): string => {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
};

export const decompress = (compressed: string): DecompressedData => {
  const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
  if (!decompressed) {
    throw new Error("Failed to decompress data");
  }
  return JSON.parse(decompressed) as DecompressedData;
};
