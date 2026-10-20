import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';
import { TemplateArchiveProcessor } from '@accordproject/template-engine';
import { Template as CiceroTemplate } from '@accordproject/cicero-core';
import JSZip from 'jszip';
import * as latePayment from '../../samples/latePaymentPenalty';

vi.mock('@accordproject/template-engine', () => {
  return {
    TemplateArchiveProcessor: vi.fn().mockImplementation(() => {
      return {
        compileLogic: vi.fn().mockResolvedValue({
          "logic/logic.ts": {
            errors: [
              { code: 1001, renderedMessage: "Error 1", line: 10, character: 10, length: 4 },
              { code: 2391, renderedMessage: "Bogus Error", line: 6, character: 1, length: 1 },
              { code: 1002, renderedMessage: "Error 2", line: 15, character: 5, length: 8 },
            ]
          }
        })
      };
    })
  };
});

vi.mock('@accordproject/template-engine/lib/TypeScriptCompilationContext', () => {
  return {
    TypeScriptCompilationContext: vi.fn().mockImplementation(() => {
      return {
        getCompilationContext: vi.fn().mockReturnValue("line 1\nline 2\nline 3"),
      };
    })
  };
});

vi.mock('@accordproject/cicero-core', () => ({
  Template: { fromArchive: vi.fn() },
}));

type Template = NonNullable<ReturnType<typeof useAppStore.getState>['templateObject']>;
type Compiled = { 'logic/logic.ts': { errors: unknown[]; code?: string } };
type Processor = InstanceType<typeof TemplateArchiveProcessor>;

// A static stand-in: fromArchive never uses `this`.
// eslint-disable-next-line @typescript-eslint/unbound-method
const fromArchive = vi.mocked(CiceroTemplate.fromArchive);

// The store's own builder, kept before any test swaps in a stand-in.
const realBuildTemplateFromMemory = useAppStore.getState().buildTemplateFromMemory;

/** A promise with its resolve/reject handles, to finish async steps in a chosen order. */
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

describe('useAppStore - compileLogic', () => {
  const mockModelManager = {};
  const mockTemplateModel = {
    getFullyQualifiedName: () => 'org.example.TemplateModel'
  };
  const mockTemplateObject = {
    getModelManager: () => mockModelManager,
    getTemplateModel: () => mockTemplateModel
  } as unknown as Template;

  beforeEach(() => {
    useAppStore.setState({
      logicTs: 'const x = 1;',
      modelCto: 'namespace org.example',
      isCompiling: false,
      compilationErrors: [],
    });
    vi.clearAllMocks();
  });

  it('maps and keeps all compilation errors except 2391, adjusting line offset', async () => {
    useAppStore.setState({
      buildTemplateFromMemory: vi.fn().mockResolvedValue(mockTemplateObject)
    });

    const store = useAppStore.getState();
    await store.compileLogic();

    const state = useAppStore.getState();
    expect(state.isCompiling).toBe(false);
    expect(state.isProblemPanelVisible).toBe(true);

    // The prepended text is `\n${contextStr}          ` — the declarations
    // block is not currently included. Offset is: 1 (leading newline) + 2
    // (newlines inside contextStr's "line 1\nline 2\nline 3") = 3 newlines.
    // Line 10 (0-indexed) - 3 offset = 7 (0-indexed). Mapped to 1-indexed = 8.
    // Line 15 (0-indexed) - 3 offset = 12 (0-indexed). Mapped to 1-indexed = 13.
    expect(state.compilationErrors).toHaveLength(2);
    expect(state.compilationErrors[0]).toEqual({
      message: 'Error 1',
      line: 8,
      column: 11,
      length: 4,
    });
    expect(state.compilationErrors[1]).toEqual({
      message: 'Error 2',
      line: 13,
      column: 6,
      length: 8,
    });
  });

  it('records the model.cto it compiled against, so a later model edit makes the logic stale', async () => {
    useAppStore.setState({
      buildTemplateFromMemory: vi.fn().mockResolvedValue(mockTemplateObject),
      compiledModelCto: null,
    });

    await useAppStore.getState().compileLogic();

    expect(useAppStore.getState().compiledModelCto).toBe('namespace org.example');
  });

  it('builds from the sources as they were when it started, whatever is edited meanwhile', async () => {
    const build = vi.fn().mockResolvedValue(mockTemplateObject);
    useAppStore.setState({ buildTemplateFromMemory: build, templateMarkdown: 'text A', compiledModelCto: null });

    const run = useAppStore.getState().compileLogic();
    useAppStore.setState({ modelCto: 'edited model', logicTs: 'edited logic', templateMarkdown: 'edited text' });
    await run;

    expect(build).toHaveBeenCalledWith({ templateMarkdown: 'text A', modelCto: 'namespace org.example', logicTs: 'const x = 1;' });
    expect(useAppStore.getState().compiledModelCto).toBe('namespace org.example');
  });
});

describe('useAppStore - buildTemplateFromMemory', () => {
  const sources = (model: string) => ({ templateMarkdown: 'Hello', modelCto: model, logicTs: '' });
  const templateFor = (model: string) => ({ model, isStateful: () => false }) as unknown as Template;
  /** The model.cto inside the archive a fromArchive call received. */
  const archivedModel = async (call: number) => {
    const archive = fromArchive.mock.calls[call][0] as Uint8Array;
    return (await JSZip.loadAsync(archive)).file('model/model.cto')!.async('string');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      buildTemplateFromMemory: realBuildTemplateFromMemory,
      templateObject: null,
      modelCto: 'store model',
      templateMarkdown: 'Hello',
      logicTs: '',
    });
  });

  it('returns its own template, and a superseded build does not overwrite the newer one', async () => {
    const a = deferred<Template>();
    fromArchive
      .mockReturnValueOnce(a.promise)
      .mockResolvedValueOnce(templateFor('model B'));

    const buildA = useAppStore.getState().buildTemplateFromMemory(sources('model A'));
    await vi.waitFor(() => expect(fromArchive).toHaveBeenCalledTimes(1));
    const templateB = await useAppStore.getState().buildTemplateFromMemory(sources('model B'));
    a.resolve(templateFor('model A'));
    const templateA = await buildA;

    expect(templateA).toEqual(expect.objectContaining({ model: 'model A' }));
    expect(templateB).toEqual(expect.objectContaining({ model: 'model B' }));
    expect(useAppStore.getState().templateObject).toBe(templateB);
  });

  it('returns null when the build fails', async () => {
    fromArchive.mockRejectedValueOnce(new Error('Invalid CTO model'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(await useAppStore.getState().buildTemplateFromMemory(sources('model A'))).toBeNull();
    expect(useAppStore.getState().templateObject).toBeNull();
  });

  it('forgets the previous template when sources are replaced, and a build still running cannot restore it', async () => {
    // A finished build of the old template, and another still running.
    useAppStore.setState({ templateObject: templateFor('old model'), isTemplateStateful: false, rebuild: vi.fn().mockResolvedValue(undefined) });
    const old = deferred<Template>();
    fromArchive.mockReturnValueOnce(old.promise);
    const pendingBuild = useAppStore.getState().buildTemplateFromMemory(sources('old model'));
    await vi.waitFor(() => expect(fromArchive).toHaveBeenCalledTimes(1));

    // An archive without logic: nothing compiles afterwards to replace the cached template.
    await useAppStore.getState().loadImportedTemplate({ name: 'Imported', templateMarkdown: 'Hi', modelCto: 'model B', data: '{}' });
    expect(useAppStore.getState().templateObject).toBeNull();
    expect(useAppStore.getState().isTemplateStateful).toBe(true);

    old.resolve(templateFor('old model'));
    await pendingBuild;
    expect(useAppStore.getState().templateObject).toBeNull();
  });

  it('reads the store sources when called, not after its own awaits', async () => {
    fromArchive.mockResolvedValueOnce(templateFor('store model'));

    const build = useAppStore.getState().buildTemplateFromMemory();
    useAppStore.setState({ modelCto: 'edited model' });
    await build;

    expect(await archivedModel(0)).toBe('store model');
  });
});

describe('useAppStore - overlapping compileLogic runs', () => {
  const compiledAs = (name: string): Compiled => ({
    'logic/logic.ts': { errors: [], code: `class ${name} extends TemplateLogic {}` },
  });

  /** Per model, what its build returns and what compiling its template returns. */
  let builds: Record<string, Promise<Template | null>>;
  let compiles: Record<string, Promise<Compiled>>;

  beforeEach(() => {
    vi.clearAllMocks();
    builds = {};
    compiles = {};
    useAppStore.setState({
      logicTs: 'class X {}',
      modelCto: 'model A',
      compiledLogicJs: null,
      compiledModelCto: null,
      compilationErrors: [],
      isCompiling: false,
      buildTemplateFromMemory: vi.fn((s?: { modelCto: string }) => builds[s!.modelCto]),
    });
    // The compiler's output names the model of the template it was given.
    vi.mocked(TemplateArchiveProcessor).mockImplementation(((template: { model: string }) => ({
      compileLogic: () => compiles[template.model],
    })) as unknown as (t: Template) => Processor);
  });

  /** Starts run A on model A, then edits the model and runs B to completion. */
  const runAThenB = async () => {
    const runA = useAppStore.getState().compileLogic();
    await vi.waitFor(() => expect(useAppStore.getState().buildTemplateFromMemory).toHaveBeenCalledTimes(1));
    useAppStore.setState({ modelCto: 'model B' });
    await useAppStore.getState().compileLogic();
    // Wrapped: returning the promise itself would make this helper wait for run A.
    return { runA };
  };

  it('keeps the newer result when an older run succeeds after it', async () => {
    const compileA = deferred<Compiled>();
    builds = { 'model A': Promise.resolve(templateOf('model A')), 'model B': Promise.resolve(templateOf('model B')) };
    compiles = { 'model A': compileA.promise, 'model B': Promise.resolve(compiledAs('FromModelB')) };

    const { runA } = await runAThenB();
    expect(useAppStore.getState().compiledLogicJs).toContain('FromModelB');
    compileA.resolve(compiledAs('FromModelA'));
    await runA;

    const state = useAppStore.getState();
    expect(state.compiledLogicJs).toContain('FromModelB');
    expect(state.compiledModelCto).toBe('model B');
    expect(state.isCompiling).toBe(false);
  });

  it('keeps the newer result when an older run fails after it', async () => {
    const compileA = deferred<Compiled>();
    builds = { 'model A': Promise.resolve(templateOf('model A')), 'model B': Promise.resolve(templateOf('model B')) };
    compiles = { 'model A': compileA.promise, 'model B': Promise.resolve(compiledAs('FromModelB')) };

    const { runA } = await runAThenB();
    compileA.reject(new Error('compiled against model A'));
    await runA;

    const state = useAppStore.getState();
    expect(state.compiledLogicJs).toContain('FromModelB');
    expect(state.compiledModelCto).toBe('model B');
    expect(state.compilationErrors).toEqual([]);
  });

  it('drops a compile still running when a sample is loaded over it', async () => {
    const compileA = deferred<Compiled>();
    builds = { 'model A': Promise.resolve(templateOf('model A')) };
    compiles = { 'model A': compileA.promise };
    // loadSample re-renders and may offer the logic tour; neither matters here.
    useAppStore.setState({ rebuild: vi.fn().mockResolvedValue(undefined) });
    localStorage.setItem('hasVisitedLogicTour', 'true');

    const runA = useAppStore.getState().compileLogic();
    await vi.waitFor(() => expect(TemplateArchiveProcessor).toHaveBeenCalledTimes(1));
    await useAppStore.getState().loadSample(latePayment.NAME);
    compileA.resolve(compiledAs('FromDiscardedEdits'));
    await runA;

    const state = useAppStore.getState();
    expect(state.logicTs).toBe(latePayment.LOGIC);
    expect(state.compiledLogicJs).toBeNull();
    expect(state.isCompiling).toBe(false);
  });

  it('does not build for a compile cancelled while the engine loads', async () => {
    useAppStore.setState({ rebuild: vi.fn().mockResolvedValue(undefined) });
    localStorage.setItem('hasVisitedLogicTour', 'true');

    // loadSample cancels before compileLogic's first await (the engine import) resolves.
    const run = useAppStore.getState().compileLogic();
    const load = useAppStore.getState().loadSample(latePayment.NAME);
    await Promise.all([run, load]);

    expect(useAppStore.getState().buildTemplateFromMemory).not.toHaveBeenCalled();
    expect(TemplateArchiveProcessor).not.toHaveBeenCalled();
    expect(useAppStore.getState().compiledLogicJs).toBeNull();
  });

  it('never compiles an older build for a newer run whose own build failed', async () => {
    const buildA = deferred<Template | null>();
    builds = { 'model A': buildA.promise, 'model B': Promise.resolve(null) };
    compiles = { 'model A': Promise.resolve(compiledAs('FromModelA')) };

    const { runA } = await runAThenB();
    buildA.resolve(templateOf('model A'));
    await runA;

    const state = useAppStore.getState();
    expect(TemplateArchiveProcessor).not.toHaveBeenCalled();
    expect(state.compiledLogicJs).toBeNull();
    expect(state.compiledModelCto).toBe('model B');
    expect(state.compilationErrors[0]?.message).toBe('Failed to initialize Template object from memory.');
  });
});

const templateOf = (model: string) => ({ model }) as unknown as Template;
