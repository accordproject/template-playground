// Bundled Accord Project Concerto model files. Vite's `?raw` import inlines
// the .cto source at build time so we don't need a separate fetch.
import contractCto from "../models/bundled/accordproject.contract.cto?raw";
import runtimeCto from "../models/bundled/accordproject.runtime.cto?raw";
import timeCto from "../models/bundled/accordproject.time.cto?raw";
import moneyCto from "../models/bundled/accordproject.money.cto?raw";
import obligationCto from "../models/bundled/accordproject.obligation.cto?raw";
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
    namespace: "org.accordproject.money@0.3.0",
    fileName: "@models.accordproject.org.money@0.3.0.cto",
    source: moneyCto,
  },
  {
    namespace: "org.accordproject.obligation@0.2.0",
    fileName: "@models.accordproject.org.accordproject.obligation@0.2.0.cto",
    source: obligationCto,
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

/**
 * Pre-populate a ModelManager with the bundled Accord Project standard models.
 * Templates that import these namespaces resolve from the bundle without any
 * network access. The ModelManager is constructed with `offline: true` in the
 * caller, so unbundled URL imports fail validation rather than triggering a
 * fetch.
 */
export function loadBundledModels(modelManager: ModelManager): void {
  for (const { fileName, source } of BUNDLED_MODELS) {
    modelManager.addCTOModel(source, fileName, true);
  }
}
