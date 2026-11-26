import DOMPurify from "dompurify";

/**
 * Block elements that get their own text direction. Each takes it from its
 * first strong character (dir="auto"), so an Arabic, Hebrew or Persian
 * paragraph reads right to left while English paragraphs stay as they are,
 * even in one agreement that mixes both.
 */
const DIRECTIONAL_BLOCKS = "p, h1, h2, h3, h4, h5, h6, li, ul, ol, blockquote, table, td, th, dt, dd, figcaption";

/**
 * Sanitises rendered agreement HTML for display or export and marks each
 * block element dir="auto". Without it every block inherits the page's
 * left-to-right direction, which left-aligns right-to-left text and
 * scrambles the word order of sentences that mix in left-to-right values.
 */
export const prepareAgreementHtml = (html: string): string => {
  const fragment = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  fragment.querySelectorAll(DIRECTIONAL_BLOCKS).forEach((el) => {
    if (!el.hasAttribute("dir")) el.setAttribute("dir", "auto");
  });
  const container = document.createElement("div");
  container.appendChild(fragment);
  return container.innerHTML;
};
