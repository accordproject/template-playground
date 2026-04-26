import { TemplateLogicNode } from './parser';

export class TemplateLogicEvaluator {
  /**
   * Evaluate parsed template nodes with data
   */
  evaluate(nodes: TemplateLogicNode[], data: Record<string, any>): string {
    let result = '';

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          result += node.content;
          break;

        case 'expression':
          // Simple expression evaluation
          try {
            // Use Function instead of eval (safer)
            const fn = new Function('data', `return (${node.content})`);
            const value = fn(data);
            result += String(value);
          } catch (error) {
            result += `[Error: ${(error as Error).message}]`;
          }
          break;

        case 'condition':
          // Evaluate condition
          try {
            const fn = new Function('data', `return (${node.condition})`);
            const conditionMet = fn(data);
            if (conditionMet) {
              result += this.evaluate(
                this.parse(node.content),
                data
              );
            }
          } catch (error) {
            result += `[Error: ${(error as Error).message}]`;
          }
          break;

        case 'loop':
          // Evaluate loop
          try {
            const fn = new Function('data', `return (${node.iterator})`);
            const items = fn(data);
            if (Array.isArray(items)) {
              for (const item of items) {
                const loopData = { ...data, this: item };
                result += this.evaluate(
                  this.parse(node.content),
                  loopData
                );
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

  private parse(template: string): TemplateLogicNode[] {
    // Reuse parser logic
    return []; // Placeholder
  }
}
