import { describe, expect, it } from "vitest";
import { Parser } from "@accordproject/concerto-cto";
import { formatConcertoModel } from "../../utils/formatConcertoModel";

const unformattedCto = `namespace org.example
asset Sample identified by sampleId {o String sampleId o String name optional}`;

describe("formatConcertoModel", () => {
  it("formats valid CTO while preserving model semantics", () => {
    const formatted = formatConcertoModel(unformattedCto);

    const inputAst = Parser.parse(unformattedCto, undefined, { skipLocationNodes: true });
    const outputAst = Parser.parse(formatted, undefined, { skipLocationNodes: true });

    expect(outputAst).toEqual(inputAst);
  });

  it("is stable when formatting already formatted CTO", () => {
    const once = formatConcertoModel(unformattedCto);
    const twice = formatConcertoModel(once);

    expect(twice).toBe(once);
  });

  it("throws for invalid CTO", () => {
    expect(() => formatConcertoModel("namespace org.example asset")).toThrow();
  });
});

