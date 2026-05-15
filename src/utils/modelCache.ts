// Bundled Accord Project Concerto model files. Vite's `?raw` import inlines
// the .cto source at build time so we don't need a separate fetch.
import contractCto from "../models/bundled/accordproject.contract.cto?raw";
import runtimeCto from "../models/bundled/accordproject.runtime.cto?raw";
import timeCto from "../models/bundled/accordproject.time.cto?raw";
import binaryCto from "../models/bundled/accordproject.binary.cto?raw";
import signatureCto from "../models/bundled/accordproject.signature.cto?raw";
import docusignConnectCto from "../models/bundled/docusign.connect.cto?raw";

import type { ModelManager } from "@accordproject/concerto-core";

interface BundledModel {
  namespace: string;
  fileName: string;
  source: string;
}

const BUNDLED_MODELS: BundledModel[] = [
  {
    namespace: "org.accordproject.contract@0.2.0",
    fileName: "@models.accordproject.org.accordproject.contract@0.2.0.cto",
    source: contractCto,
  },
  {
    namespace: "org.accordproject.runtime@0.2.0",
    fileName: "@models.accordproject.org.accordproject.runtime@0.2.0.cto",
    source: runtimeCto,
  },
  {
    namespace: "org.accordproject.time@0.3.0",
    fileName: "@models.accordproject.org.time@0.3.0.cto",
    source: timeCto,
  },
  {
    namespace: "org.accordproject.binary@0.2.0",
    fileName: "@models.accordproject.org.binary@0.2.0.cto",
    source: binaryCto,
  },
  {
    namespace: "org.accordproject.signature@0.3.0",
    fileName: "@models.accordproject.org.signature.signature@0.3.0.cto",
    source: signatureCto,
  },
  {
    namespace: "com.docusign.connect@0.4.0",
    fileName: "@models.accordproject.org.docusign.connect@0.4.0.cto",
    source: docusignConnectCto,
  },
];

const BUNDLED_NAMESPACES = new Set(BUNDLED_MODELS.map((m) => m.namespace));

/**
 * Pre-populate a ModelManager with the bundled Accord Project standard models.
 * Templates that import these namespaces resolve offline; templates importing
 * anything else hit the FileDownloader and get rejected (see rejectingDownloader).
 */
export function loadBundledModels(modelManager: ModelManager): void {
  for (const { fileName, source } of BUNDLED_MODELS) {
    modelManager.addCTOModel(source, fileName, true);
  }
}

/**
 * Strip the trailing `.TypeName` from a fully-qualified import declaration to
 * recover the namespace. Handles versioned namespaces whose version part
 * (e.g. `@0.2.0`) contains dots.
 */
function namespaceOf(importDeclaration: string): string {
  const segments = importDeclaration.split(".");
  segments.pop();
  return segments.join(".");
}

interface ExternalDependencyFile {
  getExternalImports?: () => Record<string, string>;
}

/**
 * A FileDownloader replacement passed to `modelManager.updateExternalModels`.
 *
 * For every external import declared in the user's model, it checks whether
 * the namespace was already preloaded from the bundle:
 *   - If yes, the import is silently considered satisfied (no network).
 *   - If no, the call rejects with a clear, user-facing error message.
 *
 * Returning an empty array of "downloaded" files is safe because the bundled
 * namespaces are already in the ModelManager from `loadBundledModels`.
 */
export const rejectingDownloader = {
  async downloadExternalDependencies(
    files: ExternalDependencyFile[]
  ): Promise<unknown[]> {
    for (const file of files) {
      const imports = file.getExternalImports?.() ?? {};
      for (const [importDecl, url] of Object.entries(imports)) {
        const ns = namespaceOf(importDecl);
        if (!BUNDLED_NAMESPACES.has(ns)) {
          throw new Error(
            "External model imports are not allowed in the playground. " +
              `Unresolved import: ${importDecl} from ${url}. ` +
              "Either remove the import or paste the model contents into the editor."
          );
        }
      }
    }
    return [];
  },
};
