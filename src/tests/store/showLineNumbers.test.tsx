import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - showLineNumbers', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the store to initial state
    useAppStore.setState({
      showLineNumbers: true,
    });
  });

  it('should have showLineNumbers default to true', () => {
    const state = useAppStore.getState();
    expect(state.showLineNumbers).toBe(true);
  });

  it('should update showLineNumbers when setShowLineNumbers is called', () => {
    const store = useAppStore.getState();
    
    store.setShowLineNumbers(false);
    
    expect(useAppStore.getState().showLineNumbers).toBe(false);
  });

  it('should persist showLineNumbers to localStorage', () => {
    const store = useAppStore.getState();
    
    store.setShowLineNumbers(false);
    
    expect(localStorage.getItem('showLineNumbers')).toBe('false');
  });

  it('should toggle showLineNumbers correctly', () => {
    const store = useAppStore.getState();
    
    // Initially true
    expect(useAppStore.getState().showLineNumbers).toBe(true);
    
    // Set to false
    store.setShowLineNumbers(false);
    expect(useAppStore.getState().showLineNumbers).toBe(false);
    
    // Set back to true
    store.setShowLineNumbers(true);
    expect(useAppStore.getState().showLineNumbers).toBe(true);
  });
});
