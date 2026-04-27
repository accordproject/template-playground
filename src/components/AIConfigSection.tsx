/**
 * AI Configuration form section - can be embedded in SettingsModal or used standalone.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Checkbox,
  Collapse,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  LockOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AIConfig, KeyProtectionLevel } from '../types/components/AIAssistant.types';
import { useDebounce } from 'use-debounce';
import useAppStore from '../store/store';
import {
  isWebAuthnPRFSupported,
  encryptAndStoreApiKey,
  loadAndDecryptApiKey,
  clearStoredKey,
} from '../utils/secureKeyStorage';
import { fetchModels } from '../utils/fetchModels';

const { Text } = Typography;

interface AIConfigSectionProps {
  onSaveSuccess?: () => void;
}

const AIConfigSection = ({ onSaveSuccess }: AIConfigSectionProps): JSX.Element => {
  const { keyProtectionLevel, setKeyProtectionLevel } = useAppStore((state) => ({
    keyProtectionLevel: state.keyProtectionLevel,
    setKeyProtectionLevel: state.setKeyProtectionLevel,
  }));

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
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [debouncedApiKey] = useDebounce(apiKey, 1000);

  // Check WebAuthn PRF support on mount
  useEffect(() => {
    isWebAuthnPRFSupported().then(setWebauthnAvailable).catch(() => setWebauthnAvailable(false));
  }, []);

  // Load config on mount
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

  useEffect(() => {
    setSecurityMessage('');
    loadConfig().catch(console.warn);
  }, [loadConfig]);

  useEffect(() => {
    if (!provider) {
      setAvailableModels([]);
      return;
    }

    // Only gate on API key for providers that require it (e.g., OpenAI, Anthropic, etc.).
    // Ollama does not require an API key, so allow it to proceed without debouncedApiKey.
    const requiresApiKey = provider !== 'ollama';
    if (requiresApiKey && !debouncedApiKey) {
      setAvailableModels([]);
      return;
    }

    const controller = new AbortController();

    const runFetch = async () => {
      const models = await fetchModels({
        provider,
        apiKey: debouncedApiKey,
        customEndpoint,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setAvailableModels(models);
        setModel(prev => models.includes(prev) ? prev : '');
      }
    };

    void runFetch();

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
    setIsEncrypting(true);

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
    onSaveSuccess?.();
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all AI configuration? This will clear your API key and all settings.'
    );

    if (confirmed) {
      // Clear all AI-related localStorage items (including encrypted key data)
      clearStoredKey();
      const keysToRemove = [
        'aiProvider',
        'aiModel',
        'aiCustomEndpoint',
        'aiResMaxTokens',
        'aiShowFullPrompt',
        'aiEnableCodeSelectionMenu',
        'aiEnableInlineSuggestions',
        'aiIncludeTemplateMark',
        'aiIncludeConcertoModel',
        'aiIncludeData',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

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

  const isSaveDisabled = isEncrypting || !provider || !model ||
    (availableModels.length > 0 && !availableModels.includes(model)) ||
    (provider !== 'ollama' && !apiKey) ||
    (provider === 'openai-compatible' && !customEndpoint);

  const providerOptions = [
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'openai-compatible', label: 'OpenAI Compatible API' },
  ];

  const modelOptions = availableModels.map(m => ({ value: m, label: m }));

  const providerHint: Record<string, React.ReactNode> = {
    openai: 'Example: gpt-5, gpt-5-mini',
    anthropic: 'Example: claude-opus-4-1-20250805, claude-sonnet-4-5-20250929',
    google: 'Example: gemini-3-pro, gemini-2.5-flash',
    mistral: 'Example: mistral-large-latest, mistral-medium-latest',
    openrouter: 'Example: openai/gpt-5, meta-llama/llama-3.3-70b-instruct',
    ollama: (
      <Text type="warning">
        ⚠️ For browser access, configure <code>OLLAMA_ORIGINS</code> to this site&apos;s origin
        (for example, <code>https://template-playground.accordproject.org</code>), not{' '}
        <code>&quot;*&quot;</code>. Using <code>&quot;*&quot;</code> allows any website to send
        requests to your local Ollama server.
        <br />Example models: tinyllama, qwen2.5:0.5b, llama3
      </Text>
    ),
  };

  const advancedItems = [
    {
      key: 'advanced',
      label: 'Advanced Settings',
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            label="Max Tokens"
            extra="Maximum number of tokens the model can generate in response"
            style={{ marginBottom: 8 }}
          >
            <Input
              id="ai-max-tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="Leave empty for default"
              min={1}
              max={32000}
            />
          </Form.Item>

          <Divider style={{ margin: '4px 0' }} />

          <Checkbox
            id="showFullPrompt"
            checked={showFullPrompt}
            onChange={(e) => setShowFullPrompt(e.target.checked)}
          >
            Show Full Prompts in Chat History
          </Checkbox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            When enabled, you&apos;ll see the complete prompt sent to the AI (including any context), not just your input
          </Text>

          <Checkbox
            id="enableCodeSelectionMenu"
            checked={enableCodeSelectionMenu}
            onChange={(e) => setEnableCodeSelectionMenu(e.target.checked)}
          >
            Enable Code Selection Menu
          </Checkbox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            When enabled, selecting code in editors will show a menu with &quot;Explain&quot; and &quot;Chat&quot; options
          </Text>

          <Checkbox
            id="enableInlineSuggestions"
            checked={enableInlineSuggestions}
            onChange={(e) => setEnableInlineSuggestions(e.target.checked)}
          >
            Enable Inline AI Suggestions
          </Checkbox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            When enabled, AI will provide ghost text suggestions as you type in the editors
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <Form layout="vertical" style={{ width: '100%' }}>
      <Form.Item label="Provider">
        <Select
          id="ai-provider-select"
          value={provider || undefined}
          onChange={setProvider}
          placeholder="Select a provider"
          options={providerOptions}
          style={{ width: '100%' }}
        />
      </Form.Item>

      {provider === 'openai-compatible' && (
        <Form.Item
          label="API Endpoint"
          extra="Enter the full base URL of the OpenAI-compatible API"
        >
          <Input
            id="ai-api-endpoint"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="https://your-api-endpoint/v1"
          />
        </Form.Item>
      )}

      <Form.Item label="API Key">
        <Input.Password
          id="ai-api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key"
        />
        {keyProtectionLevel === 'webauthn' && (
          <Space size={4} style={{ marginTop: 4 }}>
            <LockOutlined style={{ color: '#52c41a', fontSize: 12 }} />
            <Text style={{ color: '#52c41a', fontSize: 12 }}>
              Protected with Passkey (WebAuthn)
            </Text>
          </Space>
        )}
        {keyProtectionLevel === 'memory-only' && (
          <Space size={4} style={{ marginTop: 4 }}>
            <WarningOutlined style={{ color: '#faad14', fontSize: 12 }} />
            <Text style={{ color: '#faad14', fontSize: 12 }}>
              Stored in memory only (cleared on refresh)
            </Text>
          </Space>
        )}
        {!webauthnAvailable && apiKey && provider !== 'ollama' && !keyProtectionLevel && (
          <Text style={{ color: '#faad14', fontSize: 12, display: 'block', marginTop: 4 }}>
            ⚠️ WebAuthn not available. Key will be stored in memory only.
          </Text>
        )}
        {securityMessage && (
          <Text style={{ color: '#fa8c16', fontSize: 12, display: 'block', marginTop: 4 }}>
            {securityMessage}
          </Text>
        )}
      </Form.Item>

      <Form.Item
        label="Model Name"
        extra={provider ? providerHint[provider] : undefined}
      >
        <Select
          id="ai-model-select"
          value={model || undefined}
          onChange={setModel}
          placeholder="Select a model"
          options={modelOptions}
          notFoundContent="No models available"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Collapse
        items={advancedItems}
        activeKey={showAdvancedSettings ? ['advanced'] : []}
        onChange={(keys) =>
          setShowAdvancedSettings(Array.isArray(keys) ? keys.includes('advanced') : keys === 'advanced')
        }
        bordered
        style={{ marginBottom: 16 }}
      />

      <Button
        type="primary"
        block
        disabled={isSaveDisabled}
        onClick={() => { handleSave().catch(console.warn); }}
      >
        {isEncrypting ? 'Encrypting & Saving...' : 'Save Configuration'}
      </Button>

      <Button
        danger
        block
        onClick={handleReset}
        style={{ marginTop: 8 }}
      >
        Reset Configuration
      </Button>
    </Form>
  );
};

export default AIConfigSection;
