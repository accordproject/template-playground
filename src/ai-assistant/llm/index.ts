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
 * Bridge between the playground's AI settings and the LLM contract executor.
 *
 * The provider, model and API key all come from the single `aiConfig` object in
 * the global store (written by `AIConfigSection`), so contract execution and the
 * AI chat panel are always configured from the same place and the key never has
 * to be threaded through the UI.
 */

import type { Template } from '@accordproject/cicero-core';
import { AIConfig } from '../../types/components/AIAssistant.types';
import {
  LLMExecutorConfig,
  LLMMode,
  LLMProviderConfig,
  LLMProviderId,
  ProviderCapabilities,
  ReasoningEffort,
  getProviderCapabilities,
  isLLMConfigured,
} from './LLMConfig';
import { LLMExecutor } from './LLMExecutor';

export { LLMExecutor, isStatefulTemplate } from './LLMExecutor';
export type { InitResponse, TriggerResponse } from './LLMExecutor';
export * from './LLMConfig';

/** Which engine produced the artifacts currently shown in the runner. */
export enum ExecutionEngine {
  TypeScript = 'typescript',
  Llm = 'llm',
}

/**
 * Builds the provider config for the executor, including only the tuning
 * knobs the chosen provider actually honours.
 * @param config - the caller's (already validated) AI configuration
 * @param provider - the provider id, narrowed from `config.provider`
 * @param capabilities - the tuning knobs `provider` honours
 * @returns the provider config to send to the executor
 */
function buildProviderConfig(
  config: AIConfig,
  provider: LLMProviderId,
  capabilities: ProviderCapabilities
): LLMProviderConfig {
  const providerConfig: LLMProviderConfig = {
    provider,
    model: config.model,
    apiKey: config.apiKey,
    customEndpoint: config.customEndpoint,
    isStructuredOutputSupported: capabilities.structuredOutput,
  };

  if (capabilities.effort && config.effort) {
    providerConfig.effort = config.effort as ReasoningEffort;
  }
  if (capabilities.thinking) {
    providerConfig.thinking = config.thinking ?? true;
  }
  if (capabilities.temperature && config.temperature !== undefined) {
    providerConfig.temperature = config.temperature;
  }
  if (config.maxTokens) {
    providerConfig.maxTokens = config.maxTokens;
  }

  return providerConfig;
}

/**
 * Maps the playground's AI settings onto the executor configuration, dropping
 * any tuning knob the chosen provider does not honour.
 *
 * Callers are expected to have already confirmed `aiConfig` is present (e.g.
 * behind an `isLLMConfigured` / null check at the call site) — this function
 * takes a definite `AIConfig` rather than re-deriving that check internally.
 * @param aiConfig - the AI configuration held in the global store
 * @param mode - the execution mode selected in the Contract Runner
 * @returns the executor configuration
 * @throws {Error} if the AI configuration is incomplete for the chosen provider
 */
export function buildLLMExecutorConfig(aiConfig: AIConfig, mode: LLMMode): LLMExecutorConfig {
  if (!isLLMConfigured(aiConfig)) {
    throw new Error(
      'AI execution requires a provider, model and API key. Open Settings → AI Configuration to set them up.'
    );
  }
  const provider = aiConfig.provider as LLMProviderId;
  const capabilities = getProviderCapabilities(provider);

  return {
    mode,
    provider: buildProviderConfig(aiConfig, provider, capabilities),
    verbose: import.meta.env.DEV,
  };
}

/**
 * One cached executor per template. Rebuilding it on every run would re-derive
 * the whole JSON Schema from the ModelManager, so it is kept until either the
 * template or the AI configuration changes.
 */
const executorCache = new WeakMap<Template, { key: string; executor: LLMExecutor }>();

/**
 * Returns the executor for a template, reusing the cached one when the
 * configuration has not changed.
 * @param template - the template to execute
 * @param config - the executor configuration
 * @returns an executor bound to the template
 */
export function getLLMExecutor(template: Template, config: LLMExecutorConfig): LLMExecutor {
  const key = JSON.stringify(config.provider);
  const cached = executorCache.get(template);
  if (cached && cached.key === key) {
    return cached.executor;
  }
  const executor = new LLMExecutor(template, config);
  executorCache.set(template, { key, executor });
  return executor;
}