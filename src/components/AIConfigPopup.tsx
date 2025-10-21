import { useState, useEffect, useMemo } from 'react';
import { AIConfigPopupProps } from '../types/components/AIAssistant.types';
import useAppStore from '../store/store';

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
      }
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
  const [maxAssistantMessages, setMaxAssistantMessages] = useState<string>('10');
  const [maxUserMessages, setMaxUserMessages] = useState<string>('10');

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
      const savedMaxAssistantMessages = localStorage.getItem('aiMaxAssistantMessages') || '10';
      const savedMaxUserMessages = localStorage.getItem('aiMaxUserMessages') || '10';
      
      if (savedProvider) setProvider(savedProvider);
      if (savedModel) setModel(savedModel);
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedCustomEndpoint) setCustomEndpoint(savedCustomEndpoint);
      if (savedMaxTokens) setMaxTokens(savedMaxTokens);
      
      setShowFullPrompt(savedShowFullPrompt);
      setEnableCodeSelectionMenu(savedEnableCodeSelection);
      setEnableInlineSuggestions(savedEnableInlineSuggestions);
      setMaxAssistantMessages(savedMaxAssistantMessages);
      setMaxUserMessages(savedMaxUserMessages);
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
    localStorage.setItem('aiMaxAssistantMessages', maxAssistantMessages);
    localStorage.setItem('aiMaxUserMessages', maxUserMessages);
    
    onSave(); 
    onClose();
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
              Model Name
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Enter model name"
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
            />
            {provider && (
              <div className={`mt-1 text-xs ${theme.helpText}`}>
                {provider === 'openai' && 'Example: gpt-4-turbo, gpt-3.5-turbo'}
                {provider === 'anthropic' && 'Example: claude-3-opus-20240229, claude-3-sonnet-20240229'}
                {provider === 'google' && 'Example: gemini-1.5-pro, gemini-1.0-pro'}
                {provider === 'mistral' && 'Example: mistral-large-latest, mistral-medium-latest'}
                {provider === 'openrouter' && 'Example: anthropic/claude-3-opus, meta-llama/llama-3-70b-instruct'}
              </div>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-1`}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
            />
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

                <div className={`border-t my-4 ${theme.divider}`}></div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1`}>
                    Max Assistant Messages in History
                  </label>
                  <input
                    type="number"
                    value={maxAssistantMessages}
                    onChange={(e) => setMaxAssistantMessages(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="100"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
                  />
                  <div className={`mt-1 text-xs ${theme.helpText}`}>
                    Maximum number of assistant messages to include in chat history (default: 10)
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1`}>
                    Max User Messages in History
                  </label>
                  <input
                    type="number"
                    value={maxUserMessages}
                    onChange={(e) => setMaxUserMessages(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="100"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.input}`}
                  />
                  <div className={`mt-1 text-xs ${theme.helpText}`}>
                    Maximum number of user messages to include in chat history (default: 10)
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!provider || !model || !apiKey || (provider === 'openai-compatible' && !customEndpoint)}
            className={`w-full py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${
              !provider || !model || !apiKey || (provider === 'openai-compatible' && !customEndpoint)
                ? theme.saveButton.disabled
                : theme.saveButton.enabled
            }`}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPopup;