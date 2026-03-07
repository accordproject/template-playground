import { useState, useEffect, useMemo, useCallback } from 'react';
import { AIConfig, AIConfigPopupProps, KeyProtectionLevel } from '../types/components/AIAssistant.types';
import { useDebounce } from 'use-debounce';
import useAppStore from '../store/store';
import {
  isWebAuthnPRFSupported,
  encryptAndStoreApiKey,
  loadAndDecryptApiKey,
  clearStoredKey,
} from '../utils/secureKeyStorage';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const AIConfigPopup = ({ isOpen, onClose }: AIConfigPopupProps) => {
  const { backgroundColor, keyProtectionLevel, setKeyProtectionLevel } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    keyProtectionLevel: state.keyProtectionLevel,
    setKeyProtectionLevel: state.setKeyProtectionLevel,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      overlay: 'fixed inset-0 bg-black bg-opacity-50',
      container: isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900',

      headerText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
      closeButton: isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',

      label: isDarkMode ? 'text-gray-200' : 'text-gray-700',
      input: isDarkMode
        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
      select: isDarkMode
        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500'
        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
      helpText: isDarkMode ? 'text-gray-400' : 'text-gray-500',

      advancedContainer: isDarkMode ? 'border-gray-600' : 'border-gray-200',
      advancedButton: isDarkMode ? 'text-gray-200' : 'text-gray-700',
      advancedContent: isDarkMode ? 'border-gray-600' : 'border-gray-200',
      divider: isDarkMode ? 'border-gray-600' : 'border-gray-200',

      checkbox: isDarkMode
        ? 'text-blue-400 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800'
        : 'text-blue-500 bg-white border-gray-300 focus:ring-blue-400 focus:ring-offset-white',
      checkboxLabel: isDarkMode ? 'text-gray-200' : 'text-gray-700',

      saveButton: {
        enabled: 'bg-blue-500 text-white hover:bg-blue-600',
        disabled: isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-400 text-gray-200'
      },
      resetButton: isDarkMode
        ? 'border-red-600 text-red-400 hover:bg-red-900 hover:border-red-500'
        : 'border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600'
    };
  }, [backgroundColor]);

  const [provider, setProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [maxTokens, setMaxTokens] = useState<string>('');

  const [showFullPrompt, setShowFullPrompt] = useState<boolean>(false);
  const [enableCodeSelectionMenu, setEnableCodeSelectionMenu] = useState<boolean>(true);
  const [enableInlineSuggestions, setEnableInlineSuggestions] = useState<boolean>(true);
  const [webauthnAvailable, setWebauthnAvailable] = useState<boolean>(false);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [securityMessage, setSecurityMessage] = useState<string>('');

  // Check WebAuthn PRF support on mount
  useEffect(() => {
    isWebAuthnPRFSupported().then(setWebauthnAvailable).catch(() => setWebauthnAvailable(false));
  }, []);

  // Load config when popup opens
  const loadConfig = useCallback(async () => {
    const savedProvider = localStorage.getItem('aiProvider');
    const savedModel = localStorage.getItem('aiModel');
    const savedCustomEndpoint = localStorage.getItem('aiCustomEndpoint');
    const savedMaxTokens = localStorage.getItem('aiResMaxTokens');

    const savedShowFullPrompt = localStorage.getItem('aiShowFullPrompt') === 'true';
    const savedEnableCodeSelection = localStorage.getItem('aiEnableCodeSelectionMenu') !== 'false';
    const savedEnableInlineSuggestions = localStorage.getItem('aiEnableInlineSuggestions') !== 'false';

    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
    if (savedCustomEndpoint) setCustomEndpoint(savedCustomEndpoint);
    if (savedMaxTokens) setMaxTokens(savedMaxTokens);

    setShowFullPrompt(savedShowFullPrompt);
    setEnableCodeSelectionMenu(savedEnableCodeSelection);
    setEnableInlineSuggestions(savedEnableInlineSuggestions);

    // Load API key: try WebAuthn-encrypted first, then in-memory (Zustand), then legacy plaintext
    const storedConfig = useAppStore.getState().aiConfig;
    if (storedConfig?.apiKey) {
      // Key is already in memory (loaded previously this session)
      setApiKey(storedConfig.apiKey);
    } else {
      // Try to load from encrypted storage or legacy
      try {
        const result = await loadAndDecryptApiKey();
        if (result) {
          setApiKey(result.apiKey);
          setKeyProtectionLevel(result.protectionLevel);
          if (result.protectionLevel === 'legacy-plaintext') {
            setSecurityMessage('\u26a0\ufe0f Your API key was stored unencrypted. Save again to protect it with WebAuthn.');
          }
        }
      } catch {
        // Decryption failed (e.g. user cancelled WebAuthn prompt)
        setSecurityMessage('Could not unlock stored API key. Please re-enter it.');
      }
    }
  }, [setKeyProtectionLevel]);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [debouncedApiKey] = useDebounce(apiKey, 1000);

  useEffect(() => {
    if (isOpen) {
      setSecurityMessage('');
      loadConfig().catch(console.warn);
    }
  }, [isOpen, loadConfig]);

  useEffect(() => {
	setAvailableModels([]);
    if (!provider || !debouncedApiKey) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchModels = async () => {
      try {
        switch (provider) {
          case 'openai':
		  case 'openai-compatible':
			if (!apiKey) return;

			let endpoint = provider === 'openai-compatible' ? customEndpoint : 'https://api.openai.com/v1';
			if (!endpoint) return;
			endpoint = endpoint.replace(/\/$/, '');
			const url = `${endpoint}/models`;

			const res = await fetch(url, {
			  headers: { Authorization: `Bearer ${apiKey}` },
		  	  signal,
			});

			if (!res.ok) {
			  console.error(`Fetch error (${res.status}): ${res.statusText}`);
			  return;
			}

			const data = await res.json();
			if (!signal.aborted) {
			  let models = data.data?.map((m: any) => m.id) || []
			  setAvailableModels(models);
			  setModel(prev => models.includes(prev) ? prev : '');
			}
			break;

          case 'anthropic':
			if (!apiKey) return;
			{
			  const res = await fetch('https://api.anthropic.com/v1/models', {
			    headers: {
				  'x-api-key': apiKey,
				  'anthropic-version': '2023-06-01',
				  'anthropic-dangerous-direct-browser-access': 'true',
				},
				signal,
			  });
			  if (!res.ok) {
				console.error(`Fetch error (${res.status}): ${res.statusText}`);
				return;
			  }
			  const data = await res.json();
			  if (!signal.aborted) {
				let models = data.data?.map((m: any) => m.id) || [];
				setAvailableModels(models);
			  	setModel(prev => models.includes(prev) ? prev : '');
			  }
			}
			break;

          case 'google':
            if (!apiKey) return;
            {
              const res = await fetch('https://generativelanguage.googleapis.com/v1beta2/models', {
                headers: { 'x-goog-api-key': apiKey },
                signal,
              });
			  if (!res.ok) {
				console.error(`Fetch error (${res.status}): ${res.statusText}`);
				return;
			  }
              const data = await res.json();
              if (!signal.aborted) {
				let models = data.models?.map((m: any) => m.name) || [];
				setAvailableModels(models);
				setModel(prev => models.includes(prev) ? prev : '');
			  }
            }
            break;

          case 'mistral':
            if (!apiKey) return;
            {
              const res = await fetch('https://api.mistral.ai/v1/models', {
                headers: { Authorization: `Bearer ${apiKey}` },
                signal,
              });
			  if (!res.ok) {
				console.error(`Fetch error (${res.status}): ${res.statusText}`);
				return;
			  }
              const data = await res.json();
              if (!signal.aborted) {
				let models = data.models?.map((m: any) => m.id) || [];
				setAvailableModels(models);
				setModel(prev => models.includes(prev) ? prev : '');
			  }
            }
            break;

          case 'ollama':
			{
			  const res = await fetch('http://localhost:11434/api/tags', { signal });
			  if (!res.ok) {
				console.error(`Ollama fetch failed: ${res.statusText}`);
				return;
			  }
			  const data = await res.json();
			  if (!signal.aborted) {
				let models = data.models?.map((m: any) => m.name || m.model) || [];
				setAvailableModels(models);
				setModel(prev => models.includes(prev) ? prev : '');
			  }
			}
			break;

          case 'openrouter':
            if (!apiKey) return;
            {
              const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { Authorization: `Bearer ${apiKey}` },
                signal,
              });
			  if (!res.ok) {
				console.error(`Fetch error (${res.status}): ${res.statusText}`);
				return;
			  }
              const data = await res.json();
              if (!signal.aborted) {
				let models = data.data?.map((m: any) => m.id) || [];
				setAvailableModels(models);
				setModel(prev => models.includes(prev) ? prev : '');
			  }
            }
            break;

          default:
            setAvailableModels([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch models:', err);
          setAvailableModels([]);
        }
      }
    };

    void fetchModels();

    return () => {
      controller.abort();
    };
  }, [provider, debouncedApiKey, customEndpoint]);

  useEffect(() => {
    if (availableModels.length > 0 && model && !availableModels.includes(model)) {
      setModel('');
    }
  }, [model, availableModels]);

  const handleSave = async () => {
    localStorage.setItem('aiProvider', provider);
    localStorage.setItem('aiModel', model);

    if (provider === 'openai-compatible') {
      localStorage.setItem('aiCustomEndpoint', customEndpoint);
    } else {
      localStorage.removeItem('aiCustomEndpoint');
    }

    if (maxTokens) {
      localStorage.setItem('aiResMaxTokens', maxTokens);
    } else {
      localStorage.removeItem('aiResMaxTokens');
    }

    localStorage.setItem('aiShowFullPrompt', showFullPrompt.toString());
    localStorage.setItem('aiEnableCodeSelectionMenu', enableCodeSelectionMenu.toString());
    localStorage.setItem('aiEnableInlineSuggestions', enableInlineSuggestions.toString());

    // Securely store the API key
    let protectionLevel: KeyProtectionLevel = 'memory-only';

    if (apiKey && provider !== 'ollama') {
      if (webauthnAvailable) {
        try {
          const success = await encryptAndStoreApiKey(apiKey);
          if (success) {
            protectionLevel = 'webauthn';
            // Only remove legacy plaintext key when encryption succeeds
            localStorage.removeItem('aiApiKey');
          }
        } catch {
          // Encryption failed — fall through to memory-only
        }
      }
    }

    // Build the config from the current form values and set it directly
    // in the Zustand store. This avoids calling loadConfigFromLocalStorage()
    // which would re-trigger a WebAuthn prompt to decrypt the key we just saved.
    const config: AIConfig = {
      provider,
      model,
      apiKey: provider === 'ollama' ? '' : apiKey,
      includeTemplateMarkContent: localStorage.getItem('aiIncludeTemplateMark') === 'true',
      includeConcertoModelContent: localStorage.getItem('aiIncludeConcertoModel') === 'true',
      includeDataContent: localStorage.getItem('aiIncludeData') === 'true',
      showFullPrompt,
      enableCodeSelectionMenu,
      enableInlineSuggestions,
    };

    if (provider === 'openai-compatible' && customEndpoint) {
      config.customEndpoint = customEndpoint;
    }

    if (maxTokens) {
      config.maxTokens = parseInt(maxTokens);
    }

    const { setAIConfig } = useAppStore.getState();
    setAIConfig(config);
    setKeyProtectionLevel(protectionLevel);
    setIsEncrypting(false);
    onClose();
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all AI configuration? This will clear your API key and all settings.'
    );

    if (confirmed) {
      // Clear all AI-related localStorage items (including encrypted key data)
      clearStoredKey();
      localStorage.removeItem('aiProvider');
      localStorage.removeItem('aiModel');
      localStorage.removeItem('aiCustomEndpoint');
      localStorage.removeItem('aiResMaxTokens');
      localStorage.removeItem('aiShowFullPrompt');
      localStorage.removeItem('aiEnableCodeSelectionMenu');
      localStorage.removeItem('aiEnableInlineSuggestions');
      localStorage.removeItem('aiIncludeTemplateMark');
      localStorage.removeItem('aiIncludeConcertoModel');
      localStorage.removeItem('aiIncludeData');

      // Reset all state variables to default
      setProvider('');
      setModel('');
      setApiKey('');
      setCustomEndpoint('');
      setMaxTokens('');
      setShowFullPrompt(false);
      setEnableCodeSelectionMenu(true);
      setEnableInlineSuggestions(true);
      setKeyProtectionLevel(null);
      setSecurityMessage('');

      // Clear the in-memory AI config in Zustand so stale keys don't persist
      const { setAIConfig } = useAppStore.getState();
      setAIConfig(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${theme.overlay} flex items-center justify-center z-[1050] twp`}>
      <div className={`${theme.container} rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.headerText}`}>AI Configuration</h2>
          <button
            onClick={onClose}
            className={theme.closeButton}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-1`}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.select}`}
            >
              <option value="">Select a provider</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="mistral">Mistral</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="openai-compatible">OpenAI Compatible API</option>
            </select>
          </div>

          {provider === 'openai-compatible' && (
            <div>
              <label className={`block text-sm font-medium ${theme.label} mb-1`}>
                API Endpoint
              </label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://your-api-endpoint/v1"
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
              />
              <div className={`mt-1 text-xs ${theme.helpText}`}>
                Enter the full base URL of the OpenAI-compatible API
              </div>
            </div>
          )}

		  <div className="relative">
		    <label className={`block text-sm font-medium ${theme.label} mb-1`}>
				API Key
			</label>
			<div className="flex items-center">
			  <input
				type={showApiKey ? "text" : "password"}
				value={apiKey}
				onChange={(e) => setApiKey(e.target.value)}
				placeholder="Enter API key"
				className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
			  />
			  <button
				type="button"
				onClick={() => setShowApiKey(!showApiKey)}
				className={`ml-2 p-2 rounded ${theme.closeButton}`}
			  >
				{showApiKey ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
			  </button>
			</div>

			{/* Security status indicators */}
			{keyProtectionLevel === 'webauthn' && (
				<div className="mt-1 text-xs text-green-500 flex items-center gap-1">
				  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
				    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
				  </svg>
				  Protected with Passkey (WebAuthn)
				</div>
			)}
			{keyProtectionLevel === 'memory-only' && (
				<div className="mt-1 text-xs text-yellow-500 flex items-center gap-1">
				  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
				    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
				  </svg>
				  Stored in memory only (cleared on refresh)
				</div>
			)}
			{!webauthnAvailable && apiKey && provider !== 'ollama' && !keyProtectionLevel && (
			  <div className="mt-1 text-xs text-yellow-500">
				⚠️ WebAuthn not available. Key will be stored in memory only.
			  </div>
			)}
			{securityMessage && (
			  <div className="mt-1 text-xs text-orange-400">
				{securityMessage}
			  </div>
			)}
		  </div>

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-1`}>
              Model Name
            </label>
            <select
			  value={model}
			  onChange={(e) => setModel(e.target.value)}
			  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.select}`}
			>
			<option value="">Select a model</option>
			{availableModels.length > 0
				? availableModels.map((m) => (
					<option key={m} value={m}>{m}</option>
				)) : <option disabled>No models available</option>
			}
			</select>
            {provider && (
              <div className={`mt-1 text-xs ${theme.helpText}`}>
                {provider === 'openai' && 'Example: gpt-5, gpt-5-mini'}
                {provider === 'anthropic' && 'Example: claude-opus-4-1-20250805, claude-sonnet-4-5-20250929'}
                {provider === 'google' && 'Example: gemini-3-pro, gemini-2.5-flash'}
                {provider === 'mistral' && 'Example: mistral-large-latest, mistral-medium-latest'}
                {provider === 'openrouter' && 'Example: openai/gpt-5, meta-llama/llama-3.3-70b-instruct'}
                {provider === 'ollama' && (
                  <span className="text-orange-500 font-bold">
                    ⚠️ Must run: <code>OLLAMA_ORIGINS="*" ollama serve</code>
                    <br/>Example models: tinyllama, qwen2.5:0.5b, llama3
                  </span>
                )}
                
              </div>
            )}
          </div>

          <div className={`border rounded-lg ${theme.advancedContainer}`}>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className={`w-full p-3 flex justify-between items-center text-left ${theme.advancedButton}`}
              aria-expanded={showAdvancedSettings}
            >
              <span className="font-medium">Advanced Settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showAdvancedSettings && (
              <div className={`p-3 border-t space-y-4 ${theme.advancedContent}`}>
                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1`}>
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    placeholder="Leave empty for default"
                    min="1"
                    max="32000"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
                  />
                  <div className={`mt-1 text-xs ${theme.helpText}`}>
                    Maximum number of tokens the model can generate in response
                  </div>
                </div>

                <div className={`border-t my-4 ${theme.divider}`}></div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFullPrompt"
                    checked={showFullPrompt}
                    onChange={(e) => setShowFullPrompt(e.target.checked)}
                    className={`h-4 w-4 rounded focus:ring-2 ${theme.checkbox}`}
                  />
                  <label htmlFor="showFullPrompt" className={`ml-2 text-sm ${theme.checkboxLabel}`}>
                    Show Full Prompts in Chat History
                  </label>
                </div>
                <div className={`mt-1 text-xs ${theme.helpText}`}>
                  When enabled, you'll see the complete prompt sent to the AI (including any context), not just your input
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableCodeSelectionMenu"
                    checked={enableCodeSelectionMenu}
                    onChange={(e) => setEnableCodeSelectionMenu(e.target.checked)}
                    className={`h-4 w-4 rounded focus:ring-2 ${theme.checkbox}`}
                  />
                  <label htmlFor="enableCodeSelectionMenu" className={`ml-2 text-sm ${theme.checkboxLabel}`}>
                    Enable Code Selection Menu
                  </label>
                </div>
                <div className={`mt-1 text-xs ${theme.helpText}`}>
                  When enabled, selecting code in editors will show a menu with "Explain" and "Chat" options
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableInlineSuggestions"
                    checked={enableInlineSuggestions}
                    onChange={(e) => setEnableInlineSuggestions(e.target.checked)}
                    className={`h-4 w-4 rounded focus:ring-2 ${theme.checkbox}`}
                  />
                  <label htmlFor="enableInlineSuggestions" className={`ml-2 text-sm ${theme.checkboxLabel}`}>
                    Enable Inline AI Suggestions
                  </label>
                </div>
                <div className={`mt-1 text-xs ${theme.helpText}`}>
                  When enabled, AI will provide ghost text suggestions as you type in the editors
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { handleSave().catch(console.warn); }}
            disabled={isEncrypting || !provider || !model || (availableModels.length > 0 && !availableModels.includes(model)) || (provider !== 'ollama' && !apiKey) || (provider === 'openai-compatible' && !customEndpoint)}
            className={`w-full py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${isEncrypting || !provider || !model || (provider !== 'ollama' && !apiKey) || (provider === 'openai-compatible' && !customEndpoint)
              ? theme.saveButton.disabled
              : theme.saveButton.enabled
              }`}
          >
            {isEncrypting ? 'Encrypting & Saving...' : 'Save Configuration'}
          </button>

          <button
            onClick={handleReset}
            className={`w-full py-2 rounded-lg border-2 transition-colors ${theme.resetButton}`}
          >
            Reset Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPopup;
