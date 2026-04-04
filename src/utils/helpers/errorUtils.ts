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
