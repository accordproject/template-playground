import { describe, it, expect } from "vitest";
import { ModelManager } from "@accordproject/concerto-core";
import { loadBundledModels } from "./modelCache";

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
        "org.accordproject.money@0.3.0",
        "org.accordproject.obligation@0.2.0",
        "org.accordproject.runtime@0.2.0",
        "org.accordproject.signature@0.3.0",
        "org.accordproject.time@0.3.0",
      ].sort()
    );
  });

  it("resolves a user model importing a bundled namespace without network access", () => {
    // Construct the manager with `offline: true` (the same way store.ts does)
    // so this test would fail loudly if any code path attempted a fetch.
    // @ts-expect-error `offline` is supported at runtime but not yet in published typings
    const mm = new ModelManager({ strict: true, offline: true });
    loadBundledModels(mm);
    const userModel = `namespace example@1.0.0

import org.accordproject.contract@0.2.0.{Clause} from https://models.accordproject.org/accordproject/contract@0.2.0.cto

@template
asset TemplateModel extends Clause {
  o String greeting
}`;
    expect(() => mm.addCTOModel(userModel, "user.cto", false)).not.toThrow();
  });

  it("rejects a user model importing an unbundled external namespace", () => {
    // @ts-expect-error `offline` is supported at runtime but not yet in published typings
    const mm = new ModelManager({ strict: true, offline: true });
    loadBundledModels(mm);
    const userModel = `namespace example@1.0.0

import com.example.foo@1.0.0.Bar from https://example.com/foo.cto

asset TemplateModel identified by id {
  o String id
}`;
    // With offline:true and no network, an unbundled import fails validation
    // rather than triggering a fetch. The error message names the missing
    // namespace so the user can see what's wrong.
    expect(() => mm.addCTOModel(userModel, "user.cto", false)).toThrow(
      /com\.example\.foo@1\.0\.0/
    );
  });
});
