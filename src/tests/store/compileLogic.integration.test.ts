import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useAppStore from "../../store/store";
import * as blank from "../../samples/blank";

const initialState = useAppStore.getState();
type LogicClass = new () => {
  trigger(data: object, request: object): Promise<{ result: { text: string } }>;
};

// No compiler/template mocks: build, type-check and emit with the real engine.
const compileAndRun = async (logicTs: string) => {
  useAppStore.setState({
    templateMarkdown: blank.TEMPLATE,
    modelCto: blank.MODEL,
    logicTs,
  });
  await useAppStore.getState().compileLogic();
  const state = useAppStore.getState();
  expect(state.compilationErrors).toEqual([]);
  expect(state.compiledLogicJs).toBeTruthy();
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- Match sandbox execution.
  const Constructor = new Function(state.compiledLogicJs!)() as LogicClass;
  return {
    text: (await new Constructor().trigger(blank.DATA, {})).result.text,
    code: state.compiledLogicJs!,
  };
};

const logicReturning = (
  expression: string,
  prefix = "",
  suffix = "export default RealLogic;",
) => `${prefix}class RealLogic extends TemplateLogic<any> {
  async trigger(data: any, request: any): Promise<any> {
    return { result: { text: ${expression} }, events: [] };
  }
}
${suffix}`;

describe("compileLogic with the real template engine", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    useAppStore.setState(initialState, true);
    vi.restoreAllMocks();
  });

  it.each([
    ["default assignment", "", "export default RealLogic;"],
    ["named class", "export ", ""],
    ["default class", "export default ", ""],
    ["module marker", "", "export {};"],
  ])("preserves the original multiline string with a %s", async (_name, prefix, suffix) => {
    const expected = "line one\nexport default example;\nexport class Sample {}\nline four";
    const { text } = await compileAndRun(
      logicReturning(`\`${expected}\``, prefix, suffix),
    );
    expect(text).toBe(expected);
  }, 30_000);

  it("preserves escaped quotes, backticks, nested interpolation and export markers", async () => {
    const expression = [
      "`quotes: \\\"double\\\" and \\'single\\'",
      'backtick: \\`',
      'export {};',
      '${`nested',
      'export default nested;',
      'export class Nested {}',
      '${"interpolated"}`}',
      'last line`',
    ].join("\n");
    const expected = [
      'quotes: "double" and \'single\'',
      'backtick: `',
      "export {};",
      "nested",
      "export default nested;",
      "export class Nested {}",
      "interpolated",
      "last line",
    ].join("\n");
    const { text } = await compileAndRun(logicReturning(expression));
    expect(text).toBe(expected);
  }, 30_000);

  it("preserves emitted comments containing export-like text", async () => {
    const comment = [
      "/*", "export default documentation;", "export class Example {}", "export {};", "*/",
    ].join("\n");
    const { text, code } = await compileAndRun(
      `${comment}\n${logicReturning('"unchanged"')}`,
    );
    expect(text).toBe("unchanged");
    expect(code).toContain(comment);
  }, 30_000);
});
