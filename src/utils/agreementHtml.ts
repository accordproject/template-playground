import DOMPurify from "dompurify";

export type TextDirection = "rtl" | "ltr";

/**
 * Block elements that get their own text direction, so an Arabic, Hebrew,
 * Persian or Urdu paragraph reads right to left while English paragraphs stay
 * as they are, even in one agreement that mixes both. Lists and tables are
 * included as well as their items and cells: the list's direction puts the
 * markers on the right side, and the table's puts its first column there.
 */
const DIRECTIONAL_BLOCKS =
  "p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, table, th, td, dt, dd, figcaption";

/** Template variables, as the markdown-html renderer marks them. */
const VARIABLE = "span.variable";

/** Letters of right-to-left scripts. */
const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
/** Any letter; one that isn't right-to-left reads left to right. */
const LETTER = /\p{L}/u;

const directionOfText = (text: string): TextDirection | undefined => {
  const match = LETTER.exec(text);
  if (!match) return undefined;
  return RTL_LETTER.test(match[0]) ? "rtl" : "ltr";
};

/**
 * The direction of an element's own words: its first letter, skipping
 * template variables, since a value such as an English company name at the
 * start of an Arabic sentence must not turn the sentence left to right. Falls
 * back to the variables when they are the only text. Undefined when the
 * element has no letters at all, so it keeps its parent's direction.
 */
export const textDirectionOf = (el: Element): TextDirection | undefined => {
  const doc = el.ownerDocument;
  let fallback: TextDirection | undefined;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const dir = directionOfText(node.nodeValue ?? "");
    if (!dir) continue;
    if (node.parentElement?.closest(VARIABLE)) {
      fallback ??= dir;
      continue;
    }
    return dir;
  }
  return fallback;
};

/**
 * Sanitises rendered agreement HTML for display or export and gives each
 * block element an explicit direction (see textDirectionOf). Without it every
 * block inherits the page's left-to-right direction, which left-aligns
 * right-to-left text and scrambles sentences that mix in left-to-right
 * values. An explicit dir already in the HTML is kept.
 *
 * Each variable is isolated with dir="auto", so a value keeps its own
 * punctuation in place: the period of "Northwind Logistics Ltd." stays after
 * "Ltd" inside an Arabic sentence. A right-to-left table also sits on the
 * right of the page.
 */
export const prepareAgreementHtml = (html: string): string => {
  const fragment = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  fragment.querySelectorAll(DIRECTIONAL_BLOCKS).forEach((el) => {
    if (el.hasAttribute("dir")) return;
    const dir = textDirectionOf(el);
    if (dir) el.setAttribute("dir", dir);
  });
  fragment.querySelectorAll(VARIABLE).forEach((el) => {
    if (!el.hasAttribute("dir")) el.setAttribute("dir", "auto");
  });
  fragment.querySelectorAll<HTMLElement>('table[dir="rtl"]').forEach((table) => {
    table.style.marginLeft = "auto";
    table.style.marginRight = "0";
  });
  const container = document.createElement("div");
  container.appendChild(fragment);
  return container.innerHTML;
};
