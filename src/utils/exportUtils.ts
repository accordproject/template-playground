import TurndownService from "turndown";
import DOMPurify from "dompurify";

/**
 * Generates a Markdown representation of the provided HTML string.
 */
export const generateMarkdown = (html: string): string => {
  const turndownService = new TurndownService();
  return turndownService.turndown(html);
};

/**
 * Sanitizes and wraps the provided HTML string in a full HTML document.
 */
export const generateHtml = (html: string): string => {
  const sanitizedHtml = DOMPurify.sanitize(html);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agreement</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
${sanitizedHtml}
</body>
</html>`;
};
