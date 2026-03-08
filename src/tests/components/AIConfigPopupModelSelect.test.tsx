import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIConfigPopup from '../../components/AIConfigPopup';

// Mock the store
vi.mock('../../store/store', () => {
    return {
        default: vi.fn((selector) => selector({
            backgroundColor: '#ffffff',
        })),
    };
});

describe('AIConfigPopup - Model Selection', () => {
    const mockOnClose = vi.fn();


    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should show model dropdown when a provider is selected', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        // Select OpenAI provider
        const providerSelect = screen.getByDisplayValue('Select a provider');
        fireEvent.change(providerSelect, { target: { value: 'openai' } });

        // Model dropdown should appear with "Select a model" default
        expect(screen.getByDisplayValue('Select a model')).toBeInTheDocument();
    });

    it('should populate model dropdown with provider-specific models', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');
        fireEvent.change(providerSelect, { target: { value: 'openai' } });

        // Check that OpenAI models appear
        expect(screen.getByText('GPT-5.2')).toBeInTheDocument();
        expect(screen.getByText('GPT-5 Mini')).toBeInTheDocument();
        expect(screen.getByText('o3')).toBeInTheDocument();
    });

    it('should show different models when switching providers', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');

        // Select Anthropic
        fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
        expect(screen.getByText('Claude Opus 4.6')).toBeInTheDocument();

        // Switch to Google
        fireEvent.change(providerSelect, { target: { value: 'google' } });
        expect(screen.getByText('Gemini 2.5 Pro')).toBeInTheDocument();
    });

    it('should reset model when provider changes', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');

        // Select OpenAI and pick a model
        fireEvent.change(providerSelect, { target: { value: 'openai' } });
        const modelSelect = screen.getByDisplayValue('Select a model');
        fireEvent.change(modelSelect, { target: { value: 'gpt-5.2' } });
        expect(screen.getByDisplayValue('GPT-5.2')).toBeInTheDocument();

        // Switch provider — model should reset
        fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
        expect(screen.getByDisplayValue('Select a model')).toBeInTheDocument();
    });

    it('should show Custom option and text input when Custom is selected', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');
        fireEvent.change(providerSelect, { target: { value: 'openai' } });

        // Select "Custom..."
        const modelSelect = screen.getByDisplayValue('Select a model');
        fireEvent.change(modelSelect, { target: { value: '__custom__' } });

        // Custom text input should appear
        expect(screen.getByPlaceholderText('Enter custom model name')).toBeInTheDocument();
    });

    it('should show text input instead of dropdown for openai-compatible provider', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');
        fireEvent.change(providerSelect, { target: { value: 'openai-compatible' } });

        // Should show plain text input, not a dropdown
        expect(screen.getByPlaceholderText('Enter model name')).toBeInTheDocument();
    });

    it('should include Custom option in the model dropdown', () => {
        render(<AIConfigPopup isOpen={true} onClose={mockOnClose} />);

        const providerSelect = screen.getByDisplayValue('Select a provider');
        fireEvent.change(providerSelect, { target: { value: 'google' } });

        expect(screen.getByText('Custom...')).toBeInTheDocument();
    });
});
