// Simple template logic parser

export interface TemplateLogicNode {
  type: 'condition' | 'loop' | 'expression' | 'text';
  content: string;
  condition?: string;
  iterator?: string;
}

export class TemplateLogicParser {
  /**
   * Parse template with logic syntax
   * Supports: {{#if condition}} ... {{/if}}
   *           {{#each array}} ... {{/each}}
   *           {{expression}}
   */
  parse(template: string): TemplateLogicNode[] {
    const nodes: TemplateLogicNode[] = [];
    let remaining = template;
    
    while (remaining.length > 0) {
      // Check for {{#if ...}}
      const ifMatch = remaining.match(/^(.*?)\{\{#if\s+(.+?)\}\}(.*?)\{\{\/if\}\}/s);
      if (ifMatch) {
        if (ifMatch[1]) {
          nodes.push({ type: 'text', content: ifMatch[1] });
        }
        nodes.push({
          type: 'condition',
          content: ifMatch[3],
          condition: ifMatch[2],
        });
        remaining = remaining.slice(ifMatch[0].length);
        continue;
      }

      // Check for {{#each ...}}
      const eachMatch = remaining.match(/^(.*?)\{\{#each\s+(.+?)\}\}(.*?)\{\{\/each\}\}/s);
      if (eachMatch) {
        if (eachMatch[1]) {
          nodes.push({ type: 'text', content: eachMatch[1] });
        }
        nodes.push({
          type: 'loop',
          content: eachMatch[3],
          iterator: eachMatch[2],
        });
        remaining = remaining.slice(eachMatch[0].length);
        continue;
      }

      // Check for {{expression}}
      const exprMatch = remaining.match(/^(.*?)\{\{(.+?)\}\}/s);
      if (exprMatch) {
        if (exprMatch[1]) {
          nodes.push({ type: 'text', content: exprMatch[1] });
        }
        nodes.push({
          type: 'expression',
          content: exprMatch[2],
        });
        remaining = remaining.slice(exprMatch[0].length);
        continue;
      }

      // No more logic, add remaining as text
      if (remaining) {
        nodes.push({ type: 'text', content: remaining });
      }
      break;
    }

    return nodes;
  }
}
