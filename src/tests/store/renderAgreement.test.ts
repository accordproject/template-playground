import { describe, it, expect, vi, beforeEach } from 'vitest';

/*
 * renderAgreement renders the current sources for exports. The sandbox
 * answers a superseded request with the newer render's result, so an export
 * whose sources changed mid-render must not get the other template's HTML.
 */
const sandbox = vi.hoisted(() => ({
  next: null as null | ((json: unknown) => void),
  fail: null as null | ((error: Error) => void),
}));

vi.mock('../../store/rebuildSandbox', () => ({
  rebuildInSandbox: vi.fn(
    () =>
      new Promise((resolve, reject) => {
        sandbox.next = resolve;
        sandbox.fail = reject;
      }),
  ),
}));
vi.mock('../../utils/validators', () => ({ validateBeforeRebuild: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@accordproject/markdown-transform', () => ({
  transform: vi.fn((json: { html: string }) => Promise.resolve(json.html)),
}));

import useAppStore, { SourcesChangedError } from '../../store/store';

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

  it('refuses the result when an edit was undone while it was rendering', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    // An edit superseded this render, then Undo restored the original text before its result arrived.
    useAppStore.setState({ templateMarkdown: 'A edited' });
    useAppStore.setState({ templateMarkdown: 'A' });
    sandbox.next!({ html: '<p>A edited</p>' });
    await expect(pending).rejects.toThrow(/changed while it was being rendered/);
  });

  it('reports changed sources, not the render error, when a render fails after an edit', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    // Edited, then undone; the render then fails (for the edited sources, which are gone).
    useAppStore.setState({ data: '{"broken":' });
    useAppStore.setState({ data: '{}' });
    sandbox.fail!(new Error('Unexpected end of JSON input'));
    await expect(pending).rejects.toBeInstanceOf(SourcesChangedError);
  });

  it('still reports an ordinary render error when nothing changed', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    sandbox.fail!(new Error('Unknown variable'));
    await expect(pending).rejects.toThrow(/Unknown variable/);
    await expect(pending).rejects.not.toBeInstanceOf(SourcesChangedError);
  });

  it('counts an undone data edit too', async () => {
    const pending = useAppStore.getState().renderAgreement();
    await settle();
    useAppStore.setState({ data: '{"a":1}' });
    useAppStore.setState({ data: '{}' });
    sandbox.next!({ html: '<p>A</p>' });
    await expect(pending).rejects.toThrow(/changed while it was being rendered/);
  });
});
