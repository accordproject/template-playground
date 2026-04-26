import { TemplateLogicNode } from './types';
import { TemplateLogicParser } from './parser';

export class TemplateLogicEvaluator {
  /**
   * Evaluate parsed template nodes with data
   */
  evaluate(nodes: TemplateLogicNode[], data: Record<string, any>): string {
    const parser = new TemplateLogicParser();
    let result = '';

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          result += node.content;
          break;

        case 'expression':
          try {
            const expr = node.content.trim();
            const fn = new Function('data', `with(data) { return (${expr}); }`);
            result += String(fn(data) ?? '');
          } catch (error) {
            result += `[Error: ${(error as Error).message}]`;
          }
          break;

        case 'condition':
          try {
            const fn = new Function('data', `with(data) { return (${node.condition}); }`);
            if (fn(data)) {
              result += this.evaluate(parser.parse(node.content), data);
            }
          } catch (error) {
            result += `[Error: ${(error as Error).message}]`;
          }
          break;

        case 'loop':
          try {
            const fn = new Function('data', `with(data) { return (${node.iterator}); }`);
            const items = fn(data);
            if (Array.isArray(items)) {
              for (const item of items) {
                const loopTemplate = node.content.replace(/\{\{this\}\}/g, String(item));
                result += this.evaluate(parser.parse(loopTemplate), { ...data, ...item });
              }
            }
          } catch (error) {
            result += `[Error: ${(error as Error).message}]`;
          }
          break;
      }
    }

    return result;
  }
}
