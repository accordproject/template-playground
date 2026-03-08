import { describe, it, expect } from 'vitest';
import { PROVIDER_MODELS, getModelsForProvider } from '../../ai-assistant/providerModels';

describe('PROVIDER_MODELS', () => {
    const expectedProviders = ['openai', 'anthropic', 'google', 'mistral', 'openrouter', 'ollama'];

    it.each(expectedProviders)('should have models for provider "%s"', (provider) => {
        expect(PROVIDER_MODELS[provider]).toBeDefined();
        expect(PROVIDER_MODELS[provider].length).toBeGreaterThan(0);
    });

    it('should have non-empty label and value for every model entry', () => {
        for (const provider of Object.keys(PROVIDER_MODELS)) {
            for (const model of PROVIDER_MODELS[provider]) {
                expect(model.label).toBeTruthy();
                expect(model.value).toBeTruthy();
            }
        }
    });

    it('should not have duplicate values within the same provider', () => {
        for (const provider of Object.keys(PROVIDER_MODELS)) {
            const values = PROVIDER_MODELS[provider].map(m => m.value);
            expect(new Set(values).size).toBe(values.length);
        }
    });
});

describe('getModelsForProvider', () => {
    it('should return models for a known provider', () => {
        const models = getModelsForProvider('openai');
        expect(models.length).toBeGreaterThan(0);
        expect(models[0]).toHaveProperty('label');
        expect(models[0]).toHaveProperty('value');
    });

    it('should return an empty array for an unknown provider', () => {
        expect(getModelsForProvider('unknown-provider')).toEqual([]);
    });

    it('should return an empty array for an empty string', () => {
        expect(getModelsForProvider('')).toEqual([]);
    });

    it('should return correct models for each provider', () => {
        expect(getModelsForProvider('openai').some(m => m.value === 'gpt-5.2')).toBe(true);
        expect(getModelsForProvider('anthropic').some(m => m.value === 'claude-opus-4.6')).toBe(true);
        expect(getModelsForProvider('google').some(m => m.value === 'gemini-2.5-pro')).toBe(true);
        expect(getModelsForProvider('mistral').some(m => m.value === 'mistral-large-latest')).toBe(true);
        expect(getModelsForProvider('openrouter').some(m => m.value === 'openai/gpt-5.2')).toBe(true);
        expect(getModelsForProvider('ollama').some(m => m.value === 'llama3')).toBe(true);
    });
});
