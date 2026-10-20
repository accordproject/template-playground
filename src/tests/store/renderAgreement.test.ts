import { describe, it, expect, vi, beforeEach } from 'vitest';

/*
 * renderAgreement renders the current sources for exports. The sandbox
 * answers a superseded request with the newer render's result, so an export
 * whose sources changed mid-render must not get the other template's HTML.
 */
const sandbox = vi.hoisted(() => ({ next: null as null | ((json: unknown) => void) }));

vi.mock('../../store/rebuildSandbox', () => ({
  rebuildInSandbox: vi.fn(() => new Promise((resolve) => (sandbox.next = resolve))),
}));
vi.mock('../../utils/validators', () => ({ validateBeforeRebuild: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@accordproject/markdown-transform', () => ({
  transform: vi.fn((json: { html: string }) => Promise.resolve(json.html)),
}));

import useAppStore from '../../store/store';

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('useAppStore.renderAgreement', () => {
  beforeEach(() => {
    sandbox.next = null;
    useAppStore.setState({ templateMarkdown: 'A', modelCto: 'namespace a@1.0.0', data: '{}' });
  });

  it('returns the HTML rendered from the current sources', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    sandbox.next!({ html: '<p>A</p>' });
    await expect(pending).resolves.toBe('<p>A</p>');
  });

  it('refuses the result when the template changed while it was rendering', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    // The user picks another template; the sandbox answers with that one's render.
    useAppStore.setState({ templateMarkdown: 'B' });
    sandbox.next!({ html: '<p>B</p>' });
    await expect(pending).rejects.toThrow(/changed while it was being rendered/);
  });
});
