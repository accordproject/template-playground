import { useState, useEffect } from 'react';
import useAppStore from '../store/store';
import { AIConfig } from '../types/components/AIAssistant.types.ts';

interface AIConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AIConfigPopup = ({ isOpen, onClose, onSave }: AIConfigPopupProps) => {
  const [provider, setProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [maxTokens, setMaxTokens] = useState<string>('');
  
  const [showFullPrompt, setShowFullPrompt] = useState<boolean>(false);
  
  const setAIConfig = useAppStore((state) => state.setAIConfig);

  useEffect(() => {
    if (isOpen) {
      const savedProvider = localStorage.getItem('aiProvider');
      const savedModel = localStorage.getItem('aiModel');
      const savedApiKey = localStorage.getItem('aiApiKey');
      const savedCustomEndpoint = localStorage.getItem('aiCustomEndpoint');
      const savedMaxTokens = localStorage.getItem('aiResMaxTokens');
      
      const savedShowFullPrompt = localStorage.getItem('aiShowFullPrompt') === 'true';

      if (savedProvider) setProvider(savedProvider);
      if (savedModel) setModel(savedModel);
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedCustomEndpoint) setCustomEndpoint(savedCustomEndpoint);
      if (savedMaxTokens) setMaxTokens(savedMaxTokens);
      
      setShowFullPrompt(savedShowFullPrompt);
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
    
    const config: AIConfig = {
      provider,
      model,
      apiKey,
      customEndpoint: provider === 'openai-compatible' ? customEndpoint : undefined,
      maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
      showFullPrompt,
      includeTemplateMarkContent: true,
      includeConcertoModelContent: true,
      includeDataContent: true,
    };
    
    setAIConfig(config);
    
    onSave(); 
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050] twp">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://your-api-endpoint/v1"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-1 text-xs text-gray-500">
                Enter the full base URL of the OpenAI-compatible API
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Enter model name"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {provider && (
              <div className="mt-1 text-xs text-gray-500">
                {provider === 'openai' && 'Example: gpt-4-turbo, gpt-3.5-turbo'}
                {provider === 'anthropic' && 'Example: claude-3-opus-20240229, claude-3-sonnet-20240229'}
                {provider === 'google' && 'Example: gemini-1.5-pro, gemini-1.0-pro'}
                {provider === 'mistral' && 'Example: mistral-large-latest, mistral-medium-latest'}
                {provider === 'openrouter' && 'Example: anthropic/claude-3-opus, meta-llama/llama-3-70b-instruct'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border rounded-lg">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full p-3 flex justify-between items-center text-left"
              aria-expanded={showAdvancedSettings}
            >
              <span className="font-medium text-gray-700">Advanced Settings</span>
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
              <div className="p-3 border-t space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    placeholder="Leave empty for default"
                    min="1"
                    max="32000"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Maximum number of tokens the model can generate in response
                  </div>
                </div>
                
                <div className="border-t my-4"></div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFullPrompt"
                    checked={showFullPrompt}
                    onChange={(e) => setShowFullPrompt(e.target.checked)}
                    className="h-4 w-4 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <label htmlFor="showFullPrompt" className="ml-2 text-sm text-gray-700">
                    Show Full Prompts in Chat History
                  </label>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  When enabled, you'll see the complete prompt sent to the AI (including any context), not just your input
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!provider || !model || !apiKey || (provider === 'openai-compatible' && !customEndpoint)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPopup;