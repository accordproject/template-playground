import { describe, it, expect } from "vitest";
import { generateCiceroMark, serializeRebuildError } from "../../sandbox/rebuildPipeline";
import * as helloworld from "../../samples/helloworld";

describe("generateCiceroMark", () => {
  it("renders a template to a CiceroMark document", async () => {
    const doc = (await generateCiceroMark(
      helloworld.TEMPLATE,
      helloworld.MODEL,
      JSON.stringify(helloworld.DATA),
    )) as { $class: string };
    expect(doc.$class).toContain("Document");
    const text = JSON.stringify(doc);
    const name = (helloworld.DATA as { name: string }).name;
    expect(text).toContain(name);
  }, 30_000);

  it("throws when the data does not match the model", async () => {
    await expect(
      generateCiceroMark(helloworld.TEMPLATE, helloworld.MODEL, JSON.stringify({ $class: "nope" })),
    ).rejects.toBeDefined();
  }, 30_000);
});

describe("serializeRebuildError", () => {
  it("keeps strings and stringifies Errors the way formatError does", () => {
    expect(serializeRebuildError("plain")).toBe("plain");
    expect(serializeRebuildError(new TypeError("boom"))).toBe("TypeError: boom");
  });

  it("recurses into arrays", () => {
    expect(serializeRebuildError(["a", new Error("b")])).toEqual(["a", "Error: b"]);
  });

  it("keeps the fields formatError reads from coded errors and drops the rest", () => {
    class EngineError extends Error {
      code = "E42";
      renderedMessage = "rendered";
      errors = [new Error("inner")];
      fileLocation = { start: () => 1 };
    }
    const serialized = serializeRebuildError(new EngineError("outer"));
    expect(serialized).toEqual({
      code: "E42",
      renderedMessage: "rendered",
      errors: ["Error: inner"],
      message: "outer",
    });
    expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
  });

  it("stringifies non-primitive fields so the result is cloneable", () => {
    const serialized = serializeRebuildError({ code: { nested: true }, renderedMessage: 12 });
    expect(serialized).toEqual({
      code: "[object Object]",
      renderedMessage: 12,
      errors: undefined,
      message: undefined,
    });
  });
});
