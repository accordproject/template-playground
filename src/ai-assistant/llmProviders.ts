import OpenAI from 'openai';
import { AIConfig, Message, TokenUsage } from '../types/components/AIAssistant.types';
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import Anthropic from '@anthropic-ai/sdk';
import { ChatCompletionStreamRequest } from '@mistralai/mistralai/models/components/chatcompletionstreamrequest';

export abstract class LLMProvider {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void,
    onTokenUsage?: (usage: TokenUsage) => void
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
    onComplete: () => void,
    onTokenUsage?: (usage: TokenUsage) => void
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
        stream_options: { include_usage: true }
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
        if (chunk.usage && onTokenUsage) {
          onTokenUsage({
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens
          });
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

export class AnthropicProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void,
    onTokenUsage?: (usage: TokenUsage) => void
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

      let inputTokens = 0;
      let outputTokens = 0;

      const stream = client.messages.stream(params);
      
      stream.on('text', (text) => onChunk(text));
      
      stream.on('message', (msg) => {
         if (msg.usage) {
             inputTokens = msg.usage.input_tokens;
             outputTokens = msg.usage.output_tokens;
         }
      });
      
      // Wait for the stream to finish
      await stream.finalMessage();
      
      if (onTokenUsage) {
          onTokenUsage({
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens
          });
      }

      onComplete();

    } catch(error) {
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
    onComplete: () => void,
    onTokenUsage?: (usage: TokenUsage) => void
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

      const result = await chat.sendMessageStream({
        message: geminiMessages.slice(-1)[0].parts[0].text,
      });
      
      for await (const chunk of result) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
        if (chunk.usageMetadata && onTokenUsage) {
            onTokenUsage({
                inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                outputTokens: chunk.usageMetadata.candidatesTokenCount || 0,
                totalTokens: chunk.usageMetadata.totalTokenCount || 0
            });
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
    onComplete: () => void,
    onTokenUsage?: (usage: TokenUsage) => void
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
        if (chunk.data.usage && onTokenUsage) {
             onTokenUsage({
                inputTokens: chunk.data.usage.promptTokens,
                outputTokens: chunk.data.usage.completionTokens,
                totalTokens: chunk.data.usage.totalTokens
             });
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
    case 'openai-compatible':
      if (!config.customEndpoint) {
        throw new Error('Custom API endpoint is required for OpenAI Compatible API');
      }
      return new OpenAICompatibleProvider(config, config.customEndpoint);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}