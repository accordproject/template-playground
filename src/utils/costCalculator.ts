import pricingData from '../constants/aiPricing.json';
import { TokenUsage } from '../types/components/AIAssistant.types';

export const calculateCost = (model: string, usage: TokenUsage): number => {
  const models = pricingData.models as Record<string, { input: number; output: number }>;
  let pricing = models[model];

  // If no exact match, try to find the longest matching prefix
  if (!pricing) {
    const matchingKeys = Object.keys(models).filter(key => model.startsWith(key));
    if (matchingKeys.length > 0) {
      // Sort by length descending to get the most specific match
      // e.g. "gpt-4o-mini" should match "gpt-4o-mini" (len 11) before "gpt-4o" (len 6)
      matchingKeys.sort((a, b) => b.length - a.length);
      pricing = models[matchingKeys[0]];
    }
  }

  if (!pricing) {
    return 0;
  }

  const inputCost = (usage.inputTokens / 1000000) * pricing.input;
  const outputCost = (usage.outputTokens / 1000000) * pricing.output;

  return inputCost + outputCost;
};
