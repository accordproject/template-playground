import { describe, it, expect } from "vitest";
import { validateConcertoModel, validateJson } from "../../mcp/guardrails";

describe("validateConcertoModel", () => {
  it("accepts a well-formed model with a @template root concept", () => {
    const cto = `namespace org.accordproject.playground@1.0.0

@template
concept TemplateModel {
  o String name
}`;
    expect(validateConcertoModel(cto)).toBeNull();
  });

  it("rejects a valid model that has no @template concept", () => {
    const cto = `namespace org.accordproject.playground@1.0.0

concept TemplateModel {
  o String name
}`;
    expect(validateConcertoModel(cto)).not.toBeNull();
  });

  it("rejects a structurally invalid model", () => {
    expect(validateConcertoModel("namespace org.x@1.0.0\nconcept {")).not.toBeNull();
  });

  it("rejects an unversioned namespace", () => {
    expect(
      validateConcertoModel("namespace org.x\nconcept Foo {\n o String a\n}")
    ).not.toBeNull();
  });

  it("rejects an empty model", () => {
    expect(validateConcertoModel("   ")).not.toBeNull();
  });
});

describe("validateJson", () => {
  it("accepts valid JSON", () => {
    expect(validateJson('{"a":1}')).toBeNull();
  });

  it("rejects invalid JSON", () => {
    expect(validateJson("{ not json }")).not.toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateJson("   ")).not.toBeNull();
  });
});
