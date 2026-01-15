import OpenAI from 'openai';
import { AIConfig, Message, Attachment } from '../types/components/AIAssistant.types';
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
    onComplete: () => void
  ): Promise<void>;

  protected formatAttachments(attachments?: Attachment[]): string {
    if (!attachments || attachments.length === 0) return '';
    
    let attachmentText = '\n\n--- Attached Files ---\n';
    for (const att of attachments) {
      attachmentText += `\nFile: ${att.fileName} (${att.mimeType})\n`;
      
      // For text files, decode and include content
      if (att.fileType === 'text' || att.mimeType === 'application/json') {
        try {
          const decoded = atob(att.base64Content);
          attachmentText += `Content:\n${decoded}\n`;
        } catch (e) {
          attachmentText += '[Content could not be decoded]\n';
        }
      } else if (att.fileType === 'image') {
        attachmentText += '[Image attached - see multimodal content]\n';
      } else {
        attachmentText += '[Binary file attached]\n';
      }
    }
    return attachmentText;
  }
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
      const formattedMessages = messages.map(msg => {
        // Handle attachments for user messages
        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
          const imageAttachments = msg.attachments.filter(att => att.fileType === 'image');
          
          // If we have images and model supports vision, use multimodal format
          if (imageAttachments.length > 0) {
            const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: 'text', text: msg.content }
            ];
            
            // Add images
            imageAttachments.forEach(img => {
              content.push({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType};base64,${img.base64Content}`
                }
              });
            });
            
            // Add text attachments as text
            const textContent = this.formatAttachments(
              msg.attachments.filter(att => att.fileType !== 'image')
            );
            if (textContent) {
              content[0].text += textContent;
            }
            
            return {
              role: msg.role,
              content: content as never
            };
          }
        }
        
        // Default text-only format
        let content = msg.content;
        if (msg.attachments) {
          content += this.formatAttachments(msg.attachments);
        }
        
        return {
          role: msg.role,
          content: content
        };
      });

      const openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.apiEndpoint,
        dangerouslyAllowBrowser: true
      });

      const options: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
        model: this.config.model,
        messages: formattedMessages as never,
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
            // Handle attachments for user messages
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
              const imageAttachments = msg.attachments.filter(att => att.fileType === 'image');
              
              if (imageAttachments.length > 0) {
                // Anthropic multimodal format
                const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [
                  { type: 'text', text: msg.content }
                ];
                
                // Add images
                imageAttachments.forEach(img => {
                  content.push({
                    type: 'image' as const,
                    source: {
                      type: 'base64',
                      media_type: img.mimeType,
                      data: img.base64Content
                    }
                  } as never);
                });
                
                // Add text attachments
                const textContent = this.formatAttachments(
                  msg.attachments.filter(att => att.fileType !== 'image')
                );
                if (textContent) {
                  content[0].text += textContent;
                }
                
                formattedMessages.push({
                  role: msg.role,
                  content: content as never,
                });
                return;
              }
            }
            
            // Default text format
            let content = msg.content;
            if (msg.attachments) {
              content += this.formatAttachments(msg.attachments);
            }
            
            formattedMessages.push({
              role: msg.role,
              content: content,
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
        console.log(textDelta)
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
        message: geminiMessages.slice(-1)[0].parts[0].text || '',
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
        // Handle attachments for user messages
        if (message.role === 'user' && message.attachments && message.attachments.length > 0) {
          const imageAttachments = message.attachments.filter(att => att.fileType === 'image');
          
          if (imageAttachments.length > 0) {
            // Google multimodal format
            const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
              { text: message.content }
            ];
            
            // Add images
            imageAttachments.forEach(img => {
              parts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Content
                }
              });
            });
            
            // Add text attachments
            const textContent = this.formatAttachments(
              message.attachments.filter(att => att.fileType !== 'image')
            );
            if (textContent) {
              parts[0].text += textContent;
            }
            
            geminiMessages.push({
              role: role,
              parts: parts
            });
            continue;
          }
        }
        
        // Default text format
        let content = message.content;
        if (message.attachments) {
          content += this.formatAttachments(message.attachments);
        }
        
        geminiMessages.push({
          role: role,
          parts: [{ text: content }]
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
      const formattedMessages = messages.map(msg => {
        // Add attachment text for Mistral (no native vision support for most models)
        let content = msg.content;
        if (msg.attachments) {
          content += this.formatAttachments(msg.attachments);
        }
        
        return {
          role: msg.role,
          content: content
        };
      });

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

export interface ModelCapabilities {
  supportsVision: boolean;
  supportsDocuments: boolean;
}

export function getModelCapabilities(_provider: string, model: string): ModelCapabilities {
  const modelLower = model.toLowerCase();
  
  // Vision-capable models
  const visionModels = [
    'gpt-4o', 'gpt-4-turbo', 'gpt-4-vision',
    'claude-3', 'claude-opus', 'claude-sonnet', 'claude-haiku',
    'gemini-pro-vision', 'gemini-1.5', 'gemini-2.0',
    'pixtral'
  ];
  
  const supportsVision = visionModels.some(vm => modelLower.includes(vm));
  
  // Most models support text documents
  const supportsDocuments = true;
  
  return {
    supportsVision,
    supportsDocuments
  };
}