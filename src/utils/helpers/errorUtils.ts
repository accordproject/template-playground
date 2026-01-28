// Helper function to extract meaningful error message from complex error objects

interface GoogleError {
  error: {
    message: string;
  };
}

interface MistralError {
  detail: string;
}

interface DirectMessageError {
  message: string;
}

// Type guards
const isGoogleError = (obj: unknown): obj is GoogleError => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    typeof (obj as GoogleError).error === 'object' &&
    'message' in (obj as GoogleError).error &&
    typeof (obj as GoogleError).error.message === 'string'
  );
};

const isMistralError = (obj: unknown): obj is MistralError => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'detail' in obj &&
    typeof (obj as MistralError).detail === 'string'
  );
};

const isDirectMessageError = (obj: unknown): obj is DirectMessageError => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as DirectMessageError).message === 'string'
  );
};

const isErrorWithStringError = (obj: unknown): obj is { error: string } => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    typeof (obj as { error: string }).error === 'string'
  );
};

export const extractErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Try to extract JSON from the message (might be prefixed with error type/code)
  const jsonMatch = errorMessage.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const parsed: unknown = JSON.parse(jsonMatch[0]);

      if (isGoogleError(parsed)) {
        // Handle nested error with message
        try {
          const inner: unknown = JSON.parse(parsed.error.message);
          if (isGoogleError(inner)) {
            return inner.error.message;
          }
        } catch {
          // inner message is not JSON, return as is
          return parsed.error.message;
        }
      }

      if (isErrorWithStringError(parsed)) {
        return parsed.error;
      }

      if (isMistralError(parsed)) {
        return parsed.detail;
      }

      if (isDirectMessageError(parsed)) {
        return parsed.message;
      }
    } catch {
      // JSON parsing failed, continue
    }
  }

  // Try to parse the entire message as JSON (for cleanly formatted JSON errors)
  try {
    const parsed: unknown = JSON.parse(errorMessage);

    if (isGoogleError(parsed)) {
      try {
        const innerParsed: unknown = JSON.parse(parsed.error.message);
        if (isGoogleError(innerParsed)) {
          return innerParsed.error.message;
        }
      } catch {
        return parsed.error.message;
      }
    }

    if (isErrorWithStringError(parsed)) {
      return parsed.error;
    }

    if (isMistralError(parsed)) {
      return parsed.detail;
    }

    if (isDirectMessageError(parsed)) {
      return parsed.message;
    }
  } catch {
    // Not JSON, return as is
  }

  return errorMessage;
};