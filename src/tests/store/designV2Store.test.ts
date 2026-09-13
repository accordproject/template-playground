import { describe, it, expect, beforeEach } from 'vitest';
import useDesignV2Store from '../../store/designV2Store';
import { STEPS, FIRST_STEP, LAST_STEP } from '../../types/designV2.types';

describe('useDesignV2Store', () => {
  beforeEach(() => {
    useDesignV2Store.setState({ view: 'welcome', previewOpen: false });
  });

  it('starts on the welcome view with the preview closed', () => {
    const state = useDesignV2Store.getState();
    expect(state.view).toBe('welcome');
    expect(state.previewOpen).toBe(false);
  });

  it('start() moves from welcome to the first step', () => {
    useDesignV2Store.getState().start();
    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
  });

  it('goNext() walks through every step in STEPS order and stops at the last one', () => {
    const store = useDesignV2Store.getState();
    store.start();
    for (let i = 1; i < STEPS.length; i++) {
      store.goNext();
      expect(useDesignV2Store.getState().view).toBe(STEPS[i].id);
    }
    store.goNext();
    expect(useDesignV2Store.getState().view).toBe(LAST_STEP);
  });

  it('goBack() stops at the first step', () => {
    const store = useDesignV2Store.getState();
    store.start();
    store.goBack();
    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
  });

  it('goBack() and goNext() are no-ops on the welcome view', () => {
    const store = useDesignV2Store.getState();
    store.goNext();
    expect(useDesignV2Store.getState().view).toBe('welcome');
    store.goBack();
    expect(useDesignV2Store.getState().view).toBe('welcome');
  });

  it('setView() jumps directly to a step', () => {
    useDesignV2Store.getState().setView(LAST_STEP);
    expect(useDesignV2Store.getState().view).toBe(LAST_STEP);
  });

  it('togglePreview() and setPreviewOpen() control the preview drawer', () => {
    const store = useDesignV2Store.getState();
    store.togglePreview();
    expect(useDesignV2Store.getState().previewOpen).toBe(true);
    store.togglePreview();
    expect(useDesignV2Store.getState().previewOpen).toBe(false);
    store.setPreviewOpen(true);
    expect(useDesignV2Store.getState().previewOpen).toBe(true);
  });
});
