import { BUNDLED_MODELS } from "./modelCache";

/** What a template archive is built from: the three parts of a template. */
export interface TemplateArchiveSources {
  templateMarkdown: string;
  modelCto: string;
  logicTs: string;
}

/** package.json `name` used when none is given. */
export const DEFAULT_TEMPLATE_NAME = "playground-template";

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

/**
 * Builds a template archive (.cta, a zip) from the sources: package.json,
 * text/grammar.tem.md, model/model.cto with the bundled models its imports
 * resolve to offline, and logic/logic.ts when there is logic. The store
 * loads the same archive with cicero-core to compile and execute it, and
 * the Deploy step offers it for download, so what is downloaded is what
 * ran here. JSZip is loaded on first use.
 */
export const buildTemplateArchive = async (
  sources: TemplateArchiveSources,
  name: string = DEFAULT_TEMPLATE_NAME,
): Promise<Uint8Array> => (await zipTemplate(sources, name)).generateAsync({ type: "uint8array" });

/** The same archive as buildTemplateArchive, as a Blob to save as a file. */
export const buildTemplateArchiveBlob = async (
  sources: TemplateArchiveSources,
  name: string = DEFAULT_TEMPLATE_NAME,
): Promise<Blob> => (await zipTemplate(sources, name)).generateAsync({ type: "blob", mimeType: "application/zip" });

const zipTemplate = async ({ templateMarkdown, modelCto, logicTs }: TemplateArchiveSources, name: string) => {
  const JSZip = (await import("jszip")).default;
  const packageJson = {
    name,
    version: "1.0.0",
    accordproject: {
      template: "contract",
      cicero: "^2.1.1",
    },
  };

  const zip = new JSZip();
  zip.file("package.json", JSON.stringify(packageJson, null, 2));
  zip.file("text/grammar.tem.md", templateMarkdown);
  zip.file("model/model.cto", modelCto);
  // Offline copies of the models that model.cto imports, so the archive resolves without network access.
  for (const bundledModel of BUNDLED_MODELS) {
    zip.file(`model/${bundledModel.fileName}`, bundledModel.source);
  }
  if (logicTs) {
    zip.file("logic/logic.ts", logicTs);
  }
  return zip;
};
