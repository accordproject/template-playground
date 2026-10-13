import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import CodeSelectionMenu from '../../components/CodeSelectionMenu';

vi.mock('../../ai-assistant/chatRelay', () => ({
  sendMessage: vi.fn(),
}));

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
