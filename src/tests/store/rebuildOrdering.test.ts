import { vi } from "vitest";
import useAppStore from "../../store/store";
import { rebuildInSandbox } from "../../store/rebuildSandbox";

vi.mock("../../store/rebuildSandbox", () => ({ rebuildInSandbox: vi.fn() }));
vi.mock("@accordproject/markdown-transform", () => ({
  transform: vi.fn((ciceroMark: { text: string }) => Promise.resolve(`<p>${ciceroMark.text}</p>`)),
}));

const MODEL = `namespace test@1.0.0

@template
concept Greeting {
  o String name
}`;

describe("rebuild results arriving out of order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useAppStore.setState({
      templateMarkdown: "Hello {{name}}",
      modelCto: MODEL,
      data: '{"$class":"test@1.0.0.Greeting","name":"Acme"}',
      agreementHtml: "<p>Acme</p>",
      error: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the newer edit's validation error when an older render finishes later", async () => {
    let finishOlderRender!: (ciceroMark: unknown) => void;
    vi.mocked(rebuildInSandbox).mockImplementationOnce(
      () => new Promise((resolve) => { finishOlderRender = resolve; }),
    );
    const { setData } = useAppStore.getState();

    const older = setData('{"$class":"test@1.0.0.Greeting","name":"Zeta"}');
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    const newer = setData('{"$class":"test@1.0.0.Greeting","name":"Zeta"');
    await vi.advanceTimersByTimeAsync(500);
    await newer;
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);

    finishOlderRender({ text: "Zeta" });
    await older;

    expect(useAppStore.getState().agreementHtml).toBe("<p>Acme</p>");
    expect(useAppStore.getState().error).toMatch(/Invalid JSON data/);
  });

  it("keeps the newer model's validation error when an older render finishes later", async () => {
    let finishOlderRender!: (ciceroMark: unknown) => void;
    vi.mocked(rebuildInSandbox).mockImplementationOnce(
      () => new Promise((resolve) => { finishOlderRender = resolve; }),
    );
    const { setModelCto } = useAppStore.getState();

    const older = setModelCto(`${MODEL}\n// reviewed`);
    await vi.advanceTimersByTimeAsync(500);
    expect(rebuildInSandbox).toHaveBeenCalledTimes(1);

    const newer = setModelCto(MODEL.slice(0, -1));
    await vi.advanceTimersByTimeAsync(500);
    await newer;
    expect(useAppStore.getState().error).toMatch(/Invalid CTO model/);

    finishOlderRender({ text: "Zeta" });
    await older;

    expect(useAppStore.getState().agreementHtml).toBe("<p>Acme</p>");
    expect(useAppStore.getState().error).toMatch(/Invalid CTO model/);
  });
});
