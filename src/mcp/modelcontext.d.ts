/**
 * Ambient type declarations for the WebMCP API (document.modelContext or navigator.modelContext).
 * The modern W3C WebML Working Group specification exposes this on document.modelContext,
 * with earlier origin trials using navigator.modelContext.
 *
 * Available when WebMCP is supported by the browser or polyfilled.
 * See: https://webmachinelearning.github.io/webmcp/
 */

/** Annotations indicating the behavioral characteristics of a tool to the model/agent. */
export interface ToolAnnotations {
  /** True when the tool performs read-only operations without side effects. */
  readOnlyHint?: boolean;
  /** True when the tool performs destructive, state-altering, or consequential actions. */
  consequentialHint?: boolean;
  /** True when the tool content or response should be treated as untrusted. */
  untrustedContentHint?: boolean;
  /** True when the tool is intended for debugging. */
  debugging?: boolean;
}

/** A single content item returned by a tool execution. */
export interface WebMcpToolResultContent {
  type: 'text';
  text: string;
}

/** Result returned from a tool's execute() call. */
export interface WebMcpToolResult {
  content: WebMcpToolResultContent[];
}

/** A tool registered with document.modelContext.registerTool. */
export interface WebMcpToolDescriptor {
  name: string;
  description: string;
  /** JSON Schema object describing the tool input. */
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<WebMcpToolResult> | WebMcpToolResult;
  annotations?: ToolAnnotations;
}

/** The ModelContext WebMCP interface. */
export interface ModelContext {
  registerTool: (tool: WebMcpToolDescriptor) => (() => void) | void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export {};
