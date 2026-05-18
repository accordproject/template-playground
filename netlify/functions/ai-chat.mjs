import {
  fetchJson,
  getConversationMessages,
  getProviderConfig,
  getSystemPrompt,
  jsonResponse,
  optionsResponse,
  parseBody,
  validateMessages,
  validateModel,
} from './_ai-providers.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return optionsResponse();
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const body = parseBody(event);
    if (!body) {
      return jsonResponse(400, { error: 'Invalid JSON body.' });
    }

    const provider = body.provider;
    const model = validateModel(body.model);
    const messages = validateMessages(body.messages);
    const maxTokens = Number.isFinite(body.maxTokens) ? body.maxTokens : undefined;
    const config = getProviderConfig(provider);

    switch (config.type) {
      case 'openai':
        return jsonResponse(200, {
          content: await chatOpenAICompatible(config, model, messages, maxTokens),
        });
      case 'anthropic':
        return jsonResponse(200, {
          content: await chatAnthropic(config, model, messages, maxTokens),
        });
      case 'google':
        return jsonResponse(200, {
          content: await chatGoogle(config, model, messages, maxTokens),
        });
      case 'mistral':
        return jsonResponse(200, {
          content: await chatMistral(config, model, messages, maxTokens),
        });
      default:
        return jsonResponse(400, { error: `Unsupported provider: ${provider}` });
    }
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'AI proxy request failed.',
    });
  }
}

async function chatOpenAICompatible(config, model, messages, maxTokens) {
  const payload = {
    model,
    messages: messages.map(({ role, content }) => ({ role, content })),
  };

  if (maxTokens) {
    payload.max_tokens = maxTokens;
  }

  const data = await fetchJson(config.chatUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return data.choices?.[0]?.message?.content || '';
}

async function chatAnthropic(config, model, messages, maxTokens) {
  const data = await fetchJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify({
      model,
      system: getSystemPrompt(messages),
      messages: getConversationMessages(messages),
      max_tokens: maxTokens || 4096,
    }),
  });

  return data.content?.map((part) => part.text || '').join('') || '';
}

async function chatGoogle(config, model, messages, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const conversation = getConversationMessages(messages).map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  const body = {
    contents: conversation,
    generationConfig: {},
  };

  const systemPrompt = getSystemPrompt(messages);
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  if (maxTokens) {
    body.generationConfig.maxOutputTokens = maxTokens;
  }

  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
}

async function chatMistral(config, model, messages, maxTokens) {
  const payload = {
    model,
    messages: messages.map(({ role, content }) => ({ role, content })),
  };

  if (maxTokens) {
    payload.max_tokens = maxTokens;
  }

  const data = await fetchJson(config.chatUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return data.choices?.[0]?.message?.content || '';
}
