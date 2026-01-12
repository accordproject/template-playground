/**
 * Enum for supported AI Models to prevent "magic strings"
 */
export enum AIModel {
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  DEFAULT = 'default'
}

interface Pricing {
  input: number;
  output: number;
}

/**
 * Prices per 1M tokens
 * Using Record<AIModel, Pricing> ensures every enum member has a price defined
 */
export const MODEL_PRICING: Record<AIModel, Pricing> = {
  [AIModel.GPT_4_TURBO]: { input: 10.00, output: 30.00 },
  [AIModel.GPT_3_5_TURBO]: { input: 0.50, output: 1.50 },
  [AIModel.CLAUDE_3_OPUS]: { input: 15.00, output: 75.00 },
  [AIModel.CLAUDE_3_SONNET]: { input: 3.00, output: 15.00 },
  [AIModel.DEFAULT]: { input: 0, output: 0 }
};

/**
 * Calculates the estimated cost of an interaction
 */
export const calculateEstimatedCost = (
  model: AIModel | string, 
  inputTokens: number, 
  outputTokens: number
): number => {
  // We check if the string provided exists in our pricing map
  const pricing = MODEL_PRICING[model as AIModel] || MODEL_PRICING[AIModel.DEFAULT];
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
};
