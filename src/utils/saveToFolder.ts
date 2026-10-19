/**
 * Writing a template archive out as a folder, through the File System Access
 * API, so an editor that opens local folders (vscode.dev, VS Code) can open it.
 * Only Chromium browsers implement the API; callers check `canSaveToFolder()`.
 */

/** The slice of FileSystemDirectoryHandle this module uses (also what tests fake). */
export interface DirectoryHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<{ createWritable(): Promise<{ write(data: Uint8Array): Promise<void>; close(): Promise<void> }> }>;
}

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<DirectoryHandle>;
};

export const canSaveToFolder = (): boolean =>
  typeof window !== "undefined" && typeof (window as PickerWindow).showDirectoryPicker === "function";

/** Asks the user for a parent folder. Rejects with an AbortError when they cancel. */
export const pickFolder = (): Promise<DirectoryHandle> => {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("This browser cannot save folders.");
  return picker.call(window, { id: "accord-template", mode: "readwrite" });
};

/**
 * `name`, or `name-2`, `name-3`… — the first that does not exist in
 * `parent` yet. Each save gets a fresh folder, so a file dropped from the
 * template (say its logic) never lingers from an earlier save, and nothing
 * the user put in an existing folder is overwritten.
 */
const MAX_COPIES = 99;

export const freshFolderName = async (parent: DirectoryHandle, name: string): Promise<string> => {
  const exists = async (candidate: string) => {
    try {
      await parent.getDirectoryHandle(candidate);
      return true;
    } catch (error) {
      // NotFoundError: free. TypeMismatchError: a file has that name, so it is taken.
      return !(error instanceof DOMException && error.name === "NotFoundError");
    }
  };
  if (!(await exists(name))) return name;
  for (let n = 2; n <= MAX_COPIES; n++) {
    const candidate = `${name}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`There are already ${MAX_COPIES} copies of “${name}” in that folder — pick another one.`);
};

/**
 * Writes every file of a `.cta` archive into a new folder under `parent`
 * (see freshFolderName), creating sub-folders as needed. Returns the
 * folder's name.
 */
export const writeArchiveToFolder = async (
  archive: Uint8Array,
  parent: DirectoryHandle,
  folderName: string,
): Promise<string> => {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(archive);
  const root = await parent.getDirectoryHandle(await freshFolderName(parent, folderName), { create: true });
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const parts = entry.name.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName || parts.includes("..")) continue;
    let dir = root;
    for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
    const file = await dir.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();
    await writable.write(await entry.async("uint8array"));
    await writable.close();
  }
  return root.name;
};
