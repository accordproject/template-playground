import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { patchTypeScriptVfsCdn } from "../../utils/patchTypeScriptVfsCdn";

const PATCH_FLAG = "__tp_vfs_cdn_patch_applied__";

describe("patchTypeScriptVfsCdn", () => {
  const originalWindowFetch = window.fetch;

  beforeEach(() => {
    delete (window as unknown as Record<string, unknown>)[PATCH_FLAG];
  });

  afterEach(() => {
    window.fetch = originalWindowFetch;
    delete (window as unknown as Record<string, unknown>)[PATCH_FLAG];
    vi.restoreAllMocks();
  });

  it("stubs known missing TypeScript lib files from playground CDN", async () => {
    const upstreamFetch = vi.fn(async () => {
      return new Response("upstream", { status: 200 });
    });

    window.fetch = upstreamFetch as unknown as typeof window.fetch;
    patchTypeScriptVfsCdn();

    const response = await window.fetch(
      "https://playgroundcdn.typescriptlang.org/cdn/5.1.6/typescript/lib/lib.core.d.ts",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/typescript");
    await expect(response.text()).resolves.toContain("// stub");
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("passes through unknown TypeScript lib files", async () => {
    const upstreamResponse = new Response("real upstream", { status: 200 });
    const upstreamFetch = vi.fn(async () => upstreamResponse);

    window.fetch = upstreamFetch as unknown as typeof window.fetch;
    patchTypeScriptVfsCdn();

    const requestUrl =
      "https://playgroundcdn.typescriptlang.org/cdn/5.1.6/typescript/lib/lib.es2021.d.ts";

    const response = await window.fetch(requestUrl);

    expect(response).toBe(upstreamResponse);
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
    expect(upstreamFetch).toHaveBeenCalledWith(requestUrl, undefined);
  });

  it("passes through non-TypeScript-CDN requests", async () => {
    const upstreamResponse = new Response("normal fetch", { status: 200 });
    const upstreamFetch = vi.fn(async () => upstreamResponse);

    window.fetch = upstreamFetch as unknown as typeof window.fetch;
    patchTypeScriptVfsCdn();

    const requestUrl = "https://example.com/api/data";

    const response = await window.fetch(requestUrl);

    expect(response).toBe(upstreamResponse);
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
    expect(upstreamFetch).toHaveBeenCalledWith(requestUrl, undefined);
  });

  it("is idempotent and does not wrap fetch multiple times", () => {
    const upstreamFetch = vi.fn(
      async () => new Response("ok", { status: 200 }),
    );
    window.fetch = upstreamFetch as unknown as typeof window.fetch;

    patchTypeScriptVfsCdn();
    const wrappedFetch = window.fetch;

    patchTypeScriptVfsCdn();

    expect(window.fetch).toBe(wrappedFetch);
  });
});
