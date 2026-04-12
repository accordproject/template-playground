// Helper function to extract meaningful error message from complex error objects
export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Try to extract JSON from the message using progressive approach
  // Find the first '{' and try to parse valid JSON from there
  const firstBrace = errorMessage.indexOf('{');
  if (firstBrace !== -1) {
    // Try progressively larger substrings to find valid JSON
    for (let i = errorMessage.length; i > firstBrace; i--) {
      const candidate = errorMessage.slice(firstBrace, i);
      try {
        const parsed = JSON.parse(candidate);
      
        // Handle Google error structure: {"error":{"message":"..."}}
        if (parsed.error) {
          // Handle error as string first
          if (typeof parsed.error === 'string') {
            return parsed.error;
          }
          // Handle nested error with message (object case)
          if (typeof parsed.error === 'object') {
            if (parsed.error.message) {
              if (typeof parsed.error.message === 'string') {
                try {
                  const inner = JSON.parse(parsed.error.message);
                  if (inner?.error?.message) {
                    return inner.error.message;
                  }
                  // JSON parsed but no inner.error.message, return original
                  return parsed.error.message;
                } catch {
                  return parsed.error.message;
                }
              }
            }
          }
        }
      
        // Handle Mistral error structure: {"detail":"..."}
        if (parsed.detail && typeof parsed.detail === 'string') {
          return parsed.detail;
        }
      
        // Handle direct error message
        if (parsed.message && typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        // JSON parsing failed for this candidate, try shorter substring
        continue;
      }
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
    if (parsed.detail && typeof parsed.detail === 'string') {
      return parsed.detail;
    }
    
    // Handle direct error message
    if (parsed.message && typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    // Not JSON, return as is
  }
  
  return errorMessage;
};
