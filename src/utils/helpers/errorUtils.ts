// Helper function to extract meaningful error message from complex error objects
export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  let errorMessage = error instanceof Error ? error.message : String(error);
  
  // Try to extract JSON from the message (might be prefixed with error type/code)
  let jsonMatch = errorMessage.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Handle Google error structure: {"error":{"message":"..."}}
      if (parsed.error) {
        if (typeof parsed.error === 'object') {
          // Handle nested error with message
          if (parsed.error.message) {
            if (typeof parsed.error.message === 'string') {
              try {
                const inner = JSON.parse(parsed.error.message);
                if (inner?.error?.message) {
                  return inner.error.message;
                }
              } catch {
                return parsed.error.message;
              }
            }
          }
        }
        // Handle error as string
        if (typeof parsed.error === 'string') {
          return parsed.error;
        }
      }
      
      // Handle Mistral error structure: {"detail":"..."}
      if (parsed.detail) {
        return parsed.detail;
      }
      
      // Handle direct error message
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // JSON parsing failed, continue
    }
  }
  
  // Try to parse the entire message as JSON (for cleanly formatted JSON errors)
  try {
    const parsed = JSON.parse(errorMessage);
    
    // Handle nested error structures
    if (parsed.error) {
      if (typeof parsed.error === 'object') {
        // Handle Google nested structure
        if (parsed.error.message) {
          // Check if the inner message is also JSON
          try {
            const innerParsed = JSON.parse(parsed.error.message);
            if (innerParsed.error && innerParsed.error.message) {
              return innerParsed.error.message;
            }
          } catch {
            return parsed.error.message;
          }
        }
      }
      if (typeof parsed.error === 'string') {
        return parsed.error;
      }
    }
    
    // Handle Mistral error structure: {"detail":"..."}
    if (parsed.detail) {
      return parsed.detail;
    }
    
    // Handle direct error message
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Not JSON, return as is
  }
  
  return errorMessage;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toNumericCode = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  return null;
};

const tryParseJson = (value: string): unknown | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
};

const getMessageFromPayload = (payload: Record<string, unknown>): string | null => {
  if (isRecord(payload.error) && typeof payload.error.message === 'string') {
    return payload.error.message;
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  return null;
};

const getCodeFromPayload = (payload: Record<string, unknown>): number | null => {
  const candidates: unknown[] = [
    payload.code,
    payload.status,
    payload.statusCode,
  ];

  if (isRecord(payload.error)) {
    candidates.push(payload.error.code, payload.error.status, payload.error.statusCode);
  }

  if (isRecord(payload.response)) {
    candidates.push(payload.response.code, payload.response.status, payload.response.statusCode);

    if (isRecord(payload.response.error)) {
      candidates.push(payload.response.error.code, payload.response.error.status, payload.response.error.statusCode);
    }
  }

  for (const candidate of candidates) {
    const parsed = toNumericCode(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

export const parseProviderError = (error: unknown): string => {
  if (!error) {
    return 'An unknown error occurred';
  }

  const originalMessage = error instanceof Error ? error.message : String(error);
  let extractedMessage: string | null = null;
  let code: number | null = null;

  const inspectPayload = (payload: unknown) => {
    if (!isRecord(payload)) {
      return;
    }

    if (code === null) {
      code = getCodeFromPayload(payload);
    }

    if (!extractedMessage) {
      extractedMessage = getMessageFromPayload(payload);
    }
  };

  inspectPayload(error);

  const parsedOriginalMessage = tryParseJson(originalMessage);
  if (parsedOriginalMessage) {
    inspectPayload(parsedOriginalMessage);
  }

  if (extractedMessage) {
    const parsedNestedMessage = tryParseJson(extractedMessage);
    if (parsedNestedMessage && isRecord(parsedNestedMessage)) {
      inspectPayload(parsedNestedMessage);

      const nestedMessage = getMessageFromPayload(parsedNestedMessage);
      if (nestedMessage) {
        extractedMessage = nestedMessage;
      }
    }
  }

  const normalizedMessage = (extractedMessage || originalMessage).trim() || 'An unknown error occurred';

  if (/api key.{0,20}(invalid|not valid)|invalid api key|api_key_invalid/i.test(normalizedMessage)) {
    return 'Invalid API key. Please check your AI configuration.';
  }

  if (code !== null) {
    if (code === 401) return 'Invalid API key. Please check your AI configuration.';
    if (code === 400) return 'Bad request. Please check your model name and settings.';
    if (code === 429) return 'Rate limit exceeded. Please wait and try again.';
    if (code === 500) return 'Provider server error. Please try again later.';
  }

  return normalizedMessage;
};
