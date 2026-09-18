import { webMcpTools } from './tools';

/**
 * Registers the in-page WebMCP panel tools with Chrome's experimental
 * navigator.modelContext (chrome://flags#enable-webmcp-testing, or the dev
 * relay polyfill). Returns a cleanup function. When the API is unavailable the
 * call is a no-op.
 */
export function registerWebMcp(): () => void {
  if (typeof navigator === 'undefined' || !navigator.modelContext?.registerTool) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info(
        '[WebMCP] navigator.modelContext unavailable — enable chrome://flags#enable-webmcp-testing or load the dev relay to expose the panel tools.'
      );
    }
    return () => {};
  }

  const modelContext = navigator.modelContext;
  const cleanups = webMcpTools.map((tool) => modelContext.registerTool(tool));
  return () => {
    for (const cleanup of cleanups) {
      if (typeof cleanup === 'function') cleanup();
    }
  };
}
