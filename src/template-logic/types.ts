// src/template-logic/types.ts
export interface TemplateLogicNode {
  type: 'condition' | 'loop' | 'expression' | 'text';
  content: string;
  condition?: string;
  iterator?: string;
}
