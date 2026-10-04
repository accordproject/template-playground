import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodeSelectionMenu from '../../components/CodeSelectionMenu';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSetSettingsOpen = vi.fn();
const mockSetAIChatOpen = vi.fn();

const storeState = {
  aiConfig: {
    provider: 'google',
    model: 'gemini-pro',
    apiKey: 'test-key',
  } as Record<string, unknown> | null,
  setSettingsOpen: mockSetSettingsOpen,
  setAIChatOpen: mockSetAIChatOpen,
  editorValue: '',
  editorModelCto: '',
  editorAgreementData: '',
};

// useAppStore is called two ways in CodeSelectionMenu:
//   1. useAppStore()        — no selector, returns whole state
//   2. useAppStore(selector) — runs selector against state
vi.mock('../../store/store', () => {
  const store = vi.fn((selector?: (s: typeof storeState) => unknown) => {
    if (typeof selector === 'function') return selector(storeState);
    return storeState;
  });
  (store as unknown as { getState: () => typeof storeState }).getState = () => storeState;
  return { default: store };
});

// Control sendMessage to simulate different AI response scenarios
const mockSendMessage = vi.fn();
vi.mock('../../ai-assistant/chatRelay', () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  selectedText: 'contract Foo {}',
  position: { x: 100, y: 100 },
  onClose: vi.fn(),
  editorType: 'concerto' as const,
};

type SendMessageArgs = [
  userInput: string,
  preset: string,
  content: unknown,
  addToChat: boolean,
  editorType: string,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
];

/** Simulate sendMessage calling onError with a raw error message. */
const simulateSendMessageError = (rawErrorMessage: string) => {
  mockSendMessage.mockImplementation((...args: SendMessageArgs) => {
    const onError = args[6];
    onError(new Error(rawErrorMessage));
    return Promise.resolve();
  });
};

/** Simulate sendMessage streaming a chunk then completing. */
const simulateSendMessageSuccess = (text: string) => {
  mockSendMessage.mockImplementation((...args: SendMessageArgs) => {
    const [, , , , , onChunk, , onComplete] = args;
    onChunk(text);
    onComplete();
    return Promise.resolve();
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CodeSelectionMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onClose = vi.fn();
    storeState.aiConfig = {
      provider: 'google',
      model: 'gemini-pro',
      apiKey: 'test-key',
    };
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the Explain and Chat buttons', () => {
    render(<CodeSelectionMenu {...defaultProps} />);
    expect(screen.getByText('Explain')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  // ── Explain: loading state ─────────────────────────────────────────────────

  it('shows a loading indicator while waiting for AI response', async () => {
    mockSendMessage.mockReturnValue(new Promise(() => {})); // never resolves

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(screen.getByText('Explaining...')).toBeInTheDocument()
    );
  });

  // ── Explain: success ──────────────────────────────────────────────────────

  it('renders the AI response text after a successful explanation', async () => {
    simulateSendMessageSuccess('This is the explanation.');

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(screen.getByText('This is the explanation.')).toBeInTheDocument()
    );
  });

  // ── Explain: error — human-readable messages (fix for issue #869) ─────────

  it('displays a human-readable message for a Google nested-JSON error', async () => {
    const rawGoogleError = JSON.stringify({
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'INVALID_ARGUMENT',
      },
    });
    simulateSendMessageError(rawGoogleError);

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(
        screen.getByText('Error: API key not valid. Please pass a valid API key.')
      ).toBeInTheDocument()
    );
    // Raw JSON must NOT appear in the UI
    expect(screen.queryByText(/INVALID_ARGUMENT/)).not.toBeInTheDocument();
  });

  it('displays a human-readable message for an Anthropic prefixed-JSON error', async () => {
    const rawAnthropicError =
      'AuthenticationError: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_abc123"}';
    simulateSendMessageError(rawAnthropicError);

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(screen.getByText('Error: invalid x-api-key')).toBeInTheDocument()
    );
    // Raw JSON must NOT appear in the UI
    expect(screen.queryByText(/AuthenticationError: 401/)).not.toBeInTheDocument();
  });

  it('displays a human-readable message for a Mistral API error', async () => {
    const rawMistralError =
      'API error occurred: Status 401 Content-Type application/json; charset=utf-8 Body {"detail":"Unauthorized"}';
    simulateSendMessageError(rawMistralError);

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(screen.getByText('Error: Unauthorized')).toBeInTheDocument()
    );
  });

  it('displays a human-readable message for an OpenAI invalid-key error', async () => {
    const rawOpenAIError = JSON.stringify({
      error: {
        message: 'Incorrect API key provided',
        type: 'invalid_request_error',
        code: 'invalid_api_key',
      },
    });
    simulateSendMessageError(rawOpenAIError);

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(
        screen.getByText('Error: Incorrect API key provided')
      ).toBeInTheDocument()
    );
  });

  it('displays a plain error message unchanged when the error is not JSON', async () => {
    simulateSendMessageError('Network connection failed');

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(
        screen.getByText('Error: Network connection failed')
      ).toBeInTheDocument()
    );
  });

  it('does NOT surface raw JSON or internal error codes to the user', async () => {
    const rawGoogleError = JSON.stringify({
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'INVALID_ARGUMENT',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'API_KEY_INVALID',
          },
        ],
      },
    });
    simulateSendMessageError(rawGoogleError);

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());

    // Internal error codes and nested type paths must not be visible
    expect(screen.queryByText(/API_KEY_INVALID/)).not.toBeInTheDocument();
    expect(screen.queryByText(/type.googleapis.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/INVALID_ARGUMENT/)).not.toBeInTheDocument();
  });

  // ── Close button ──────────────────────────────────────────────────────────

  it('calls onClose when the close button is clicked on the explanation panel', async () => {
    simulateSendMessageSuccess('Some explanation');

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    await waitFor(() =>
      expect(screen.getByText('Some explanation')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByLabelText('Close explanation'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // ── No AI config ──────────────────────────────────────────────────────────

  it('opens settings modal when Explain is clicked without AI config', () => {
    storeState.aiConfig = null;

    render(<CodeSelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Explain'));

    expect(mockSetSettingsOpen).toHaveBeenCalledWith(true);
    // Should NOT attempt to call sendMessage
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
