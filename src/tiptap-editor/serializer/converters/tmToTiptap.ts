/**
 * TemplateMark → TipTap node converters.
 * 
 * Converts TemplateMark JSON nodes to TipTap/ProseMirror JSONContent format.
 */
import type { JSONContent } from '@tiptap/core';
import type { TemplateMarkNode } from '../../types/TemplateMark';
import { CM, TM } from '../../constants/nodeClasses';

/**
 * Convert a single TemplateMark node to TipTap JSONContent.
 * Returns null if the node cannot be converted, or an array if the node
 * expands to multiple TipTap nodes (e.g., Strong/Emph marks).
 */
export function tmNodeToTipTap(node: TemplateMarkNode): JSONContent | JSONContent[] | null {
  const cls = node.$class;

  // ── CommonMark text and formatting ────────────────────────────────────────

  if (cls === CM.Text) {
    const n = node as { $class: string; text: string };
    return { type: 'text', text: n.text ?? '' };
  }

  if (cls === CM.Softbreak) {
    // Softbreak = single newline in markdown, renders as whitespace
    return { type: 'text', text: ' ' };
  }

  if (cls === CM.Linebreak) {
    // Linebreak = trailing backslash in markdown, renders as actual line break
    return { type: 'hardBreak' };
  }

  if (cls === CM.Strong) {
    const children = convertChildren(node.nodes ?? []);
    return children.map(c => ({
      ...c,
      marks: [...(c.marks ?? []), { type: 'bold' }],
    }));
  }

  if (cls === CM.Emph) {
    const children = convertChildren(node.nodes ?? []);
    return children.map(c => ({
      ...c,
      marks: [...(c.marks ?? []), { type: 'italic' }],
    }));
  }

  // ── CommonMark block elements ─────────────────────────────────────────────

  if (cls === CM.Paragraph) {
    return {
      type: 'paragraph',
      content: convertChildren(node.nodes ?? []),
    };
  }

  if (cls === CM.Heading) {
    const n = node as { $class: string; level: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'heading',
      attrs: { level: parseInt(n.level, 10) || 1 },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === CM.BlockQuote) {
    return {
      type: 'blockquote',
      content: convertChildren(node.nodes ?? []),
    };
  }

  if (cls === CM.Code) {
    const n = node as { $class: string; text?: string };
    return {
      type: 'text',
      text: n.text ?? '',
      marks: [{ type: 'code' }],
    };
  }

  if (cls === CM.CodeBlock) {
    const n = node as { $class: string; text?: string; info?: string };
    return {
      type: 'codeBlock',
      attrs: { language: n.info ?? null },
      content: [{ type: 'text', text: n.text ?? '' }],
    };
  }

  if (cls === CM.Link) {
    const n = node as { $class: string; destination?: string; title?: string; nodes?: TemplateMarkNode[] };
    const children = convertChildren(n.nodes ?? []);
    return children.map(c => ({
      ...c,
      marks: [...(c.marks ?? []), { type: 'link', attrs: { href: n.destination ?? '', title: n.title } }],
    }));
  }

  if (cls === CM.List) {
    const n = node as { $class: string; type?: string; tight?: boolean | string; start?: number | string; nodes?: TemplateMarkNode[] };
    const listType = n.type === 'ordered' ? 'ordered' : 'bullet';
    return {
      type: 'listBlock',
      attrs: {
        name: null,
        elementType: null,
        listType,
        tight: typeof n.tight === 'string' ? n.tight === 'true' : (n.tight ?? true),
        start: typeof n.start === 'string' ? parseInt(n.start, 10) : (n.start ?? 1),
        delimiter: null,
      },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === CM.Item) {
    return {
      type: 'listItem',
      content: convertChildren(node.nodes ?? []),
    };
  }

  if (cls === CM.Image) {
    const n = node as { $class: string; destination?: string; title?: string; nodes?: TemplateMarkNode[] };
    const altText = n.nodes?.find((c) => c.$class === CM.Text) as { text?: string } | undefined;
    return {
      type: 'image',
      attrs: {
        src: n.destination ?? null,
        alt: altText?.text ?? null,
        title: n.title ?? null,
      },
    };
  }

  if (cls === CM.ThematicBreak) {
    return { type: 'thematicBreak' };
  }

  if (cls === CM.HtmlInline) {
    const n = node as { $class: string; text?: string };
    return {
      type: 'htmlInline',
      attrs: { text: n.text ?? '' },
    };
  }

  if (cls === CM.HtmlBlock) {
    const n = node as { $class: string; text?: string };
    return {
      type: 'htmlBlock',
      attrs: { text: n.text ?? '' },
    };
  }

  // ── TemplateMark list definitions ─────────────────────────────────────────

  if (cls === TM.ListBlockDefinition) {
    const n = node as { $class: string; tight?: boolean | string; start?: number | string; listType?: string; type?: string; nodes?: TemplateMarkNode[]; name?: string; elementType?: string; delimiter?: string };
    const listType = n.listType ?? n.type ?? 'bullet';
    return {
      type: 'listBlock',
      attrs: {
        name: n.name ?? null,
        elementType: n.elementType ?? null,
        listType,
        tight: typeof n.tight === 'string' ? n.tight === 'true' : (n.tight ?? true),
        start: typeof n.start === 'string' ? parseInt(n.start, 10) : (n.start ?? 1),
        delimiter: n.delimiter ?? null,
      },
      content: convertChildren(n.nodes ?? []),
    };
  }

  // ── TemplateMark clause and contract ──────────────────────────────────────

  if (cls === TM.ClauseDefinition) {
    const n = node as { $class: string; name: string; src?: string; elementType?: string; error?: string; parseable?: boolean; nodes?: TemplateMarkNode[] };
    return {
      type: 'clause',
      attrs: {
        name: n.name,
        src: n.src ?? null,
        elementType: n.elementType ?? null,
        error: n.error ?? null,
        parseable: n.parseable ?? true,
      },
      content: convertChildren(n.nodes ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
    };
  }

  if (cls === TM.ContractDefinition) {
    const n = node as { $class: string; name?: string; elementType?: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'contract',
      attrs: { name: n.name ?? '', elementType: n.elementType ?? null },
      content: convertChildren(n.nodes ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
    };
  }

  // ── TemplateMark variables ────────────────────────────────────────────────

  if (cls === TM.VariableDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; identifiedBy?: string; decorators?: unknown[]; nodes?: TemplateMarkNode[] };
    return {
      type: 'variable',
      attrs: {
        name: n.name,
        elementType: n.elementType ?? null,
        identifiedBy: n.identifiedBy ?? null,
        decorators: n.decorators ?? [],
      },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === TM.FormattedVariableDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; format?: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'formattedVariable',
      attrs: {
        name: n.name,
        elementType: n.elementType ?? null,
        format: n.format ?? null,
      },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === TM.EnumVariableDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; enumValues: string[]; value?: string };
    return {
      type: 'enumVariable',
      attrs: {
        name: n.name,
        elementType: n.elementType ?? null,
        enumValues: n.enumValues ?? [],
        value: n.value ?? '',
      },
    };
  }

  // ── TemplateMark formula ──────────────────────────────────────────────────

  if (cls === TM.FormulaDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; dependencies?: string[]; code?: { $class: string; contents: string }; value?: string };
    return {
      type: 'formula',
      attrs: {
        name: n.name ?? '',
        elementType: n.elementType ?? null,
        dependencies: n.dependencies ?? [],
        codeContents: (n.code?.contents ?? '').trim(),
        value: n.value ?? '',
      },
    };
  }

  // ── TemplateMark inline conditionals/optionals ────────────────────────────

  if (cls === TM.ConditionalDefinition) {
    const n = node as { $class: string; name: string; condition?: string; dependencies?: string[]; isTrue?: boolean; whenTrue: TemplateMarkNode[]; whenFalse: TemplateMarkNode[] };
    return {
      type: 'conditional',
      attrs: {
        name: n.name,
        condition: n.condition ?? null,
        dependencies: n.dependencies ?? [],
        isTrue: n.isTrue ?? false,
        whenTrueJson: JSON.stringify(n.whenTrue ?? []),
        whenFalseJson: JSON.stringify(n.whenFalse ?? []),
      },
    };
  }

  if (cls === TM.OptionalDefinition) {
    const n = node as { $class: string; name: string; hasSome?: boolean; whenSome: TemplateMarkNode[]; whenNone: TemplateMarkNode[] };
    return {
      type: 'optional',
      attrs: {
        name: n.name,
        hasSome: n.hasSome ?? false,
        whenSomeJson: JSON.stringify(n.whenSome ?? []),
        whenNoneJson: JSON.stringify(n.whenNone ?? []),
      },
    };
  }

  if (cls === TM.WithDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'withBlock',
      attrs: { name: n.name, elementType: n.elementType ?? null },
      content: convertChildren(n.nodes ?? []),
    };
  }

  // ── TemplateMark iteration ────────────────────────────────────────────────

  if (cls === TM.ForeachDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'foreach',
      attrs: { name: n.name, elementType: n.elementType ?? null },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === TM.JoinDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; separator?: string; locale?: string; listFormatType?: string };
    return {
      type: 'join',
      attrs: {
        name: n.name,
        elementType: n.elementType ?? null,
        separator: n.separator ?? ', ',
        locale: n.locale ?? null,
        listFormatType: n.listFormatType ?? null,
      },
    };
  }

  // ── TemplateMark block definitions ────────────────────────────────────────

  if (cls === TM.WithBlockDefinition) {
    const n = node as { $class: string; name: string; elementType?: string; nodes?: TemplateMarkNode[] };
    return {
      type: 'withBlockDef',
      attrs: { name: n.name, elementType: n.elementType ?? null },
      content: convertChildren(n.nodes ?? []),
    };
  }

  if (cls === TM.ConditionalBlockDefinition) {
    const n = node as { $class: string; name: string; condition?: { type: string; contents: string }; whenTrue: TemplateMarkNode[]; whenFalse: TemplateMarkNode[] };
    return {
      type: 'conditionalBlock',
      attrs: {
        name: n.name,
        condition: n.condition ?? null,
      },
      content: [
        {
          type: 'conditionalBranchTrue',
          content: convertChildren(n.whenTrue ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
        },
        {
          type: 'conditionalBranchFalse',
          content: convertChildren(n.whenFalse ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
        },
      ],
    };
  }

  if (cls === TM.OptionalBlockDefinition) {
    const n = node as { $class: string; name: string; whenSome: TemplateMarkNode[]; whenNone: TemplateMarkNode[] };
    return {
      type: 'optionalBlock',
      attrs: { name: n.name },
      content: [
        {
          type: 'optionalBranchSome',
          content: convertChildren(n.whenSome ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
        },
        {
          type: 'optionalBranchNone',
          content: convertChildren(n.whenNone ?? [{ $class: CM.Paragraph, nodes: [] } as TemplateMarkNode]),
        },
      ],
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────

  // Recurse into children for unknown node types
  if (node.nodes && node.nodes.length > 0) {
    return convertChildren(node.nodes);
  }

  return null;
}

/**
 * Convert an array of TemplateMark nodes to TipTap JSONContent[].
 */
export function convertChildren(nodes: TemplateMarkNode[]): JSONContent[] {
  const result: JSONContent[] = [];
  for (const n of nodes) {
    const converted = tmNodeToTipTap(n);
    if (!converted) continue;
    if (Array.isArray(converted)) {
      result.push(...converted);
    } else {
      result.push(converted);
    }
  }
  return result;
}
