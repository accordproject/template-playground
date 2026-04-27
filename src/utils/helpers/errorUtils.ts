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

export const parseProviderError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  const err = error as Record<string, unknown>;

  // 1. Extract message first
  const message =
    error instanceof Error
      ? error.message
      : typeof err?.message === 'string'
        ? err.message
        : String(error);

  // 2. Check for invalid API key patterns in the message before checking status codes
  if (/api key/i.test(message) && /invalid/i.test(message)) {
    return 'Invalid API key. Please check your AI configuration.';
  }
  // Handle Google's specific "INVALID_ARGUMENT" status in the message
  if (message.includes('INVALID_ARGUMENT')) {
    return 'Invalid API key. Please check your AI configuration.';
  }

  // 3. Then, check status codes as a fallback
  const rawCode = err?.status ?? err?.code ?? err?.statusCode ?? null;
  let code: number | null = null;
  if (typeof rawCode === 'number' && Number.isFinite(rawCode)) {
    code = rawCode;
  } else if (typeof rawCode === 'string' && /^\d+$/.test(rawCode.trim())) {
    code = Number(rawCode.trim());
  }

  if (code === 401) return 'Invalid API key. Please check your AI configuration.';
  if (code === 400) return 'Bad request. Please check your model name and settings.';
  if (code === 429) return 'Rate limit exceeded. Please wait and try again.';
  if (code === 500) return 'Provider server error. Please try again later.';

  // 4. Return the original message if no specific pattern or code was matched
  return message || 'An unknown error occurred';
};
