import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodeSelectionMenu from '../../components/CodeSelectionMenu';

const mockState = vi.hoisted(() => ({
  backgroundColor: '#ffffff',
  aiConfig: null as unknown,
  setSettingsOpen: vi.fn(),
  setAIChatOpen: vi.fn(),
  editorValue: '',
  editorModelCto: '',
  editorAgreementData: '',
}));

vi.mock('../../store/store', () => ({
  default: vi.fn((selector?: (state: typeof mockState) => unknown) =>
    selector ? selector(mockState) : mockState
  ),
}));

vi.mock('../../ai-assistant/chatRelay', () => ({
  sendMessage: vi.fn(),
}));

describe('CodeSelectionMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.backgroundColor = '#ffffff';
  });

  it('renders Explain and Chat buttons in light mode without Tailwind .twp classes', () => {
    render(
      <CodeSelectionMenu
        selectedText="const a = 1;"
        position={{ x: 100, y: 100 }}
        onClose={vi.fn()}
        editorType="markdown"
      />
    );

    const menu = screen.getByTestId('code-selection-menu');
    expect(menu).not.toHaveClass('twp');
    expect(screen.getByRole('button', { name: /explain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();

    const card = menu.querySelector('.ant-card');
    expect(card).toBeInTheDocument();
    expect(getComputedStyle(card as Element).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('applies Ant Design dark theme tokens when backgroundColor is #121212', () => {
    mockState.backgroundColor = '#121212';

    render(
      <CodeSelectionMenu
        selectedText="const a = 1;"
        position={{ x: 100, y: 100 }}
        onClose={vi.fn()}
        editorType="markdown"
      />
    );

    const menu = screen.getByTestId('code-selection-menu');
    const card = menu.querySelector('.ant-card');
    expect(card).toBeInTheDocument();
    expect(getComputedStyle(card as Element).backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});
