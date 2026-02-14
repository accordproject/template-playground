import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsModal from '../../components/SettingsModal';

// Mock the store - use inline functions to avoid hoisting issues
// Mock the store - use inline functions to avoid hoisting issues
vi.mock('../../store/store', async () => {
  const actual = await vi.importActual('../../store/store');
  type AppState = import('../../store/store').AppState;
  return {
    ...actual,
    default: vi.fn((selector: (state: AppState) => unknown) => selector({
      isSettingsOpen: true,
      setSettingsOpen: vi.fn(),
      showLineNumbers: true,
      setShowLineNumbers: vi.fn(),
      textColor: '#121212',
      backgroundColor: '#ffffff',
      toggleDarkMode: vi.fn(),
    } as unknown as AppState)),
  };
});

// Mock react-dark-mode-toggle
vi.mock('react-dark-mode-toggle', () => ({
  default: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button 
      data-testid="dark-mode-toggle" 
      onClick={onChange}
      aria-pressed={checked}
    >
      Dark Mode Toggle
    </button>
  ),
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with title when open', () => {
    render(<SettingsModal />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the Dark Mode setting', () => {
    render(<SettingsModal />);
    
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Toggle between light and dark theme')).toBeInTheDocument();
  });

  it('renders the Show Line Numbers setting', () => {
    render(<SettingsModal />);
    
    expect(screen.getByText('Show Line Numbers')).toBeInTheDocument();
    expect(screen.getByText('Display line numbers in code editors')).toBeInTheDocument();
  });

  it('renders the dark mode toggle button', () => {
    render(<SettingsModal />);
    
    const toggle = screen.getByTestId('dark-mode-toggle');
    expect(toggle).toBeInTheDocument();
  });

  it('renders the line numbers toggle switch', () => {
    render(<SettingsModal />);
    
    const toggle = screen.getByRole('switch', { name: /toggle line numbers/i });
    expect(toggle).toBeInTheDocument();
  });

  it('line numbers toggle is checked when showLineNumbers is true', () => {
    render(<SettingsModal />);
    
    const toggle = screen.getByRole('switch', { name: /toggle line numbers/i });
    expect(toggle).toBeChecked();
  });

  it('renders divider between settings', () => {
    render(<SettingsModal />);
    
    const divider = document.querySelector('hr');
    expect(divider).toBeInTheDocument();
  });
});
