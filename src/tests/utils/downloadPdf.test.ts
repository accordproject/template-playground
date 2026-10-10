import { beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { downloadElementAsPdf } from "../../utils/downloadPdf";

/*
 * downloadPdf wraps html2pdf.js behind a `html2pdf().set(opts).from(el).save()`
 * chain and temporarily forces the element to black-on-white. These tests
 * replace that chain so we can drive the success/failure paths without a real
 * canvas, and can observe the element's styles while the export is running.
 */
const hoisted = vi.hoisted(() => {
  const state: { element: HTMLElement | null } = { element: null };
  const save = vi.fn();
  const from = vi.fn((element: HTMLElement) => {
    state.element = element;
    return { save };
  });
  const set = vi.fn(() => ({ from }));
  return {
    state,
    save,
    from,
    set,
    html2pdf: vi.fn(() => ({ set })),
  };
});

vi.mock("html2pdf.js", () => ({ default: hoisted.html2pdf }));
vi.mock("antd", () => ({ message: { error: vi.fn() } }));

describe("downloadElementAsPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.save.mockReset();
    hoisted.state.element = null;
  });

  it("does nothing when there is no element to export", async () => {
    await expect(downloadElementAsPdf(null)).resolves.toBeUndefined();

    expect(hoisted.html2pdf).not.toHaveBeenCalled();
    expect(message.error).not.toHaveBeenCalled();
  });

  it("shows an error message when PDF generation fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    hoisted.save.mockRejectedValueOnce(new Error("canvas exploded"));
    const element = document.createElement("div");

    await expect(downloadElementAsPdf(element)).resolves.toBeUndefined();

    expect(hoisted.html2pdf).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("PDF generation failed:", expect.any(Error));
    expect(message.error).toHaveBeenCalledWith(
      "Failed to generate PDF. Please check the console."
    );

    consoleError.mockRestore();
  });

  it("restores the element's original styles after the PDF is generated", async () => {
    const element = document.createElement("div");
    element.style.backgroundColor = "#112233";
    element.style.color = "#ccddee";
    const originalBg = element.style.backgroundColor;
    const originalColor = element.style.color;

    // jsdom normalises colours, so compare against what it reports for the
    // forced black-on-white values rather than the raw hex strings.
    const probe = document.createElement("div");
    probe.style.backgroundColor = "#ffffff";
    probe.style.color = "#000000";

    let bgDuringExport = "";
    let colorDuringExport = "";
    hoisted.save.mockImplementationOnce(() => {
      bgDuringExport = element.style.backgroundColor;
      colorDuringExport = element.style.color;
      return Promise.resolve();
    });

    await downloadElementAsPdf(element);

    // Forced black-on-white while rendering...
    expect(bgDuringExport).toBe(probe.style.backgroundColor);
    expect(colorDuringExport).toBe(probe.style.color);
    // ...then restored afterwards.
    expect(element.style.backgroundColor).toBe(originalBg);
    expect(element.style.color).toBe(originalColor);
  });
});
