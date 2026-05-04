import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIConfigSection from '../../components/AIConfigSection';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSetKeyProtectionLevel = vi.fn();
const mockSetAIConfig = vi.fn();

vi.mock('../../store/store', () => {
  const store = vi.fn((selector: (state: object) => unknown) =>
    selector({
      backgroundColor: '#ffffff',
      keyProtectionLevel: null,
      setKeyProtectionLevel: mockSetKeyProtectionLevel,
    })
  );
  // expose getState for handleSave / handleReset
  (store as unknown as { getState: () => object }).getState = () => ({
    aiConfig: null,
    setAIConfig: mockSetAIConfig,
  });
  return { default: store };
});

vi.mock('../../utils/secureKeyStorage', () => ({
  isWebAuthnPRFSupported: vi.fn().mockResolvedValue(false),
  encryptAndStoreApiKey: vi.fn().mockResolvedValue(true),
  loadAndDecryptApiKey: vi.fn().mockResolvedValue(null),
  clearStoredKey: vi.fn(),
}));

// Bypass the 1-second debounce so model-fetch effects fire synchronously in tests
vi.mock('use-debounce', () => ({
  useDebounce: (value: unknown) => [value],
}));

// Mock antd Select to use a native <select> for simpler test interactions
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;

  interface NativeSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    id?: string;
    style?: React.CSSProperties;
    notFoundContent?: React.ReactNode;
  }

  const NativeSelect = ({
    value,
    onChange,
    placeholder,
    options,
    id,
    style,
    notFoundContent: _notFoundContent,
  }: NativeSelectProps) => (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      style={style}
    >
      <option value="">{placeholder}</option>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  return { ...actual, Select: NativeSelect };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

import {
  isWebAuthnPRFSupported,
  encryptAndStoreApiKey,
  loadAndDecryptApiKey,
  clearStoredKey,
} from '../../utils/secureKeyStorage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/** Build a minimal fetch mock that returns a list of models.
 *  - `format: 'openai'` (default) wraps models as `{ data: [{ id }] }`
 *  - `format: 'ollama'` wraps models as `{ models: [{ name }] }`
 */
function makeFetchMock(models: string[], format: 'openai' | 'ollama' = 'openai') {
  const body =
    format === 'ollama'
      ? { models: models.map((name) => ({ name })) }
      : { data: models.map((id) => ({ id })) };
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AIConfigSection', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    } as unknown as Response);
    vi.clearAllMocks();
    // Re-apply default mock implementations after clearAllMocks
    vi.mocked(isWebAuthnPRFSupported).mockResolvedValue(false);
    vi.mocked(loadAndDecryptApiKey).mockResolvedValue(null);
    vi.mocked(encryptAndStoreApiKey).mockResolvedValue(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders provider select, model select, and action buttons without an API key field', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter API key')).not.toBeInTheDocument();
    expect(screen.getByText('Model Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Configuration/i })).toBeInTheDocument();
  });

  it('save button is disabled when no provider or model is selected', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    const saveBtn = screen.getByRole('button', { name: /Save Configuration/i });
    expect(saveBtn).toBeDisabled();
  });

  // ── Provider selection impacts required fields ─────────────────────────────

  it('does not expose custom API endpoint input for openai-compatible provider', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    expect(screen.queryByPlaceholderText('https://your-api-endpoint/v1')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'openai-compatible' },
      });
    });

    expect(screen.queryByPlaceholderText('https://your-api-endpoint/v1')).not.toBeInTheDocument();
    expect(screen.getByText(/Provider credentials are managed by the server/i)).toBeInTheDocument();
  });

  it('shows server-managed credential message for hosted providers', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), { target: { value: 'openai' } });
    });

    expect(screen.getByText(/Provider credentials are managed by the server/i)).toBeInTheDocument();
  });

  // ── Ollama-specific path ───────────────────────────────────────────────────

  it('shows Ollama-specific hint text when Ollama provider is selected', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'ollama' },
      });
    });

    expect(screen.getByText(/OLLAMA_ORIGINS/)).toBeInTheDocument();
  });

  it('save button remains disabled for Ollama when no model is selected', async () => {
    global.fetch = makeFetchMock([], 'ollama');

    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'ollama' },
      });
    });

    // No model selected yet → save still disabled
    expect(screen.getByRole('button', { name: /Save Configuration/i })).toBeDisabled();
  });

  // ── localStorage loading on mount ─────────────────────────────────────────

  it('loads saved provider from localStorage on mount', async () => {
    localStorageMock.setItem('aiProvider', 'openai');
    localStorageMock.setItem('aiModel', 'gpt-4');
    // No fetch needed — models aren't listed yet; we just check the provider select value
    global.fetch = makeFetchMock([]);

    await act(async () => {
      render(<AIConfigSection />);
    });

    // The provider <select> should have its value set to 'openai'
    await waitFor(() => {
      const [providerSelect] = screen.getAllByRole('combobox');
      expect(providerSelect).toHaveValue('openai');
    });
  });

  it('does not load browser-stored API keys in server proxy mode', async () => {
    vi.mocked(loadAndDecryptApiKey).mockResolvedValue({
      apiKey: 'legacy-key',
      protectionLevel: 'legacy-plaintext',
    });

    await act(async () => {
      render(<AIConfigSection />);
    });

    expect(loadAndDecryptApiKey).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Enter API key')).not.toBeInTheDocument();
    expect(screen.queryByText(/stored unencrypted/i)).not.toBeInTheDocument();
  });

  // ── Save persistence ───────────────────────────────────────────────────────

  it('persists provider and model to localStorage on save', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: ['gpt-4', 'gpt-4o'] }),
    } as unknown as Response);

    await act(async () => {
      render(<AIConfigSection />);
    });

    // Select provider
    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'openai' },
      });
    });

    // Wait for models to be populated in the select, then choose one
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'gpt-4' })).toBeInTheDocument();
    });

    await act(async () => {
      const [, modelSelect] = screen.getAllByRole('combobox');
      fireEvent.change(modelSelect, {
        target: { value: 'gpt-4' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Configuration/i }));
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('aiProvider', 'openai');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('aiModel', 'gpt-4');
    });
  });

  it('removes aiCustomEndpoint from localStorage when provider is not openai-compatible', async () => {
    localStorageMock.setItem('aiCustomEndpoint', 'https://old-endpoint/v1');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: ['gpt-4'] }),
    } as unknown as Response);

    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'openai' },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'gpt-4' })).toBeInTheDocument();
    });

    await act(async () => {
      const [, modelSelect] = screen.getAllByRole('combobox');
      fireEvent.change(modelSelect, {
        target: { value: 'gpt-4' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Configuration/i }));
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('aiCustomEndpoint');
    });
  });

  it('calls onSaveSuccess callback after saving with Ollama', async () => {
    const onSaveSuccess = vi.fn();
    global.fetch = makeFetchMock(['tinyllama'], 'ollama');

    await act(async () => {
      render(<AIConfigSection onSaveSuccess={onSaveSuccess} />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'ollama' },
      });
    });

    // Wait for Ollama models to be fetched
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'tinyllama' })).toBeInTheDocument();
    });

    await act(async () => {
      const [, modelSelect] = screen.getAllByRole('combobox');
      fireEvent.change(modelSelect, {
        target: { value: 'tinyllama' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Configuration/i }));
    });

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });
  });

  // ── Reset clears state ─────────────────────────────────────────────────────

  it('clears localStorage and resets form state on confirmed reset', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorageMock.setItem('aiProvider', 'openai');
    localStorageMock.setItem('aiModel', 'gpt-4');

    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Reset Configuration/i }));
    });

    expect(clearStoredKey).toHaveBeenCalled();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('aiProvider');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('aiModel');
    expect(mockSetAIConfig).toHaveBeenCalledWith(null);
  });

  it('does NOT clear state when reset is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorageMock.setItem('aiProvider', 'openai');

    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Reset Configuration/i }));
    });

    expect(clearStoredKey).not.toHaveBeenCalled();
    expect(mockSetAIConfig).not.toHaveBeenCalled();
  });

  // ── Server proxy handling ─────────────────────────────────────────────────

  it('uses server-managed credentials when saving hosted providers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: ['gpt-4'] }),
    } as unknown as Response);

    await act(async () => {
      render(<AIConfigSection />);
    });

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Select a provider'), {
        target: { value: 'openai' },
      });
    });

    expect(screen.queryByPlaceholderText('Enter API key')).not.toBeInTheDocument();
    expect(screen.getByText(/Provider credentials are managed by the server/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'gpt-4' })).toBeInTheDocument();
    });

    await act(async () => {
      const [, modelSelect] = screen.getAllByRole('combobox');
      fireEvent.change(modelSelect, {
        target: { value: 'gpt-4' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Configuration/i }));
    });

    await waitFor(() => {
      expect(encryptAndStoreApiKey).not.toHaveBeenCalled();
      expect(clearStoredKey).toHaveBeenCalled();
      expect(mockSetAIConfig).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'openai', model: 'gpt-4', apiKey: '' })
      );
    });
  });

  // ── Advanced Settings toggle ───────────────────────────────────────────────

  it('shows advanced settings section when toggle is clicked', async () => {
    await act(async () => {
      render(<AIConfigSection />);
    });

    expect(screen.queryByText('Max Tokens')).not.toBeInTheDocument();

    const advancedBtn = screen.getByRole('button', { name: /Advanced Settings/i });
    await act(async () => {
      fireEvent.click(advancedBtn);
    });

    expect(screen.getByText('Max Tokens')).toBeInTheDocument();
    expect(screen.getByText('Show Full Prompts in Chat History')).toBeInTheDocument();
  });
});
