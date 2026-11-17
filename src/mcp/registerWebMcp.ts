import { webMcpTools } from "./tools";
import type { ModelContext } from "./modelcontext";

/**
 * Discovers the active WebMCP ModelContext interface from the browser environment.
 * Checks `document.modelContext` first (following the modern W3C WebML Working Group
 * specification), then falls back to `navigator.modelContext` (for origin trials / polyfills).
 */
export function getModelContext(): ModelContext | null {
  if (typeof document !== "undefined" && document.modelContext?.registerTool) {
    return document.modelContext;
  }
  if (typeof navigator !== "undefined" && navigator.modelContext?.registerTool) {
    return navigator.modelContext;
  }
  return null;
}

/**
 * Registers all in-page WebMCP panel tools with the browser's modelContext.
 * Returns an unregister cleanup function.
 * If WebMCP is unavailable in the environment, returns a no-op function cleanly.
 */
export function registerWebMcp(): () => void {
  const modelContext = getModelContext();
  if (!modelContext) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info(
        "[WebMCP] modelContext unavailable — enable chrome://flags#enable-webmcp-testing or browser WebMCP to expose in-page panel tools."
      );
    }
    return () => undefined;
  }

  const cleanups = webMcpTools.map((tool) => modelContext.registerTool(tool));
  return () => {
    for (const cleanup of cleanups) {
      if (typeof cleanup === "function") {
        cleanup();
      }
    }
  };
}
