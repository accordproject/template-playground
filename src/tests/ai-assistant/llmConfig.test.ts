import { describe, it, expect } from 'vitest';
import {
  buildLLMExecutorConfig,
  getProviderCapabilities,
  isLLMConfigured,
} from '../../ai-assistant/llm';
import { treeShakeModel } from '../../ai-assistant/llm/ModelManagerSchema';
import { AIConfig } from '../../types/components/AIAssistant.types';

const anthropicConfig: AIConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  apiKey: 'sk-test',
  includeTemplateMarkContent: false,
  includeConcertoModelContent: false,
  includeDataContent: false,
  effort: 'high',
  temperature: 0.9,
  thinking: false,
  maxTokens: 12000,
};

describe('LLM provider capabilities', () => {
  it('exposes reasoning effort only for the providers that accept it', () => {
    expect(getProviderCapabilities('anthropic').effort).toContain('xhigh');
    expect(getProviderCapabilities('openai').effort).toContain('minimal');
    expect(getProviderCapabilities('google').effort).toBeNull();
  });

  it('falls back to no tuning knobs for an unknown provider', () => {
    const capabilities = getProviderCapabilities('not-a-provider');
    expect(capabilities).toEqual({
      effort: null,
      temperature: false,
      thinking: false,
      structuredOutput: false,
    });
  });
});

describe('isLLMConfigured', () => {
  it('requires a provider, model and key', () => {
    expect(isLLMConfigured(null)).toBe(false);
    expect(isLLMConfigured({ ...anthropicConfig, apiKey: '' })).toBe(false);
    expect(isLLMConfigured({ ...anthropicConfig, model: '' })).toBe(false);
    expect(isLLMConfigured(anthropicConfig)).toBe(true);
  });

  it('does not require a key for a local Ollama model', () => {
    expect(
      isLLMConfigured({ ...anthropicConfig, provider: 'ollama', apiKey: '' })
    ).toBe(true);
  });

  it('requires an endpoint for an OpenAI-compatible provider', () => {
    const config = { ...anthropicConfig, provider: 'openai-compatible' };
    expect(isLLMConfigured(config)).toBe(false);
    expect(isLLMConfigured({ ...config, customEndpoint: 'https://host/v1' })).toBe(true);
  });
});

describe('buildLLMExecutorConfig', () => {
  it('carries the provider, model and key through from the global AI config', () => {
    const config = buildLLMExecutorConfig(anthropicConfig, 'force');

    expect(config.mode).toBe('force');
    expect(config.provider.provider).toBe('anthropic');
    expect(config.provider.model).toBe('claude-sonnet-4-5-20250929');
    expect(config.provider.apiKey).toBe('sk-test');
    expect(config.provider.maxTokens).toBe(12000);
  });

  it('drops the knobs the selected provider does not honour', () => {
    const anthropic = buildLLMExecutorConfig(anthropicConfig, 'fallback');
    // Anthropic takes effort and thinking, but no sampling temperature.
    expect(anthropic.provider.effort).toBe('high');
    expect(anthropic.provider.thinking).toBe(false);
    expect(anthropic.provider.temperature).toBeUndefined();

    const google = buildLLMExecutorConfig(
      { ...anthropicConfig, provider: 'google', model: 'gemini-2.5-pro' },
      'fallback'
    );
    // Google takes a temperature, but neither effort nor thinking.
    expect(google.provider.temperature).toBe(0.9);
    expect(google.provider.effort).toBeUndefined();
    expect(google.provider.thinking).toBeUndefined();
  });

  it('refuses to build a config from incomplete AI settings', () => {
    expect(() => buildLLMExecutorConfig(null, 'force')).toThrow(/AI Configuration/);
  });
});

describe('ModelManagerSchema', () => {
  it('loads the concerto-codegen graph and JSON Schema visitors', () => {
    // Guards the CommonJS interop: a missing named export would only surface
    // here (or at runtime in the browser), not at type-check time.
    expect(typeof treeShakeModel).toBe('function');
    expect(() => treeShakeModel({ getModelManager: () => undefined }, [])).toThrow();
  });
});
