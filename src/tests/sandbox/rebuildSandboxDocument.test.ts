import { describe, it, expect } from "vitest";
import {
  buildRebuildSandboxCsp,
  buildRebuildSandboxDocument,
  createNonce,
  toScriptLiteral,
  TYPESCRIPT_CDN_ORIGIN,
} from "../../sandbox/rebuildSandboxDocument";

const ORIGIN = "https://playground.example";
const WORKER_URL = "https://playground.example/assets/rebuild.worker-abc123.js";

function directives(csp: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of csp.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    result[name] = values.join(" ");
  }
  return result;
}

describe("buildRebuildSandboxCsp", () => {
  const csp = directives(buildRebuildSandboxCsp(ORIGIN, "n0nce"));

  it("blocks everything by default", () => {
    expect(csp["default-src"]).toBe("'none'");
  });

  it("allows scripts only from the nonced bootstrap, the playground origin and eval", () => {
    expect(csp["script-src"]).toBe(`'nonce-n0nce' ${ORIGIN} 'unsafe-eval'`);
    expect(csp["script-src"]).not.toContain("'unsafe-inline'");
    // No scheme-wide sources: only the one named origin may serve scripts.
    expect(csp["script-src"].split(" ")).not.toContain("https:");
  });

  it("allows only blob workers", () => {
    expect(csp["worker-src"]).toBe("blob:");
  });

  it("allows network access only to the TypeScript CDN", () => {
    expect(csp["connect-src"]).toBe(TYPESCRIPT_CDN_ORIGIN);
    expect(csp["connect-src"]).not.toContain(ORIGIN);
  });

  it("forbids base changes and form submissions", () => {
    expect(csp["base-uri"]).toBe("'none'");
    expect(csp["form-action"]).toBe("'none'");
  });
});

describe("buildRebuildSandboxDocument", () => {
  const html = buildRebuildSandboxDocument({
    origin: ORIGIN,
    workerUrl: WORKER_URL,
    nonce: "n0nce",
  });

  it("declares the policy in a meta tag before the bootstrap script", () => {
    const metaIndex = html.indexOf('http-equiv="Content-Security-Policy"');
    const scriptIndex = html.indexOf("<script");
    expect(metaIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeGreaterThan(metaIndex);
    expect(html).toContain(buildRebuildSandboxCsp(ORIGIN, "n0nce"));
  });

  it("authorises the bootstrap script with the nonce", () => {
    expect(html).toContain('<script nonce="n0nce">');
  });

  it("embeds the worker URL as a string literal", () => {
    expect(html).toContain(`var WORKER_URL = "${WORKER_URL}";`);
  });

  it("escapes a hostile worker URL so it cannot close the script tag", () => {
    const hostile = buildRebuildSandboxDocument({
      origin: ORIGIN,
      workerUrl: 'x";</script><script>alert(1)</script>',
      nonce: "n0nce",
    });
    expect(hostile).not.toContain("</script><script>alert(1)");
    expect(hostile).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
  });

  it("starts a classic worker, never a module worker", () => {
    // Module workers cannot start from blob URLs in a null-origin document,
    // and importScripts() needs no CORS headers from the static host. The
    // bootstrap's behaviour is covered in rebuildSandboxBootstrap.test.ts.
    expect(html).not.toContain('type: "module"');
    expect(html).not.toContain("import(");
  });
});

describe("toScriptLiteral", () => {
  it("produces valid JavaScript that survives an HTML script context", () => {
    const value = "a</script>b\u2028c";
    const literal = toScriptLiteral(value);
    expect(literal).not.toContain("</script");
    expect(literal).not.toContain("\u2028");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    expect(new Function(`return ${literal}`)()).toBe(value);
  });
});

describe("createNonce", () => {
  it("returns 32 hex characters that differ between calls", () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(b).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});
