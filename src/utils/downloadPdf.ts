import html2pdf from "html2pdf.js";
import { message } from "antd";

/**
 * Renders an element to a PDF download.
 *
 * Extracted from the legacy preview panel so both the old layout
 * (src/pages/MainContainer.tsx) and the design-v2 preview drawer
 * (PreviewDrawer.tsx) share one implementation. The element's own colours are
 * temporarily forced to black on white so the exported document stays legible
 * regardless of the active theme.
 */
export const downloadElementAsPdf = async (element: HTMLElement | null): Promise<void> => {
  if (!element) return;

  const originalBg = element.style.backgroundColor;
  const originalColor = element.style.color;

  try {
    element.style.backgroundColor = "#ffffff";
    element.style.color = "#000000";

    const options = {
      margin: 10,
      filename: "agreement.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    } as const;

    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error("PDF generation failed:", error);
    void message.error("Failed to generate PDF. Please check the console.");
  } finally {
    element.style.backgroundColor = originalBg;
    element.style.color = originalColor;
  }
};
