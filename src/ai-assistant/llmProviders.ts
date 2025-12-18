import OpenAI from 'openai';
import { AIConfig, Message } from '../types/components/AIAssistant.types';
import { GoogleGenAI, GenerateContentConfig } from '@google/generative-ai'; // Corrected import
import { Mistral } from '@mistralai/mistralai';
import Anthropic from '@anthropic-ai/sdk';
import { ChatCompletionStreamRequest } from '@mistralai/mistralai/models/components/chatcompletionstreamrequest';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

export abstract class LLMProvider {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: (usage?: TokenUsage) => void // Updated to accept usage
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
    onComplete: (usage?: TokenUsage) => void
  ): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role as "system" | "user" | "assistant",
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
        stream_options: { include_usage: true } // Required to get usage in stream
      };
      
      if (this.config.maxTokens) {
        options.max_tokens = this.config.maxTokens;
      }

      let finalUsage: TokenUsage | undefined;

      const stream = await openai.chat.completions.create(options);

      for await (const chunk of stream) {
        // The last chunk contains usage if include_usage is true
        if (chunk.usage) {
          finalUsage = {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens
          };
        }

        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
      
      onComplete(finalUsage);
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

export class AnthropicProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: (usage?: TokenUsage) => void
  ): Promise<void> {
    try {
      const client = new Anthropic({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true
      });

      const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
      const formattedMessages: Anthropic.MessageParam[] = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      let promptTokens = 0;
      let completionTokens = 0;

      await client.messages.stream({
        model: this.config.model,
        system: systemInstruction,
        messages: formattedMessages,
        max_tokens: this.config.maxTokens ?? 4096,
      })
      .on('streamEvent', (event) => {
        // Anthropic sends usage in message_start and message_delta/stop events
        if (event.type === 'message_start') {
          promptTokens = event.message.usage.input_tokens;
        } else if (event.type === 'message_delta') {
          completionTokens = event.usage.output_tokens;
        }
      })
      .on('text', (textDelta) => {
        onChunk(textDelta);
      })
      .on('finalMessage', (message) => {
          onComplete({
            prompt_tokens: message.usage.input_tokens,
            completion_tokens: message.usage.output_tokens
          });
      });

    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

export class GoogleProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: (usage?: TokenUsage) => void
  ): Promise<void> {
    try {
      const genAI = new GoogleGenAI(this.config.apiKey);
      const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
      const geminiMessages = this.convertToGeminiFormat(messages);
      
      const model = genAI.getGenerativeModel({ 
        model: this.config.model,
        systemInstruction: systemInstruction 
      });

      const result = await model.generateContentStream({
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
        },
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          onChunk(chunkText);
        }
      }

      const response = await result.response;
      onComplete({
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0
      });

    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private convertToGeminiFormat(messages: Message[]) {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
  }
}

export class MistralProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: (usage?: TokenUsage) => void
  ): Promise<void> {
    try {
      const mistral = new Mistral({ apiKey: this.config.apiKey });

      const stream = await mistral.chat.stream({
        model: this.config.model,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        maxTokens: this.config.maxTokens,
      });

      let finalUsage: TokenUsage | undefined;

      for await (const chunk of stream) {
        // Mistral usage is usually in the final chunk
        if (chunk.data.usage) {
          finalUsage = {
            prompt_tokens: chunk.data.usage.promptTokens,
            completion_tokens: chunk.data.usage.completionTokens
          };
        }
        const content = chunk.data.choices[0]?.delta?.content || '';
        if (content) onChunk(content as string);
      }
      
      onComplete(finalUsage);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export function getLLMProvider(config: AIConfig): LLMProvider {
  switch (config.provider) {
    case 'openai': return new OpenAIProvider(config);
    case 'anthropic': return new AnthropicProvider(config);
    case 'google': return new GoogleProvider(config);
    case 'mistral': return new MistralProvider(config);
    case 'openrouter': return new OpenRouterProvider(config);
    case 'openai-compatible': return new OpenAICompatibleProvider(config, config.customEndpoint!);
    default: throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
