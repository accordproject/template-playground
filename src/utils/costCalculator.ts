import pricingData from '../constants/aiPricing.json';
import { TokenUsage } from '../types/components/AIAssistant.types';

/**
 * Calculate estimated cost based on token usage and model pricing.
 * 
 * IMPORTANT: This provides rough estimates only. Actual costs may differ based on:
 * - Your subscription plan/tier
 * - Provider-specific discounts or usage limits
 * - Currency fluctuations
 * - Changes in provider pricing
 * 
 * Always verify actual billing in your provider's dashboard.
 * 
 * @param model - The model identifier (e.g., "gpt-4o", "claude-3-5-sonnet-20240620")
 * @param usage - Token usage data from the API response
 * @returns Estimated cost in USD, or 0 if pricing unavailable
 */
export const calculateCost = (model: string, usage: TokenUsage): number => {
  const models = pricingData.models as Record<string, { input: number; output: number }>;
  let pricing = models[model];

  // If no exact match, try to find the longest matching prefix
  // This handles versioned models (e.g., "gpt-4o-2024-08-06" -> "gpt-4o")
  if (!pricing) {
    const matchingKeys = Object.keys(models).filter(key => model.startsWith(key));
    if (matchingKeys.length > 0) {
      // Sort by length descending to get the most specific match
      // e.g. "gpt-4o-mini" should match "gpt-4o-mini" (len 11) before "gpt-4o" (len 6)
      matchingKeys.sort((a, b) => b.length - a.length);
      pricing = models[matchingKeys[0]];
    }
  }

  // Return 0 if pricing not available (will be handled in UI as N/A)
  if (!pricing) {
    return 0;
  }

  const inputCost = (usage.inputTokens / 1000000) * pricing.input;
  const outputCost = (usage.outputTokens / 1000000) * pricing.output;

  return inputCost + outputCost;
};

/**
 * Get pricing sources and last updated date from pricing configuration.
 */
export const getPricingInfo = () => {
  return {
    lastUpdated: pricingData.lastUpdated,
    sources: pricingData.sources
  };
};
