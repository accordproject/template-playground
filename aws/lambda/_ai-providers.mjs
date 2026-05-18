const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const OPENAI_COMPATIBLE_BASE_URL = process.env.OPENAI_COMPATIBLE_BASE_URL;

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

export function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}

function providerConfig(provider) {
  switch (provider) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY,
        chatUrl: 'https://api.openai.com/v1/chat/completions',
        modelsUrl: 'https://api.openai.com/v1/models',
        type: 'openai',
      };
    case 'openrouter':
      return {
        apiKey: process.env.OPENROUTER_API_KEY,
        chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
        modelsUrl: 'https://openrouter.ai/api/v1/models',
        type: 'openai',
      };
    case 'openai-compatible': {
      const baseUrl = OPENAI_COMPATIBLE_BASE_URL?.replace(/\/$/, '');
      return {
        apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
        chatUrl: baseUrl ? `${baseUrl}/chat/completions` : undefined,
        modelsUrl: baseUrl ? `${baseUrl}/models` : undefined,
        type: 'openai',
      };
    }
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY,
        modelsUrl: 'https://api.anthropic.com/v1/models',
        type: 'anthropic',
      };
    case 'google':
      return {
        apiKey: process.env.GOOGLE_API_KEY,
        modelsUrl: 'https://generativelanguage.googleapis.com/v1beta2/models',
        type: 'google',
      };
    case 'mistral':
      return {
        apiKey: process.env.MISTRAL_API_KEY,
        chatUrl: 'https://api.mistral.ai/v1/chat/completions',
        modelsUrl: 'https://api.mistral.ai/v1/models',
        type: 'mistral',
      };
    default:
      return null;
  }
}

export function getProviderConfig(provider) {
  const config = providerConfig(provider);
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  if (!config.apiKey) {
    throw new Error(`Server API key is not configured for provider: ${provider}`);
  }
  return config;
}

export function validateModel(model) {
  if (typeof model !== 'string' || !model.trim()) {
    throw new Error('Model is required.');
  }
  return model.trim();
}

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages are required.');
  }

  return messages
    .filter((message) => message && typeof message.content === 'string')
    .map((message) => ({
      role: message.role === 'assistant' || message.role === 'system' ? message.role : 'user',
      content: message.content,
    }));
}

export function getProviderError(status, text) {
  const detail = text ? `: ${text.slice(0, 500)}` : '';
  return new Error(`Provider request failed with status ${status}${detail}`);
}

export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw getProviderError(response.status, text);
  }

  return text ? JSON.parse(text) : {};
}

export function getSystemPrompt(messages) {
  return messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
}

export function getConversationMessages(messages) {
  return messages.filter((message) => message.role === 'user' || message.role === 'assistant');
}
