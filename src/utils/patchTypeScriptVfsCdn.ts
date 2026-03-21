/**
 * Patches fetch for known ghost lib requests produced by @typescript/vfs.
 *
 * Root cause:
 * - template-engine loads TypeScript runtime from TYPESCRIPT_URL
 * - @typescript/vfs still fetches lib files from playgroundcdn
 * - some legacy lib names are requested but not hosted there
 */

const PATCH_FLAG = "__tp_vfs_cdn_patch_applied__";
const TYPESCRIPT_CDN = "playgroundcdn.typescriptlang.org";
const TYPESCRIPT_LIB_SEGMENT = "/typescript/lib/";

const KNOWN_MISSING_LIBS = new Set<string>([
  "lib.core.d.ts",
  "lib.decorators.d.ts",
  "lib.decorators.legacy.d.ts",
  "lib.dom.asynciterable.d.ts",
  "lib.webworker.asynciterable.d.ts",
  "lib.es7.d.ts",
  "lib.core.es6.d.ts",
  "lib.core.es7.d.ts",
  "lib.es2016.intl.d.ts",
  "lib.es2017.arraybuffer.d.ts",
  "lib.es2017.date.d.ts",
  "lib.es2022.regexp.d.ts",
]);

const getUrlString = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const isTypeScriptLibRequest = (url: string): boolean =>
  url.includes(TYPESCRIPT_CDN) && url.includes(TYPESCRIPT_LIB_SEGMENT);

export const patchTypeScriptVfsCdn = (): void => {
  if (typeof window === "undefined") return;

  const marker = window as unknown as Record<string, unknown>;
  if (marker[PATCH_FLAG]) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = getUrlString(input);

    if (isTypeScriptLibRequest(url)) {
      const filename = url.split("/").pop() ?? "";
      if (KNOWN_MISSING_LIBS.has(filename)) {
        return new Response("// stub\nexport {};\n", {
          status: 200,
          headers: { "Content-Type": "application/typescript" },
        });
      }
    }

    return originalFetch(input, init);
  };

  marker[PATCH_FLAG] = true;
};
