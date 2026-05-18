import type { JSONContent } from '@tiptap/core';
import type { TemplateMarkDocument, TemplateMarkNode } from '../types/TemplateMark';
import { convertChildren } from './nodeConverters';
import { CM, TM } from '../constants/nodeClasses';

export function templateMarkToTipTap(doc: TemplateMarkDocument): JSONContent {
  const cls = doc.$class;
  if (cls === TM.ContractDefinition || cls === CM.Document) {
    return {
      type: 'doc',
      content: convertChildren((doc.nodes ?? []) as TemplateMarkNode[]),
    };
  }

  if (cls === TM.ClauseDefinition) {
    const n = doc as { $class: string; name: string; src?: string; elementType?: string; error?: string; parseable?: boolean; nodes?: TemplateMarkNode[] };
    return {
      type: 'doc',
      content: [
        {
          type: 'clause',
          attrs: {
            name: n.name,
            src: n.src ?? null,
            elementType: n.elementType ?? null,
            error: n.error ?? null,
            parseable: n.parseable ?? true,
          },
          content: convertChildren(n.nodes ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
        },
      ],
    };
  }

  const fallbackDoc = doc as { nodes?: TemplateMarkNode[] };
  return {
    type: 'doc',
    content: convertChildren(fallbackDoc.nodes ?? []),
  };
}
