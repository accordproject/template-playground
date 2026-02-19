import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - editorWordWrap', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      editorWordWrap: true,
    });
  });

  it('should have editorWordWrap default to true', () => {
    const state = useAppStore.getState();
    expect(state.editorWordWrap).toBe(true);
  });

  it('should update editorWordWrap when setEditorWordWrap is called', () => {
    const store = useAppStore.getState();
    
    store.setEditorWordWrap(false);
    
    expect(useAppStore.getState().editorWordWrap).toBe(false);
  });

  it('should persist editorWordWrap to localStorage', () => {
    const store = useAppStore.getState();
    
    store.setEditorWordWrap(false);
    
    expect(localStorage.getItem('editorWordWrap')).toBe('false');
  });

  it('should toggle editorWordWrap correctly', () => {
    const store = useAppStore.getState();
    
    // Initially true
    expect(useAppStore.getState().editorWordWrap).toBe(true);
    
    // Set to false
    store.setEditorWordWrap(false);
    expect(useAppStore.getState().editorWordWrap).toBe(false);
    
    // Set back to true
    store.setEditorWordWrap(true);
    expect(useAppStore.getState().editorWordWrap).toBe(true);
  });
});
