import { describe, it, expect, vi, afterEach } from "vitest";
import JSZip from "jszip";
import {
  EMPTY_FILTER,
  LIBRARIES,
  MAX_ARCHIVE_DOWNLOAD_BYTES,
  fetchArchive,
  fetchLibraryIndex,
  filterTemplates,
  groupTemplates,
  libraryTags,
  parseLibraryIndex,
} from "../../utils/templateLibrary";
import { ciceroAccepts } from "../../utils/cicero";

const index = {
  "a@0.5.0": { name: "a", version: "0.5.0", ciceroVersion: "^0.22.0", tags: ["finance"] },
  "a@1.0.0": { name: "a", displayName: "Alpha", version: "1.0.0", ciceroVersion: "^1.0.0", type: 0, tags: ["finance", "sales"] },
  "a@1.0.10": { name: "a", displayName: "Alpha", version: "1.0.10", ciceroVersion: "^2.0.0", type: 0, tags: ["finance", "sales"] },
  "b@1.0.0": { name: "b", displayName: "Beta", version: "1.0.0", ciceroVersion: "^2.0.0", type: 1, tags: ["finance"], description: "a clause" },
  "c@1.0.0": { name: "c", displayName: "Gamma", version: "1.0.0", ciceroVersion: "^2.0.0", type: 1, tags: [] },
  "d@1.0.0": { name: "d", displayName: "Delta", version: "1.0.0", ciceroVersion: "^2.0.0", archived: true, tags: ["sales"] },
};

describe("template library", () => {
  it("accepts the Cicero versions Cicero itself does: 2.0 and later, not 1.x or 0.x", async () => {
    expect(await ciceroAccepts("^2.0.0")).toBe(true);
    expect(await ciceroAccepts("^3.0.0")).toBe(true);
    expect(await ciceroAccepts("^1.0.0")).toBe(false);
    expect(await ciceroAccepts("^0.26.0")).toBe(false);
    expect(await ciceroAccepts("")).toBe(false);
    expect(await ciceroAccepts(undefined)).toBe(false);
  });

  it("keeps the newest version of each template that this Cicero accepts", async () => {
    const list = await parseLibraryIndex(index);
    // a@1.0.0 targets Cicero 1.x, which Cicero 3 no longer accepts; a@1.0.10 is the newest anyway.
    expect(list.map((t) => `${t.name}@${t.version}`)).toEqual(["a@1.0.10", "b@1.0.0", "d@1.0.0", "c@1.0.0"]);
    expect(list.find((t) => t.name === "b")?.type).toBe("Clause");
    expect(list.find((t) => t.name === "a")?.displayName).toBe("Alpha");
  });

  describe("checking archives", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const archive = (cicero: string) => {
      const zip = new JSZip();
      zip.file("package.json", JSON.stringify({ name: "t", version: "1.0.0", accordproject: { cicero } }));
      return zip.generateAsync({ type: "uint8array" });
    };

    it("falls back to the newest version whose archive Cicero accepts, and hides a template with none", async () => {
      // The index says ^2.0.0 throughout; the archives disagree for some versions.
      const archives: Record<string, string> = {
        "x@1.1.0": "^1.0.0",
        "x@1.0.1": "^1.0.0",
        "x@1.0.0": "^2.0.0",
        "y@1.0.0": "^1.0.0",
        "z@2.0.0": "^3.0.0",
      };
      const index = Object.fromEntries(
        Object.keys(archives).map((key) => {
          const [name, version] = key.split("@");
          return [key, { name, version, ciceroVersion: "^2.0.0" }];
        })
      );
      const fetchMock = vi.fn(async (url: string) => {
        if (url.endsWith("template-library.json")) return { ok: true, json: () => Promise.resolve(index) };
        const key = /archives\/(.+)\.cta$/.exec(url)![1];
        const bytes = await archive(archives[key]);
        return { ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) };
      });
      vi.stubGlobal("fetch", fetchMock);
      const list = await fetchLibraryIndex(LIBRARIES[0]);
      expect(list.map((t) => `${t.name}@${t.version}`)).toEqual(["x@1.0.0", "z@2.0.0"]);
      // Each archive is downloaded at most once, older ones only after a newer one is refused.
      const downloaded = fetchMock.mock.calls.map(([url]) => url).filter((url) => url.endsWith(".cta"));
      expect(downloaded.map((url) => /archives\/(.+)\.cta$/.exec(url)![1]).sort()).toEqual(Object.keys(archives).sort());
    });
  });

  it("orders versions semantically: a prerelease below its release", async () => {
    const list = await parseLibraryIndex({
      "e@1.0.0-beta.1": { name: "e", version: "1.0.0-beta.1", ciceroVersion: "^2.0.0" },
      "e@1.0.0": { name: "e", version: "1.0.0", ciceroVersion: "^2.0.0" },
      "f@1.0.9": { name: "f", version: "1.0.9", ciceroVersion: "^2.0.0" },
      "f@1.0.10": { name: "f", version: "1.0.10", ciceroVersion: "^2.0.0" },
    });
    expect(list.map((t) => t.version)).toEqual(["1.0.0", "1.0.10"]);
  });

  it("filters by text, type, category and archived", async () => {
    const list = await parseLibraryIndex(index);
    expect(filterTemplates(list, EMPTY_FILTER).map((t) => t.name)).not.toContain("d");
    expect(filterTemplates(list, { ...EMPTY_FILTER, showArchived: true }).map((t) => t.name)).toContain("d");
    expect(filterTemplates(list, { ...EMPTY_FILTER, type: "Clause" }).map((t) => t.name).sort()).toEqual(["b", "c"]);
    expect(filterTemplates(list, { ...EMPTY_FILTER, tags: ["sales"] }).map((t) => t.name)).toEqual(["a"]);
    expect(filterTemplates(list, { ...EMPTY_FILTER, query: "CLAUSE" }).map((t) => t.name)).toEqual(["b"]);
  });

  it("groups by category, most used first, then untagged, then archived", async () => {
    const list = await parseLibraryIndex(index);
    expect(libraryTags(list.filter((t) => !t.archived))).toEqual(["finance", "sales"]);
    const groups = groupTemplates(filterTemplates(list, { ...EMPTY_FILTER, showArchived: true }), { untagged: "Other", archived: "Archived" });
    expect(groups.map((g) => g.title)).toEqual(["finance", "sales", "Other", "Archived"]);
    expect(groups[0].templates.map((t) => t.name)).toEqual(["a", "b"]);
    expect(groupTemplates(filterTemplates(list, EMPTY_FILTER), { untagged: "Other", archived: "Archived" }, ["sales"]).map((g) => g.title)).toEqual(["sales", "Other"]);
  });

  describe("fetchArchive", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it("rejects invalid URLs and non-https protocols", async () => {
      await expect(fetchArchive("not-a-valid-url")).rejects.toThrow("That is not a valid URL.");
      await expect(fetchArchive("ftp://example.com/test.cta")).rejects.toThrow(
        "Only https URLs can be imported.",
      );
      await expect(fetchArchive("javascript:alert(1)")).rejects.toThrow(
        "Only https URLs can be imported.",
      );
      await expect(fetchArchive("http://example.com/archive.cta")).rejects.toThrow(
        "Only https URLs can be imported.",
      );
      await expect(fetchArchive("http://localhost:3000/archive.cta")).rejects.toThrow(
        "Only https URLs can be imported.",
      );
    });

    it("downloads valid archives over HTTPS", async () => {
      const payload = new Uint8Array([10, 20, 30]);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-length": "3" }),
          arrayBuffer: () => Promise.resolve(payload.buffer),
        }),
      );

      const result = await fetchArchive("https://example.com/template.cta");
      expect(result).toEqual(payload);
    });

    it("rejects immediately when Content-Length exceeds maxBytes", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-length": String(MAX_ARCHIVE_DOWNLOAD_BYTES + 100) }),
          arrayBuffer: vi.fn(),
        }),
      );

      await expect(fetchArchive("https://example.com/huge.cta")).rejects.toThrow(/exceeds the maximum allowed size/);
    });

    it("rejects when streamed chunks exceed maxBytes", async () => {
      const chunk1 = new Uint8Array(50);
      const chunk2 = new Uint8Array(60);
      let step = 0;

      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (step === 0) {
            step += 1;
            return Promise.resolve({ done: false, value: chunk1 });
          }
          if (step === 1) {
            step += 1;
            return Promise.resolve({ done: false, value: chunk2 });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
        cancel: vi.fn().mockResolvedValue(undefined),
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers(),
          body: { getReader: () => mockReader },
        }),
      );

      await expect(fetchArchive("https://example.com/stream.cta", { maxBytes: 80 })).rejects.toThrow(
        /exceeds the maximum allowed size/,
      );
      expect(mockReader.cancel).toHaveBeenCalled();
    });

    it("streams and combines chunks when within maxBytes", async () => {
      const chunk1 = new Uint8Array([1, 2]);
      const chunk2 = new Uint8Array([3, 4]);
      let step = 0;

      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (step === 0) {
            step += 1;
            return Promise.resolve({ done: false, value: chunk1 });
          }
          if (step === 1) {
            step += 1;
            return Promise.resolve({ done: false, value: chunk2 });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers(),
          body: { getReader: () => mockReader },
        }),
      );

      const result = await fetchArchive("https://example.com/stream.cta");
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("rejects when fetch times out", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((_url, { signal }: { signal?: AbortSignal } = {}) => {
          return new Promise((_, reject) => {
            signal?.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted", "AbortError"));
            });
          });
        }),
      );

      await expect(fetchArchive("https://example.com/slow.cta", { timeoutMs: 50 })).rejects.toThrow(
        /timed out after/,
      );
    });

    it("rejects when reading the body stalls and times out", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((_url, { signal }: { signal: AbortSignal }) => {
          const mockReader = {
            read: vi.fn().mockImplementation(() => {
              return new Promise((_, reject) => {
                signal.addEventListener("abort", () => {
                  reject(new Error("aborted"));
                });
              });
            }),
            cancel: vi.fn().mockResolvedValue(undefined),
          };
          return Promise.resolve({
            ok: true,
            headers: new Headers(),
            body: { getReader: () => mockReader },
          });
        }),
      );

      await expect(fetchArchive("https://example.com/stalled-body.cta", { timeoutMs: 50 })).rejects.toThrow(
        /timed out after/,
      );
    });

    it("rejects when cancelled via external signal", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(fetchArchive("https://example.com/cancel.cta", { signal: controller.signal })).rejects.toThrow(
        "The download was cancelled.",
      );
    });

    it("throws server error message on non-ok HTTP responses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        }),
      );

      await expect(fetchArchive("https://example.com/missing.cta")).rejects.toThrow("The server answered 404.");
    });
  });
});
