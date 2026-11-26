import { prepareAgreementHtml } from "./agreementHtml";

/** File name of the rendered agreement as a PDF (Preview and the Deploy step). */
export const AGREEMENT_PDF_FILE = "agreement.pdf";

/**
 * html2canvas draws list markers on the left whatever the list's direction,
 * so in a right-to-left list the bullets and numbers end up far from their
 * text. For the PDF, those lists get their markers as text at the start of
 * each item instead, which lands them right beside it, on the right.
 */
export const inlineRtlListMarkers = (page: HTMLElement) => {
  page.querySelectorAll<HTMLElement>('ul[dir="rtl"], ol[dir="rtl"]').forEach((list) => {
    const ordered = list.tagName === "OL";
    const start = ordered ? Number(list.getAttribute("start") ?? 1) || 1 : 1;
    list.style.listStyle = "none";
    list.style.paddingLeft = "0";
    list.style.paddingRight = "1.5em";
    Array.from(list.children)
      .filter((item) => item.tagName === "LI")
      .forEach((item, i) => {
        const marker = document.createElement("span");
        marker.className = "nd-pdf-list-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = ordered ? `${start + i}. ` : "• ";
        // A loose list wraps each item's text in a paragraph; put the marker in it.
        const first = item.firstElementChild;
        const textBefore = first && Array.from(item.childNodes).slice(0, Array.from(item.childNodes).indexOf(first));
        const isLoose = first?.tagName === "P" && textBefore?.every((n) => !n.textContent?.trim());
        const target = isLoose && first ? first : item;
        target.insertBefore(marker, target.firstChild);
      });
  });
};

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
  page.innerHTML = prepareAgreementHtml(html);
  inlineRtlListMarkers(page);
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
