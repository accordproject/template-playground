import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------- Mutable store state ----------
let mockBackgroundColor = '#ffffff';
const mockToggleDarkMode = vi.fn();

vi.mock('../../store/store', () => {
    // Return a function that, when called with no selector, returns the store object.
    // When called with a selector, passes the store object through the selector.
    const useAppStore = (...args: unknown[]) => {
        const storeState = {
            backgroundColor: mockBackgroundColor,
            toggleDarkMode: mockToggleDarkMode,
        };
        if (typeof args[0] === 'function') {
            return (args[0] as (s: typeof storeState) => unknown)(storeState);
        }
        return storeState;
    };
    return { default: useAppStore };
});

// ---------- Mock react-dark-mode-toggle ----------
vi.mock('react-dark-mode-toggle', () => ({
    default: ({
        checked,
        onChange,
        size,
        className,
    }: {
        checked: boolean;
        onChange: () => void;
        size: number;
        className: string;
    }) => (
        <button
            data-testid="dark-mode-toggle"
            data-checked={checked}
            data-size={size}
            className={className}
            onClick={onChange}
        >
            Dark Mode Toggle
        </button>
    ),
}));

// ---------- Mock styled-component ----------
vi.mock('../../styles/components/ToggleDarkMode', () => ({
    ToggleDarkModeContainer: ({
        children,
        ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
        <div {...props}>{children}</div>
    ),
}));

// ---------- Import after mocks ----------
import ToggleDarkMode from '../../components/ToggleDarkMode';

// ---------- Tests ----------
describe('ToggleDarkMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBackgroundColor = '#ffffff';
        document.documentElement.removeAttribute('data-theme');
    });

    it('renders the toggle component', () => {
        render(<ToggleDarkMode />);
        expect(screen.getByTestId('toggle-dark-mode')).toBeInTheDocument();
    });

    it('initializes isDarkMode to false when backgroundColor is #ffffff', () => {
        mockBackgroundColor = '#ffffff';
        render(<ToggleDarkMode />);
        const btn = screen.getByTestId('dark-mode-toggle');
        expect(btn.getAttribute('data-checked')).toBe('false');
    });

    it('initializes isDarkMode to true when backgroundColor is #121212', () => {
        mockBackgroundColor = '#121212';
        render(<ToggleDarkMode />);
        const btn = screen.getByTestId('dark-mode-toggle');
        expect(btn.getAttribute('data-checked')).toBe('true');
    });

    it('calls toggleDarkMode when clicked', () => {
        render(<ToggleDarkMode />);
        fireEvent.click(screen.getByTestId('dark-mode-toggle'));
        expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    });

    it('sets data-theme to dark when toggled from light mode', () => {
        mockBackgroundColor = '#ffffff';
        render(<ToggleDarkMode />);
        fireEvent.click(screen.getByTestId('dark-mode-toggle'));
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('sets data-theme to light when toggled from dark mode', () => {
        mockBackgroundColor = '#121212';
        render(<ToggleDarkMode />);
        fireEvent.click(screen.getByTestId('dark-mode-toggle'));
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('updates isDarkMode when backgroundColor prop changes', () => {
        mockBackgroundColor = '#ffffff';
        const { rerender } = render(<ToggleDarkMode />);

        const btn = screen.getByTestId('dark-mode-toggle');
        expect(btn.getAttribute('data-checked')).toBe('false');

        // Simulate store change
        mockBackgroundColor = '#121212';
        rerender(<ToggleDarkMode />);

        expect(btn.getAttribute('data-checked')).toBe('true');
    });

    it('passes size={60} to the toggle', () => {
        render(<ToggleDarkMode />);
        const btn = screen.getByTestId('dark-mode-toggle');
        expect(btn.getAttribute('data-size')).toBe('60');
    });

    it('applies className dark-mode-toggle', () => {
        render(<ToggleDarkMode />);
        const btn = screen.getByTestId('dark-mode-toggle');
        expect(btn.className).toBe('dark-mode-toggle');
    });

    it('handles multiple sequential toggles correctly', () => {
        mockBackgroundColor = '#ffffff';
        render(<ToggleDarkMode />);
        const btn = screen.getByTestId('dark-mode-toggle');

        // First click: light → dark
        fireEvent.click(btn);
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);

        // Second click: dark → light
        fireEvent.click(btn);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        expect(mockToggleDarkMode).toHaveBeenCalledTimes(2);
    });
});
