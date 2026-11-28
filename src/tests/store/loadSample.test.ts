import { describe, it, expect, vi, beforeEach } from 'vitest';

const sandbox = vi.hoisted(() => ({
  resolve: null as null | ((value: { html: string }) => void),
}));

vi.mock('../../store/rebuildSandbox', () => ({
  rebuildInSandbox: vi.fn(
    () =>
      new Promise<{ html: string }>((resolve) => {
        sandbox.resolve = resolve;
      }),
  ),
}));
vi.mock('../../utils/validators', () => ({
  validateBeforeRebuild: vi.fn().mockResolvedValue(undefined),
}));

import useAppStore from '../../store/store';
import { SAMPLES } from '../../samples';

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('useAppStore.loadSample', () => {
  beforeEach(() => {
    sandbox.resolve = null;
    useAppStore.setState({ agreementHtml: '<p>Previous agreement</p>' });
  });

  it('resets agreementHtml to an empty string instead of undefined while rebuilding', async () => {
    const sample = SAMPLES[0];
    expect(sample).toBeDefined();

    const pending = useAppStore.getState().loadSample(sample.NAME);

    // Synchronously reset before rebuild resolves
    expect(useAppStore.getState().agreementHtml).toBe('');

    await settle();
    sandbox.resolve!({ html: '<p>Rebuilt</p>' });
    await pending;
  });
});
