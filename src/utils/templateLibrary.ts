import type { Sample } from "../samples";
import { ModelManager, Factory, Serializer } from "@accordproject/concerto-core";

interface ConcertoDeclaration {
  getDecorator(name: string): unknown;
  getName(): string;
}

interface ConcertoModelFile {
  getAllDeclarations(): ConcertoDeclaration[];
  getNamespace(): string;
}
import { loadBundledModels } from "./modelCache";
import { intersects, gt } from "semver";

const TEMPLATE_LIBRARY_URL =
  "https://templates.accordproject.org/template-library.json";

// templates.accordproject.org has not yet published archives built against cicero-core 2.x,
// so gating the catalog by the installed @accordproject/cicero-core dependency (currently
// ^2.1.0) would filter out every entry. Track the max cicero version the remote registry
// actually supports separately until it catches up.
const CICERO_RANGE = "^1.0.0";

export interface TemplateIndexEntry {
  NAME: string;     // display name from template-library.json
  dirName: string;  // raw template name (e.g. "helloworld") — used for default lookup in init()
  description?: string;
}

interface LibraryEntry {
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  ciceroVersion: string;
  url?: string;
}

interface LibraryIndex {
  [key: string]: LibraryEntry;
}

// Maps display name → LibraryEntry for URL lookup when loading a template
const displayNameToEntry = new Map<string, LibraryEntry>();

let indexCache: TemplateIndexEntry[] | null = null;
const templateCache = new Map<string, Sample>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export async function fetchTemplateIndex(): Promise<TemplateIndexEntry[]> {
  if (indexCache) return indexCache;

  const library = await fetchJson<LibraryIndex>(TEMPLATE_LIBRARY_URL);

  // Keep only ^1.x templates, deduplicated to latest version per name
  const latest = new Map<string, LibraryEntry>();
  for (const entry of Object.values(library)) {
    if (!entry.ciceroVersion || !intersects(CICERO_RANGE, entry.ciceroVersion)) continue;
    const existing = latest.get(entry.name);
    if (!existing || gt(entry.version, existing.version)) {
      latest.set(entry.name, entry);
    }
  }

  const entries: TemplateIndexEntry[] = [];
  for (const entry of latest.values()) {
    const displayName = entry.displayName ?? entry.name;
    displayNameToEntry.set(displayName, entry);
    entries.push({
      NAME: displayName,
      dirName: entry.name,
      description: entry.description,
    });
  }

  entries.sort((a, b) => a.NAME.localeCompare(b.NAME));
  indexCache = entries;
  return entries;
}

export async function fetchTemplate(displayName: string): Promise<Sample> {
  if (templateCache.has(displayName)) return templateCache.get(displayName)!;

  const entry = displayNameToEntry.get(displayName);
  if (!entry?.url) {
    throw new Error(
      `Unknown template: "${displayName}". Call fetchTemplateIndex() first.`,
    );
  }

  const res = await fetch(entry.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${entry.url}`);
  const arrayBuffer = await res.arrayBuffer();

  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Extract template grammar (required)
  const grammarFile = zip.file("text/grammar.tem.md");
  if (!grammarFile)
    throw new Error(`No text/grammar.tem.md in archive for "${displayName}"`);
  const template = await grammarFile.async("string");

  // Extract the user-authored model — first non-@models.* CTO in model/
  const userModelEntry = Object.entries(zip.files).find(
    ([path]) =>
      path.startsWith("model/") &&
      path.endsWith(".cto") &&
      !path.split("/")[1].startsWith("@models."),
  );
  if (!userModelEntry)
    throw new Error(`No user model .cto found in archive for "${displayName}"`);
  const model = await userModelEntry[1].async("string");

  // Extract logic (only logic/logic.ts — skip generated type files)
  const logicFile = zip.file("logic/logic.ts");
  const logic = logicFile ? await logicFile.async("string") : null;

  // Extract request.json (optional)
  const requestFile = zip.file("request.json");
  const request = requestFile
    ? (JSON.parse(await requestFile.async("string")) as object)
    : null;

  // Use sampleData.json if present, otherwise generate defaults from the model
  const sampleDataFile = zip.file("sampleData.json");
  const data = sampleDataFile
    ? (JSON.parse(await sampleDataFile.async("string")) as object)
    : generateDefaultData(model);

  const sample: Sample = {
    NAME: entry.displayName ?? entry.name,
    TEMPLATE: template,
    MODEL: model,
    DATA: data,
    ...(logic != null ? { LOGIC: logic } : {}),
    ...(request != null ? { REQUEST: request } : {}),
  };

  templateCache.set(displayName, sample);
  return sample;
}

function generateDefaultData(modelCto: string): object {
  try {
    const mm = new ModelManager({ offline: true });
    loadBundledModels(mm);
    mm.addCTOModel(modelCto, "model.cto", true);

    // Find the concept decorated with @template
    let templateNs: string | null = null;
    let templateClass: string | null = null;
    outer: for (const mf of mm.getModelFiles() as ConcertoModelFile[]) {
      for (const decl of mf.getAllDeclarations()) {
        try {
          if (decl.getDecorator("template")) {
            templateNs = mf.getNamespace();
            templateClass = decl.getName();
            break outer;
          }
        } catch {
          // declaration has no decorators
        }
      }
    }
    if (!templateNs || !templateClass) return {};

    const factory = new Factory(mm);
    const serializer = new Serializer(factory, mm);
    const resource = factory.newResource(templateNs, templateClass, "sample-1", { generate: "empty" }) as unknown;
    return serializer.toJSON(resource as object) as object;
  } catch {
    return {};
  }
}

export function clearTemplateCache(): void {
  indexCache = null;
  templateCache.clear();
  displayNameToEntry.clear();
}
