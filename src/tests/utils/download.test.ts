import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadBlob, downloadMarkdown, AGREEMENT_MARKDOWN_FILE } from "../../utils/download";

describe("download", () => {
  const createObjectURLMock = vi.fn();
  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURLMock.mockReset();
    revokeObjectURLMock.mockReset();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates an object URL, clicks a download link, and defers URL revocation", () => {
    const fakeUrl = "blob:https://playground.accordproject.org/fake-uuid";
    createObjectURLMock.mockReturnValue(fakeUrl);

    let clicked = false;
    let downloadAttr = "";
    let hrefAttr = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked = true;
      downloadAttr = this.download;
      hrefAttr = this.href;
    });

    const blob = new Blob(["hello world"], { type: "text/plain" });
    downloadBlob(blob, "test.txt");

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clicked).toBe(true);
    expect(downloadAttr).toBe("test.txt");
    expect(hrefAttr).toBe(fakeUrl);

    // URL should NOT be revoked immediately synchronously
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    // Advance timer by 1000ms
    vi.advanceTimersByTime(1000);

    // Now revokeObjectURL should have been called
    expect(revokeObjectURLMock).toHaveBeenCalledWith(fakeUrl);
  });

  it("downloads markdown with default file name", () => {
    const fakeUrl = "blob:https://playground.accordproject.org/markdown-uuid";
    createObjectURLMock.mockReturnValue(fakeUrl);

    let downloadAttr = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadAttr = this.download;
    });

    downloadMarkdown("# Agreement");
    expect(downloadAttr).toBe(AGREEMENT_MARKDOWN_FILE);

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(fakeUrl);
  });

  it("downloads markdown with custom file name", () => {
    const fakeUrl = "blob:https://playground.accordproject.org/custom-uuid";
    createObjectURLMock.mockReturnValue(fakeUrl);

    let downloadAttr = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadAttr = this.download;
    });

    downloadMarkdown("# Custom Agreement", "custom.md");
    expect(downloadAttr).toBe("custom.md");

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(fakeUrl);
  });
});
