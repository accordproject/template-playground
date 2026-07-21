import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchTemplateIndex,
  fetchTemplate,
  clearTemplateCache,
  TemplateIndexEntry,
} from "../../utils/templateLibrary";

// Mock semver so tests are not sensitive to the actual CICERO_RANGE from package.json
vi.mock("semver", () => ({
  intersects: vi.fn(),
  gt: vi.fn(),
}));

// Mock package.json cicero dependency
vi.mock("../../../package.json", () => ({
  default: {
    dependencies: { "@accordproject/cicero-core": "^1.0.0" },
  },
}));

// Mock modelCache (used by generateDefaultData)
vi.mock("../../utils/modelCache", () => ({
  loadBundledModels: vi.fn(),
  BUNDLED_MODELS: {},
}));

// Prevent real concerto classes from being instantiated in generateDefaultData
vi.mock("@accordproject/concerto-core", () => ({
  ModelManager: vi.fn().mockImplementation(() => ({
    addCTOModel: vi.fn(),
    getModelFiles: vi.fn().mockReturnValue([]),
  })),
  Factory: vi.fn(),
  Serializer: vi.fn(),
}));

import { intersects, gt } from "semver";

const COMPATIBLE = true;
const INCOMPATIBLE = false;

function makeLibraryIndex(
  entries: Array<{
    name: string;
    version: string;
    ciceroVersion: string;
    displayName?: string;
    description?: string;
    url?: string;
    compatible?: boolean;
  }>,
) {
  const index: Record<string, object> = {};
  for (const e of entries) {
    index[`${e.name}@${e.version}`] = {
      name: e.name,
      version: e.version,
      ciceroVersion: e.ciceroVersion,
      ...(e.displayName ? { displayName: e.displayName } : {}),
      ...(e.description ? { description: e.description } : {}),
      ...(e.url ? { url: e.url } : {}),
    };
    // Track compatibility for the mock
    (e as { compatible?: boolean }).compatible = e.compatible ?? COMPATIBLE;
  }
  return index;
}

describe("fetchTemplateIndex", () => {
  beforeEach(() => {
    clearTemplateCache();
    vi.resetAllMocks();
    (intersects as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (gt as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => a > b,
    );
  });

  it("returns entries sorted alphabetically by display name", async () => {
    const library = makeLibraryIndex([
      { name: "zebra", version: "1.0.0", ciceroVersion: "^1.0.0" },
      { name: "apple", version: "1.0.0", ciceroVersion: "^1.0.0" },
      { name: "mango", version: "1.0.0", ciceroVersion: "^1.0.0" },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    const result = await fetchTemplateIndex();

    expect(result.map((e) => e.NAME)).toEqual(["apple", "mango", "zebra"]);
  });

  it("filters out entries with incompatible cicero versions", async () => {
    (intersects as ReturnType<typeof vi.fn>).mockImplementation(
      (_range: string, ciceroVersion: string) =>
        ciceroVersion === "^1.0.0",
    );
    const library = makeLibraryIndex([
      { name: "compatible", version: "1.0.0", ciceroVersion: "^1.0.0" },
      { name: "incompatible", version: "1.0.0", ciceroVersion: "^0.22.0" },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    const result = await fetchTemplateIndex();

    expect(result.map((e) => e.dirName)).toEqual(["compatible"]);
  });

  it("deduplicates to the latest version per template name", async () => {
    (gt as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => a > b,
    );
    const library = makeLibraryIndex([
      { name: "hello", version: "1.0.0", ciceroVersion: "^1.0.0" },
      { name: "hello", version: "1.2.0", ciceroVersion: "^1.0.0" },
      { name: "hello", version: "1.1.0", ciceroVersion: "^1.0.0" },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    const result = await fetchTemplateIndex();

    expect(result).toHaveLength(1);
    expect(result[0].dirName).toBe("hello");
  });

  it("uses displayName when provided, falls back to name", async () => {
    const library = makeLibraryIndex([
      {
        name: "helloworld",
        version: "1.0.0",
        ciceroVersion: "^1.0.0",
        displayName: "Hello World",
      },
      { name: "nda", version: "1.0.0", ciceroVersion: "^1.0.0" },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    const result = await fetchTemplateIndex();
    const byDir = Object.fromEntries(result.map((e) => [e.dirName, e]));

    expect(byDir["helloworld"].NAME).toBe("Hello World");
    expect(byDir["nda"].NAME).toBe("nda");
  });

  it("sets dirName to the raw template name regardless of displayName", async () => {
    const library = makeLibraryIndex([
      {
        name: "helloworld",
        version: "1.0.0",
        ciceroVersion: "^1.0.0",
        displayName: "Hello World",
      },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    const [entry] = await fetchTemplateIndex();
    expect(entry.dirName).toBe("helloworld");
  });

  it("returns cached result without re-fetching on second call", async () => {
    const library = makeLibraryIndex([
      { name: "hello", version: "1.0.0", ciceroVersion: "^1.0.0" },
    ]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    await fetchTemplateIndex();
    await fetchTemplateIndex();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws when the network request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchTemplateIndex()).rejects.toThrow("HTTP 500");
  });
});

describe("fetchTemplate", () => {
  beforeEach(() => {
    clearTemplateCache();
    vi.resetAllMocks();
    (intersects as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (gt as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => a > b,
    );
  });

  async function seedIndex(
    name: string,
    displayName?: string,
    url = "https://example.com/template.zip",
  ) {
    const library = {
      [`${name}@1.0.0`]: {
        name,
        version: "1.0.0",
        ciceroVersion: "^1.0.0",
        ...(displayName ? { displayName } : {}),
        url,
      },
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(library),
    });
    await fetchTemplateIndex();
  }

  function makeZipMock(files: Record<string, string>) {
    return {
      default: {
        loadAsync: vi.fn().mockResolvedValue({
          file: (path: string) => {
            const content = files[path];
            return content !== undefined
              ? { async: () => Promise.resolve(content) }
              : null;
          },
          files: Object.fromEntries(
            Object.keys(files).map((path) => [
              path,
              { async: () => Promise.resolve(files[path]) },
            ]),
          ),
        }),
      },
    };
  }

  it("throws when called before fetchTemplateIndex populates the index", async () => {
    await expect(fetchTemplate("Unknown Template")).rejects.toThrow(
      'Unknown template: "Unknown Template"',
    );
  });

  it("extracts TEMPLATE, MODEL, and DATA from the zip", async () => {
    await seedIndex("helloworld", "Hello World");

    const zipFiles = {
      "text/grammar.tem.md": "Hello {{firstName}}",
      "model/model.cto":
        'namespace test@1.0.0\n@template\nconcept Greet { o String firstName }',
      "sampleData.json": '{"firstName":"Alice"}',
    };
    vi.doMock("jszip", () => makeZipMock(zipFiles));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const sample = await fetchTemplate("Hello World");

    expect(sample.NAME).toBe("Hello World");
    expect(sample.TEMPLATE).toBe("Hello {{firstName}}");
    expect(sample.MODEL).toContain("namespace test@1.0.0");
    expect(sample.DATA).toEqual({ firstName: "Alice" });
  });

  it("sets LOGIC when logic/logic.ts is present in the zip", async () => {
    await seedIndex("counter", "Counter");

    const zipFiles = {
      "text/grammar.tem.md": "Counter {{count}}",
      "model/model.cto": "namespace test@1.0.0\n@template\nconcept C { o Integer count }",
      "sampleData.json": '{"count":0}',
      "logic/logic.ts": "export function main() {}",
    };
    vi.doMock("jszip", () => makeZipMock(zipFiles));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const sample = await fetchTemplate("Counter");
    expect(sample.LOGIC).toBe("export function main() {}");
  });

  it("omits LOGIC when logic/logic.ts is absent", async () => {
    await seedIndex("simple", "Simple");

    const zipFiles = {
      "text/grammar.tem.md": "Hello",
      "model/model.cto": "namespace test@1.0.0\n@template\nconcept S { o String x }",
      "sampleData.json": '{"x":"y"}',
    };
    vi.doMock("jszip", () => makeZipMock(zipFiles));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const sample = await fetchTemplate("Simple");
    expect(sample.LOGIC).toBeUndefined();
  });

  it("caches result so the zip is only fetched once", async () => {
    await seedIndex("helloworld", "Hello World");

    const zipFiles = {
      "text/grammar.tem.md": "Hello",
      "model/model.cto": "namespace test@1.0.0\n@template\nconcept H { o String x }",
      "sampleData.json": '{"x":"y"}',
    };
    vi.doMock("jszip", () => makeZipMock(zipFiles));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
    global.fetch = fetchMock;

    await fetchTemplate("Hello World");
    await fetchTemplate("Hello World");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the zip download fails", async () => {
    await seedIndex("helloworld", "Hello World");

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchTemplate("Hello World")).rejects.toThrow("HTTP 404");
  });
});

describe("clearTemplateCache", () => {
  beforeEach(() => {
    clearTemplateCache();
    vi.resetAllMocks();
    (intersects as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (gt as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => a > b,
    );
  });

  it("causes fetchTemplateIndex to re-fetch after being called", async () => {
    (intersects as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (gt as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => a > b,
    );
    const library = {
      "hello@1.0.0": { name: "hello", version: "1.0.0", ciceroVersion: "^1.0.0" },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(library),
    });

    await fetchTemplateIndex();
    clearTemplateCache();
    await fetchTemplateIndex();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
