import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchModels } from '../../utils/fetchModels';

const providers = ['openai', 'openai-compatible', 'anthropic', 'google', 'groq', 'mistral', 'ollama', 'openrouter'];
const options = { apiKey: 'test-key', customEndpoint: 'https://example.test/v1' };

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe.each(providers)('fetchModels (%s)', (provider) => {
  it('distinguishes HTTP 503 from an empty successful list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [], models: [] }) });
    vi.stubGlobal('fetch', request);
    expect(await fetchModels({ provider, ...options })).toBeNull();
    expect(await fetchModels({ provider, ...options })).toEqual([]);
  });

  it('returns null for network and response parsing failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.reject(new SyntaxError('Invalid JSON')) }));
    expect(await fetchModels({ provider, ...options })).toBeNull();
    expect(await fetchModels({ provider, ...options })).toBeNull();
  });

  it('forwards cancellation and does not log aborted requests', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const controller = new AbortController();
    controller.abort();
    const request = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', request);
    expect(await fetchModels({ provider, ...options, signal: controller.signal })).toBeNull();
    expect(request).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
    expect(log).not.toHaveBeenCalled();
  });
});

it('does not treat missing discovery configuration as an empty successful list', async () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  expect(await fetchModels({ provider: 'openai' })).toBeNull();
  expect(await fetchModels({ provider: 'openai-compatible', apiKey: 'key' })).toBeNull();
  expect(await fetchModels({ provider: 'unsupported' })).toBeNull();
  expect(request).not.toHaveBeenCalled();
});
