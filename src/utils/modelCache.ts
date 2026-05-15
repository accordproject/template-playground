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
  fileName: string;
  source: string;
}

const BUNDLED_MODELS: BundledModel[] = [
  { fileName: "@models.accordproject.org.accordproject.contract@0.2.0.cto", source: contractCto },
  { fileName: "@models.accordproject.org.accordproject.runtime@0.2.0.cto", source: runtimeCto },
  { fileName: "@models.accordproject.org.time@0.3.0.cto", source: timeCto },
  { fileName: "@models.accordproject.org.binary@0.2.0.cto", source: binaryCto },
  { fileName: "@models.accordproject.org.signature.signature@0.3.0.cto", source: signatureCto },
  { fileName: "@models.accordproject.org.docusign.connect@0.4.0.cto", source: docusignConnectCto },
];

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
 * A FileDownloader replacement passed to modelManager.updateExternalModels.
 * Any URL that wasn't already resolved by the bundle reaches this and is
 * rejected with a clear, user-facing error message. This keeps the playground
 * deterministic and prevents arbitrary remote `.cto` fetches at runtime.
 */
export const rejectingDownloader = {
  // The signature is intentionally permissive — concerto-core's downloader API
  // has shifted between versions; we only need to throw whenever it's invoked.
  downloadExternalDependencies(): Promise<unknown> {
    return Promise.reject(
      new Error(
        "External model imports are not allowed in the playground. " +
          "Either remove the import or paste the model contents into the editor."
      )
    );
  },
};
