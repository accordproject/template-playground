// Helper function to extract meaningful error message from complex error objects
export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Try to extract JSON from the message (might be prefixed with error type/code)
  const jsonMatch = errorMessage.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      // Handle Google error structure: {"error":{"message":"..."}}
      if (parsed.error) {
        if (typeof parsed.error === 'object' && parsed.error !== null) {
          const errorObj = parsed.error as Record<string, unknown>;
          // Handle nested error with message
          if (errorObj.message) {
            if (typeof errorObj.message === 'string') {
              try {
                const inner = JSON.parse(errorObj.message) as Record<string, unknown>;
                if (inner?.error && typeof inner.error === 'object' && inner.error !== null) {
                  const innerError = inner.error as Record<string, unknown>;
                  if (typeof innerError.message === 'string') {
                    return innerError.message;
                  }
                }
              } catch {
                return errorObj.message;
              }
            }
          }
          // Handle error as string
          if (typeof parsed.error === 'string') {
            return parsed.error;
          }
        }
      }

      // Handle Mistral error structure: {"detail":"..."}
      if (typeof parsed.detail === 'string') {
        return parsed.detail;
      }

      // Handle direct error message
      if (typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {
      // JSON parsing failed, continue
    }
  }

  // Try to parse the entire message as JSON (for cleanly formatted JSON errors)
  try {
    const parsed = JSON.parse(errorMessage) as Record<string, unknown>;

    // Handle nested error structures
    if (parsed.error) {
      if (typeof parsed.error === 'object' && parsed.error !== null) {
        const errorObj = parsed.error as Record<string, unknown>;
        // Handle Google nested structure
        if (typeof errorObj.message === 'string') {
          // Check if the inner message is also JSON
          try {
            const innerParsed = JSON.parse(errorObj.message) as Record<string, unknown>;
            if (innerParsed.error && typeof innerParsed.error === 'object' && innerParsed.error !== null) {
              const innerError = innerParsed.error as Record<string, unknown>;
              if (typeof innerError.message === 'string') {
                return innerError.message;
              }
            }
          } catch {
            return errorObj.message;
          }
        }
      }
      if (typeof parsed.error === 'string') {
        return parsed.error;
      }
    }

    // Handle Mistral error structure: {"detail":"..."}
    if (typeof parsed.detail === 'string') {
      return parsed.detail;
    }

    // Handle direct error message
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    // Not JSON, return as is
  }

  return errorMessage;
};