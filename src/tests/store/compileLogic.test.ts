import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

/** Each test decides what `new TemplateArchiveProcessor()` returns. */
const { processorFactory } = vi.hoisted(() => ({ processorFactory: vi.fn() }));

vi.mock('@accordproject/template-engine', () => {
  return {
    TemplateArchiveProcessor: vi.fn().mockImplementation(() => processorFactory() as unknown),
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

const COMPILED_CLASS = 'class L extends TemplateLogic {}\nexport default L;';
const USER_LOGIC = {
  source: 'export function f() {}',
  compiledJs: 'export function f() {}',
  prelude: 'function f() {}',
  symbols: ['f'],
};

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
      compiledUserLogic: null,
      templateObject: mockTemplateObject as unknown as ReturnType<typeof useAppStore.getState>["templateObject"],
      buildTemplateFromMemory: vi.fn().mockResolvedValue(undefined),
    });
    vi.clearAllMocks();
  });

  it('maps and keeps all compilation errors except 2391, adjusting line offset', async () => {
    processorFactory.mockReturnValue({
      compileLogic: vi.fn().mockResolvedValue({
        "logic/logic.ts": {
          errors: [
            { code: 1001, renderedMessage: "Error 1", line: 10, character: 10, length: 4 },
            { code: 2391, renderedMessage: "Bogus Error", line: 6, character: 1, length: 1 },
            { code: 1002, renderedMessage: "Error 2", line: 15, character: 5, length: 8 },
          ]
        }
      })
    });
    // Stale logic from an earlier successful compile must not survive a failure.
    useAppStore.setState({ compiledUserLogic: USER_LOGIC });

    const store = useAppStore.getState();
    await store.compileLogic();

    const state = useAppStore.getState();
    expect(state.isCompiling).toBe(false);
    expect(state.isProblemPanelVisible).toBe(true);
    expect(state.compiledUserLogic).toBeNull();

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

  it('prepares the compiled logic for formulas, reusing the logic compiled with the cache on', async () => {
    const compileLogic = vi.fn().mockResolvedValue({ 'logic/logic.ts': { errors: [], code: COMPILED_CLASS } });
    const compileUserLogicForDraft = vi.fn().mockResolvedValue(USER_LOGIC);
    processorFactory.mockReturnValue({ compileLogic, compileUserLogicForDraft });

    await useAppStore.getState().compileLogic();

    expect(compileLogic).toHaveBeenCalledWith(true);
    expect(compileUserLogicForDraft).toHaveBeenCalledTimes(1);
    const state = useAppStore.getState();
    expect(state.compiledUserLogic).toEqual(USER_LOGIC);
    expect(state.compiledLogicJs).toContain('return L;');
    expect(state.compilationErrors).toEqual([]);
    expect(state.isCompiling).toBe(false);
  });

  it('leaves the formula logic empty when the engine does not provide it, or provides something malformed', async () => {
    processorFactory.mockReturnValue({
      compileLogic: vi.fn().mockResolvedValue({ 'logic/logic.ts': { errors: [], code: COMPILED_CLASS } }),
    });
    await useAppStore.getState().compileLogic();
    expect(useAppStore.getState().compiledUserLogic).toBeNull();
    expect(useAppStore.getState().compiledLogicJs).toContain('return L;');

    processorFactory.mockReturnValue({
      compileLogic: vi.fn().mockResolvedValue({ 'logic/logic.ts': { errors: [], code: COMPILED_CLASS } }),
      compileUserLogicForDraft: vi.fn().mockResolvedValue({ source: 1 }),
    });
    await useAppStore.getState().compileLogic();
    expect(useAppStore.getState().compiledUserLogic).toBeNull();

    processorFactory.mockReturnValue({
      compileLogic: vi.fn().mockResolvedValue({ 'logic/logic.ts': { errors: [], code: COMPILED_CLASS } }),
      compileUserLogicForDraft: vi.fn().mockRejectedValue(new Error('parse failed')),
    });
    await useAppStore.getState().compileLogic();
    expect(useAppStore.getState().compiledUserLogic).toBeNull();
    expect(useAppStore.getState().compiledLogicJs).toContain('return L;');
  });
});
