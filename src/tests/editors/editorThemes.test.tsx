import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import ConcertoEditor from '../../editors/ConcertoEditor';
import JSONEditor from '../../editors/JSONEditor';
import LogicMonaco from '../../editors/LogicMonaco';
import MarkdownEditor from '../../editors/MarkdownEditor';
import useAppStore from '../../store/store';

const monacoStub = vi.hoisted(() => ({
  editor: { defineTheme: vi.fn() },
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
}));

vi.mock('../../ai-assistant/autocompletion', () => ({ registerAutocompletion: vi.fn() }));
// Runs beforeMount as the real Editor does; useMonaco is still loading, so no
// editor can rely on it (or on a sibling editor) to register its theme.
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ beforeMount, theme }: { beforeMount?: (m: unknown) => void; theme?: string }) => {
    beforeMount?.(monacoStub);
    return <div data-testid="monaco" data-theme-name={theme} />;
  },
}));

const editors: [string, ReactElement][] = [
  ['Concerto', <ConcertoEditor value="" />],
  ['JSON', <JSONEditor value="{}" />],
  ['read-only JSON', <JSONEditor id="response" value="{}" readOnly />],
  ['Logic', <LogicMonaco />],
  ['Markdown', <MarkdownEditor value="" />],
];

describe.each(editors)('%s editor themes', (_label, editor) => {
  beforeEach(() => {
    monacoStub.editor.defineTheme.mockClear();
  });

  it.each([
    ['darkTheme', '#121212', '#ffffff'],
    ['lightTheme', '#ffffff', '#121212'],
  ])('registers both themes itself and selects %s', async (themeName, backgroundColor, textColor) => {
    useAppStore.setState({ backgroundColor, textColor });

    const { findByTestId } = render(editor);

    expect(await findByTestId('monaco')).toHaveAttribute('data-theme-name', themeName);
    // Both keep their own colors, whichever mode is on when the editor mounts.
    const registered = Object.fromEntries(monacoStub.editor.defineTheme.mock.calls as [string, unknown][]);
    expect(registered).toMatchObject({
      lightTheme: { base: 'vs', colors: { 'editor.background': '#ffffff', 'editor.foreground': '#121212' } },
      darkTheme: { base: 'vs-dark', colors: { 'editor.background': '#121212', 'editor.foreground': '#ffffff' } },
    });
  });
});
