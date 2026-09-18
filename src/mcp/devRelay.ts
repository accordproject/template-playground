/**
 * DEV-only harness for driving the page's WebMCP tools from an external MCP
 * client (Claude Code, Cursor, …).
 *
 * Loads, in order:
 *  1. @mcp-b/global — polyfills `document.modelContext` (and the deprecated
 *     `navigator.modelContext` alias that registerWebMcp uses), so tools
 *     register without the chrome://flags#enable-webmcp-testing flag.
 *  2. @mcp-b/webmcp-local-relay embed — bridges this page's tools to a
 *     localhost relay that `npx @mcp-b/webmcp-local-relay` exposes over stdio.
 *
 * Never bundled in production: the only caller guards it with import.meta.env.DEV.
 */
const POLYFILL_SRC =
  "https://cdn.jsdelivr.net/npm/@mcp-b/global@latest/dist/index.iife.js";
const RELAY_EMBED_SRC =
  "https://cdn.jsdelivr.net/npm/@mcp-b/webmcp-local-relay@latest/dist/browser/embed.js";

// Must match the port the relay is started on (npx ... --port 9333). Without
// this the embed auto-discovers a worker port (e.g. 9334) the relay isn't on.
const RELAY_PORT = "9333";

function loadScript(
  src: string,
  dataset?: Record<string, string>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false; // preserve execution order across injected scripts
    if (dataset) Object.assign(el.dataset, dataset);
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

/** Install the polyfill before any tool registers, then connect the relay embed. */
export async function setupDevRelay(): Promise<void> {
  await loadScript(POLYFILL_SRC);
  await loadScript(RELAY_EMBED_SRC, { relayPort: RELAY_PORT });
}
