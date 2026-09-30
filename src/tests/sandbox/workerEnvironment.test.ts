import { describe, it, expect } from "vitest";
import { prepareWorkerEnvironment } from "../../sandbox/workerEnvironment";

describe("prepareWorkerEnvironment", () => {
  it("exposes the worker global as window, as the engine's checks expect", () => {
    const scope: Record<string, unknown> = {};
    prepareWorkerEnvironment(scope);

    expect(scope.window).toBe(scope);
    // browser-or-node's isBrowser: window and window.document both defined
    const win = scope.window as Record<string, unknown>;
    expect(typeof win.document).not.toBe("undefined");
  });

  it("adds an empty, frozen document so guarded DOM checks stay falsy", () => {
    const scope: Record<string, unknown> = {};
    prepareWorkerEnvironment(scope);

    const doc = scope.document as Record<string, unknown>;
    expect(Object.keys(doc)).toEqual([]);
    expect(Object.isFrozen(doc)).toBe(true);
    // The patterns found in the worker bundle
    expect(doc.documentElement && (doc.documentElement as { style?: unknown }).style).toBeFalsy();
    expect(doc.all).toBeUndefined();
  });

  it("leaves an existing window and document alone", () => {
    const existingWindow = { marker: true };
    const existingDocument = { title: "real" };
    const scope: Record<string, unknown> = { window: existingWindow, document: existingDocument };
    prepareWorkerEnvironment(scope);

    expect(scope.window).toBe(existingWindow);
    expect(scope.document).toBe(existingDocument);
  });
});
