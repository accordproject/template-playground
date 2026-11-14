/** Saves a Blob as a file download named `fileName`. */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/** File name of the rendered agreement as Markdown (Preview and the Deploy step). */
export const AGREEMENT_MARKDOWN_FILE = "agreement.md";

/** Saves Markdown text as a .md download. */
export const downloadMarkdown = (markdown: string, fileName: string = AGREEMENT_MARKDOWN_FILE) =>
  downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), fileName);
