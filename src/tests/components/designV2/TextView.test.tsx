import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextView } from '../../../components/designV2/TextView';
import { HELP_RAIL, TEXT } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import * as counter from '../../../samples/counterLogic';

/*
 * Monaco is replaced by a plain div: the view under test is the chrome around
 * the editor (header, toolbar, status bar, help rail) and its wiring to the
 * app store, not the editor itself.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

describe('TextView', () => {
  beforeEach(() => {
    useDesignV2Store.setState({ helpRailOpen: true });
    useAppStore.setState({ editorValue: counter.TEMPLATE, templateMarkdown: counter.TEMPLATE, error: undefined });
  });

  const pane = () => within(screen.getByRole('region', { name: TEXT.paneLabel }));

  it('shows text.md in the markdown editor with the formatting toolbar', async () => {
    render(<TextView />);
    expect(pane().getByText(TEXT.file)).toBeInTheDocument();
    expect(pane().getByText(TEXT.badge)).toBeInTheDocument();
    const toolbar = within(screen.getByRole('toolbar', { name: TEXT.toolbarLabel }));
    for (const button of TEXT.toolbar) {
      expect(toolbar.getByRole('button', { name: button.title })).toBeInTheDocument();
    }
    expect(await pane().findByTestId('monaco-markdown')).toBeInTheDocument();
  });

  it('mirrors the store error in the status bar and the checklist', () => {
    const { unmount } = render(<TextView />);
    expect(pane().getByText(TEXT.ok)).toBeInTheDocument();
    expect(within(screen.getByRole('complementary')).getByText(HELP_RAIL.count(1, 1))).toBeInTheDocument();
    unmount();

    useAppStore.setState({ error: 'Error: Unknown variable {{ownerr}}' });
    render(<TextView />);
    expect(pane().getByText(TEXT.error)).toHaveAttribute('title', 'Error: Unknown variable {{ownerr}}');
    const rail = within(screen.getByRole('complementary'));
    expect(rail.getByText(TEXT.help.checks.renders).closest('li')).toHaveClass('nd-check-error');
    expect(rail.getByText(HELP_RAIL.count(0, 1))).toBeInTheDocument();
  });

  it('fills the help rail with the "why" note, its link and the "how" steps', () => {
    render(<TextView />);
    const rail = within(screen.getByRole('complementary'));
    expect(rail.getByText(TEXT.help.why.note)).toBeInTheDocument();
    for (const link of TEXT.help.why.links) {
      expect(rail.getByRole('link', { name: `↗ ${link.label}` })).toHaveAttribute('href', link.href);
    }
    fireEvent.click(rail.getByRole('tab', { name: HELP_RAIL.tabHow }));
    for (const step of TEXT.help.how) {
      expect(rail.getByText(step)).toBeInTheDocument();
    }
  });

  it('"copy" writes the text to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<TextView />);
    fireEvent.click(pane().getByRole('button', { name: TEXT.copy }));
    expect(writeText).toHaveBeenCalledWith(counter.TEMPLATE);
  });
});
