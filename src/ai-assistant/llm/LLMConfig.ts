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

/**
 * Configuration types for LLM-backed contract execution.
 *
 * Mirrors `src/llm/LLMConfig.ts` on the template-engine `main` branch so the
 * playground can be switched over to the engine's own `LLMExecutor` once a
 * release ships it. The provider union is narrowed to the providers the
 * playground's AI settings offer (see `AIConfigSection`); the engine
 * additionally supports Groq.
 */

import type { AIConfig } from '../../types/components/AIAssistant.types';

/**
 * How the Contract Runner should pick an execution engine.
 * - `disabled`: only run the template's compiled TypeScript logic.
 * - `fallback`: run the compiled logic when there is some, otherwise the LLM.
 * - `force`: always run the LLM, even when compiled logic exists.
 */
export type LLMMode = 'disabled' | 'fallback' | 'force';

/** Every LLM mode, in the order the mode switch renders them. */
export const LLM_MODES: readonly LLMMode[] = ['disabled', 'fallback', 'force'];

/**
 * Effort levels the OpenAI Chat Completions API accepts. Only reasoning models
 * take the parameter at all — a non-reasoning model (e.g. `gpt-4o`) rejects it.
 */
export const OPENAI_EFFORT_LEVELS = ['minimal', 'low', 'medium', 'high'] as const;

export type OpenAIEffort = (typeof OPENAI_EFFORT_LEVELS)[number];

/**
 * Effort levels the Anthropic Messages API accepts. The browser SDK bundled
 * with the playground predates the `output_config.effort` parameter, so
 * `AnthropicReasoner` maps these onto an extended-thinking token budget
 * (see `EFFORT_THINKING_BUDGET`).
 */
export const ANTHROPIC_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

export type AnthropicEffort = (typeof ANTHROPIC_EFFORT_LEVELS)[number];

/** Union of every effort level any supported provider accepts. */
export type ReasoningEffort = OpenAIEffort | AnthropicEffort;

/** Thinking-token budget used for each Anthropic effort level. */
export const EFFORT_THINKING_BUDGET: Record<AnthropicEffort, number> = {
  low: 2048,
  medium: 4096,
  high: 8192,
  xhigh: 16384,
  max: 24576,
};

/** The provider ids the playground can execute contracts with. */
export type LLMProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'openrouter'
  | 'ollama'
  | 'openai-compatible';

/**
 * Which tuning knobs a provider honours. Drives both the settings form and the
 * reasoners, so the UI never offers a control the request would ignore.
 */
export interface ProviderCapabilities {
  /** Reasoning-effort levels, or null when the provider takes no effort hint. */
  effort: readonly ReasoningEffort[] | null;
  /** Whether a sampling temperature is honoured. */
  temperature: boolean;
  /** Whether extended thinking can be toggled. */
  thinking: boolean;
  /** Whether the provider enforces a JSON Schema on its own output. */
  structuredOutput: boolean;
}

/** Capability matrix, keyed by provider id. */
export const PROVIDER_CAPABILITIES: Record<LLMProviderId, ProviderCapabilities> = {
  openai: { effort: OPENAI_EFFORT_LEVELS, temperature: false, thinking: false, structuredOutput: true },
  anthropic: { effort: ANTHROPIC_EFFORT_LEVELS, temperature: false, thinking: true, structuredOutput: true },
  google: { effort: null, temperature: true, thinking: false, structuredOutput: true },
  mistral: { effort: null, temperature: true, thinking: false, structuredOutput: true },
  openrouter: { effort: null, temperature: true, thinking: false, structuredOutput: true },
  // Local models vary wildly in how well they honour a schema, so the executor
  // falls back to describing the Concerto types in the prompt for these two.
  ollama: { effort: null, temperature: true, thinking: false, structuredOutput: false },
  'openai-compatible': { effort: null, temperature: true, thinking: false, structuredOutput: false },
};

/**
 * Reads the capabilities of a provider, defaulting to "no tuning knobs" for an
 * id the playground does not know about.
 * @param provider - the provider id from the saved AI configuration
 * @returns the provider's capabilities
 */
export function getProviderCapabilities(provider: string): ProviderCapabilities {
  return (
    PROVIDER_CAPABILITIES[provider as LLMProviderId] ?? {
      effort: null,
      temperature: false,
      thinking: false,
      structuredOutput: false,
    }
  );
}

/**
 * Whether the saved AI configuration is complete enough to execute a contract.
 *
 * Lives here rather than next to the executor so the UI can check it without
 * pulling the provider SDKs into the main bundle.
 * @param aiConfig - the AI configuration held in the global store
 * @returns true when a provider, model and (where required) an API key are set
 */
export function isLLMConfigured(aiConfig: AIConfig | null | undefined): boolean {
  if (!aiConfig?.provider || !aiConfig.model) return false;
  if (aiConfig.provider === 'openai-compatible' && !aiConfig.customEndpoint) return false;
  // Ollama runs locally and takes no key.
  if (aiConfig.provider !== 'ollama' && !aiConfig.apiKey) return false;
  return true;
}

/**
 * Provider settings shared by every reasoner.
 */
export interface LLMProviderConfig {
  provider: LLMProviderId;
  apiKey?: string;
  model: string;
  /** Base URL for the OpenAI-compatible providers (`openai-compatible`, `ollama`). */
  customEndpoint?: string;
  /** Whether the provider enforces the JSON Schema natively. */
  isStructuredOutputSupported?: boolean;
  /** Reasoning depth. Only honoured where {@link ProviderCapabilities.effort} is set. */
  effort?: ReasoningEffort;
  /** Whether to run Anthropic with extended thinking. Defaults to `true`. */
  thinking?: boolean;
  /** Sampling temperature. Only honoured where the provider accepts one. */
  temperature?: number;
  maxTokens?: number;
  /** Extra attempts after the first failure. Defaults to 1. */
  retries?: number;
  timeoutMs?: number;
}

/**
 * Runtime configuration for the LLM executor.
 */
export interface LLMExecutorConfig {
  mode: LLMMode;
  provider: LLMProviderConfig;
  verbose?: boolean;
}
