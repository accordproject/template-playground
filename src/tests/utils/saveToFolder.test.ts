import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { freshFolderName, writeArchiveToFolder, type DirectoryHandle } from "../../utils/saveToFolder";

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
          write: (data: Uint8Array) => Promise.resolve(void tree.set(`${name}/${file}`, new TextDecoder().decode(data))),
          close: () => Promise.resolve(),
        }),
    }),
});

const archive = async (files: Record<string, string>) => {
  const zip = new JSZip();
  for (const [path, text] of Object.entries(files)) zip.file(path, text);
  return zip.generateAsync({ type: "uint8array" });
};

describe("saveToFolder", () => {
  it("writes the archive's files, folders included", async () => {
    const parent = memoryFolder("Docs");
    const saved = await writeArchiveToFolder(await archive({ "package.json": "{}", "logic/logic.ts": "x" }), parent, "nda");
    expect(saved).toBe("Docs/nda");
    expect(parent.tree.get("Docs/nda/logic/logic.ts")).toBe("x");
  });

  it("saves again into a fresh folder, so files dropped since the last save do not linger", async () => {
    const parent = memoryFolder("Docs");
    await writeArchiveToFolder(await archive({ "package.json": "{}", "logic/logic.ts": "old" }), parent, "nda");
    const second = await writeArchiveToFolder(await archive({ "package.json": "{}" }), parent, "nda");
    expect(second).toBe("Docs/nda-2");
    expect([...parent.tree.keys()].filter((k) => k.startsWith("Docs/nda-2/") && !k.endsWith("/"))).toEqual(["Docs/nda-2/package.json"]);
    expect(await freshFolderName(parent, "nda")).toBe("nda-3");
  });
});
