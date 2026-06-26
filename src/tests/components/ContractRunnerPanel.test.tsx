import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContractRunnerPanel from '../../components/ContractRunnerPanel';
import useAppStore from '../../store/store';

// Mock the store
vi.mock('../../store/store', () => {
  return {
    default: vi.fn(),
  };
});

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
    (useAppStore as any).mockImplementation((selector: any) => 
      selector({ backgroundColor: '#ffffff', textColor: '#000000' })
    );

    render(<ContractRunnerPanel />);
    
    // Check main panel texts
    expect(screen.getByText('Request Editor Coming Soon...')).toBeInTheDocument();
    
    // Check header text
    expect(screen.getByText('Request')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /init contract/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send request/i })).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole('tab', { name: /response/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /state/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /events/i })).toBeInTheDocument();
    
    // Default tab content
    expect(screen.getByText('Response Output Coming Soon...')).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    (useAppStore as any).mockImplementation((selector: any) => 
      selector({ backgroundColor: '#1e1e1e', textColor: '#ffffff' })
    );

    render(<ContractRunnerPanel />);
    
    expect(screen.getByText('Request Editor Coming Soon...')).toBeInTheDocument();
  });
});
