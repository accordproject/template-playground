import { describe, it, expect } from "vitest";
import { ModelManager } from "@accordproject/concerto-core";
import { loadBundledModels, rejectingDownloader } from "./modelCache";

describe("loadBundledModels", () => {
  it("preloads the standard Accord Project namespaces", () => {
    const mm = new ModelManager({ strict: true });
    loadBundledModels(mm);
    const namespaces = (mm as unknown as {
      getModelFiles: () => { getNamespace: () => string }[];
    })
      .getModelFiles()
      .map((f) => f.getNamespace())
      .sort();
    expect(namespaces).toEqual(
      [
        "com.docusign.connect@0.4.0",
        "org.accordproject.binary@0.2.0",
        "org.accordproject.contract@0.2.0",
        "org.accordproject.runtime@0.2.0",
        "org.accordproject.signature@0.3.0",
        "org.accordproject.time@0.3.0",
      ].sort()
    );
  });

  it("resolves a model importing a bundled namespace without network access", async () => {
    const mm = new ModelManager({ strict: true });
    loadBundledModels(mm);
    const userModel = `namespace example@1.0.0

import org.accordproject.contract@0.2.0.{Clause} from https://models.accordproject.org/accordproject/contract@0.2.0.cto

@template
asset TemplateModel extends Clause {
  o String greeting
}`;
    mm.addCTOModel(userModel, "user.cto", true);
    // The rejecting downloader would throw if any import still needed
    // fetching. Passing it here proves the bundle satisfied everything.
    await expect(
      mm.updateExternalModels({}, rejectingDownloader as never)
    ).resolves.not.toThrow();
  });
});

describe("rejectingDownloader", () => {
  it("rejects with the expected user-facing message for unbundled imports", async () => {
    const fakeFile = {
      getExternalImports: () => ({
        "com.example.foo@1.0.0.Bar": "https://example.com/foo.cto",
      }),
    };
    await expect(
      rejectingDownloader.downloadExternalDependencies([fakeFile])
    ).rejects.toThrow(/External model imports are not allowed in the playground/);
  });

  it("returns an empty result when every import is satisfied by the bundle", async () => {
    const fakeFile = {
      getExternalImports: () => ({
        "org.accordproject.contract@0.2.0.Clause":
          "https://models.accordproject.org/accordproject/contract@0.2.0.cto",
      }),
    };
    await expect(
      rejectingDownloader.downloadExternalDependencies([fakeFile])
    ).resolves.toEqual([]);
  });

  it("blocks a model that imports an unbundled external URL", async () => {
    const mm = new ModelManager({ strict: true });
    loadBundledModels(mm);
    const userModel = `namespace example@1.0.0

import com.example.foo@1.0.0.Bar from https://example.com/foo.cto

asset TemplateModel identified by id {
  o String id
}`;
    mm.addCTOModel(userModel, "user.cto", true);
    await expect(
      mm.updateExternalModels({}, rejectingDownloader as never)
    ).rejects.toThrow(/External model imports are not allowed in the playground/);
  });
});
