import type { SdkLoaders } from "@accordproject/template-engine/lib/llm";

/**
 * Loads each LLM provider SDK on demand, for template-engine's
 * `LLMExecutor` / `TemplateArchiveProcessor` (`sdkLoaders` argument). The
 * import specifiers are literals so Vite can resolve them and split each SDK
 * into its own lazy chunk (see `manualChunks` in vite.config.ts); the
 * engine's own fallback, `import(specifier)`, cannot be followed by bundlers.
 *
 * The `ollama` and `openai-compatible` providers use the `openai` loader.
 * See https://github.com/accordproject/template-playground/issues/1005
 */
export const sdkLoaders: SdkLoaders = {
  groq: () => import("groq-sdk"),
  openai: () => import("openai"),
  anthropic: () => import("@anthropic-ai/sdk"),
  google: () => import("@google/genai"),
  mistral: () => import("@mistralai/mistralai"),
  openrouter: () => import("@openrouter/sdk"),
};
