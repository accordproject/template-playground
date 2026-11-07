import DOMPurify from "dompurify";

/** File name of the rendered agreement as a PDF (Preview and the Deploy step). */
export const AGREEMENT_PDF_FILE = "agreement.pdf";

/**
 * Saves rendered agreement HTML as an A4 PDF: sanitised, black on white, in
 * an element of its own rather than whatever the page is showing. Callers
 * pass HTML rendered afresh (store.renderAgreement), so a PDF never holds an
 * agreement older than the current sources. html2pdf.js loads on first use.
 */
export const saveAgreementPdf = async (html: string, fileName: string = AGREEMENT_PDF_FILE) => {
  const { default: html2pdf } = await import("html2pdf.js");
  const page = document.createElement("div");
  page.className = "nd-preview-page";
  page.style.cssText = "background:#fff;color:#000;padding:16px";
  page.innerHTML = DOMPurify.sanitize(html);
  await html2pdf()
    .set({
      margin: 10,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    } as const)
    .from(page)
    .save();
};
