import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getModelContext, registerWebMcp } from "../../mcp/registerWebMcp";
import { webMcpTools } from "../../mcp/tools";
import type { ModelContext, WebMcpToolDescriptor } from "../../mcp/modelcontext";

describe("registerWebMcp", () => {
  const originalDocumentModelContext = (document as unknown as { modelContext?: ModelContext }).modelContext;
  const originalNavigatorModelContext = (navigator as unknown as { modelContext?: ModelContext }).modelContext;

  beforeEach(() => {
    delete (document as unknown as { modelContext?: ModelContext }).modelContext;
    delete (navigator as unknown as { modelContext?: ModelContext }).modelContext;
  });

  afterEach(() => {
    (document as unknown as { modelContext?: ModelContext }).modelContext = originalDocumentModelContext;
    (navigator as unknown as { modelContext?: ModelContext }).modelContext = originalNavigatorModelContext;
  });

  it("discovers document.modelContext when available", () => {
    const mockContext: ModelContext = {
      registerTool: vi.fn(),
    };
    (document as unknown as { modelContext?: ModelContext }).modelContext = mockContext;

    expect(getModelContext()).toBe(mockContext);
  });

  it("falls back to navigator.modelContext when document.modelContext is missing", () => {
    const mockContext: ModelContext = {
      registerTool: vi.fn(),
    };
    (navigator as unknown as { modelContext?: ModelContext }).modelContext = mockContext;

    expect(getModelContext()).toBe(mockContext);
  });

  it("returns null when neither document nor navigator has modelContext", () => {
    expect(getModelContext()).toBeNull();
  });

  it("returns a no-op cleanup function when modelContext is absent", () => {
    const cleanup = registerWebMcp();
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });

  it("registers all webMcpTools and unregisters on cleanup", () => {
    const registeredTools: WebMcpToolDescriptor[] = [];
    const unregisterMock = vi.fn();
    const mockContext: ModelContext = {
      registerTool: vi.fn((tool: WebMcpToolDescriptor) => {
        registeredTools.push(tool);
        return unregisterMock;
      }),
    };
    (document as unknown as { modelContext?: ModelContext }).modelContext = mockContext;

    const cleanup = registerWebMcp();

    expect(mockContext.registerTool).toHaveBeenCalledTimes(webMcpTools.length);
    expect(registeredTools.length).toBe(webMcpTools.length);
    expect(registeredTools.map((t) => t.name)).toContain("get_model");
    expect(registeredTools.map((t) => t.name)).toContain("set_model");
    expect(registeredTools.map((t) => t.name)).toContain("get_template");
    expect(registeredTools.map((t) => t.name)).toContain("simulate_contract");

    cleanup();
    expect(unregisterMock).toHaveBeenCalledTimes(webMcpTools.length);
  });
});
