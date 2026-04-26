import { TemplateLogicParser } from '../parser';

describe('TemplateLogicParser', () => {
  const parser = new TemplateLogicParser();

  test('should parse simple text', () => {
    const result = parser.parse('Hello World');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
  });

  test('should parse expression', () => {
    const result = parser.parse('Hello {{name}}');
    expect(result).toHaveLength(2);
    expect(result[1].type).toBe('expression');
    expect(result[1].content).toBe('name');
  });

  test('should parse if condition', () => {
    const result = parser.parse('{{#if amount > 100}}Discount{{/if}}');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('condition');
    expect(result[0].condition).toBe('amount > 100');
  });

  test('should parse loop', () => {
    const result = parser.parse('{{#each items}}{{this}}{{/each}}');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('loop');
    expect(result[0].iterator).toBe('items');
  });
});
