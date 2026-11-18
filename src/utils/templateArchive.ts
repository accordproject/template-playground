/**
 * Accord Project templates in and out of the playground, through
 * cicero-core's Template: the store builds one from the editors' contents
 * to compile and run it (templateFromContent), the Deploy step exports it
 * with Template.toArchive, and the Template step imports archives with
 * Template.fromArchive. What the playground adds is only what Cicero does
 * not do: the checks that keep an import runnable here, the `@template`
 * decorator older library models lack, and sample data for archives that
 * ship none. cicero-core, Concerto, JSZip and TypeScript load on first use.
 */
import type JSZipType from "jszip";
import { BUNDLED_MODELS, loadBundledModels } from "./modelCache";
import { ciceroAccepts, ciceroVersion } from "./cicero";

type CiceroTemplate = InstanceType<typeof import("@accordproject/cicero-core").Template>;
type ModelManagerInstance = InstanceType<typeof import("@accordproject/concerto-core").ModelManager>;
type Declaration = ReturnType<ModelManagerInstance["getConceptDeclarations"]>[number];

/**
 * The part of cicero-core's Template this module uses, typed: cicero-core's
 * own declarations return `any` from most of these. Templates are viewed
 * through it once, where they are created or loaded (cicero()).
 */
interface CiceroTemplateApi {
  getMetadata(): {
    getPackageJson(): Record<string, unknown>;
    getRequest(): unknown;
    getSampleData(): unknown;
    setSampleData(data: unknown): void;
    getDisplayName(): string;
  };
  getModelManager(): ModelManagerInstance;
  getLogicManager(): { addLogicFile(contents: string, identifier: string): void };
  getScriptManager(): { getScriptsForTarget(language: string): { getIdentifier(): string; getContents(): string }[] };
  getTemplate(): string;
  setTemplate(grammar: string): void;
  getTemplateModel(): Declaration;
  getFactory(): InstanceType<typeof import("@accordproject/concerto-core").Factory>;
  getSerializer(): InstanceType<typeof import("@accordproject/concerto-core").Serializer>;
  setPackageJson(packageJson: object): void;
  validate(options?: object): void;
  toArchive(language: string): Promise<Uint8Array>;
}
const cicero = (template: CiceroTemplate): CiceroTemplateApi => template as unknown as CiceroTemplateApi;

/** The editable parts of a template, as the playground stores them. */
export interface TemplateContent {
  templateMarkdown: string;
  modelCto: string;
  /** JSON text of the sample agreement data (an archive's sample.json). */
  data?: string;
  logicTs?: string;
  /** Sample request for Simulate (an archive's request.json). */
  requestJson?: string;
}

/** What the store builds its runnable template from. */
export type TemplateArchiveSources = Pick<TemplateContent, "templateMarkdown" | "modelCto"> & { logicTs: string };

export interface ImportedTemplate extends TemplateContent {
  data: string;
  /** The template's display name (Cicero's), or the file name the user picked. */
  name: string;
  /** Things the user should know about the import (e.g. that the sample data was generated). */
  warnings: string[];
}

const BUNDLED_NAMESPACES = new Set(BUNDLED_MODELS.map((m) => m.namespace));

/** package.json `name` used when none is given. */
export const DEFAULT_TEMPLATE_NAME = "playground-template";

/** Path of the logic file the playground writes, the template engine's default entry point. */
const LOGIC_FILE = "logic/logic.ts";

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

/** What package.json says the template is: a whole contract or a clause. */
export type TemplateKind = "contract" | "clause";

const parseJson = (text: string | undefined): unknown => {
  if (!text?.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

/**
 * A cicero Template built from the playground's parts, assembled the way
 * TemplateLoader.fromArchive assembles one, without a zip in between: the
 * package.json (named after `name`, a contract or clause, for this
 * Cicero), the bundled models model.cto may import, the grammar, the logic
 * as logic/logic.ts, and the sample request and data. Validated offline.
 */
export const templateFromContent = async (
  content: TemplateContent,
  name: string = DEFAULT_TEMPLATE_NAME,
  kind: TemplateKind = "contract",
): Promise<CiceroTemplate> => {
  const { Template } = await import("@accordproject/cicero-core");
  const slug = templateSlug(name);
  const packageJson = {
    name: slug,
    version: "1.0.0",
    ...(name !== slug ? { displayName: name, description: name } : {}),
    accordproject: { template: kind, runtime: "typescript", cicero: `^${await ciceroVersion()}` },
  };
  const template = new Template(packageJson, null, {}, parseJson(content.requestJson), null, { offline: true }, null);
  const api = cicero(template);
  const modelManager = api.getModelManager();
  loadBundledModels(modelManager);
  modelManager.addCTOModel(content.modelCto, "model.cto", true);
  modelManager.validateModelFiles();
  api.setTemplate(content.templateMarkdown);
  if (content.logicTs?.trim()) api.getLogicManager().addLogicFile(content.logicTs, LOGIC_FILE);
  // After the package.json: Template.setPackageJson rebuilds the metadata without it.
  const data = parseJson(content.data);
  if (data) api.getMetadata().setSampleData(data);
  api.validate({ offline: true });
  return template;
};

/**
 * Whether a template is a whole contract or a clause: the Accord Project
 * base its template model extends, directly or through its ancestors
 * (`LateFee extends BaseClause extends Clause`); "contract" when it
 * extends neither, which is what Cicero assumes too.
 */
const templateKind = async (template: CiceroTemplateApi): Promise<TemplateKind> => {
  const { ModelUtil } = await import("@accordproject/concerto-core");
  const model = template.getTemplateModel();
  let ancestors: Declaration[];
  try {
    ancestors = [model, ...(model.getAllSuperTypeDeclarations() as Declaration[])];
  } catch {
    ancestors = [model];
  }
  for (const declaration of ancestors) {
    if (ModelUtil.parseNamespace(declaration.getNamespace()).name !== "org.accordproject.contract") continue;
    if (declaration.getName() === "Clause") return "clause";
    if (declaration.getName() === "Contract") return "contract";
  }
  return "contract";
};

/**
 * Refuses an export whose data or Simulate request is not valid JSON, which
 * building the Template would otherwise drop without a word. Synchronous, so
 * Deploy can check before the folder picker uses up the click.
 */
export const checkExportJson = (content: Pick<TemplateContent, "data" | "requestJson">): void => {
  const sources: [string, string | undefined][] = [["data", content.data], ["Simulate request", content.requestJson]];
  for (const [label, text] of sources) {
    if (!text?.trim()) continue;
    try {
      JSON.parse(text);
    } catch (error) {
      throw new Error(`The ${label} isn't valid JSON, so it can't be exported: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * The template's package.json says whether it is a contract or a clause,
 * from the base its template model extends; Cicero's own export
 * (Template.toArchive) writes the archive.
 */
const exportTemplate = async (content: TemplateContent, name: string): Promise<CiceroTemplateApi> => {
  checkExportJson(content);
  const template = cicero(await templateFromContent(content, name));
  const kind = await templateKind(template);
  if (kind !== "contract") {
    const packageJson = template.getMetadata().getPackageJson() as { accordproject: Record<string, unknown> };
    template.setPackageJson({ ...packageJson, accordproject: { ...packageJson.accordproject, template: kind } });
    const data = parseJson(content.data);
    if (data) template.getMetadata().setSampleData(data);
  }
  return template;
};

/** The archive the Deploy step hands out, written by Template.toArchive. */
export const buildExportArchive = async (content: TemplateContent, name: string): Promise<Uint8Array> =>
  new Uint8Array(await (await exportTemplate(content, name)).toArchive("typescript"));

/** A file of an exported template: its path in the template folder, and its contents. */
export interface TemplateFile {
  path: string;
  contents: string;
}

/**
 * The files of an exported template, laid out as Template.toArchive lays
 * out its archive, for writing straight into a folder (Deploy's "Open in
 * vscode.dev"): package.json, text/grammar.tem.md, request.json,
 * sample.json, model/*.cto and logic/*.
 */
export const exportTemplateFiles = async (content: TemplateContent, name: string): Promise<TemplateFile[]> => {
  const template = await exportTemplate(content, name);
  const metadata = template.getMetadata();
  const files: TemplateFile[] = [
    { path: "package.json", contents: JSON.stringify(metadata.getPackageJson(), null, 2) },
    { path: "text/grammar.tem.md", contents: template.getTemplate() },
  ];
  const request = metadata.getRequest();
  if (request) files.push({ path: "request.json", contents: JSON.stringify(request, null, 2) });
  const sampleData = metadata.getSampleData();
  if (sampleData) files.push({ path: "sample.json", contents: JSON.stringify(sampleData, null, 2) });
  for (const model of template.getModelManager().getModels()) {
    files.push({ path: `model/${model.name}`, contents: model.content ?? "" });
  }
  for (const script of template.getScriptManager().getScriptsForTarget("typescript")) {
    const fileName = script.getIdentifier().split(/[\\/]/).pop() ?? script.getIdentifier();
    files.push({ path: `logic/${fileName}`, contents: script.getContents() });
  }
  return files;
};

const loadModel = async (modelCto: string): Promise<ModelManagerInstance> => {
  const { ModelManager } = await import("@accordproject/concerto-core");
  const modelManager = new ModelManager({ offline: true });
  loadBundledModels(modelManager);
  modelManager.addCTOModel(modelCto, undefined, true);
  return modelManager;
};

/** Contract or clause, from the Accord Project base a declaration extends (see templateKind). */
const declarationKind = (declaration: Declaration): TemplateKind | null => {
  let ancestors: Declaration[];
  try {
    ancestors = declaration.getAllSuperTypeDeclarations() as Declaration[];
  } catch {
    return null;
  }
  for (const ancestor of ancestors) {
    if (!ancestor.getNamespace().startsWith("org.accordproject.contract@")) continue;
    if (ancestor.getName() === "Clause") return "clause";
    if (ancestor.getName() === "Contract") return "contract";
  }
  return null;
};

/**
 * The declaration an older library model (without `@template`) is written
 * against: the one extending the Accord Project Contract or Clause, as
 * package.json's `kind` says; without a kind a Contract wins, since
 * contracts embed clauses and not the other way round. Bundled dependency
 * models are skipped. Throws when more than one fits, rather than guessing
 * by order. Models with `@template` are Cicero's (Template.getTemplateModel).
 */
const findUndecoratedTemplate = (modelManager: ModelManagerInstance, kind?: TemplateKind) => {
  const candidates = [...modelManager.getConceptDeclarations(), ...modelManager.getAssetDeclarations()].filter(
    (c) => !c.isAbstract() && !BUNDLED_NAMESPACES.has(c.getNamespace()),
  );
  if (candidates.some((c) => c.getDecorator("template"))) return undefined;
  const byKind = (k: TemplateKind) => candidates.filter((c) => declarationKind(c) === k);
  const fits = kind ? byKind(kind) : byKind("contract").length ? byKind("contract") : byKind("clause");
  if (fits.length > 1) {
    throw new Error(
      `The model has several ${kind ?? "template"} declarations (${fits.map((c) => c.getName()).join(", ")}) and none is marked @template.`,
    );
  }
  return fits[0];
};

/**
 * Cicero finds the template model by its `@template` decorator
 * (Template.getTemplateModel). Older library models mark it only by
 * extending Contract or Clause, so add the decorator to that declaration.
 * Returns the model unchanged when it already has one, or when no candidate
 * is found; throws when the choice is ambiguous.
 */
export const ensureTemplateDecorator = async (modelCto: string, kind?: TemplateKind): Promise<string> => {
  const target = findUndecoratedTemplate(await loadModel(modelCto), kind);
  if (!target) return modelCto;
  const declaration = new RegExp(
    `^([ \\t]*)((?:abstract[ \\t]+)?(?:asset|concept|participant|transaction|event)[ \\t]+${target.getName()}\\b)`,
    "m",
  );
  return modelCto.replace(declaration, "$1@template\n$1$2");
};

/**
 * Whether the template a model describes is a whole contract or a clause
 * (see templateKind); "contract" when the model does not say, or does not load.
 */
export const templateKindOf = async (modelCto: string): Promise<TemplateKind> => {
  try {
    return await templateKind(cicero(await templateFromContent({ templateMarkdown: "", modelCto })));
  } catch {
    return "contract";
  }
};

/**
 * Sample data generated for a template's model by Concerto's sample
 * generator, through the template's own factory and serializer, for
 * archives that ship neither sample.json nor data.json.
 */
const generateSampleData = (template: CiceroTemplateApi): string => {
  const model = template.getTemplateModel();
  const factory = template.getFactory();
  const options = { generate: "sample", includeOptionalFields: true } as const;
  const instance = model.isIdentified()
    ? factory.newResource(model.getNamespace(), model.getName(), "sample", options)
    : factory.newConcept(model.getNamespace(), model.getName(), undefined, options);
  return JSON.stringify(template.getSerializer().toJSON(instance), null, 2);
};

/** Sample data for a model, as generateSampleData makes it for an imported template. */
export const sampleDataFromModel = async (modelCto: string): Promise<string> =>
  generateSampleData(cicero(await templateFromContent({ templateMarkdown: "", modelCto })));

interface PackageJson {
  name?: unknown;
  displayName?: unknown;
  accordproject?: { runtime?: unknown; cicero?: unknown; template?: unknown };
}

/**
 * Why an archive cannot run in this playground, or null when it can.
 * Cicero refuses a template whose Cicero range this release does not accept
 * (ciceroAccepts, the rule Template.fromArchive enforces); the playground
 * also refuses logic it would drop (Ergo, or JavaScript only), since it runs
 * TypeScript logic.
 */
export const incompatibilityReason = async (
  pkg: PackageJson,
  paths: string[],
  hasTypeScriptLogic: boolean,
): Promise<string | null> => {
  if (!hasTypeScriptLogic && paths.some((p) => /^logic\/.+\.ergo$/.test(p))) {
    return "This template’s logic is written in Ergo, for an older version of Cicero. The playground runs TypeScript templates.";
  }
  // JavaScript logic would otherwise be dropped silently: the playground loads only logic/*.ts.
  const javaScript = paths.filter((p) => /^logic\/[^/]+\.[cm]?js$/.test(p) && !/\.(test|spec)\.[cm]?js$/.test(p));
  if (!hasTypeScriptLogic && javaScript.length) {
    return `This template’s logic is JavaScript (${javaScript.join(", ")}). The playground runs TypeScript logic only, so it can’t import this template without losing its logic.`;
  }
  const cicero = pkg.accordproject?.cicero;
  if (typeof cicero !== "string" || !cicero) {
    return "This template’s package.json doesn’t say which Cicero version it targets (accordproject.cicero), which Cicero requires.";
  }
  if (!(await ciceroAccepts(cicero))) {
    return `This template targets Cicero ${String(cicero)}, which Cicero ${await ciceroVersion()} (the version this playground runs) doesn’t accept.`;
  }
  return null;
};

/** Namespace and imported namespaces of a model, from Concerto's CTO parser; null when it does not parse. */
const modelNamespaces = async (modelCto: string): Promise<{ own: string; imports: string[] } | null> => {
  const { Parser } = await import("@accordproject/concerto-cto");
  try {
    const ast = Parser.parse(modelCto) as { namespace: string; imports?: { namespace: string }[] };
    return { own: ast.namespace, imports: (ast.imports ?? []).map((i) => i.namespace) };
  } catch {
    return null;
  }
};

/**
 * Namespaces the template engine generates TypeScript types for when it
 * compiles logic against `modelCto`: the model's own, the ones it imports,
 * the bundled Accord Project models and Concerto's.
 */
const generatedNamespaces = async (modelCto: string): Promise<Set<string>> => {
  const namespaces = await modelNamespaces(modelCto);
  return new Set([
    ...(namespaces ? [namespaces.own, ...namespaces.imports] : []),
    ...BUNDLED_NAMESPACES,
    "concerto@1.0.0",
    "concerto",
  ]);
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
  const namespaces = await generatedNamespaces(modelCto);
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
 * Whether a logic/ file is one the playground runs: TypeScript, not a test
 * or a declaration file, and not a type file generated from the model
 * (`concerto.ts`, `<namespace>@<version>.ts`). Authored files that merely
 * start with "concerto" (`concertoLogic.ts`) count.
 */
const isAuthoredLogic = (path: string) =>
  /^logic\/[^/]+\.ts$/.test(path) && !/\.(test|spec|d)\.ts$/.test(path) && !/^logic\/(concerto|[^/]*@[^/]*)\.ts$/.test(path);

/**
 * The logic source to load: the template engine's own choice
 * (resolveLogicEntryPoint: logic/logic.ts, else the only .ts in logic/)
 * among the authored files, so the playground runs what the engine would.
 * Undefined when there is no logic; throws when several files fit.
 */
export const findLogicEntry = async (paths: string[]): Promise<string | undefined> => {
  const authored = paths.filter(isAuthoredLogic);
  if (!authored.length) return undefined;
  const { resolveLogicEntryPoint } = await import("@accordproject/template-engine/lib/TemplateArchiveProcessor");
  try {
    return resolveLogicEntryPoint(authored);
  } catch {
    throw new Error(`The archive has several logic files (${authored.join(", ")}) and no ${LOGIC_FILE} to say which one to run.`);
  }
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
  const namespaces = await generatedNamespaces(modelCto);
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
 * Namespaces the model imports that the playground cannot supply. It keeps
 * a template's main model next to its bundled models only, so a type from
 * another model in the archive (say `model/party.cto`) would not resolve,
 * and exporting the template again would drop that file. An import naming
 * a version must match a bundled namespace exactly (`money@0.2.0` is not
 * `money@0.3.0`); one without a version matches by name. A model that does
 * not parse yields none: the Data step reports it once loaded.
 */
export const unsupportedModelImports = async (modelCto: string): Promise<string[]> => {
  const namespaces = await modelNamespaces(modelCto);
  if (!namespaces) return [];
  const { ModelUtil } = await import("@accordproject/concerto-core");
  const supplied = new Set([...BUNDLED_NAMESPACES, "concerto@1.0.0"]);
  const suppliedNames = new Set([...supplied].map((ns) => ModelUtil.parseNamespace(ns).name));
  const isSupplied = (ns: string) => {
    const { name, version } = ModelUtil.parseNamespace(ns);
    return version ? supplied.has(ns) : suppliedNames.has(name);
  };
  return [...new Set(namespaces.imports.filter((ns) => !isSupplied(ns)))];
};

/**
 * Local modules the logic still imports once compiled: those whose values
 * it uses at run time (an enum value such as `CurrencyCode.USD`), not just
 * their types. TypeScript drops imports used only as types, and the
 * playground runs the compiled logic with `new Function`, which cannot load
 * modules, so any import left in the output would fail when it runs.
 */
export const runtimeLogicImports = async (logicTs: string): Promise<string[]> => {
  const ts = (await import("typescript")).default;
  const { outputText } = ts.transpileModule(logicTs, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  const { importedFiles } = ts.preProcessFile(outputText, true, true);
  return [...new Set(importedFiles.map((f) => f.fileName).filter((spec) => /^\.{1,2}\//.test(spec)))];
};

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

/**
 * Adds the bundled models the archive's models import but don't ship, so
 * Template.fromArchive (offline) resolves them as the playground's store
 * does. A namespace an archive file already declares is left alone.
 */
const supplyBundledModels = async (zip: JSZipType, modelPaths: string[], read: (path: string) => Promise<string | undefined>) => {
  const declared = new Set<string>();
  for (const path of modelPaths) {
    const namespaces = await modelNamespaces((await read(path)) ?? "");
    if (namespaces) declared.add(namespaces.own);
  }
  for (const bundled of BUNDLED_MODELS) {
    if (!declared.has(bundled.namespace)) zip.file(`model/${bundled.fileName}`, bundled.source);
  }
};

/** Reads a `.cta` archive. Throws a user-readable Error when it is not a usable template. */
export const readTemplateArchive = async (
  bytes: ArrayBuffer | Uint8Array,
  fallbackName: string,
): Promise<ImportedTemplate> => {
  const [{ default: JSZip }, { Template, TemplateLoader }] = await Promise.all([
    import("jszip"),
    import("@accordproject/cicero-core"),
  ]);
  let zip: JSZipType;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error("That file is not a template archive (.cta).");
  }
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  // TemplateLoader's own reader, as Template.fromArchive reads these files.
  const read = async (path: string) =>
    paths.includes(path) ? ((await TemplateLoader.loadZipFileContents(zip, path)) as string | null) ?? undefined : undefined;

  if (!paths.includes("text/grammar.tem.md")) {
    throw new Error("The archive has no text/grammar.tem.md, so it is not a template.");
  }
  const pkg = (parseJson(await read("package.json")) ?? {}) as PackageJson;
  const logicEntry = await findLogicEntry(paths);
  const incompatible = await incompatibilityReason(pkg, paths, logicEntry !== undefined);
  if (incompatible) throw new Error(incompatible);
  const mainModel = findMainModel(paths);
  const rawModel = mainModel ? await read(mainModel) : undefined;
  if (mainModel === undefined || rawModel === undefined) {
    throw new Error("The archive has no model/model.cto.");
  }
  const modelImports = await unsupportedModelImports(rawModel);
  if (modelImports.length) {
    throw new Error(
      `The model imports types from ${modelImports.join(", ")}, which the playground doesn’t include. It keeps one model file next to the Accord Project models it bundles, so this template can’t be imported.`,
    );
  }
  const rawLogic = logicEntry ? await read(logicEntry) : undefined;
  const localImports = rawLogic ? await unsupportedLogicImports(rawLogic, rawModel) : [];
  if (localImports.length) {
    throw new Error(
      `The logic imports other files from the archive (${localImports.join(", ")}). The playground runs a single logic file, so this template can’t be imported.`,
    );
  }
  const warnings: string[] = [];
  /*
   * Logic that reads the model's generated code at run time can't run here
   * (see runtimeLogicImports). The text and model still work, and the logic
   * can be fixed in the Logic editor, so the template is imported with a
   * warning that says what to change, rather than refused.
   */
  const runtimeImports = rawLogic ? await runtimeLogicImports(rawLogic) : [];
  if (runtimeImports.length) {
    warnings.push(
      `The logic uses values from ${runtimeImports.join(", ")} when it runs (an enum value, for example). The playground can use the model's generated code only as types, so Simulate will fail until the logic uses plain values instead (e.g. 'USD' rather than CurrencyCode.USD).`,
    );
  }

  // Older library models lack @template, which Cicero needs; add it before Cicero loads the archive.
  const declaredKind = pkg.accordproject?.template;
  const kind = declaredKind === "contract" || declaredKind === "clause" ? declaredKind : undefined;
  let modelCto = rawModel;
  try {
    modelCto = await ensureTemplateDecorator(rawModel, kind);
  } catch (error) {
    // An ambiguous model is the user's to resolve by adding @template; Cicero reports it below.
    if (error instanceof Error && /none is marked @template/.test(error.message)) warnings.push(error.message);
  }
  if (modelCto !== rawModel) zip.file(mainModel, modelCto);
  await supplyBundledModels(zip, paths.filter((p) => /^model\/[^/]+\.cto$/.test(p)), read);

  let template: CiceroTemplateApi;
  try {
    const { Buffer } = await import("buffer");
    template = cicero(
      (await Template.fromArchive(Buffer.from(await zip.generateAsync({ type: "uint8array" })), { offline: true })) as CiceroTemplate,
    );
  } catch (error) {
    throw new Error(`Cicero could not load this template: ${error instanceof Error ? error.message : String(error)}`);
  }
  const metadata = template.getMetadata();

  // Sample data: Cicero's sample.json, else the data.json earlier exports carry, else generated.
  const sampleData = metadata.getSampleData();
  let data = sampleData ? JSON.stringify(sampleData, null, 2) : await read("data.json");
  if (data === undefined) {
    try {
      data = generateSampleData(template);
      warnings.push("The archive has no sample data, so the data was generated from the model.");
    } catch (error) {
      data = "{}";
      warnings.push(
        `Sample data could not be generated: ${error instanceof Error ? error.message : "unknown error"}. Fill in the Data step.`,
      );
    }
  }

  const request = metadata.getRequest();
  return {
    name: metadata.getDisplayName() || fallbackName,
    templateMarkdown: template.getTemplate(),
    modelCto,
    data,
    logicTs: rawLogic === undefined ? undefined : await normalizeModelImports(rawLogic, rawModel),
    requestJson: request ? JSON.stringify(request) : undefined,
    warnings,
  };
};
