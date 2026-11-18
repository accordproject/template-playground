import { describe, it, expect } from "vitest";
import { freshFolderName, writeTemplateFiles, type DirectoryHandle } from "../../utils/saveToFolder";
import { exportTemplateFiles } from "../../utils/templateArchive";
import * as counter from "../../samples/counterLogic";

/** An in-memory folder tree with the File System Access calls the module uses. */
const memoryFolder = (name: string, tree: Map<string, string> = new Map()): DirectoryHandle & { tree: Map<string, string> } => ({
  name,
  tree,
  getDirectoryHandle: (child: string, options?: { create?: boolean }) => {
    const path = `${name}/${child}`;
    if (!options?.create && ![...tree.keys()].some((k) => k.startsWith(`${path}/`)) && !tree.has(`${path}/`)) {
      return Promise.reject(new DOMException("missing", "NotFoundError"));
    }
    tree.set(`${path}/`, "");
    return Promise.resolve(memoryFolder(path, tree));
  },
  getFileHandle: (file: string) =>
    Promise.resolve({
      createWritable: () =>
        Promise.resolve({
          write: (data: string) => Promise.resolve(void tree.set(`${name}/${file}`, data)),
          close: () => Promise.resolve(),
        }),
    }),
});

const files = (entries: Record<string, string>) => Object.entries(entries).map(([path, contents]) => ({ path, contents }));

describe("saveToFolder", () => {
  it("writes the template's files, folders included", async () => {
    const parent = memoryFolder("Docs");
    const saved = await writeTemplateFiles(files({ "package.json": "{}", "logic/logic.ts": "x" }), parent, "nda");
    expect(saved).toBe("Docs/nda");
    expect(parent.tree.get("Docs/nda/logic/logic.ts")).toBe("x");
  });

  it("saves again into a fresh folder, so files dropped since the last save do not linger", async () => {
    const parent = memoryFolder("Docs");
    await writeTemplateFiles(files({ "package.json": "{}", "logic/logic.ts": "old" }), parent, "nda");
    const second = await writeTemplateFiles(files({ "package.json": "{}" }), parent, "nda");
    expect(second).toBe("Docs/nda-2");
    expect([...parent.tree.keys()].filter((k) => k.startsWith("Docs/nda-2/") && !k.endsWith("/"))).toEqual(["Docs/nda-2/package.json"]);
    expect(await freshFolderName(parent, "nda")).toBe("nda-3");
  });

  it("skips a name a file already has, but reports a permission error rather than trying every name", async () => {
    const failing = (name: string): DirectoryHandle => ({
      ...memoryFolder("Docs"),
      getDirectoryHandle: (child: string) =>
        Promise.reject(child === "nda" ? new DOMException("a file", name) : new DOMException("missing", "NotFoundError")),
    });
    expect(await freshFolderName(failing("TypeMismatchError"), "nda")).toBe("nda-2");
    await expect(freshFolderName(failing("NotAllowedError"), "nda")).rejects.toMatchObject({ name: "NotAllowedError" });
  });

  it("writes a template laid out as Cicero lays out its archives", async () => {
    const parent = memoryFolder("Docs");
    const template = await exportTemplateFiles(
      { templateMarkdown: counter.TEMPLATE, modelCto: counter.MODEL, data: JSON.stringify(counter.DATA), logicTs: counter.LOGIC },
      "Counter",
    );
    await writeTemplateFiles(template, parent, "counter");
    expect(JSON.parse(parent.tree.get("Docs/counter/package.json")!)).toMatchObject({ name: "counter", displayName: "Counter" });
    expect(parent.tree.get("Docs/counter/text/grammar.tem.md")).toBe(counter.TEMPLATE);
    expect(parent.tree.get("Docs/counter/model/model.cto")).toBe(counter.MODEL);
    expect(parent.tree.get("Docs/counter/logic/logic.ts")).toBe(counter.LOGIC);
    expect(JSON.parse(parent.tree.get("Docs/counter/sample.json")!)).toEqual(counter.DATA);
  }, 60_000);
});
