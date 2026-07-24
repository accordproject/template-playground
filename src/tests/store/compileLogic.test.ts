import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

vi.mock('@accordproject/template-engine', () => {
  return {
    TemplateArchiveProcessor: vi.fn().mockImplementation(() => {
      return {
        compileLogic: vi.fn().mockResolvedValue({
          "logic/logic.ts": {
            errors: [
              { code: 1001, renderedMessage: "Error 1", line: 5, character: 10, length: 4 },
              { code: 2391, renderedMessage: "Bogus Error", line: 6, character: 1, length: 1 },
              { code: 1002, renderedMessage: "Error 2", line: 10, character: 5, length: 8 },
            ]
          }
        })
      };
    })
  };
});

describe('useAppStore - compileLogic', () => {
  beforeEach(() => {
    useAppStore.setState({
      logicTs: 'const x = 1;',
      modelCto: 'namespace org.example',
      isCompiling: false,
      compilationErrors: [],
      templateObject: {} as any
    });
    vi.clearAllMocks();
  });

  it('maps and keeps all compilation errors except 2391', async () => {
    useAppStore.setState({
      buildTemplateFromMemory: vi.fn().mockResolvedValue(undefined)
    });

    const store = useAppStore.getState();
    await store.compileLogic();

    const state = useAppStore.getState();
    expect(state.isCompiling).toBe(false);
    expect(state.isProblemPanelVisible).toBe(true);
    
    expect(state.compilationErrors).toHaveLength(2);
    expect(state.compilationErrors[0]).toEqual({
      message: 'Error 1',
      line: 5,
      column: 10,
      length: 4,
    });
    expect(state.compilationErrors[1]).toEqual({
      message: 'Error 2',
      line: 10,
      column: 5,
      length: 8,
    });
  });
});
