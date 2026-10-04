/**
 * Ambient type declarations for Chrome's experimental navigator.modelContext WebMCP testing API.
 * These types mirror the Chrome-exposed testing API and are isolated here to contain API churn.
 * 
 * Available when chrome://flags#enable-webmcp-testing is enabled.
 * See: https://github.com/chromium/chromium/blob/main/chrome/common/extensions/docs/examples/api/modelContext/
 */

/** A single content item returned by a tool execution (text only for this POC). */
export interface WebMcpToolResultContent {
  type: 'text';
  text: string;
}

/** Result returned from a tool's execute() call. */
export interface WebMcpToolResult {
  content: WebMcpToolResultContent[];
}

/** A tool registered with navigator.modelContext.registerTool. */
export interface WebMcpToolDescriptor {
  name: string;
  description: string;
  /** JSON Schema object describing the tool input. */
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<WebMcpToolResult> | WebMcpToolResult;
}

/** The navigator.modelContext WebMCP testing API interface. */
export interface NavigatorModelContext {
  registerTool: (tool: WebMcpToolDescriptor) => (() => void) | void;
}

declare global {
  interface Navigator {
    /**
     * Optional WebMCP testing API, only available when
     * chrome://flags#enable-webmcp-testing is enabled.
     */
    modelContext?: NavigatorModelContext;
  }
}

export {};
