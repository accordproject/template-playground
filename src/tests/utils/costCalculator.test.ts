import { calculateCost } from '../../../src/utils/costCalculator';
import { TokenUsage } from '../../../src/types/components/AIAssistant.types';

describe('costCalculator', () => {
  it('should calculate cost correctly for gpt-4', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    // gpt-4: input $30/1M, output $60/1M
    // input: 1000 * 30 / 1000000 = 0.03
    // output: 1000 * 60 / 1000000 = 0.06
    // total: 0.09
    const cost = calculateCost('gpt-4', usage);
    expect(cost).toBeCloseTo(0.09);
  });

  it('should calculate cost correctly for gpt-3.5-turbo', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    // gpt-3.5-turbo: input $0.50/1M, output $1.50/1M
    // input: 1000 * 0.5 / 1000000 = 0.0005
    // output: 1000 * 1.5 / 1000000 = 0.0015
    // total: 0.002
    const cost = calculateCost('gpt-3.5-turbo', usage);
    expect(cost).toBeCloseTo(0.002);
  });

  it('should return 0 for unknown models', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    const cost = calculateCost('unknown-model', usage);
    expect(cost).toBe(0);
  });

  it('should handle zero tokens', () => {
    const usage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };
    const cost = calculateCost('gpt-4', usage);
    expect(cost).toBe(0);
  });

  it('should handle partial model matches (prefix)', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    // gpt-4-0613 should match gpt-4
    const cost = calculateCost('gpt-4-0613', usage);
    expect(cost).toBeCloseTo(0.09);
  });

  it('should handle partial model matches (longest prefix wins)', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    // gpt-4o-mini-2024-07-18 should match gpt-4o-mini (cheaper), not gpt-4o (expensive)
    // gpt-4o-mini: 0.15/0.60 -> 0.00075
    // gpt-4o: 5.00/15.00 -> 0.02
    const cost = calculateCost('gpt-4o-mini-2024-07-18', usage);
    expect(cost).toBeCloseTo(0.00075);
  });

  it('should calculate cost correctly for gemini-2.5-flash', () => {
    const usage: TokenUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000
    };
    // gemini-2.5-flash (mapped to 1.5 flash pricing): input $0.075/1M, output $0.30/1M
    // input: 1000 * 0.075 / 1000000 = 0.000075
    // output: 1000 * 0.30 / 1000000 = 0.0003
    // total: 0.000375
    const cost = calculateCost('gemini-2.5-flash', usage);
    expect(cost).toBeCloseTo(0.000375);
  });
});
