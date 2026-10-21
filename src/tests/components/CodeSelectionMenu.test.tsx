import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type * as monaco from 'monaco-editor';
import CodeSelectionMenu, { useCodeSelection } from '../../components/CodeSelectionMenu';

vi.mock('../../ai-assistant/chatRelay', () => ({
  sendMessage: vi.fn(),
}));

const rect = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top }) as DOMRect;

// editor placed away from the viewport origin, with a selection at the given
// editor-relative position (as returned by getScrolledVisiblePosition)
const makeEditor = (left: number, top: number) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'editorwrapper';
  const editorNode = document.createElement('div');
  wrapper.appendChild(editorNode);
  wrapper.getBoundingClientRect = () => rect(80, 270, 1000, 760);
  editorNode.getBoundingClientRect = () => rect(80, 270, 1000, 760);
  return {
    getSelection: () => ({ isEmpty: () => false, getStartPosition: () => ({}) }),
    getModel: () => ({ getValueInRange: () => 'selected code' }),
    getScrolledVisiblePosition: () => ({ left, top, height: 18 }),
    getDomNode: () => editorNode,
  } as unknown as monaco.editor.IStandaloneCodeEditor;
};

const SelectionHarness = ({ editor }: { editor: monaco.editor.IStandaloneCodeEditor }) => {
  const { handleSelection, MenuComponent } = useCodeSelection('markdown');
  return (
    <>
      <button onClick={() => handleSelection(editor)}>select</button>
      {MenuComponent}
    </>
  );
};

const menuForSelection = (editor: monaco.editor.IStandaloneCodeEditor) => {
  render(<SelectionHarness editor={editor} />);
  fireEvent.click(screen.getByRole('button', { name: 'select' }));
  return screen.getByRole('button', { name: 'Explain' }).parentElement;
};

it('follows the selection horizontally while staying within the viewport', () => {
  const props = {
    selectedText: 'selected code',
    onClose: vi.fn(),
    editorType: 'markdown' as const,
  };
  const { rerender } = render(
    <CodeSelectionMenu {...props} position={{ x: 320, y: 100 }} />
  );
  const menu = screen.getByRole('button', { name: 'Explain' }).parentElement;

  expect(menu).toHaveStyle({ left: '320px', top: '100px' });

  rerender(<CodeSelectionMenu {...props} position={{ x: 500, y: 100 }} />);
  expect(menu).toHaveStyle({ left: '500px', top: '100px' });

  rerender(<CodeSelectionMenu {...props} position={{ x: -20, y: 100 }} />);
  expect(menu).toHaveStyle({ left: '10px' });

  rerender(
    <CodeSelectionMenu {...props} position={{ x: window.innerWidth, y: 100 }} />
  );
  expect(menu).toHaveStyle({ left: `${window.innerWidth - 150}px` });
});

it('positions the menu below the start of the selection in viewport coordinates', () => {
  const menu = menuForSelection(makeEditor(400, 100));

  expect(menu).toHaveStyle({ left: '480px', top: '388px' });
});

it('keeps the menu inside the editor for a selection near its edge', () => {
  const menu = menuForSelection(makeEditor(900, 480));

  expect(menu).toHaveStyle({ left: '850px', top: '710px' });
});
