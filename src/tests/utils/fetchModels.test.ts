import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchModels } from '../../utils/fetchModels';

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

describe('fetchModels', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('google', () => {
    it('queries the v1beta models endpoint with the API key header', async () => {
      global.fetch = mockFetch({ models: [] });

      await fetchModels({ provider: 'google', apiKey: 'test-key' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];
      expect(String(url)).toContain('https://generativelanguage.googleapis.com/v1beta/models');
      expect(String(url)).not.toContain('v1beta2');
      expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    });

    it('returns only models that support generateContent', async () => {
      global.fetch = mockFetch({
        models: [
          { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
          { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
          { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        ],
      });

      const models = await fetchModels({ provider: 'google', apiKey: 'test-key' });

      expect(models).toEqual(['models/gemini-2.0-flash', 'models/gemini-1.5-pro']);
    });

    it('keeps models when supportedGenerationMethods is absent', async () => {
      global.fetch = mockFetch({ models: [{ name: 'models/gemini-custom' }] });

      const models = await fetchModels({ provider: 'google', apiKey: 'test-key' });

      expect(models).toEqual(['models/gemini-custom']);
    });

    it('returns an empty list without calling the API when the key is missing', async () => {
      global.fetch = mockFetch({ models: [] });

      const models = await fetchModels({ provider: 'google' });

      expect(models).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns an empty list when the API responds with an error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      global.fetch = mockFetch({}, false, 404);

      const models = await fetchModels({ provider: 'google', apiKey: 'test-key' });

      expect(models).toEqual([]);
    });
  });
});
