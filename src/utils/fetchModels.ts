/**
 * Utility for fetching available AI models from each supported provider.
 */
import { getAIProxyEndpoint } from '../ai-assistant/aiProxy';

export interface FetchModelsOptions {
  provider: string;
  signal?: AbortSignal;
}

interface ModelListResponse {
  models?: { name?: string; model?: string }[];
}

export async function fetchModels({
  provider,
  signal,
}: FetchModelsOptions): Promise<string[]> {
  try {
    if (provider === 'ollama') {
      const res = await fetch('http://localhost:11434/api/tags', { signal });
      if (!res.ok) {
        console.error(`Ollama fetch failed: ${res.statusText}`);
        return [];
      }
      const data = (await res.json()) as ModelListResponse;
      return (
        data.models
          ?.map((model) => model.name ?? model.model)
          .filter((name): name is string => Boolean(name)) ?? []
      );
    }

    const res = await fetch(getAIProxyEndpoint('models'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
      signal,
    });
    if (!res.ok) {
      console.error(`AI proxy model fetch failed (${res.status}): ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as { models?: string[] };
    return data.models ?? [];
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Failed to fetch models:', err);
    }
    return [];
  }
}
