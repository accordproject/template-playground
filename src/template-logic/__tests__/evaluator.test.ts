import { TemplateLogicParser } from '../parser';
import { TemplateLogicEvaluator } from '../evaluator';

describe('TemplateLogicEvaluator', () => {
  const parser = new TemplateLogicParser();
  const evaluator = new TemplateLogicEvaluator();

  test('should evaluate simple expression', () => {
    const nodes = parser.parse('Hello {{name}}');
    const result = evaluator.evaluate(nodes, { name: 'World' });
    expect(result).toBe('Hello World');
  });

  test('should evaluate condition true', () => {
    const nodes = parser.parse('{{#if amount > 100}}Discount{{/if}}');
    const result = evaluator.evaluate(nodes, { amount: 150 });
    expect(result).toContain('Discount');
  });

  test('should evaluate condition false', () => {
    const nodes = parser.parse('{{#if amount > 100}}Discount{{/if}}');
    const result = evaluator.evaluate(nodes, { amount: 50 });
    expect(result).toBe('');
  });

  test('should evaluate loop', () => {
    const nodes = parser.parse('{{#each items}}{{this}} {{/each}}');
    const result = evaluator.evaluate(nodes, { items: ['a', 'b', 'c'] });
    expect(result).toContain('a');
    expect(result).toContain('b');
  });

  test('should evaluate math expression', () => {
    const nodes = parser.parse('Total: {{price * quantity}}');
    const result = evaluator.evaluate(nodes, { price: 10, quantity: 5 });
    expect(result).toBe('Total: 50');
  });
});
