/**
 * Curated list of popular models for each AI provider.
 * Used to populate the model selection dropdown in AIConfigPopup.
 */

export interface ModelOption {
    label: string;
    value: string;
}

export const PROVIDER_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { label: 'GPT-5.2', value: 'gpt-5.2' },
        { label: 'GPT-5.2 Pro', value: 'gpt-5.2-pro' },
        { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
        { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
        { label: 'o3', value: 'o3' },
        { label: 'o3 Pro', value: 'o3-pro' },
        { label: 'o4 Mini', value: 'o4-mini' },
        { label: 'GPT-4.1', value: 'gpt-4.1' },
        { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
        { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
    ],
    anthropic: [
        { label: 'Claude Opus 4.6', value: 'claude-opus-4.6' },
        { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4.5' },
        { label: 'Claude Haiku 4.5', value: 'claude-haiku-4.5' },
    ],
    google: [
        { label: 'Gemini 3.1 Pro', value: 'gemini-3.1-pro' },
        { label: 'Gemini 3.1 Flash', value: 'gemini-3.1-flash' },
        { label: 'Gemini 3 Pro', value: 'gemini-3-pro' },
        { label: 'Gemini 3 Flash', value: 'gemini-3-flash' },

        { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
        { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
        { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
        { label: 'Gemini 2.0 Flash Lite', value: 'gemini-2.0-flash-lite' },
    ],
    mistral: [
        { label: 'Mistral Large', value: 'mistral-large-latest' },
        { label: 'Mistral Medium', value: 'mistral-medium-latest' },
        { label: 'Mistral Small', value: 'mistral-small-latest' },
        { label: 'Codestral', value: 'codestral-latest' },
    ],
    openrouter: [
        { label: 'OpenAI GPT-5.2', value: 'openai/gpt-5.2' },
        { label: 'Anthropic Claude Opus 4.6', value: 'anthropic/claude-opus-4.6' },
        { label: 'Google Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
        { label: 'Google Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
    ],
    ollama: [
        { label: 'LLaMA 3', value: 'llama3' },
        { label: 'LLaMA 3.1', value: 'llama3.1' },
        { label: 'LLaMA 3.2', value: 'llama3.2' },
        { label: 'Mistral', value: 'mistral' },
        { label: 'Mixtral', value: 'mixtral' },
        { label: 'Code LLaMA', value: 'codellama' },
        { label: 'Qwen 2.5', value: 'qwen2.5' },
        { label: 'Qwen 2.5 (0.5B)', value: 'qwen2.5:0.5b' },
        { label: 'TinyLLaMA', value: 'tinyllama' },
        { label: 'Phi 3', value: 'phi3' },
    ],
};

/**
 * Returns the list of suggested models for a given provider.
 * Returns an empty array for unknown or custom providers.
 */
export function getModelsForProvider(provider: string): ModelOption[] {
    return PROVIDER_MODELS[provider] ?? [];
}
