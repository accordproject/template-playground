 /*
 * Provider ids accepted by template-engine's `LLMProviderConfig['provider']`.
 * Declared locally because the loader types only exist in an unreleased
 * template-engine version.
 */
export type SdkProvider =
  | 'groq'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'openrouter'
  | 'ollama'
  | 'openai-compatible';

export type SdkLoader = () => Promise<unknown>;
export type SdkLoaders = Partial<Record<SdkProvider, SdkLoader>>;

/**
 * Loads each LLM provider SDK on demand. The import specifiers are literals
 * so Vite can resolve them and split each SDK into its own lazy chunk (see
 * `manualChunks` in vite.config.ts).
 *
 * Pass this as `sdkLoaders` to template-engine's `LLMExecutor` once the
 * release that accepts injected loaders is available; the engine's own
 * `import(specifier)` cannot be followed by bundlers.
 * See https://github.com/accordproject/template-playground/issues/1005
 */
export const sdkLoaders: SdkLoaders = {
  groq: () => import('groq-sdk'),
  openai: () => import('openai'),
  anthropic: () => import('@anthropic-ai/sdk'),
  google: () => import('@google/genai'),
  mistral: () => import('@mistralai/mistralai'),
  openrouter: () => import('@openrouter/sdk'),
  // Ollama and custom OpenAI-compatible endpoints use the OpenAI SDK.
  ollama: () => import('openai'),
  'openai-compatible': () => import('openai'),
};