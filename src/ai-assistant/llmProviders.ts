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

import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AIConfig, Message } from '../types/components/AIAssistant.types';
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import Anthropic from '@anthropic-ai/sdk';
import { ChatCompletionStreamRequest } from '@mistralai/mistralai/models/components/chatcompletionstreamrequest';
import type { Template } from '@accordproject/cicero-core';
import {
  LLMExecutor,
  LLMExecutorConfig,
  ReasoningEffort,
  LLMProviderConfig,
  getProviderCapabilities,
  isLLMConfigured,
} from '@accordproject/template-engine/lib/llm';

export { LLMExecutor } from '@accordproject/template-engine/lib/llm';
export type { InitResponse, TriggerResponse } from '@accordproject/template-engine/lib/llm';

/* ============================================================================
 * Chat providers — the AI Assistant chat panel
 * ==========================================================================*/

export abstract class LLMProvider {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void>;
}

export class OpenAICompatibleProvider extends LLMProvider {
  protected apiEndpoint: string;

  constructor(config: AIConfig, apiEndpoint: string) {
    super(config);
    this.apiEndpoint = apiEndpoint;
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.apiEndpoint,
        dangerouslyAllowBrowser: true
      });

      const options: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
        model: this.config.model,
        messages: formattedMessages,
        stream: true,
      };
      
      if (this.config.maxTokens) {
        options.max_tokens = this.config.maxTokens;
      }

      const stream = await openai.chat.completions.create(options);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(config: AIConfig) {
    super(config, 'https://api.openai.com/v1');
  }
}

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(config: AIConfig) {
    super(config, 'https://openrouter.ai/api/v1');
  }
}

export class OllamaProvider extends OpenAICompatibleProvider {
  constructor(config: AIConfig) {
    const modifiedConfig = { ...config, apiKey: config.apiKey || 'ollama' };
    super(modifiedConfig, 'http://localhost:11434/v1');
  }
}

/**
 * Uses groq-sdk directly rather than the generic OpenAI client pointed at
 * Groq's base URL — Groq's chat endpoint is OpenAI-compatible, but the
 * dedicated SDK is what `fetchModels`'s Groq branch already uses for the
 * model list, so this keeps both call sites on the same client.
 */
export class GroqProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const groq = new Groq({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true
      });

      const stream = await groq.chat.completions.create({
        model: this.config.model,
        messages: formattedMessages,
        stream: true,
        ...(this.config.maxTokens ? { max_tokens: this.config.maxTokens } : {}),
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export class AnthropicProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const client = new Anthropic({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true
      });

      const systemInstruction = messages.slice(-2, -1)[0]?.content || '';
      const formattedMessages: Anthropic.MessageParam[] = [];
      messages.forEach(
        (msg) => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            formattedMessages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      );

      const params: Anthropic.MessageStreamParams = {
        model: this.config.model,
        system: systemInstruction,
        messages: formattedMessages,
        max_tokens: this.config.maxTokens ?? 100000,
      }

      const stream = client.messages.stream(params);
      stream.on('text', (textDelta) => {
        onChunk(textDelta);
      });

      // Wait for stream to complete
      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => {
          resolve();
        });
        stream.on('error', (error) => {
          reject(error);
        });
      });

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

export class GoogleProvider extends LLMProvider {
  constructor(config: AIConfig) {
    super(config);
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const genAI = new GoogleGenAI({apiKey: this.config.apiKey});
      const systemInstruction = messages.slice(-2, -1)[0]?.content || '';
      const geminiMessages = this.convertToGeminiFormat(messages);
      const generationConfig: GenerateContentConfig = {};
      if (this.config.maxTokens) {
        generationConfig.maxOutputTokens = this.config.maxTokens;
      }
      if (systemInstruction) {
        generationConfig.systemInstruction = systemInstruction;
      }
      const chat = genAI.chats.create({
        model: this.config.model,
        history: geminiMessages.slice(0,-1),
        config: generationConfig
      });

      const stream = await chat.sendMessageStream({
        message: geminiMessages.slice(-1)[0].parts[0].text,
      });
      for await (const chunk of stream) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private convertToGeminiFormat(messages: Message[]) {
    const geminiMessages = [];
    
    for (const message of messages) {
      const role = message.role === 'assistant' ? 'model' : message.role;
      if (role !== "system") {
        geminiMessages.push({
          role: role,
          parts: [{ text: message.content }]
        });
      }
    }
    
    return geminiMessages;
  }
}

export class MistralProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const mistral = new Mistral({apiKey: this.config.apiKey});

      const options: ChatCompletionStreamRequest = {
        model: this.config.model,
        messages: formattedMessages,
      };

      if (this.config.maxTokens) {
        options.maxTokens = this.config.maxTokens;
      }

      const stream = await mistral.chat.stream(options);

      for await (const chunk of stream) {
        const content = chunk.data.choices[0]?.delta?.content || '';
        if (content) {
          onChunk((content as string));
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export function getLLMProvider(config: AIConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'google':
      return new GoogleProvider(config);
    case 'mistral':
      return new MistralProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'groq':
      return new GroqProvider(config);
    case 'ollama':  
      return new OllamaProvider(config);
    case 'openai-compatible':
      if (!config.customEndpoint) {
        throw new Error('Custom API endpoint is required for OpenAI Compatible API');
      }
      return new OpenAICompatibleProvider(config, config.customEndpoint);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/** Which engine produced the artifacts currently shown in the runner. */
export enum ExecutionEngine {
  TypeScript = 'typescript',
  LLM = 'llm',
}

/**
 * The provider ids the playground's AI settings form offers. Kept as a named alias
 * (rather than having every call site import `LLMProviderConfig` just to
 * reach into it) so an upstream provider add/remove is still a compile error
 * here instead of silent drift.
 */
export type LLMProviderId = LLMProviderConfig['provider'];

/**
 * The execution modes the Contract Runner offers, mirroring the upstream
 * `LLMMode` union (`'disabled' | 'fallback' | 'force'`) as a real enum, so
 * callers get `LLMMode.Disabled` / `Object.values(LLMMode)`.
 */
export enum LLMMode {
  Disabled = 'disabled',
  Fallback = 'fallback',
  Force = 'force',
}

/**
 * Maps the playground's AI settings onto the executor configuration, dropping
 * any tuning knob the chosen provider does not honour.
 * @param aiConfig - the AI configuration held in the global store
 * @param mode - the execution mode selected in the Contract Runner
 * @returns the executor configuration
 * @throws {Error} if the AI configuration is missing or incomplete
 */
export function buildLLMExecutorConfig(
  aiConfig: AIConfig | null | undefined,
  mode: LLMMode
): LLMExecutorConfig {
  if (!isLLMConfigured(aiConfig)) {
    throw new Error(
      'AI execution requires a provider, model and API key. Open Settings → AI Configuration to set them up.'
    );
  }
  const config = aiConfig!;
  const provider = config.provider as LLMProviderId;
  const capabilities = getProviderCapabilities(provider);

  return {
    mode,
    provider: {
      provider,
      model: config.model,
      apiKey: config.apiKey,
      customEndpoint: config.customEndpoint,
      isStructuredOutputSupported: capabilities.structuredOutput,
      ...(capabilities.effort && config.effort
        ? { effort: config.effort as ReasoningEffort }
        : {}),
      ...(capabilities.thinking ? { thinking: config.thinking ?? true } : {}),
      ...(capabilities.temperature && config.temperature !== undefined
        ? { temperature: config.temperature }
        : {}),
      ...(config.maxTokens ? { maxTokens: config.maxTokens } : {}),
    } as LLMProviderConfig,
    verbose: import.meta.env.DEV,
  };
}

/**
 * One cached executor per template. Rebuilding it on every run would re-derive
 * the whole JSON Schema from the ModelManager, so it is kept until either the
 * template or the AI configuration changes.
 */
const executorCache = new WeakMap<object, { key: string; executor: LLMExecutor }>();

/**
 * Returns the executor for a template, reusing the cached one when the
 * configuration has not changed.
 * @param template - the template to execute
 * @param config - the executor configuration
 * @returns an executor bound to the template
 */
export function getLLMExecutor(template: Template, config: LLMExecutorConfig): LLMExecutor {
  const key = JSON.stringify(config.provider);
  const cached = executorCache.get(template as unknown as object);
  if (cached && cached.key === key) {
    return cached.executor;
  }
  const executor = new LLMExecutor(template, config);
  executorCache.set(template as unknown as object, { key, executor });
  return executor;
}