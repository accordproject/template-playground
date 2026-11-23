import { describe, it, expect } from "vitest";
import { cleanTemplateErrorMessage, findTemplateErrorLocation } from "../../store/store";

describe("cleanTemplateErrorMessage", () => {
  it("strips minified prefix and grammar file details from unknown property error", () => {
    const raw = "o: Unknown property: notAField File text/grammar.tem.md line -1 column -1";
    expect(cleanTemplateErrorMessage(raw)).toBe(
      "Unknown variable `notAField` — add it to the template model"
    );
  });

  it("handles unknown variable errors with backticks", () => {
    const raw = "Unknown variable `notAField` File text/grammar.tem.md line -1 column -1";
    expect(cleanTemplateErrorMessage(raw)).toBe(
      "Unknown variable `notAField` — add it to the template model"
    );
  });

  it("humanizes errors with positive line and column positions", () => {
    const raw = "Unknown property: notAField File text/grammar.tem.md line 5 column 3";
    expect(cleanTemplateErrorMessage(raw)).toBe(
      "Unknown variable `notAField` — add it to the template model"
    );
  });

  it("does not strip line and column positions from Concerto model errors", () => {
    const modelError = "Invalid CTO model: syntax error at line 3 column 5";
    expect(cleanTemplateErrorMessage(modelError)).toBe(modelError);
  });

  it("preserves standard runtime and unclassified errors", () => {
    const runtimeError = "Error: Init failed";
    expect(cleanTemplateErrorMessage(runtimeError)).toBe(runtimeError);
  });
});

describe("findTemplateErrorLocation", () => {
  const template = [
    "Hello {{name}}.",
    "This is a {{badProp}} in template.",
    "Conditional {{#if conditionVar}} show text {{/if}}",
    "List {{#each itemsList}} {{this}} {{/each}}",
    "Whitespace {{   spacedVar   }} check.",
    "Dollar variable {{price$1}} check.",
  ].join("\n");

  it("finds standard variable error location with correct columns", () => {
    const loc = findTemplateErrorLocation("Unknown property: badProp", template);
    expect(loc).toEqual({ line: 2, column: 11, endColumn: 22 });
  });

  it("locates variables when error has been humanized", () => {
    const loc = findTemplateErrorLocation(
      "Unknown variable `badProp` — add it to the template model",
      template
    );
    expect(loc).toEqual({ line: 2, column: 11, endColumn: 22 });
  });

  it("does not falsely match longer variable names with the same prefix", () => {
    const tpl = "Hello {{badPropLong}} and {{badProp}}.";
    const loc = findTemplateErrorLocation("Unknown property: badProp", tpl);
    expect(loc).toEqual({ line: 1, column: 27, endColumn: 38 });
  });

  it("escapes and locates variables that contain dollar signs ($)", () => {
    const loc = findTemplateErrorLocation("Unknown property: price$1", template);
    expect(loc).toEqual({ line: 6, column: 17, endColumn: 29 });
  });

  it("finds variables inside block helpers (#if, #each)", () => {
    const ifLoc = findTemplateErrorLocation("Unknown property: conditionVar", template);
    expect(ifLoc?.line).toBe(3);

    const eachLoc = findTemplateErrorLocation("Unknown property: itemsList", template);
    expect(eachLoc?.line).toBe(4);
  });

  it("finds variables with internal whitespace inside braces", () => {
    const loc = findTemplateErrorLocation("Unknown property: spacedVar", template);
    expect(loc?.line).toBe(5);
  });

  it("returns null when variable is not present in template", () => {
    const loc = findTemplateErrorLocation("Unknown property: nonexistent", template);
    expect(loc).toBeNull();
  });

  it("returns null for errors that do not describe unknown variables", () => {
    const loc = findTemplateErrorLocation("Syntax error in model", template);
    expect(loc).toBeNull();
  });
});