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
 * Structured-output reasoners for LLM-backed contract execution.
 *
 * Browser port of `src/llm/Reasoners.ts` on the template-engine `main` branch.
 * The engine version lazily `import()`s each provider SDK and constructs it
 * with Node defaults; every SDK here is instead statically imported (they are
 * already bundled for the AI chat panel) and constructed with
 * `dangerouslyAllowBrowser`, which the browser SDKs require.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import {
  ANTHROPIC_EFFORT_LEVELS,
  AnthropicEffort,
  EFFORT_THINKING_BUDGET,
  LLMProviderConfig,
  OPENAI_EFFORT_LEVELS,
  OpenAIEffort,
  ReasoningEffort,
} from './LLMConfig';

/** A single chat turn sent to a provider. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Raw content returned by a provider. */
export interface ReasonerResult {
  content: string;
}

export type JsonSchema = Record<string, unknown>;

/** Name of the structured-output contract shared by every provider. */
const OUTPUT_NAME = 'structured_output';

/** Default wall-clock budget for a single completion. */
const DEFAULT_TIMEOUT_MS = 120000;

/** Default output-token budget for a single completion. */
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Base interface for provider-specific reasoners.
 */
export abstract class BaseReasoner {
  protected readonly config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  /**
   * Completes a chat request.
   * @param messages - conversation turns
   * @param schema - optional JSON Schema the response must satisfy
   */
  abstract complete(messages: ChatMessage[], schema?: JsonSchema): Promise<ReasonerResult>;

  /** The configured output-token budget. */
  protected get maxTokens(): number {
    return this.config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  /**
   * Rejects if the wrapped request outlives the configured timeout, so a hung
   * provider surfaces as an error rather than a spinner that never stops.
   * @param work - the in-flight provider request
   * @returns the request's result
   */
  protected withTimeout<T>(work: Promise<T>): Promise<T> {
    const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`${this.config.provider} request timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });
    return Promise.race([work, timeout]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }
}

/**
 * Narrows a configured effort level to the ones a provider's API accepts,
 * throwing rather than silently falling back to the provider default.
 * @param effort - the configured effort level, if any
 * @param supported - the levels this provider accepts
 * @param providerLabel - provider name, used in the error message
 * @returns the effort level, or undefined when none was configured
 * @throws {Error} if the level is not one the provider supports
 */
function resolveEffort<T extends ReasoningEffort>(
  effort: ReasoningEffort | undefined,
  supported: readonly T[],
  providerLabel: string
): T | undefined {
  if (!effort) return undefined;
  if (!(supported as readonly string[]).includes(effort)) {
    throw new Error(
      `The ${providerLabel} provider does not support effort '${effort}'. ` +
        `Supported levels: ${supported.join(', ')}`
    );
  }
  return effort as T;
}

/**
 * Splits the system turns out of a conversation, since most provider APIs take
 * them as a separate top-level field rather than as messages.
 * @param messages - the conversation turns
 * @returns the joined system text and the remaining turns
 */
function splitSystem(messages: ChatMessage[]): {
  system: string;
  rest: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const system = messages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');
  const rest = messages
    .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));
  return { system, rest };
}

/**
 * Reasoner for any endpoint that speaks the OpenAI Chat Completions API:
 * OpenAI itself, OpenRouter, Ollama, and arbitrary compatible servers.
 */
export class OpenAICompatibleReasoner extends BaseReasoner {
  private readonly baseUrl: string;
  private readonly effort?: OpenAIEffort;
  /** OpenAI names the token cap `max_completion_tokens`; the clones kept `max_tokens`. */
  private readonly isNativeOpenAI: boolean;

  constructor(config: LLMProviderConfig, baseUrl: string, defaultApiKey = '') {
    super({ ...config, apiKey: config.apiKey || defaultApiKey });
    if (!this.config.apiKey) {
      throw new Error(`Missing API key for the ${config.provider} provider`);
    }
    this.baseUrl = baseUrl;
    this.isNativeOpenAI = config.provider === 'openai';
    this.effort = this.isNativeOpenAI
      ? resolveEffort(config.effort, OPENAI_EFFORT_LEVELS, 'openai')
      : undefined;
  }

  async complete(messages: ChatMessage[], schema?: JsonSchema): Promise<ReasonerResult> {
    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.baseUrl,
      dangerouslyAllowBrowser: true,
    });

    const options: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
    };

    if (this.isNativeOpenAI) {
      options.max_completion_tokens = this.maxTokens;
      if (this.effort) {
        // `minimal` shipped with the GPT-5 models but is missing from the
        // bundled SDK's union, so the level is passed through as-is.
        options.reasoning_effort = this.effort as NonNullable<
          OpenAI.Chat.ChatCompletionCreateParams['reasoning_effort']
        >;
      }
    } else {
      options.max_tokens = this.maxTokens;
      if (this.config.temperature !== undefined) options.temperature = this.config.temperature;
    }

    if (schema) {
      options.response_format = {
        type: 'json_schema',
        json_schema: { name: OUTPUT_NAME, strict: false, schema },
      };
    }

    const response = await this.withTimeout(client.chat.completions.create(options));
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error(`${this.config.provider}: no content in response`);
    return { content };
  }
}

/**
 * Anthropic-backed reasoner.
 *
 * The engine uses the Messages API's `output_config.format` / `output_config.effort`
 * parameters; the SDK the playground bundles predates both, so structured output
 * goes through a single forced tool whose `input_schema` is the response schema,
 * and `effort` is mapped onto an extended-thinking token budget.
 */
export class AnthropicReasoner extends BaseReasoner {
  private readonly effort?: AnthropicEffort;
  private readonly thinking: boolean;

  constructor(config: LLMProviderConfig) {
    super(config);
    if (!config.apiKey) throw new Error('Missing API key for the anthropic provider');
    this.effort = resolveEffort(config.effort, ANTHROPIC_EFFORT_LEVELS, 'anthropic');
    this.thinking = config.thinking ?? true;
  }

  async complete(messages: ChatMessage[], schema?: JsonSchema): Promise<ReasonerResult> {
    const client = new Anthropic({ apiKey: this.config.apiKey, dangerouslyAllowBrowser: true });
    const { system, rest } = splitSystem(messages);

    // Thinking tokens are drawn from the same budget as the answer, so the cap
    // has to clear the thinking budget with room to spare for the JSON itself.
    const thinkingBudget = this.thinking ? EFFORT_THINKING_BUDGET[this.effort ?? 'low'] : 0;
    const maxTokens = Math.max(this.maxTokens, thinkingBudget + DEFAULT_MAX_TOKENS);

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.config.model,
      max_tokens: maxTokens,
      messages: rest,
    };
    if (system) params.system = system;
    if (this.thinking) {
      params.thinking = { type: 'enabled', budget_tokens: thinkingBudget };
    }

    if (schema) {
      params.tools = [
        {
          name: OUTPUT_NAME,
          description: 'Return the contract execution result. Always use this tool.',
          input_schema: schema as Anthropic.Tool.InputSchema,
        },
      ];
      // Extended thinking and forced tool choice are mutually exclusive, so with
      // thinking on the tool is merely strongly requested rather than forced.
      params.tool_choice = this.thinking
        ? { type: 'auto' }
        : { type: 'tool', name: OUTPUT_NAME };
    }

    const response = await this.withTimeout(client.messages.create(params));

    if (response.stop_reason === 'max_tokens') {
      throw new Error(
        `Anthropic response hit the ${maxTokens}-token limit before completing. ` +
          'Raise Max Tokens, lower Effort, or turn off extended thinking in AI settings.'
      );
    }

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (toolUse && toolUse.type === 'tool_use') {
      return { content: JSON.stringify(toolUse.input) };
    }

    const text = response.content.find(block => block.type === 'text');
    if (text && text.type === 'text' && text.text) {
      return { content: text.text };
    }
    throw new Error('Anthropic: no structured output in response');
  }
}

/**
 * Google-backed reasoner.
 */
export class GoogleReasoner extends BaseReasoner {
  constructor(config: LLMProviderConfig) {
    super(config);
    if (!config.apiKey) throw new Error('Missing API key for the google provider');
  }

  async complete(messages: ChatMessage[], schema?: JsonSchema): Promise<ReasonerResult> {
    const client = new GoogleGenAI({ apiKey: this.config.apiKey });
    const { system, rest } = splitSystem(messages);

    const config: GenerateContentConfig = { maxOutputTokens: this.maxTokens };
    if (system) config.systemInstruction = system;
    if (this.config.temperature !== undefined) config.temperature = this.config.temperature;
    if (schema) {
      config.responseMimeType = 'application/json';
      config.responseJsonSchema = schema;
    }

    const response = await this.withTimeout(
      client.models.generateContent({
        model: this.config.model,
        contents: rest.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        config,
      })
    );

    const content = response.text;
    if (!content) throw new Error('GoogleReasoner: no content in response');
    return { content };
  }
}

/**
 * Mistral-backed reasoner.
 */
export class MistralReasoner extends BaseReasoner {
  constructor(config: LLMProviderConfig) {
    super(config);
    if (!config.apiKey) throw new Error('Missing API key for the mistral provider');
  }

  async complete(messages: ChatMessage[], schema?: JsonSchema): Promise<ReasonerResult> {
    const client = new Mistral({ apiKey: this.config.apiKey });

    const response = await this.withTimeout(
      client.chat.complete({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        maxTokens: this.maxTokens,
        ...(this.config.temperature !== undefined ? { temperature: this.config.temperature } : {}),
        ...(schema
          ? {
              responseFormat: {
                type: 'json_schema',
                jsonSchema: { name: OUTPUT_NAME, schemaDefinition: schema, strict: false },
              },
            }
          : {}),
      })
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('MistralReasoner: no content in response');
    }
    return { content };
  }
}

/**
 * Creates a provider-specific reasoner.
 * @param config - provider configuration
 * @returns a reasoner for the selected provider
 * @throws {Error} if the provider is unknown or misconfigured
 */
export function createReasoner(config: LLMProviderConfig): BaseReasoner {
  switch (config.provider) {
    case 'openai':
      return new OpenAICompatibleReasoner(config, 'https://api.openai.com/v1');
    case 'openrouter':
      return new OpenAICompatibleReasoner(config, 'https://openrouter.ai/api/v1');
    case 'ollama':
      return new OpenAICompatibleReasoner(
        config,
        config.customEndpoint || 'http://localhost:11434/v1',
        'ollama'
      );
    case 'openai-compatible':
      if (!config.customEndpoint) {
        throw new Error('An API endpoint is required for the OpenAI Compatible provider');
      }
      return new OpenAICompatibleReasoner(config, config.customEndpoint);
    case 'anthropic':
      return new AnthropicReasoner(config);
    case 'google':
      return new GoogleReasoner(config);
    case 'mistral':
      return new MistralReasoner(config);
    default: {
      const exhaustive: never = config.provider;
      throw new Error(`Unsupported provider: ${String(exhaustive)}`);
    }
  }
}
