import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsModal from '../../components/SettingsModal';

// Shared mocks so tests can assert on calls made by the component
const mocks = vi.hoisted(() => ({
  setDesignV2Enabled: vi.fn(),
}));

// Mock the store - use inline functions to avoid hoisting issues
vi.mock('../../store/store', () => {
  return {
    default: vi.fn((selector) => selector({
      isSettingsOpen: true,
      setSettingsOpen: vi.fn(),
      showLineNumbers: true,
      setShowLineNumbers: vi.fn(),
      textColor: '#121212',
      backgroundColor: '#ffffff',
      toggleDarkMode: vi.fn(),
      keyProtectionLevel: 'none',
      setKeyProtectionLevel: vi.fn(),
      isDesignV2Enabled: false,
      setDesignV2Enabled: mocks.setDesignV2Enabled,
    })),
  };
});

// Mock AIConfigSection to isolate SettingsModal tests
vi.mock('../../components/AIConfigSection', () => ({
  default: () => <div data-testid="ai-config-section">AI Configuration Content</div>,
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

  it('renders the Design v2 feature flag setting', () => {
    render(<SettingsModal />);

    expect(screen.getByText('Enable Design v2 (Work in Progress)')).toBeInTheDocument();
    const toggle = screen.getByTestId('design-v2-toggle');
    expect(toggle).not.toBeChecked();
  });

  it('Design v2 toggle calls setDesignV2Enabled with the new value', () => {
    render(<SettingsModal />);

    fireEvent.click(screen.getByTestId('design-v2-toggle'));

    expect(mocks.setDesignV2Enabled).toHaveBeenCalledWith(true, expect.anything());
  });

  it('renders divider between settings', () => {
    render(<SettingsModal />);
    
    // Ant Design Divider renders as a separator element
    const divider = document.querySelector('[role="separator"]');
    expect(divider).toBeInTheDocument();
  });

  // Collapse panel tests
  it('renders the General collapse panel header', () => {
    render(<SettingsModal />);

    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders the AI Configuration collapse panel header', () => {
    render(<SettingsModal />);

    expect(screen.getByText('AI Configuration')).toBeInTheDocument();
  });

  it('General panel is expanded by default and shows its content', () => {
    render(<SettingsModal />);

    // Dark Mode and Show Line Numbers content should be visible since General is open by default
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Show Line Numbers')).toBeInTheDocument();
  });

  it('renders AIConfigSection when AI Configuration panel is opened', () => {
    render(<SettingsModal />);

    // Click the AI Configuration panel header to expand it
    const aiPanelHeader = screen.getByText('AI Configuration');
    fireEvent.click(aiPanelHeader);

    expect(screen.getByTestId('ai-config-section')).toBeInTheDocument();
    expect(screen.getByText('AI Configuration Content')).toBeInTheDocument();
  });
});
