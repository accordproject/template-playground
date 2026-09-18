import { beforeAll, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { BUNDLED_MODELS } from "../../utils/modelCache";

describe("createTemplateArchive", () => {
  let createTemplateArchive: typeof import("../../store/store").createTemplateArchive;

  beforeAll(async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });
    ({ createTemplateArchive } = await import("../../store/store"));
  });

  it("includes the template files, bundled models, and optional logic", async () => {
    const content = await createTemplateArchive(
      "template markdown",
      "namespace org.example",
      "class ExampleLogic {}",
    );
    const archive = await JSZip.loadAsync(content);

    expect(Object.keys(archive.files)).toEqual(
      expect.arrayContaining([
        "package.json",
        "text/grammar.tem.md",
        "model/model.cto",
        "logic/logic.ts",
        ...BUNDLED_MODELS.map(({ fileName }) => `model/${fileName}`),
      ]),
    );
    expect(await archive.file("package.json")?.async("string")).toContain(
      '"name":"playground-template"',
    );
    expect(await archive.file("text/grammar.tem.md")?.async("string")).toBe(
      "template markdown",
    );
    expect(await archive.file("model/model.cto")?.async("string")).toBe(
      "namespace org.example",
    );
    expect(await archive.file("logic/logic.ts")?.async("string")).toBe(
      "class ExampleLogic {}",
    );
  });

  it("omits logic/logic.ts when no logic is provided", async () => {
    const content = await createTemplateArchive(
      "template markdown",
      "namespace org.example",
      "",
    );
    const archive = await JSZip.loadAsync(content);

    expect(archive.file("logic/logic.ts")).toBeNull();
  });
});