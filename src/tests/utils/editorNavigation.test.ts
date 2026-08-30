import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor';
import { registerEditor, unregisterEditor, navigateToLine } from '../../utils/editorNavigation';

describe('editorNavigation', () => {
  let mockEditor: any;
  let mockDecorationsCollection: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockDecorationsCollection = {
      clear: vi.fn(),
    };

    mockEditor = {
      revealLineInCenter: vi.fn(),
      setPosition: vi.fn(),
      focus: vi.fn(),
      createDecorationsCollection: vi.fn().mockReturnValue(mockDecorationsCollection),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    unregisterEditor('concerto');
    unregisterEditor('template');
    unregisterEditor('json');
    unregisterEditor('logic');
  });

  it('registers and unregisters editors correctly', () => {
    registerEditor('logic', mockEditor as unknown as monaco.editor.IStandaloneCodeEditor);
    
    const success = navigateToLine('TypeScript Logic', 10, 5);
    expect(success).toBe(true);
    expect(mockEditor.revealLineInCenter).toHaveBeenCalledWith(10);
    expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 10, column: 5 });

    unregisterEditor('logic');
    
    const successAfter = navigateToLine('TypeScript Logic', 15);
    expect(successAfter).toBe(false);
  });

  it('clears active timeouts and decorations on unregister', () => {
    registerEditor('logic', mockEditor as unknown as monaco.editor.IStandaloneCodeEditor);
    navigateToLine('TypeScript Logic', 10);
    
    expect(mockEditor.createDecorationsCollection).toHaveBeenCalled();
    
    unregisterEditor('logic');
    
    expect(mockDecorationsCollection.clear).toHaveBeenCalled();
  });

  it('handles highlight timeout', () => {
    registerEditor('logic', mockEditor as unknown as monaco.editor.IStandaloneCodeEditor);
    navigateToLine('TypeScript Logic', 10);

    expect(mockDecorationsCollection.clear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(mockDecorationsCollection.clear).toHaveBeenCalled();
  });
});
