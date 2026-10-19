import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTER,
  compareVersions,
  filterTemplates,
  groupTemplates,
  isCompatibleCicero,
  libraryTags,
  parseLibraryIndex,
} from "../../utils/templateLibrary";

const index = {
  "a@0.5.0": { name: "a", version: "0.5.0", ciceroVersion: "^0.22.0", tags: ["finance"] },
  "a@1.0.0": { name: "a", displayName: "Alpha", version: "1.0.0", ciceroVersion: "^1.0.0", type: 0, tags: ["finance", "sales"] },
  "a@1.0.10": { name: "a", displayName: "Alpha", version: "1.0.10", ciceroVersion: "^2.0.0", type: 0, tags: ["finance", "sales"] },
  "b@1.0.0": { name: "b", displayName: "Beta", version: "1.0.0", ciceroVersion: "^2.0.0", type: 1, tags: ["finance"], description: "a clause" },
  "c@1.0.0": { name: "c", displayName: "Gamma", version: "1.0.0", ciceroVersion: "^2.0.0", type: 1, tags: [] },
  "d@1.0.0": { name: "d", displayName: "Delta", version: "1.0.0", ciceroVersion: "^2.0.0", archived: true, tags: ["sales"] },
};

describe("template library", () => {
  it("treats Cicero 1.0 and later as compatible", () => {
    expect(isCompatibleCicero("^2.0.0")).toBe(true);
    expect(isCompatibleCicero("^1.0.0")).toBe(true);
    expect(isCompatibleCicero("^0.26.0")).toBe(false);
    expect(isCompatibleCicero("")).toBe(false);
  });

  it("keeps the newest compatible version of each template", () => {
    const list = parseLibraryIndex(index);
    expect(list.map((t) => `${t.name}@${t.version}`)).toEqual(["b@1.0.0", "d@1.0.0", "c@1.0.0", "a@1.0.10"].sort((x, y) => {
      const names: Record<string, string> = { a: "Alpha", b: "Beta", c: "Gamma", d: "Delta" };
      return names[x[0]].localeCompare(names[y[0]]);
    }));
    expect(list.find((t) => t.name === "b")?.type).toBe("Clause");
  });

  it("filters by text, type, category and archived", () => {
    const list = parseLibraryIndex(index);
    expect(filterTemplates(list, EMPTY_FILTER).map((t) => t.name)).not.toContain("d");
    expect(filterTemplates(list, { ...EMPTY_FILTER, showArchived: true }).map((t) => t.name)).toContain("d");
    expect(filterTemplates(list, { ...EMPTY_FILTER, type: "Clause" }).map((t) => t.name).sort()).toEqual(["b", "c"]);
    expect(filterTemplates(list, { ...EMPTY_FILTER, tags: ["sales"] }).map((t) => t.name)).toEqual(["a"]);
    expect(filterTemplates(list, { ...EMPTY_FILTER, query: "CLAUSE" }).map((t) => t.name)).toEqual(["b"]);
  });

  it("groups by category, most used first, then untagged, then archived", () => {
    const list = parseLibraryIndex(index);
    expect(libraryTags(list.filter((t) => !t.archived))).toEqual(["finance", "sales"]);
    const groups = groupTemplates(filterTemplates(list, { ...EMPTY_FILTER, showArchived: true }), { untagged: "Other", archived: "Archived" });
    expect(groups.map((g) => g.title)).toEqual(["finance", "sales", "Other", "Archived"]);
    expect(groups[0].templates.map((t) => t.name)).toEqual(["a", "b"]);
    expect(groupTemplates(filterTemplates(list, EMPTY_FILTER), { untagged: "Other", archived: "Archived" }, ["sales"]).map((g) => g.title)).toEqual(["sales", "Other"]);
  });

  it("orders versions semantically: prereleases below their release, build metadata ignored", () => {
    expect(compareVersions("1.0.0-beta.1", "1.0.0")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "1.0.0-beta.1")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0-beta.2", "1.0.0-beta.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBeLessThan(0);
    expect(compareVersions("1.0.0-1", "1.0.0-alpha")).toBeLessThan(0);
    expect(compareVersions("1.0.0+build.5", "1.0.0+build.1")).toBe(0);
    expect(compareVersions("1.0.10", "1.0.9")).toBeGreaterThan(0);

    const list = parseLibraryIndex({
      "e@1.0.0-beta.1": { name: "e", version: "1.0.0-beta.1", ciceroVersion: "^2.0.0" },
      "e@1.0.0": { name: "e", version: "1.0.0", ciceroVersion: "^2.0.0" },
    });
    expect(list.map((t) => t.version)).toEqual(["1.0.0"]);
  });
});
