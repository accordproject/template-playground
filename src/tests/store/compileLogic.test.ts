import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';
import { TemplateArchiveProcessor } from '@accordproject/template-engine';

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

vi.mock('@accordproject/template-engine/lib/runtime/declarations', () => {
  return {
    SMART_LEGAL_CONTRACT_BASE64: btoa("line A\nline B"),
  };
});

describe('useAppStore - compileLogic', () => {
  beforeEach(() => {
    const mockModelManager = {};
    const mockTemplateModel = {
      getFullyQualifiedName: () => 'org.example.TemplateModel'
    };
    const mockTemplateObject = {
      getModelManager: () => mockModelManager,
      getTemplateModel: () => mockTemplateModel
    };
    useAppStore.setState({
      logicTs: 'const x = 1;',
      modelCto: 'namespace org.example',
      isCompiling: false,
      compilationErrors: [],
      templateObject: mockTemplateObject as any
    });
    vi.clearAllMocks();
  });

  it('maps and keeps all compilation errors except 2391, adjusting line offset', async () => {
    useAppStore.setState({
      buildTemplateFromMemory: vi.fn().mockResolvedValue(undefined)
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
      buildTemplateFromMemory: vi.fn().mockResolvedValue(undefined),
      compiledModelCto: null,
    });

    await useAppStore.getState().compileLogic();

    expect(useAppStore.getState().compiledModelCto).toBe('namespace org.example');
  });
});

describe('useAppStore - overlapping compileLogic runs', () => {
  type Compiled = { 'logic/logic.ts': { errors: unknown[]; code?: string } };
  type Processor = InstanceType<typeof TemplateArchiveProcessor>;
  type Template = NonNullable<ReturnType<typeof useAppStore.getState>['templateObject']>;
  /** A processor stand-in whose compileLogic returns the given promise. */
  const processorFor = (compiled: Promise<Compiled>) =>
    (() => ({ compileLogic: () => compiled }) as unknown as Processor);

  const compiledAs = (name: string): Compiled => ({
    'logic/logic.ts': { errors: [], code: `class ${name} extends TemplateLogic {}` },
  });

  /*
   * Run A compiles model A but its compiler only answers when `finishA` is
   * called; run B, on model B, is started meanwhile and answers at once.
   * Each run's template object says which model it was built from.
   */
  const startOutOfOrder = async (finishA: Promise<Compiled>) => {
    useAppStore.setState({
      logicTs: 'class X {}',
      modelCto: 'model A',
      buildTemplateFromMemory: vi.fn(() => {
        useAppStore.setState({ templateObject: { model: useAppStore.getState().modelCto } as unknown as Template });
        return Promise.resolve();
      }),
    });
    vi.mocked(TemplateArchiveProcessor)
      .mockImplementationOnce(processorFor(finishA))
      .mockImplementationOnce(processorFor(Promise.resolve(compiledAs('FromModelB'))));

    const runA = useAppStore.getState().compileLogic();
    await vi.waitFor(() => expect(TemplateArchiveProcessor).toHaveBeenCalledTimes(1));
    useAppStore.setState({ modelCto: 'model B' });
    await useAppStore.getState().compileLogic();
    // Wrapped: returning the promise itself would make this helper wait for run A.
    return { runA };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ compiledLogicJs: null, compiledModelCto: null, compilationErrors: [], isCompiling: false });
  });

  it('keeps the newer result when an older run succeeds after it', async () => {
    let resolveA!: (value: Compiled) => void;
    const { runA } = await startOutOfOrder(new Promise<Compiled>((resolve) => { resolveA = resolve; }));
    expect(useAppStore.getState().compiledLogicJs).toContain('FromModelB');

    resolveA(compiledAs('FromModelA'));
    await runA;

    const state = useAppStore.getState();
    expect(state.compiledLogicJs).toContain('FromModelB');
    expect(state.compiledModelCto).toBe('model B');
    expect(state.isCompiling).toBe(false);
  });

  it('keeps the newer result when an older run fails after it', async () => {
    let rejectA!: (error: Error) => void;
    const { runA } = await startOutOfOrder(new Promise<Compiled>((_, reject) => { rejectA = reject; }));

    rejectA(new Error('compiled against model A'));
    await runA;

    const state = useAppStore.getState();
    expect(state.compiledLogicJs).toContain('FromModelB');
    expect(state.compiledModelCto).toBe('model B');
    expect(state.compilationErrors).toEqual([]);
  });
});
