import { transform } from "@accordproject/markdown-transform";
import DOMPurify from "dompurify";

/**
 * Generates a plain text representation of the provided markdown string.
 */
export const generateText = async (markdown: string): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const result = (await transform(
    markdown,
    "markdown",
    ["plaintext"],
    {},
    { verbose: false },
  )) as string;
  return result;
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
