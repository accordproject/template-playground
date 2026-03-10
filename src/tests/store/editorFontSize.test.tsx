import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - editorFontSize', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      editorFontSize: 14,
    });
  });

  it('should have editorFontSize set to 14 after reset', () => {
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

  it('should set various valid font sizes correctly', () => {
    const store = useAppStore.getState();
    
    store.setEditorFontSize(12);
    expect(useAppStore.getState().editorFontSize).toBe(12);
    
    store.setEditorFontSize(20);
    expect(useAppStore.getState().editorFontSize).toBe(20);
    
    store.setEditorFontSize(14);
    expect(useAppStore.getState().editorFontSize).toBe(14);
  });

  it('should reject font sizes outside the allowed options', () => {
    const store = useAppStore.getState();

    // Start from a non-default valid size
    store.setEditorFontSize(18);
    expect(useAppStore.getState().editorFontSize).toBe(18);

    // Invalid sizes should not change the current font size
    store.setEditorFontSize(5);
    expect(useAppStore.getState().editorFontSize).toBe(18);

    store.setEditorFontSize(100);
    expect(useAppStore.getState().editorFontSize).toBe(18);
  });
});
