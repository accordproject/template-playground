import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - Logic State', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the store to initial state
    useAppStore.setState({
      isLogicFeatureEnabled: false,
      editorLogicTs: '',
      logicTs: '',
      compiledLogicJs: null,
      compilationErrors: [],
      isCompiling: false,
      isLogicPanelVisible: false,
      modelCto: '', // Empty modelCto to skip real compilation in tests
    });
  });

  describe('Feature Flag (isLogicFeatureEnabled)', () => {
    it('should default to false', () => {
      const state = useAppStore.getState();
      expect(state.isLogicFeatureEnabled).toBe(false);
    });

    it('should update and persist to localStorage', () => {
      const store = useAppStore.getState();
      store.setLogicFeatureEnabled(true);
      
      expect(useAppStore.getState().isLogicFeatureEnabled).toBe(true);
      expect(localStorage.getItem('isLogicFeatureEnabled')).toBe('true');
    });
  });

  describe('Workspace Visibility (isLogicPanelVisible)', () => {
    it('should update isLogicPanelVisible and trigger savePanelState', () => {
      expect(useAppStore.getState().isLogicPanelVisible).toBe(false);
      
      useAppStore.getState().setLogicPanelVisible(true);
      expect(useAppStore.getState().isLogicPanelVisible).toBe(true);
      
      expect(localStorage.getItem('ui-panels')).toContain('"isLogicPanelVisible":true');
    });
  });

  describe('Editor Content Actions', () => {
    it('setEditorLogicTs should only update editor logic', () => {
      const store = useAppStore.getState();
      store.setEditorLogicTs('const x = 1;');
      
      expect(useAppStore.getState().editorLogicTs).toBe('const x = 1;');
      expect(useAppStore.getState().logicTs).toBe(''); // unchanged
    });

    it('setLogicTs should sync editor and trigger compilation stub', async () => {
      const store = useAppStore.getState();
      
      // Dirty the state to ensure the compilation stub cleans it up
      useAppStore.setState({
        compiledLogicJs: 'old_js_code',
        compilationErrors: [{ message: 'Old error' }],
      });

      await store.setLogicTs('const y = 2;');
      
      const newState = useAppStore.getState();
      expect(newState.logicTs).toBe('const y = 2;');
      expect(newState.editorLogicTs).toBe('const y = 2;');
      
      // Verify that compileLogic stub was called and cleared state
      expect(newState.compiledLogicJs).toBeNull();
      expect(newState.compilationErrors).toEqual([]);
      expect(newState.isCompiling).toBe(false);
    });

    it('compileLogic stub should hard-reset execution states', async () => {
      const store = useAppStore.getState();
      
      useAppStore.setState({
        logicTs: 'const dummy = 1;',
        compiledLogicJs: 'mock_js',
        compilationErrors: [{ message: 'mock error' }],
        isCompiling: true,
      });

      await store.compileLogic();
      
      const newState = useAppStore.getState();
      expect(newState.compiledLogicJs).toBeNull();
      expect(newState.compilationErrors).toEqual([]);
      expect(newState.isCompiling).toBe(false);
    });
  });
});
