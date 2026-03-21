// Helper function to extract meaningful error message from complex error objects

interface ParsedError {
  error?: string | {
    message?: string;
  };
  detail?: string;
  message?: string;
}

export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Try to extract JSON from the message (might be prefixed with error type/code)
  const jsonMatch = errorMessage.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as ParsedError;
      
      // Handle Google error structure: {"error":{"message":"..."}}
      if (parsed.error !== undefined) {
        if (typeof parsed.error === 'object' && parsed.error !== null) {
          // Handle nested error with message
          if (parsed.error.message) {
            if (typeof parsed.error.message === 'string') {
              try {
                const inner = JSON.parse(parsed.error.message) as ParsedError;
                if (inner.error !== undefined && typeof inner.error === 'object' && inner.error?.message) {
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
    const parsed = JSON.parse(errorMessage) as ParsedError;
    
    // Handle nested error structures
    if (parsed.error !== undefined) {
      if (typeof parsed.error === 'object' && parsed.error !== null) {
        // Handle Google nested structure
        if (parsed.error.message) {
          // Check if the inner message is also JSON
          try {
            const innerParsed = JSON.parse(parsed.error.message) as ParsedError;
            if (innerParsed.error !== undefined && typeof innerParsed.error === 'object' && innerParsed.error.message) {
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