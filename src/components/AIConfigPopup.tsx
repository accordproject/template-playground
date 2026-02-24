import { useState, useEffect, useMemo } from 'react';
import { AIConfigPopupProps } from '../types/components/AIAssistant.types';
import useAppStore from '../store/store';

const KNOWN_MODELS: Record<string, string[]> = {
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-20241022',
    'claude-3-5-haiku-latest',
    'claude-3-opus-20240229',
    'claude-3-opus-latest',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  google: [
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro-exp'
  ],
  mistral: [
    'mistral-large-latest',
    'mistral-medium-latest',
    'mistral-small-latest',
    'open-mixtral-8x22b',
    'open-mixtral-8x7b',
    'open-mistral-nemo'
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-2024-05-13',
    'gpt-4o-2024-08-06',
    'gpt-4o-2024-11-20',
    'gpt-4o-mini',
    'gpt-4o-mini-2024-07-18',
    'o1-preview',
    'o1-mini',
    'o1',
    'o3-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ]
};
const AIConfigPopup = ({ isOpen, onClose, onSave }: AIConfigPopupProps) => {
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
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
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [maxTokens, setMaxTokens] = useState<string>('');

  const [showFullPrompt, setShowFullPrompt] = useState<boolean>(false);
  const [enableCodeSelectionMenu, setEnableCodeSelectionMenu] = useState<boolean>(true);
  const [enableInlineSuggestions, setEnableInlineSuggestions] = useState<boolean>(true);
  const isKnownModel = useMemo(() => {
    if (!provider || !model) return null;
    if (provider === 'openrouter' || provider === 'ollama' || provider === 'openai-compatible') return null; // Can't easily validate

    const knownForProvider = KNOWN_MODELS[provider];
    if (!knownForProvider) return null;

    return knownForProvider.includes(model);
  }, [provider, model]);

  useEffect(() => {
    if (isOpen) {
      const savedProvider = localStorage.getItem('aiProvider');
      const savedModel = localStorage.getItem('aiModel');
      const savedApiKey = localStorage.getItem('aiApiKey');
      const savedCustomEndpoint = localStorage.getItem('aiCustomEndpoint');
      const savedMaxTokens = localStorage.getItem('aiResMaxTokens');

      const savedShowFullPrompt = localStorage.getItem('aiShowFullPrompt') === 'true';
      const savedEnableCodeSelection = localStorage.getItem('aiEnableCodeSelectionMenu') !== 'false';
      const savedEnableInlineSuggestions = localStorage.getItem('aiEnableInlineSuggestions') !== 'false';

      if (savedProvider) setProvider(savedProvider);
      if (savedModel) setModel(savedModel);
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedCustomEndpoint) setCustomEndpoint(savedCustomEndpoint);
      if (savedMaxTokens) setMaxTokens(savedMaxTokens);

      setShowFullPrompt(savedShowFullPrompt);
      setEnableCodeSelectionMenu(savedEnableCodeSelection);
      setEnableInlineSuggestions(savedEnableInlineSuggestions);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('aiProvider', provider);
    localStorage.setItem('aiModel', model);
    localStorage.setItem('aiApiKey', apiKey);

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

    onSave();
    onClose();
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all AI configuration? This will clear your API key and all settings.'
    );

    if (confirmed) {
      // Clear all AI-related localStorage items
      localStorage.removeItem('aiProvider');
      localStorage.removeItem('aiModel');
      localStorage.removeItem('aiApiKey');
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

      // Notify parent and reload config
      onSave();
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

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-1`}>
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                className={`w-full p-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme.helpText} hover:text-gray-700`}
                tabIndex={-1}
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-1`}>
              Model Name
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Enter model name"
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input} ${isKnownModel === false ? 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500' : ''}`}
            />
            {isKnownModel === true && (
              <div className="mt-1 text-xs text-green-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Recognized model
              </div>
            )}
            {isKnownModel === false && (
              <div className="mt-1 text-xs text-yellow-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                Unrecognized model. It may still work if it's new or custom.
              </div>
            )}
            {provider && isKnownModel !== true && isKnownModel !== false && (
              <div className={`mt-1 text-xs ${theme.helpText}`}>
                {provider === 'openai' && 'Example: gpt-4o, gpt-4o-mini'}
                {provider === 'anthropic' && 'Example: claude-3-5-sonnet-latest, claude-3-5-haiku-latest'}
                {provider === 'google' && 'Example: gemini-1.5-pro, gemini-1.5-flash'}
                {provider === 'mistral' && 'Example: mistral-large-latest, mistral-medium-latest'}
                {provider === 'openrouter' && 'Example: openai/gpt-5, meta-llama/llama-3.3-70b-instruct'}
                {provider === 'ollama' && (
                  <span className="text-orange-500 font-bold">
                    ⚠️ Must run: <code>OLLAMA_ORIGINS="*" ollama serve</code>
                    <br />Example models: tinyllama, qwen2.5:0.5b, llama3
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
            onClick={handleSave}
            disabled={!provider || !model || (provider !== 'ollama' && !apiKey) || (provider === 'openai-compatible' && !customEndpoint)}
            className={`w-full py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${!provider || !model || (provider !== 'ollama' && !apiKey) || (provider === 'openai-compatible' && !customEndpoint)
                ? theme.saveButton.disabled
                : theme.saveButton.enabled
              }`}
          >
            Save Configuration
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
