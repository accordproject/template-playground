import { beforeEach, describe, expect, it, vi } from "vitest";

const validateBeforeRebuildMock = vi.fn();
const addCTOModelMock = vi.fn();
const updateExternalModelsMock = vi.fn();
const fromMarkdownTemplateMock = vi.fn();
const generateMock = vi.fn();
const transformMock = vi.fn();
const createdModelManagers: MockModelManager[] = [];

class MockModelManager {
  constructor(_options?: unknown) {
    createdModelManagers.push(this);
  }

  addCTOModel = addCTOModelMock;
  updateExternalModels = updateExternalModelsMock;
}

class MockTemplateMarkInterpreter {
  generate = generateMock;
}

class MockTemplateMarkTransformer {
  fromMarkdownTemplate = fromMarkdownTemplateMock;
}

vi.mock("ts-debounce", () => ({
  debounce: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("../../utils/validators", () => ({
  validateBeforeRebuild: validateBeforeRebuildMock,
}));

vi.mock("@accordproject/concerto-core", () => ({
  ModelManager: MockModelManager,
}));

vi.mock("@accordproject/template-engine", () => ({
  TemplateMarkInterpreter: MockTemplateMarkInterpreter,
}));

vi.mock("@accordproject/markdown-template", () => ({
  TemplateMarkTransformer: MockTemplateMarkTransformer,
}));

vi.mock("@accordproject/markdown-transform", () => ({
  transform: transformMock,
}));

describe("useAppStore - setData", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createdModelManagers.length = 0;

    validateBeforeRebuildMock.mockResolvedValue(undefined);
    fromMarkdownTemplateMock.mockReturnValue({ $class: "TemplateMarkDocument" });
    generateMock.mockResolvedValue({
      toJSON: () => ({ $class: "CiceroMarkDocument" }),
    });
    transformMock.mockResolvedValue("<p>rebuilt html</p>");
  });

  it("stores rebuilt html as a string and updates modelManager", async () => {
    const { default: useAppStore } = await import("../../store/store");

    useAppStore.setState({
      templateMarkdown: "Sample template markdown",
      modelCto: "namespace org.example@1.0.0",
      data: "{\"before\":true}",
      agreementHtml: "",
      modelManager: undefined,
      error: undefined,
    });

    const nextData = "{\"after\":true}";
    await useAppStore.getState().setData(nextData);

    const state = useAppStore.getState();

    expect(validateBeforeRebuildMock).toHaveBeenCalledWith(
      "Sample template markdown",
      "namespace org.example@1.0.0",
      nextData
    );
    expect(state.agreementHtml).toBe("<p>rebuilt html</p>");
    expect(typeof state.agreementHtml).toBe("string");
    expect(state.modelManager).toBe(createdModelManagers[0]);
    expect(state.error).toBeUndefined();
  });
});
