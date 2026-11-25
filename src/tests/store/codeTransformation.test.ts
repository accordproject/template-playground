import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateArchiveProcessor } from "@accordproject/template-engine";
import useAppStore from "../../store/store";

vi.mock("@accordproject/template-engine", () => ({
  TemplateArchiveProcessor: vi.fn(),
}));

const initialState = useAppStore.getState();
type LogicClass = new () => { trigger(): string };

// Supply emitted JavaScript at the compiler boundary, then exercise the store's
// actual transformation and the same new Function invocation as the sandbox.
const compile = async (code: string) => {
  vi.mocked(TemplateArchiveProcessor).mockImplementation(() => (
    {
      compileLogic: vi.fn().mockResolvedValue({
        "logic/logic.ts": { code, errors: [] },
      }),
    } as unknown as InstanceType<typeof TemplateArchiveProcessor>
  ));
  await useAppStore.getState().compileLogic();
  return useAppStore.getState();
};

describe("compileLogic emitted JavaScript", () => {
  beforeEach(() => {
    useAppStore.setState({
      logicTs: "class RealLogic extends TemplateLogic {}",
      modelCto: "model",
      buildTemplateFromMemory: vi.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    useAppStore.setState(initialState, true);
    vi.clearAllMocks();
  });

  it.each([
    ["named class", "export class RealLogic extends TemplateLogic {}"],
    ["default class", "export default class RealLogic extends TemplateLogic {}"],
    [
      "default assignment",
      "class RealLogic extends TemplateLogic {}\nexport default RealLogic;",
    ],
    ["empty module marker", "class RealLogic extends TemplateLogic {}\nexport {};"],
    ["named export list", "class RealLogic extends TemplateLogic {}\nexport { RealLogic };"],
  ])("executes a %s export", async (_name, code) => {
    const state = await compile(`class TemplateLogic {}\n${code}`);
    expect(state.compilationErrors).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- Match sandbox execution.
    const Constructor = new Function(state.compiledLogicJs!)() as LogicClass;
    expect(new Constructor()).toBeInstanceOf(Constructor);
  });

  it("preserves comments and unrelated source around export tokens", async () => {
    const comment = [
      "/*", "export default documentation;", "export class Example {}", "export {};", "*/",
    ].join("\n");
    const code = `${comment}\nclass TemplateLogic {}\nexport /* class note */ class RealLogic extends TemplateLogic {
  trigger() { return 'export default value;'; }
}
export /* default note */ default RealLogic;
export { /* marker note */ };`;
    const state = await compile(code);
    expect(state.compilationErrors).toEqual([]);
    expect(state.compiledLogicJs).toContain(comment);
    for (const note of ["class note", "default note", "marker note"]) {
      expect(state.compiledLogicJs).toContain(`/* ${note} */`);
    }
    expect(state.compiledLogicJs).toContain(
      "trigger() { return 'export default value;'; }",
    );
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- Match sandbox execution.
    const Constructor = new Function(state.compiledLogicJs!)() as LogicClass;
    expect(new Constructor().trigger()).toBe("export default value;");
  });

  it.each(["", "class SomeOtherClass {}"])("reports missing logic classes for %j", async (code) => {
    const state = await compile(code);
    expect(state.compiledLogicJs).toBeNull();
    expect(state.compilationErrors[0]?.message).toContain(
      "does not contain a class extending TemplateLogic",
    );
  });
});
