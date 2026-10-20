import { describe, it, expect, vi, afterEach } from "vitest";
import JSZip from "jszip";
import {
  EMPTY_FILTER,
  LIBRARIES,
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
});
