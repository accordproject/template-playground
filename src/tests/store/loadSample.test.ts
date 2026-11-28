import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAppStore from '../../store/store';
import { SAMPLES } from '../../samples';

describe('useAppStore.loadSample', () => {
  beforeEach(() => {
    useAppStore.setState({
      agreementHtml: '<p>Previous agreement</p>',
      rebuild: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('resets agreementHtml to an empty string instead of undefined', async () => {
    const sample = SAMPLES[0];
    expect(sample).toBeDefined();

    await useAppStore.getState().loadSample(sample.NAME);

    expect(useAppStore.getState().agreementHtml).toBe('');
  });
});
