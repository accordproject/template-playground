/**
 * Utility for fetching available AI models from each supported provider.
 */

export interface FetchModelsOptions {
  provider: string;
  apiKey?: string;
  customEndpoint?: string;
  signal?: AbortSignal;
}

interface ModelListResponse {
  data?: { id: string }[];
  models?: { id?: string; name?: string; model?: string }[];
}

/**
 * Fetches the list of available model IDs for the given provider.
 * Returns an empty array if the provider is unsupported, the required
 * credentials are missing, or the network request fails.
 */
export async function fetchModels({
  provider,
  apiKey,
  customEndpoint,
  signal,
}: FetchModelsOptions): Promise<string[]> {
  try {
    switch (provider) {
      case 'openai':
      case 'openai-compatible': {
        if (!apiKey) return [];
        let endpoint =
          provider === 'openai-compatible' ? customEndpoint : 'https://api.openai.com/v1';
        if (!endpoint) return [];
        endpoint = endpoint.replace(/\/$/, '');
        const res = await fetch(`${endpoint}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        if (!res.ok) {
          console.error(`Fetch error (${res.status}): ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return data.data?.map((m) => m.id).filter((id): id is string => Boolean(id)) ?? [];
      }

      case 'anthropic': {
        if (!apiKey) return [];
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          signal,
        });
        if (!res.ok) {
          console.error(`Fetch error (${res.status}): ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return data.data?.map((m) => m.id).filter((id): id is string => Boolean(id)) ?? [];
      }

      case 'google': {
        if (!apiKey) return [];
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta2/models',
          { headers: { 'x-goog-api-key': apiKey }, signal }
        );
        if (!res.ok) {
          console.error(`Fetch error (${res.status}): ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return data.models?.map((m) => m.name).filter((name): name is string => Boolean(name)) ?? [];
      }

      case 'mistral': {
        if (!apiKey) return [];
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        if (!res.ok) {
          console.error(`Fetch error (${res.status}): ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return data.data?.map((m) => m.id).filter((id): id is string => Boolean(id)) ?? [];
      }

      case 'ollama': {
        const res = await fetch('http://localhost:11434/api/tags', { signal });
        if (!res.ok) {
          console.error(`Ollama fetch failed: ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return (
          data.models
            ?.map((m) => m.name ?? m.model)
            .filter((name): name is string => Boolean(name)) ?? []
        );
      }

      case 'openrouter': {
        if (!apiKey) return [];
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        if (!res.ok) {
          console.error(`Fetch error (${res.status}): ${res.statusText}`);
          return [];
        }
        const data = (await res.json()) as ModelListResponse;
        return data.data?.map((m) => m.id).filter((id): id is string => Boolean(id)) ?? [];
      }

      default:
        return [];
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Failed to fetch models:', err);
    }
    return [];
  }
}
