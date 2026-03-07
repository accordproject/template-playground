import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIChatPanel } from '../../components/AIChatPanel';
import { MemoryRouter } from 'react-router-dom';
import type { ChatState, Message } from '../../types/components/AIAssistant.types';

// Mock the chat relay module
vi.mock('../../ai-assistant/chatRelay', () => ({
  sendMessage: vi.fn(),
  stopMessage: vi.fn(),
}));

// Mock window.matchMedia for responsive components
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const createMockMessage = (
  id: string,
  role: 'system' | 'user' | 'assistant',
  content: string
): Message => ({
  id,
  role,
  content,
  timestamp: new Date(),
});

const renderAIChatPanel = () => {
  return render(
    <MemoryRouter>
      <AIChatPanel />
    </MemoryRouter>
  );
};

describe('AIChatPanel', () => {
  let mockStoreState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock store state
    mockStoreState = {
      chatState: {
        messages: [],
        isLoading: false,
        error: null,
      } as ChatState,
      resetChat: vi.fn(),
      aiConfig: null,
      setAIConfig: vi.fn(),
      setAIConfigOpen: vi.fn(),
      setAIChatOpen: vi.fn(),
      textColor: '#121212',
      backgroundColor: '#ffffff',
      editorValue: '',
      editorModelCto: '',
      editorAgreementData: '',
    };

    // Mock the store
    vi.doMock('../../store/store', () => ({
      default: vi.fn((selector) => selector(mockStoreState)),
    }));
  });

  describe('Loading placeholder behavior', () => {
    it('should render loading spinner when isLoading is true and last assistant message has empty/whitespace content', async () => {
      // Setup: Last message is assistant with whitespace-only content and loading state
      const useAppStore = (await import('../../store/store')).default;
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'Hello'),
          createMockMessage('2', 'assistant', ' '), // Whitespace-only placeholder
        ],
        isLoading: true,
        error: null,
      };

      renderAIChatPanel();

      // Verify spinner and "Thinking" text are visible
      expect(screen.getByText('Thinking')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Verify the loading indicator has proper accessibility attributes
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should render message row even when content is empty during loading', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'Hello'),
          createMockMessage('2', 'assistant', '   '), // Whitespace placeholder
        ],
        isLoading: true,
        error: null,
      };

      renderAIChatPanel();

      // The assistant message box should render with "Assistant" label
      expect(screen.getByText('Assistant')).toBeInTheDocument();
      
      // Spinner should be visible
      expect(screen.getByText('Thinking')).toBeInTheDocument();
    });

    it('should filter out empty/whitespace messages when isLoading is false', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'First question'),
          createMockMessage('2', 'assistant', '  '), // Old placeholder - should be filtered
          createMockMessage('3', 'user', 'Second question'),
          createMockMessage('4', 'assistant', 'Actual response'),
        ],
        isLoading: false,
        error: null,
      };

      renderAIChatPanel();

      // Only one assistant message should be visible (the one with content)
      const assistantLabels = screen.getAllByText('Assistant');
      expect(assistantLabels).toHaveLength(1);
      
      expect(screen.getByText('Actual response')).toBeInTheDocument();
    });

    it('should not render loading spinner when isLoading is false', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'Hello'),
          createMockMessage('2', 'assistant', 'Complete response'),
        ],
        isLoading: false,
        error: null,
      };

      renderAIChatPanel();

      expect(screen.queryByText('Thinking')).not.toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should only show spinner on the last assistant message during loading', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'First'),
          createMockMessage('2', 'assistant', 'First response'),
          createMockMessage('3', 'user', 'Second'),
          createMockMessage('4', 'assistant', ' '), // Only this should have spinner
        ],
        isLoading: true,
        error: null,
      };

      renderAIChatPanel();

      // Should have exactly one "Thinking" indicator
      const thinkingElements = screen.getAllByText('Thinking');
      expect(thinkingElements).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on loading spinner container', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'Hello'),
          createMockMessage('2', 'assistant', ' '),
        ],
        isLoading: true,
        error: null,
      };

      renderAIChatPanel();

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText('Thinking')).toBeInTheDocument();
    });

    it('should have aria-hidden and focusable attributes on SVG spinner', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'Hello'),
          createMockMessage('2', 'assistant', ' '),
        ],
        isLoading: true,
        error: null,
      };

      renderAIChatPanel();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
      expect(spinner).toHaveAttribute('focusable', 'false');
    });
  });

  describe('Message rendering', () => {
    it('should render welcome message when no messages exist', () => {
      mockStoreState.chatState = {
        messages: [],
        isLoading: false,
        error: null,
      };

      renderAIChatPanel();

      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    });

    it('should not render system messages', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'system', 'System instruction'),
          createMockMessage('2', 'user', 'User message'),
        ],
        isLoading: false,
        error: null,
      };

      renderAIChatPanel();

      expect(screen.queryByText('System instruction')).not.toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
    });

    it('should render user and assistant messages correctly', async () => {
      mockStoreState.chatState = {
        messages: [
          createMockMessage('1', 'user', 'What is TemplateMark?'),
          createMockMessage('2', 'assistant', 'TemplateMark is a format...'),
        ],
        isLoading: false,
        error: null,
      };

      renderAIChatPanel();

      expect(screen.getByText('What is TemplateMark?')).toBeInTheDocument();
      expect(screen.getByText('TemplateMark is a format...')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });
  });
});
