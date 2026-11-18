import useAppStore, { DecompressedData, SHARED_TEMPLATE_NAME } from "../../store/store";
import { decompress } from "../../utils/compression/compression";
import { vi } from "vitest";

vi.mock("../../utils/compression/compression");
const renderPreview = vi.hoisted(() => vi.fn());
vi.mock('ts-debounce', () => ({ debounce: () => renderPreview }));
const realRebuild = useAppStore.getState().rebuild;

describe("useAppStore loadFromLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({
      logicTs: "",
      editorLogicTs: "",
      isLogicPanelVisible: false,
      isProblemPanelVisible: false,
      error: undefined,
    });
  });

  it("should load data from a valid shareable link without logic", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    // Mock rebuild to avoid side effects
    useAppStore.setState({ rebuild: vi.fn() });

    expect(await useAppStore.getState().loadFromLink("some-compressed-data")).toBe(true);

    const state = useAppStore.getState();
    expect(state.templateMarkdown).toBe(mockData.templateMarkdown);
    expect(state.modelCto).toBe(mockData.modelCto);
    expect(state.logicTs).toBe("");
    expect(state.isLogicPanelVisible).toBe(false);
  });

  it("should load data and trigger logic panel when logic is present", async () => {
    const mockData: DecompressedData = {
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
      logicTs: "console.log('logic code');",
    };

    vi.mocked(decompress).mockReturnValue(mockData);

    useAppStore.setState({ rebuild: vi.fn(), compileLogic: vi.fn(), isLogicPanelVisible: false });

    await useAppStore.getState().loadFromLink("some-compressed-data-with-logic");

    const state = useAppStore.getState();
    expect(state.logicTs).toBe(mockData.logicTs);
    expect(state.editorLogicTs).toBe(mockData.logicTs);
    expect(state.isLogicPanelVisible).toBe(true);
    expect(localStorage.getItem("ui-panels")).toContain('"isLogicPanelVisible":true');
  });

  it("should set an error when mandatory fields are missing", async () => {
    const mockData: Partial<DecompressedData> = {
      templateMarkdown: "Sample Template",
    };

    vi.mocked(decompress).mockReturnValue(mockData as DecompressedData);

    expect(await useAppStore.getState().loadFromLink("invalid-data")).toBe(false);

    const state = useAppStore.getState();
    expect(state.isProblemPanelVisible).toBe(true);
    expect(state.error).toContain("Invalid share link data");
  });

  it('reports a loaded template even when its preview has an error', async () => {
    vi.mocked(decompress).mockReturnValue({
      templateMarkdown: '{{missing}}', modelCto: 'namespace test@1.0.0', data: '{}',
    });
    useAppStore.setState({ rebuild: vi.fn(() => {
      useAppStore.setState({ error: 'Unknown property missing' });
      return Promise.resolve();
    }) });
    expect(await useAppStore.getState().loadFromLink('valid-payload')).toBe(true);
    expect(useAppStore.getState().error).toBe('Unknown property missing');
  });

  it("marks the template as shared and drops the previous template's request", async () => {
    vi.mocked(decompress).mockReturnValue({
      templateMarkdown: "Sample Template",
      modelCto: "namespace test@1.0.0",
      data: '{"key": "value"}',
      agreementHtml: "<p>Sample</p>",
    });
    useAppStore.setState({ rebuild: vi.fn(), requestJson: '{"$class":"org.acme.counter@1.0.0.CounterRequest"}' });

    await useAppStore.getState().loadFromLink("some-compressed-data");

    const state = useAppStore.getState();
    expect(state.sampleName).toBe(SHARED_TEMPLATE_NAME);
    expect(state.requestJson).toBe("");
  });

  it("never names an import after a bundled sample, and remembers its data for reset", async () => {
    useAppStore.setState({ rebuild: vi.fn() });
    await useAppStore.getState().loadImportedTemplate({
      name: "Hello World",
      templateMarkdown: "Hi {{name}}",
      modelCto: "namespace org.acme.hello@1.0.0",
      data: '{"name":"Ana"}',
    });
    const state = useAppStore.getState();
    expect(state.sampleName).toBe("Hello World (imported)");
    expect(state.importedData).toBe('{"name":"Ana"}');
  });

  it.each(['success', 'error'])('discards an older render %s after another share loads', async (outcome) => {
    let finish!: () => void;
    renderPreview.mockImplementationOnce(() => new Promise<string>((resolve, reject) => {
      finish = () => outcome === 'success' ? resolve('old preview') : reject(new Error('old error'));
    })).mockResolvedValueOnce('new preview');
    const compileLogic = vi.fn();
    useAppStore.setState({ rebuild: realRebuild, compileLogic });
    vi.mocked(decompress)
      .mockReturnValueOnce({ templateMarkdown: 'old', modelCto: 'model', data: '{}', logicTs: 'old logic' })
      .mockReturnValueOnce({ templateMarkdown: 'new', modelCto: 'model', data: '{}' });
    const older = useAppStore.getState().loadFromLink('A');
    expect(await useAppStore.getState().loadFromLink('B')).toBe(true);
    finish();
    expect(await older).toBe(false);
    expect(useAppStore.getState()).toMatchObject({ editorValue: 'new', agreementHtml: 'new preview', error: undefined });
    expect(compileLogic).not.toHaveBeenCalled();
  });

  it('replaces a previous shared template and retains a rejected link error after a late render', async () => {
    let finish!: (value: string) => void;
    renderPreview.mockImplementationOnce(() => new Promise<string>(resolve => { finish = resolve; }))
      .mockResolvedValueOnce('default preview');
    useAppStore.setState({ rebuild: realRebuild });
    vi.mocked(decompress).mockReturnValueOnce({ templateMarkdown: 'old', modelCto: 'model', data: '{}' })
      .mockImplementationOnce(() => { throw new Error('bad link'); });
    const older = useAppStore.getState().loadFromLink('A');
    expect(await useAppStore.getState().loadFromLink('bad')).toBe(false);
    finish('stale');
    await older;
    const state = useAppStore.getState();
    expect(state.sampleName).not.toBe(SHARED_TEMPLATE_NAME);
    expect(state.editorValue).not.toBe('old');
    expect(state.importedData).toBeNull();
    expect(state.agreementHtml).toBe('default preview');
    expect(state.error).toContain('bad link');
  });

  it('does not publish the old preview while the newer link is still loading', async () => {
    let finishOld!: (value: string) => void;
    let finishNew!: (value: string) => void;
    renderPreview
      .mockImplementationOnce(() => new Promise<string>(resolve => { finishOld = resolve; }))
      .mockImplementationOnce(() => new Promise<string>(resolve => { finishNew = resolve; }));
    useAppStore.setState({ rebuild: realRebuild });
    vi.mocked(decompress)
      .mockReturnValueOnce({ templateMarkdown: 'old', modelCto: 'model', data: '{}' })
      .mockReturnValueOnce({ templateMarkdown: 'new', modelCto: 'model', data: '{}' });
    const older = useAppStore.getState().loadFromLink('A');
    const newer = useAppStore.getState().loadFromLink('B');
    finishOld('old preview');
    expect(await older).toBe(false);
    expect(useAppStore.getState().agreementHtml).toBeUndefined();
    finishNew('new preview');
    expect(await newer).toBe(true);
    expect(useAppStore.getState().agreementHtml).toBe('new preview');
  });

  it('ignores pending preview and compilation work after the link is abandoned', async () => {
    let finish!: (value: string) => void;
    renderPreview.mockImplementationOnce(() => new Promise<string>(resolve => { finish = resolve; }));
    const compileLogic = vi.fn();
    useAppStore.setState({ rebuild: realRebuild, compileLogic });
    vi.mocked(decompress).mockReturnValue({ templateMarkdown: 'old', modelCto: 'model', data: '{}', logicTs: 'logic' });
    const controller = new AbortController();
    const pending = useAppStore.getState().loadFromLink('A', controller.signal);
    controller.abort();
    finish('stale');
    expect(await pending).toBe(false);
    expect(useAppStore.getState().agreementHtml).not.toBe('stale');
    expect(compileLogic).not.toHaveBeenCalled();
  });

  it('keeps an ordinary startup render from clearing a rejected link error', async () => {
    let finish!: (value: string) => void;
    renderPreview.mockImplementationOnce(() => new Promise<string>(resolve => { finish = resolve; }));
    useAppStore.setState({ rebuild: realRebuild, templateMarkdown: 'ordinary', editorValue: 'ordinary' });
    vi.mocked(decompress).mockImplementationOnce(() => { throw new Error('bad link'); });
    const startup = useAppStore.getState().init();
    expect(await useAppStore.getState().loadFromLink('bad')).toBe(false);
    finish('ordinary preview');
    await startup;
    expect(useAppStore.getState().error).toContain('bad link');
    expect(useAppStore.getState().editorValue).toBe('ordinary');
  });

  it('preserves a separate archive with the shared display name', async () => {
    useAppStore.setState({ rebuild: vi.fn() });
    await useAppStore.getState().loadImportedTemplate({ name: SHARED_TEMPLATE_NAME, templateMarkdown: 'archive', modelCto: 'model', data: '{}' });
    vi.mocked(decompress).mockImplementationOnce(() => { throw new Error('bad link'); });
    expect(await useAppStore.getState().loadFromLink('bad')).toBe(false);
    expect(useAppStore.getState().editorValue).toBe('archive');
  });

  it('preserves unsaved edits to a loaded share when another link fails', async () => {
    useAppStore.setState({ rebuild: vi.fn() });
    vi.mocked(decompress).mockReturnValueOnce({ templateMarkdown: 'shared', modelCto: 'model', data: '{}' })
      .mockImplementationOnce(() => { throw new Error('bad link'); });
    expect(await useAppStore.getState().loadFromLink('A')).toBe(true);
    useAppStore.getState().setEditorValue('my local edits');
    expect(await useAppStore.getState().loadFromLink('bad')).toBe(false);
    expect(useAppStore.getState().editorValue).toBe('my local edits');
  });
});
