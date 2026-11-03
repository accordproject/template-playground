import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewDrawer from "../../../components/designV2/PreviewDrawer";
import { PREVIEW } from "../../../components/designV2/constants";

const AGREEMENT_HTML = "<h1>Counter Contract</h1><p>Hello world</p>";

describe("PreviewDrawer", () => {
  it("renders the compiled agreement HTML when open", () => {
    render(
      <PreviewDrawer
        open
        onClose={vi.fn()}
        agreementHtml={AGREEMENT_HTML}
        onDownloadPdf={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByRole("heading", { name: "Counter Contract" })).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("keeps the agreement content hidden while the drawer is closed", () => {
    render(
      <PreviewDrawer
        open={false}
        onClose={vi.fn()}
        agreementHtml={AGREEMENT_HTML}
        onDownloadPdf={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("sanitizes markup before rendering it into the drawer", () => {
    render(
      <PreviewDrawer
        open
        onClose={vi.fn()}
        agreementHtml={'<p>safe text</p><script>window.__x = 1</script>'}
        onDownloadPdf={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("safe text")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("hands the rendered page to the PDF export when the button is clicked", async () => {
    const onDownloadPdf = vi.fn().mockResolvedValue(undefined);
    render(
      <PreviewDrawer
        open
        onClose={vi.fn()}
        agreementHtml={AGREEMENT_HTML}
        onDownloadPdf={onDownloadPdf}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: PREVIEW.pdf }));

    await waitFor(() => expect(onDownloadPdf).toHaveBeenCalledTimes(1));
    const [element] = onDownloadPdf.mock.calls[0] as [HTMLElement | null];
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element).toHaveClass("nd-preview-page");
  });
});
