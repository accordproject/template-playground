export const MODEL_PRICING = {
  'gpt-4-turbo': { input: 10.00, output: 30.00 }, // Prices per 1M tokens
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  // Default values for unknown models
  'default': { input: 0, output: 0 }
};

/**
 * Calculates the estimated cost of an interaction
 * @param model - The name of the LLM model
 * @param inputTokens - Number of tokens in the prompt
 * @param outputTokens - Number of tokens in the response
 * @returns cost in USD
 */
export const calculateEstimatedCost = (
  model: string, 
  inputTokens: number, 
  outputTokens: number
): number => {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING.default;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
};
