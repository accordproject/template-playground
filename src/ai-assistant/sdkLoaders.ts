/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { SdkLoaders } from '@accordproject/template-engine/lib/llm';

/**
 * Loads each LLM provider SDK on demand, for template-engine's `LLMExecutor`.
 * The import specifiers are literals so Vite can resolve them and split each
 * SDK into its own lazy chunk (see `manualChunks` in vite.config.ts); the
 * engine's own fallback, `import(specifier)`, cannot be followed by bundlers.
 * See https://github.com/accordproject/template-engine/pull/189
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
