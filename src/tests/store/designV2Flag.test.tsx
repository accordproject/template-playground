import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - Design v2 feature flag (isDesignV2Enabled)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ isDesignV2Enabled: false });
  });

  it('defaults to false', () => {
    expect(useAppStore.getState().isDesignV2Enabled).toBe(false);
  });

  it('updates and persists to localStorage when enabled', () => {
    useAppStore.getState().setDesignV2Enabled(true);

    expect(useAppStore.getState().isDesignV2Enabled).toBe(true);
    expect(localStorage.getItem('isDesignV2Enabled')).toBe('true');
  });

  it('updates and persists to localStorage when disabled again', () => {
    useAppStore.getState().setDesignV2Enabled(true);
    useAppStore.getState().setDesignV2Enabled(false);

    expect(useAppStore.getState().isDesignV2Enabled).toBe(false);
    expect(localStorage.getItem('isDesignV2Enabled')).toBe('false');
  });

  it('reads the persisted value on store creation', async () => {
    localStorage.setItem('isDesignV2Enabled', 'true');
    vi.resetModules();

    const freshStore = (await import('../../store/store')).default;

    expect(freshStore.getState().isDesignV2Enabled).toBe(true);
  });
});
