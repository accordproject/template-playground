import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { REBUILD_SANDBOX_READY } from "../../constants/rebuildSandbox";
import {
  isRebuildSandboxReady,
  resetRebuildSandboxForTests,
} from "../../store/rebuildSandbox";
import RebuildSandboxFrame from "../../components/RebuildSandboxFrame";

vi.mock("../../sandbox/rebuild.worker?worker&url", () => ({
  default: "/assets/rebuild.worker-test.js",
}));

describe("RebuildSandboxFrame", () => {
  beforeEach(() => {
    resetRebuildSandboxForTests();
  });

  afterEach(() => {
    resetRebuildSandboxForTests();
    cleanup();
  });

  it("renders a hidden iframe with a null origin and an inline document", () => {
    const { container } = render(<RebuildSandboxFrame />);
    const iframe = container.querySelector("iframe");

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    expect(iframe).not.toHaveAttribute("src");
    expect(iframe).toHaveAttribute("title", "Template Rendering Sandbox");
    expect(iframe).toHaveAttribute("aria-hidden", "true");
    expect(iframe).toHaveClass("sandbox-frame-hidden");
  });

  it("embeds a content policy naming the page origin and the worker bundle", () => {
    const { container } = render(<RebuildSandboxFrame />);
    const srcdoc = container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";

    expect(srcdoc).toContain('http-equiv="Content-Security-Policy"');
    expect(srcdoc).toContain("default-src 'none'");
    expect(srcdoc).toContain(`script-src 'nonce-`);
    expect(srcdoc).toContain(window.location.origin);
    expect(srcdoc).toContain(
      JSON.stringify(new URL("/assets/rebuild.worker-test.js", document.baseURI).href),
    );
  });

  it("accepts the ready signal from its own iframe", () => {
    const { container } = render(<RebuildSandboxFrame />);
    const iframe = container.querySelector("iframe");
    if (!iframe) throw new Error("iframe missing");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: REBUILD_SANDBOX_READY },
        origin: "null",
        source: iframe.contentWindow,
      }),
    );

    expect(isRebuildSandboxReady()).toBe(true);
  });

  it("ignores messages from other origins", () => {
    const { container } = render(<RebuildSandboxFrame />);
    const iframe = container.querySelector("iframe");
    if (!iframe) throw new Error("iframe missing");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: REBUILD_SANDBOX_READY },
        origin: "https://malicious.example",
        source: iframe.contentWindow,
      }),
    );

    expect(isRebuildSandboxReady()).toBe(false);
  });

  it("ignores null-origin messages that did not come from its iframe", () => {
    render(<RebuildSandboxFrame />);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: REBUILD_SANDBOX_READY },
        origin: "null",
        source: null,
      }),
    );

    expect(isRebuildSandboxReady()).toBe(false);
  });

  it("detaches the sandbox on unmount", () => {
    const { container, unmount } = render(<RebuildSandboxFrame />);
    const iframe = container.querySelector("iframe");
    if (!iframe) throw new Error("iframe missing");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: REBUILD_SANDBOX_READY },
        origin: "null",
        source: iframe.contentWindow,
      }),
    );
    expect(isRebuildSandboxReady()).toBe(true);

    unmount();
    expect(isRebuildSandboxReady()).toBe(false);
  });
});
