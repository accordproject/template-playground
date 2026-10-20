/**
 * Reading and writing Accord Project template archives (`.cta`): zip files
 * holding `package.json`, `text/grammar.tem.md`, `model/*.cto` and optionally
 * `logic/logic.ts`. The store compiles and runs the same archive it builds
 * here, the Deploy step offers it for download, and the Template step reads
 * archives back in, so all three share one definition of the layout.
 * JSZip and Concerto are loaded on first use.
 */
import type JSZipType from "jszip";
import { BUNDLED_MODELS, loadBundledModels } from "./modelCache";

const loadJSZip = async () => (await import("jszip")).default;

/** The editable parts of a template, as the playground stores them. */
export interface TemplateContent {
  templateMarkdown: string;
  modelCto: string;
  /** JSON text of the sample agreement data, written as data.json when given. */
  data?: string;
  logicTs?: string;
  /** Sample request for Simulate, written as request.json (the cicero layout). */
  requestJson?: string;
}

/** What the store builds its runnable archive from. */
export type TemplateArchiveSources = Pick<TemplateContent, "templateMarkdown" | "modelCto"> & { logicTs: string };

export interface ImportedTemplate extends TemplateContent {
  data: string;
  /** Name from package.json, or the file name the user picked. */
  name: string;
  /** Things the user should know about the import (e.g. that the sample data was generated). */
  warnings: string[];
}

const BUNDLED_NAMESPACES = new Set(BUNDLED_MODELS.map((m) => m.namespace));

/** package.json `name` used when none is given. */
export const DEFAULT_TEMPLATE_NAME = "playground-template";

/** Cicero range the archives target: the template engine this playground runs. */
const CICERO_RANGE = "^3.0.0";

/**
 * A template name as package.json and file names want it: lower case,
 * letters and digits joined by dashes ("Late Payment Penalty (with Logic)"
 * → "late-payment-penalty-with-logic").
 */
export const templateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || DEFAULT_TEMPLATE_NAME;

/** The `.cta` file name for a template name. */
export const archiveFileName = (name: string): string => `${templateSlug(name)}.cta`;

const zipTemplate = async (content: TemplateContent, name: string, kind: TemplateKind) => {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  zip.file(
    "package.json",
    JSON.stringify(
      {
        name: templateSlug(name),
        version: "1.0.0",
        ...(name !== templateSlug(name) ? { displayName: name, description: name } : {}),
        accordproject: { template: kind, runtime: "typescript", cicero: CICERO_RANGE },
      },
      null,
      2,
    ),
  );
  zip.file("text/grammar.tem.md", content.templateMarkdown);
  zip.file("model/model.cto", content.modelCto);
  // Offline copies of the models that model.cto imports, so the archive resolves without network access.
  for (const bundled of BUNDLED_MODELS) {
    zip.file(`model/${bundled.fileName}`, bundled.source);
  }
  if (content.logicTs?.trim()) zip.file("logic/logic.ts", content.logicTs);
  if (content.requestJson?.trim()) zip.file("request.json", content.requestJson);
  // Not part of the cicero layout; lets this playground restore the exact sample data.
  if (content.data !== undefined) zip.file("data.json", content.data);
  return zip;
};

/**
 * Builds a template archive (.cta, a zip). `kind` is package.json's
 * `accordproject.template`; the store's runnable archive is a contract, and
 * exports pass the kind the model declares (see buildExportArchive).
 */
export const buildTemplateArchive = async (
  content: TemplateContent,
  name: string = DEFAULT_TEMPLATE_NAME,
  kind: TemplateKind = "contract",
): Promise<Uint8Array> =>
  (await zipTemplate(content, name, kind)).generateAsync({ type: "uint8array", compression: "DEFLATE" });

/** The same archive as buildTemplateArchive, as a Blob to save as a file. */
export const buildTemplateArchiveBlob = async (
  content: TemplateContent,
  name: string = DEFAULT_TEMPLATE_NAME,
  kind: TemplateKind = "contract",
): Promise<Blob> =>
  (await zipTemplate(content, name, kind)).generateAsync({ type: "blob", mimeType: "application/zip", compression: "DEFLATE" });

/**
 * The archive the Deploy step hands out: marked as a contract or a clause
 * according to the model, so tools that read package.json treat it right.
 */
export const buildExportArchive = async (content: TemplateContent, name: string): Promise<Uint8Array> =>
  buildTemplateArchive(content, name, await templateKindOf(content.modelCto));

/**
 * The model file holding the template's own concepts: `model/model.cto`, or
 * the only `.cto` that is not a downloaded `@…` dependency.
 */
const findMainModel = (paths: string[]): string | undefined => {
  const models = paths.filter((p) => /^model\/[^/]+\.cto$/.test(p));
  if (models.includes("model/model.cto")) return "model/model.cto";
  const own = models.filter((p) => !p.startsWith("model/@"));
  return own.length === 1 ? own[0] : undefined;
};

type ModelManagerInstance = InstanceType<typeof import("@accordproject/concerto-core").ModelManager>;

const loadModel = async (modelCto: string): Promise<ModelManagerInstance> => {
  const { ModelManager } = await import("@accordproject/concerto-core");
  const modelManager = new ModelManager({ offline: true });
  loadBundledModels(modelManager);
  modelManager.addCTOModel(modelCto, undefined, true);
  return modelManager;
};

/** What package.json says the template is: a whole contract or a clause. */
export type TemplateKind = "contract" | "clause";

const baseKind = (superType: string | undefined | null): TemplateKind | null => {
  const match = /^org\.accordproject\.contract@[^.]+\.[^.]+\.[^.]+\.(Contract|Clause)$/.exec(superType ?? "");
  return match ? (match[1].toLowerCase() as TemplateKind) : null;
};

/**
 * The declaration the template is written against: the one with a
 * `@template` decorator, else (older library templates) the one extending
 * the Accord Project Contract or Clause. Bundled dependency models are
 * skipped by exact namespace, so a template in its own `org.accordproject.*`
 * namespace still counts.
 *
 * Without a decorator, `kind` (package.json's `accordproject.template`)
 * says whether to look for the Contract or the Clause; without a kind a
 * Contract wins, since contracts embed clauses and not the other way round.
 * Throws when more than one declaration fits, rather than guessing by order.
 */
const findTemplateDeclaration = (modelManager: ModelManagerInstance, kind?: TemplateKind) => {
  const candidates = [...modelManager.getConceptDeclarations(), ...modelManager.getAssetDeclarations()].filter(
    (c) => !c.isAbstract() && !BUNDLED_NAMESPACES.has(c.getNamespace()),
  );
  const decorated = candidates.find((c) => c.getDecorator("template"));
  if (decorated) return decorated;
  const byKind = (k: TemplateKind) => candidates.filter((c) => baseKind(c.getSuperType()) === k);
  const fits = kind ? byKind(kind) : byKind("contract").length ? byKind("contract") : byKind("clause");
  if (fits.length > 1) {
    throw new Error(
      `The model has several ${kind ?? "template"} declarations (${fits.map((c) => c.getName()).join(", ")}) and none is marked @template.`,
    );
  }
  return fits[0];
};

/**
 * The renderer finds the template concept by its `@template` decorator.
 * Older library models mark it only by extending Contract or Clause, so
 * add the decorator to that declaration. Returns the model unchanged when
 * it already has one, or when no candidate is found; throws when the
 * choice is ambiguous.
 */
export const ensureTemplateDecorator = async (modelCto: string, kind?: TemplateKind): Promise<string> => {
  const target = findTemplateDeclaration(await loadModel(modelCto), kind);
  if (!target || target.getDecorator("template")) return modelCto;
  const declaration = new RegExp(
    `^([ \\t]*)((?:abstract[ \\t]+)?(?:asset|concept|participant|transaction|event)[ \\t]+${target.getName()}\\b)`,
    "m",
  );
  return modelCto.replace(declaration, "$1@template\n$1$2");
};

/**
 * Whether the template is a whole contract or a clause, from the base of
 * its template declaration; "contract" when the model does not say (or does
 * not load), which is what cicero assumes too.
 */
export const templateKindOf = async (modelCto: string): Promise<TemplateKind> => {
  try {
    return baseKind(findTemplateDeclaration(await loadModel(modelCto))?.getSuperType()) ?? "contract";
  } catch {
    return "contract";
  }
};

/**
 * Sample data for a model, for archives that ship no `data.json` (everything
 * published in the template library), from Concerto's sample generator.
 */
export const sampleDataFromModel = async (modelCto: string): Promise<string> => {
  const { Factory, Serializer } = await import("@accordproject/concerto-core");
  const modelManager = await loadModel(modelCto);
  const target = findTemplateDeclaration(modelManager);
  if (!target) throw new Error("The model has no template concept to build sample data from.");
  const factory = new Factory(modelManager);
  const serializer = new Serializer(factory, modelManager);
  const options = { generate: "sample", includeOptionalFields: true } as const;
  const instance = target.isIdentified()
    ? factory.newResource(target.getNamespace(), target.getName(), "sample", options)
    : factory.newConcept(target.getNamespace(), target.getName(), undefined, options);
  return JSON.stringify(serializer.toJSON(instance), null, 2);
};

interface PackageJson {
  name?: unknown;
  displayName?: unknown;
  accordproject?: { runtime?: unknown; cicero?: unknown; template?: unknown };
}

/** Major version of a semver range such as "^2.0.0" or ">=0.22.0"; NaN when there is none. */
export const majorOf = (range: unknown): number => {
  const match = typeof range === "string" ? /(\d+)\./.exec(range) : null;
  return match ? Number(match[1]) : NaN;
};

/**
 * Why an archive cannot run in this playground, or null when it can. The
 * playground runs the TypeScript template engine: templates written for
 * Cicero 1.0 and later. Older ones (Cicero 0.x) use Ergo logic and an
 * earlier TemplateMark dialect.
 */
export const incompatibilityReason = (pkg: PackageJson, paths: string[], hasTypeScriptLogic: boolean): string | null => {
  if (!hasTypeScriptLogic && paths.some((p) => /^logic\/.+\.ergo$/.test(p))) {
    return "This template’s logic is written in Ergo, for an older version of Cicero. The playground runs TypeScript templates (Cicero 1.0 and later).";
  }
  const cicero = pkg.accordproject?.cicero;
  // The declared engine target decides, whatever the runtime field says.
  if (majorOf(cicero) === 0) {
    return `This template targets Cicero ${String(cicero)}. The playground runs TypeScript templates (Cicero 1.0 and later).`;
  }
  return null;
};

/**
 * Rewrites imports of `./<namespace>` (archives exported before the Logic
 * step's scaffold moved to `./generated/`) to `./generated/<namespace>`,
 * where the template engine puts the model's generated types. Only real
 * import specifiers are touched — positions come from TypeScript's
 * pre-processor, so comments and strings stay as they are.
 */
export const normalizeModelImports = async (logicTs: string, modelCto: string): Promise<string> => {
  const ts = (await import("typescript")).default;
  const namespaces = generatedNamespaces(modelCto);
  const legacy = ts
    .preProcessFile(logicTs, true, true)
    .importedFiles.filter((f) => {
      const module = /^\.\/([^/]+?)(?:\.(?:js|ts))?$/.exec(f.fileName)?.[1];
      return !!module && namespaces.has(module);
    })
    .sort((a, b) => b.pos - a.pos);
  let out = logicTs;
  for (const f of legacy) {
    // `pos` is the opening quote; the specifier follows it verbatim.
    const start = f.pos + 1;
    const end = start + f.fileName.length;
    if (out.slice(start, end) !== f.fileName) continue;
    out = `${out.slice(0, start)}./generated/${f.fileName.slice(2)}${out.slice(end)}`;
  }
  return out;
};

/**
 * The logic source to load: `logic/logic.ts`, else the only TypeScript file
 * in `logic/` that is not a test or a type file generated from the model
 * (`concerto.ts`, `<namespace>@<version>.ts` such as `concerto@1.0.0.ts`).
 * Authored files that merely start with "concerto" (`concertoLogic.ts`)
 * count. Throws when several fit, rather than silently dropping the logic.
 */
export const findLogicEntry = (paths: string[]): string | undefined => {
  if (paths.includes("logic/logic.ts")) return "logic/logic.ts";
  const sources = paths.filter(
    (p) =>
      /^logic\/[^/]+\.ts$/.test(p) &&
      !/\.(test|spec|d)\.ts$/.test(p) &&
      !/^logic\/(concerto|[^/]*@[^/]*)\.ts$/.test(p),
  );
  if (sources.length > 1) {
    throw new Error(`The archive has several logic files (${sources.join(", ")}) and no logic/logic.ts to say which one to run.`);
  }
  return sources[0];
};

/**
 * Namespaces the playground generates TypeScript types for when it compiles
 * logic against `modelCto`: the model's own, the ones it imports, the bundled
 * Accord Project models and Concerto's.
 */
const generatedNamespaces = (modelCto: string): Set<string> => {
  const own = /^\s*namespace\s+([\w.]+@[\w.-]+)/m.exec(modelCto)?.[1];
  const imported = [...modelCto.matchAll(/^\s*import\s+([\w.]+@\d+\.\d+\.\d+)\./gm)].map((m) => m[1]);
  return new Set(
    [own, ...imported, ...BUNDLED_MODELS.map((m) => m.namespace), "concerto@1.0.0", "concerto"].filter(
      (ns): ns is string => !!ns,
    ),
  );
};

/**
 * Relative modules the logic imports that the playground cannot supply. It
 * compiles one logic file and generates the model's types itself — imported
 * as `./generated/<namespace>` (the Logic step's scaffold) or, in archives
 * exported from earlier versions, `./<namespace>` — so any other local import (say `./helpers`) would not
 * resolve. TypeScript's own pre-processor reads the imports, so comments and
 * strings that merely look like one are ignored.
 */
export const unsupportedLogicImports = async (logicTs: string, modelCto: string): Promise<string[]> => {
  const ts = (await import("typescript")).default;
  const { importedFiles } = ts.preProcessFile(logicTs, true, true);
  const namespaces = generatedNamespaces(modelCto);
  const local = importedFiles.map((f) => f.fileName).filter((spec) => /^\.{1,2}\//.test(spec));
  return [
    ...new Set(
      local.filter((spec) => {
        // ./generated/<namespace> or ./<namespace>, for a namespace the playground generates types for.
        const module = /^\.\/(?:generated\/)?([^/]+?)(?:\.(?:js|ts))?$/.exec(spec)?.[1];
        return !(module && namespaces.has(module));
      }),
    ),
  ];
};

/**
 * Namespaces the model imports that the playground cannot supply. It loads
 * a template's main model next to its bundled models only, so a type from
 * another model in the archive (say `model/party.cto`) would not resolve,
 * and exporting the template again would drop that file. A bundled
 * namespace counts whether or not the import names its version. A model
 * that does not parse yields none: the Data step reports it once loaded.
 */
export const unsupportedModelImports = async (modelCto: string): Promise<string[]> => {
  const { Parser } = await import("@accordproject/concerto-cto");
  let imports: { namespace: string }[];
  try {
    imports = (Parser.parse(modelCto) as { imports?: { namespace: string }[] }).imports ?? [];
  } catch {
    return [];
  }
  const unversioned = (namespace: string) => namespace.split("@")[0];
  const supplied = new Set([...BUNDLED_NAMESPACES, "concerto@1.0.0"].map(unversioned));
  return [...new Set(imports.map((i) => i.namespace).filter((ns) => !supplied.has(unversioned(ns))))];
};

/** Reads a `.cta` archive. Throws a user-readable Error when it is not a usable template. */
export const readTemplateArchive = async (
  bytes: ArrayBuffer | Uint8Array,
  fallbackName: string,
): Promise<ImportedTemplate> => {
  const JSZip = await loadJSZip();
  let zip: JSZipType;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error("That file is not a template archive (.cta).");
  }
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  const read = (path: string) => zip.file(path)?.async("string");

  let pkg: PackageJson = {};
  try {
    pkg = JSON.parse((await read("package.json")) ?? "{}") as PackageJson;
  } catch {
    // an unreadable package.json is not fatal; the file name stands in
  }
  const logicEntry = findLogicEntry(paths);
  const logicTs = logicEntry ? await read(logicEntry) : undefined;
  const incompatible = incompatibilityReason(pkg, paths, logicTs !== undefined);
  if (incompatible) throw new Error(incompatible);


  const templateMarkdown = await read("text/grammar.tem.md");
  if (templateMarkdown === undefined) {
    throw new Error("The archive has no text/grammar.tem.md, so it is not a template.");
  }
  const mainModel = findMainModel(paths);
  const rawModel = mainModel ? await read(mainModel) : undefined;
  if (rawModel === undefined) {
    throw new Error("The archive has no model/model.cto.");
  }
  const modelImports = await unsupportedModelImports(rawModel);
  if (modelImports.length) {
    throw new Error(
      `The model imports types from ${modelImports.join(", ")}, which the playground doesn’t include. It loads one model file next to the Accord Project models it bundles, so this template can’t be imported.`,
    );
  }
  const localImports = logicTs ? await unsupportedLogicImports(logicTs, rawModel) : [];
  if (localImports.length) {
    throw new Error(
      `The logic imports other files from the archive (${localImports.join(", ")}). The playground runs a single logic file, so this template can’t be imported.`,
    );
  }

  const warnings: string[] = [];
  const declaredKind = pkg.accordproject?.template;
  const kind = declaredKind === "contract" || declaredKind === "clause" ? declaredKind : undefined;
  let modelCto = rawModel;
  try {
    modelCto = await ensureTemplateDecorator(rawModel, kind);
  } catch (error) {
    // A model that does not load is reported by the Data step once it is in the editor;
    // an ambiguous one is the user's to resolve by adding @template.
    if (error instanceof Error && /none is marked @template/.test(error.message)) warnings.push(error.message);
  }
  const name =
    (typeof pkg.displayName === "string" && pkg.displayName) ||
    (typeof pkg.name === "string" && pkg.name) ||
    fallbackName;

  let data = await read("data.json");
  if (data === undefined) {
    try {
      data = await sampleDataFromModel(modelCto);
      warnings.push("The archive has no sample data, so the data was generated from the model.");
    } catch (error) {
      data = "{}";
      warnings.push(
        `Sample data could not be generated: ${error instanceof Error ? error.message : "unknown error"}. Fill in the Data step.`,
      );
    }
  }

  const requestJson = await read("request.json");

  return {
    name,
    templateMarkdown,
    modelCto,
    data,
    logicTs: logicTs === undefined ? undefined : await normalizeModelImports(logicTs, rawModel),
    requestJson,
    warnings,
  };
};
