import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ContractRunnerPanel from '../../components/ContractRunnerPanel';
import useAppStore from '../../store/store';

// Mock the store
vi.mock('../../store/store', () => {
  return {
    default: vi.fn(),
  };
});

/**
 * Minimal slice of the store the panel reads. Kept in one place so the runner's
 * engine controls and its execution buttons see a coherent state.
 */
const baseState = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  requestJson: '{}',
  setRequestJson: vi.fn(),
  executionState: '',
  executionResponse: '',
  executionEvents: '',
  isExecuting: false,
  initContract: vi.fn(),
  triggerContract: vi.fn(),
  logicTs: '',
  compiledLogicJs: null,
  llmExecutionMode: 'disabled' as const,
  setLLMExecutionMode: vi.fn(),
  isTemplateStateful: true,
  aiConfig: null,
  setSettingsOpen: vi.fn(),
  templateObject: {},
  buildTemplateFromMemory: vi.fn(),
};

type StoreSlice = typeof baseState;

/**
 * Points the mocked store at a state slice for the duration of a test.
 * @param state - the slice the panel's selectors read from
 */
const useStoreState = (state: StoreSlice) => {
  const mockedStore = useAppStore as unknown as Mock<
    [(state: StoreSlice) => unknown],
    unknown
  >;
  mockedStore.mockImplementation((selector) => selector(state));
};

describe('ContractRunnerPanel', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock matchMedia for Ant Design
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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

  it('renders correctly in light mode', () => {
    useStoreState(baseState);

    render(<ContractRunnerPanel />);
    
    // Check main panel texts
    
    // Check header text
    expect(screen.getByText('Request')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /init contract/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send request/i })).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole('tab', { name: /response/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /state/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /events/i })).toBeInTheDocument();
    // Check empty state placeholders
    expect(screen.getByText('No response generated yet.')).toBeInTheDocument();
  });

  it('drops the init step and the State tab for a stateless template', () => {
    useStoreState({ ...baseState, isTemplateStateful: false });

    render(<ContractRunnerPanel />);

    expect(screen.queryByRole('button', { name: /init contract/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /state/i })).not.toBeInTheDocument();
    // The request can still be sent — a stateless template needs no seed state.
    expect(screen.getByRole('button', { name: /send request/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /response/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /events/i })).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    useStoreState({ ...baseState, backgroundColor: '#1e1e1e', textColor: '#ffffff' });

    render(<ContractRunnerPanel />);
    expect(screen.getByText('Request')).toBeInTheDocument();
  });
});
