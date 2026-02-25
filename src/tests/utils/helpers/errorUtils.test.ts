import { extractErrorMessage } from "../../../utils/helpers/errorUtils";

describe("extractErrorMessage", () => {
  describe("Google AI API errors", () => {
    it("should extract message from Google standard error format", () => {
      const error = new Error(JSON.stringify({
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
          status: "INVALID_ARGUMENT",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              "reason": "API_KEY_INVALID",
              "domain": "googleapis.com",
              "metadata": { "service": "generativelanguage.googleapis.com" }
            }
          ]
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("API key not valid. Please pass a valid API key.");
    });

    it("should extract message from Google nested JSON error format", () => {
      const innerError = JSON.stringify({
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
          status: "INVALID_ARGUMENT"
        }
      });

      const error = new Error(JSON.stringify({
        error: {
          message: innerError
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("API key not valid. Please pass a valid API key.");
    });
  });

  describe("Anthropic errors", () => {
    it("should extract message from Anthropic error with prefix", () => {
      const error = new Error(
        'AuthenticationError: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CWyZGnibYfGyNj4fHAaSv"}'
      );

      const result = extractErrorMessage(error);
      expect(result).toBe("invalid x-api-key");
    });

    it("should extract string error from prefixed payload", () => {
      const error = new Error(
        'AuthenticationError: 401 {"error":"Simple error string"}'
      );

      const result = extractErrorMessage(error);
      expect(result).toBe("Simple error string");
    });

    it("should extract message from Anthropic pure JSON error", () => {
      const error = new Error(JSON.stringify({
        type: "error",
        error: {
          type: "authentication_error",
          message: "invalid x-api-key"
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("invalid x-api-key");
    });
  });

  describe("Mistral errors", () => {
    it("should extract message from Mistral error with prefix", () => {
      const error = new Error(
        'API error occurred: Status 401 Content-Type application/json; charset=utf-8 Body {"detail":"Unauthorized"}'
      );

      const result = extractErrorMessage(error);
      expect(result).toBe("Unauthorized");
    });

    it("should extract message from Mistral pure JSON error", () => {
      const error = new Error(JSON.stringify({
        detail: "Unauthorized"
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Unauthorized");
    });

    it("should handle Mistral rate limit error", () => {
      const error = new Error(JSON.stringify({
        detail: "Rate limit exceeded"
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Rate limit exceeded");
    });
  });

  describe("OpenAI/OpenRouter errors", () => {
    it("should extract message from OpenAI standard error format", () => {
      const error = new Error(JSON.stringify({
        error: {
          message: "Incorrect API key provided",
          type: "invalid_request_error",
          param: null,
          code: "invalid_api_key"
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Incorrect API key provided");
    });

    it("should extract message from simple message format", () => {
      const error = new Error(JSON.stringify({
        message: "Model not found"
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Model not found");
    });
  });

  describe("Generic error handling", () => {
    it("should handle plain Error objects", () => {
      const error = new Error("Something went wrong");

      const result = extractErrorMessage(error);
      expect(result).toBe("Something went wrong");
    });

    it("should handle string errors", () => {
      const error = "Network connection failed";

      const result = extractErrorMessage(error);
      expect(result).toBe("Network connection failed");
    });

    it("should handle null or undefined errors", () => {
      expect(extractErrorMessage(null)).toBe("An unknown error occurred");
      expect(extractErrorMessage(undefined)).toBe("An unknown error occurred");
    });

    it("should handle non-JSON string errors", () => {
      const error = new Error("This is not JSON");

      const result = extractErrorMessage(error);
      expect(result).toBe("This is not JSON");
    });

    it("should handle malformed JSON errors", () => {
      const error = new Error("Some text {invalid json} more text");

      const result = extractErrorMessage(error);
      // Since JSON parsing fails, it should return the original message
      expect(result).toBe("Some text {invalid json} more text");
    });
  });

  describe("Edge cases", () => {
    it("should handle error with error as string", () => {
      const error = new Error(JSON.stringify({
        error: "Simple error string"
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Simple error string");
    });

    it("should handle complex nested structures", () => {
      const error = new Error(JSON.stringify({
        error: {
          code: 500,
          message: "Internal server error",
          details: {
            nested: "information"
          }
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Internal server error");
    });

    it("should handle empty error message object", () => {
      const error = new Error(JSON.stringify({
        error: {}
      }));

      const result = extractErrorMessage(error);
      // When error object is empty, it returns the full JSON string
      expect(result).toBe('{"error":{}}');
    });

    it("should prefer error.message over message", () => {
      const error = new Error(JSON.stringify({
        error: {
          message: "Error from error.message"
        },
        message: "Error from message"
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("Error from error.message");
    });

    it("should handle JSON with whitespace and newlines", () => {
      const error = new Error(`
        {
          "error": {
            "message": "Formatted error message"
          }
        }
      `);

      const result = extractErrorMessage(error);
      expect(result).toBe("Formatted error message");
    });
  });

  describe("Real-world tested scenarios", () => {
    it("should handle the exact Google error from testing", () => {
      // This is the actual error format observed from Google AI
      const error = new Error(JSON.stringify({
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
          status: "INVALID_ARGUMENT",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              "reason": "API_KEY_INVALID",
              "domain": "googleapis.com",
              "metadata": {
                "service": "generativelanguage.googleapis.com"
              }
            },
            {
              "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
              "locale": "en-US",
              "message": "API key not valid. Please pass a valid API key."
            }
          ]
        }
      }));

      const result = extractErrorMessage(error);
      expect(result).toBe("API key not valid. Please pass a valid API key.");
    });

    it("should handle the exact Anthropic error from testing", () => {
      // This is the actual error format observed from Anthropic
      const error = new Error(
        'AuthenticationError: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CWyZGnibYfGyNj4fHAaSv"}'
      );

      const result = extractErrorMessage(error);
      expect(result).toBe("invalid x-api-key");
    });

    it("should handle the exact Mistral error from testing", () => {
      // This is the actual error format observed from Mistral
      const error = new Error(
        'API error occurred: Status 401 Content-Type application/json; charset=utf-8 Body {"detail":"Unauthorized"}'
      );

      const result = extractErrorMessage(error);
      expect(result).toBe("Unauthorized");
    });
  });
});
