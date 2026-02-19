import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - editorFontSize', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      editorFontSize: 14,
    });
  });

  it('should have editorFontSize default to 14', () => {
    const state = useAppStore.getState();
    expect(state.editorFontSize).toBe(14);
  });

  it('should update editorFontSize when setEditorFontSize is called', () => {
    const store = useAppStore.getState();
    
    store.setEditorFontSize(18);
    
    expect(useAppStore.getState().editorFontSize).toBe(18);
  });

  it('should persist editorFontSize to localStorage', () => {
    const store = useAppStore.getState();
    
    store.setEditorFontSize(16);
    
    expect(localStorage.getItem('editorFontSize')).toBe('16');
  });

  it('should set various font sizes correctly', () => {
    const store = useAppStore.getState();
    
    store.setEditorFontSize(12);
    expect(useAppStore.getState().editorFontSize).toBe(12);
    
    store.setEditorFontSize(20);
    expect(useAppStore.getState().editorFontSize).toBe(20);
    
    store.setEditorFontSize(14);
    expect(useAppStore.getState().editorFontSize).toBe(14);
  });
});
