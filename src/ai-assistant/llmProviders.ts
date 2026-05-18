import { AIConfig, Message } from '../types/components/AIAssistant.types';
import { getAIProxyEndpoint } from './aiProxy';

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

export class ServerProxyProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await fetch(getAIProxyEndpoint('chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: this.config.provider,
          model: this.config.model,
          messages,
          maxTokens: this.config.maxTokens,
        }),
      });

      const payload = await response.json().catch(() => null) as { content?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || `AI proxy request failed with status ${response.status}`);
      }

      if (payload?.content) {
        onChunk(payload.content);
      }
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export class OllamaProvider extends LLMProvider {
  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(({ role, content }) => ({ role, content })),
          stream: false,
          ...(this.config.maxTokens ? { max_tokens: this.config.maxTokens } : {}),
        }),
      });

      const payload = await response.json().catch(() => null) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || `Ollama request failed with status ${response.status}`);
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (content) {
        onChunk(content);
      }
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export function getLLMProvider(config: AIConfig): LLMProvider {
  if (config.provider === 'ollama') {
    return new OllamaProvider(config);
  }

  return new ServerProxyProvider(config);
}
