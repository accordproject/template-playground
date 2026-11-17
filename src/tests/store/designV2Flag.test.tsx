import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAppStore from '../../store/store';

/** A store created from scratch, so its initial state reflects what is in localStorage now. */
const freshStore = async () => {
  vi.resetModules();
  return (await import('../../store/store')).default;
};

describe('useAppStore - design v2 default (isDesignV2Enabled)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to design v2 when no choice is stored', async () => {
    const store = await freshStore();

    expect(store.getState().isDesignV2Enabled).toBe(true);
  });

  it('keeps an explicit opt-out ("false") on the classic layout', async () => {
    localStorage.setItem('isDesignV2Enabled', 'false');
    const store = await freshStore();

    expect(store.getState().isDesignV2Enabled).toBe(false);
  });

  it('keeps an earlier opt-in ("true") on design v2', async () => {
    localStorage.setItem('isDesignV2Enabled', 'true');
    const store = await freshStore();

    expect(store.getState().isDesignV2Enabled).toBe(true);
  });

  it('persists a switch to classic and back', () => {
    useAppStore.getState().setDesignV2Enabled(false);
    expect(useAppStore.getState().isDesignV2Enabled).toBe(false);
    expect(localStorage.getItem('isDesignV2Enabled')).toBe('false');

    useAppStore.getState().setDesignV2Enabled(true);
    expect(useAppStore.getState().isDesignV2Enabled).toBe(true);
    expect(localStorage.getItem('isDesignV2Enabled')).toBe('true');
  });
});

describe('useAppStore - one-time "new design" notice (showDesignV2Notice)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is shown to people on design v2 by default who have not seen it', async () => {
    const store = await freshStore();

    expect(store.getState().showDesignV2Notice).toBe(true);
  });

  it('is not shown again once seen', async () => {
    localStorage.setItem('designV2NoticeSeen', 'true');
    const store = await freshStore();

    expect(store.getState().showDesignV2Notice).toBe(false);
  });

  it('is not shown to people who had already opted in', async () => {
    localStorage.setItem('isDesignV2Enabled', 'true');
    const store = await freshStore();

    expect(store.getState().showDesignV2Notice).toBe(false);
  });

  it('is not shown to people who opted out', async () => {
    localStorage.setItem('isDesignV2Enabled', 'false');
    const store = await freshStore();

    expect(store.getState().showDesignV2Notice).toBe(false);
  });

  it('dismissDesignV2Notice hides it', async () => {
    const store = await freshStore();

    store.getState().dismissDesignV2Notice();

    expect(store.getState().showDesignV2Notice).toBe(false);
  });
});
