import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

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
    
    // Offset is: 1 (leading newline) + 2 (newlines in context) + 1 (newline between) + 1 (newline in declarations) + 1 (trailing newline) = 6 newlines.
    // Line 10 (0-indexed) - 6 offset = 4 (0-indexed). Mapped to 1-indexed = 5.
    // Line 15 (0-indexed) - 6 offset = 9 (0-indexed). Mapped to 1-indexed = 10.
    expect(state.compilationErrors).toHaveLength(2);
    expect(state.compilationErrors[0]).toEqual({
      message: 'Error 1',
      line: 5,
      column: 11,
      length: 4,
    });
    expect(state.compilationErrors[1]).toEqual({
      message: 'Error 2',
      line: 10,
      column: 6,
      length: 8,
    });
  });
});
