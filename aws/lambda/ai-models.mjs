import {
  fetchJson,
  getProviderConfig,
  jsonResponse,
  parseBody,
} from './_ai-providers.mjs';

export async function handler(event) {
  if (event.requestContext?.http?.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const body = parseBody(event);
    if (!body) {
      return jsonResponse(400, { error: 'Invalid JSON body.' });
    }

    const config = getProviderConfig(body.provider);
    const models = await fetchModels(config);

    return jsonResponse(200, { models });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'AI proxy model request failed.',
    });
  }
}

async function fetchModels(config) {
  switch (config.type) {
    case 'openai': {
      const data = await fetchJson(config.modelsUrl, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return data.data?.map((model) => model.id).filter(Boolean) || [];
    }
    case 'anthropic': {
      const data = await fetchJson(config.modelsUrl, {
        headers: {
          'anthropic-version': '2023-06-01',
          'x-api-key': config.apiKey,
        },
      });
      return data.data?.map((model) => model.id).filter(Boolean) || [];
    }
    case 'google': {
      const data = await fetchJson(config.modelsUrl, {
        headers: { 'x-goog-api-key': config.apiKey },
      });
      return data.models?.map((model) => model.name).filter(Boolean) || [];
    }
    case 'mistral': {
      const data = await fetchJson(config.modelsUrl, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return data.data?.map((model) => model.id).filter(Boolean) || [];
    }
    default:
      return [];
  }
}
