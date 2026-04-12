interface NestedError {
  error?: {
    message?: string;
  };
}

interface CommonErrorStructure {
  error?: string | {
    message?: string;
  };
  detail?: string;
  message?: string;
}

export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const jsonMatch = errorMessage.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as CommonErrorStructure;
      
      if (parsed.error) {
        if (typeof parsed.error === 'object') {
          if (parsed.error.message) {
            if (typeof parsed.error.message === 'string') {
              try {
                const inner = JSON.parse(parsed.error.message) as NestedError;
                if (inner?.error?.message) {
                  return inner.error.message;
                }
              } catch {
                return parsed.error.message;
              }
            }
          }
        } else if (typeof parsed.error === 'string') {

        }
        // Handle error as string
        if (typeof parsed.error === 'string') {
          return parsed.error;
        }
      }
      
      if (parsed.detail) {
        return parsed.detail;
      }
      
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // Ignore
    }
  }
  
  try {
    const parsed = JSON.parse(errorMessage) as CommonErrorStructure;
    
    if (parsed.error) {
      if (typeof parsed.error === 'object') {
        if (parsed.error.message) {
          try {
            const innerParsed = JSON.parse(parsed.error.message) as NestedError;
            if (innerParsed.error && innerParsed.error.message) {
              return innerParsed.error.message;
            }
          } catch {
            return parsed.error.message;
          }
        }
      } else if (typeof parsed.error === 'string') {
        return parsed.error;
      }
    }
    
    if (parsed.detail) {
      return parsed.detail;
    }
    
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Ignore
  }
  
  return errorMessage;
};
