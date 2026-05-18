import type { JSONContent } from '@tiptap/core';
import type { TemplateMarkDocument } from '../types/TemplateMark';
import { convertTipTapChildren } from './nodeConverters';
import { TM } from '../constants/nodeClasses';

export function tiptapToTemplateMark(doc: JSONContent, originalName?: string): TemplateMarkDocument {
  if (doc.type !== 'doc') {
    throw new Error(`Expected TipTap doc node, got: ${doc.type}`);
  }
  return {
    $class: TM.ContractDefinition,
    name: originalName ?? 'contract',
    nodes: convertTipTapChildren(doc.content ?? []),
  };
}
