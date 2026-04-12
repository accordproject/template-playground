/**
 * TipTap → TemplateMark node converters.
 * 
 * Converts TipTap/ProseMirror JSONContent to TemplateMark JSON format.
 */
import type { JSONContent } from '@tiptap/core';
import type { TemplateMarkNode } from '../../types/TemplateMark';
import { CM, TM } from '../../constants/nodeClasses';

/**
 * Convert a single TipTap node to TemplateMark node(s).
 * Returns null for nodes that should be skipped (e.g., doc nodes).
 */
export function tipTapNodeToTM(node: JSONContent): TemplateMarkNode | TemplateMarkNode[] | null {
  const type = node.type;

  // ── Text and marks ────────────────────────────────────────────────────────

  if (type === 'text') {
    const text = node.text ?? '';
    const marks = node.marks ?? [];
    let result: TemplateMarkNode = { $class: CM.Text, text };
    for (const mark of marks) {
      if (mark.type === 'bold') {
        result = { $class: CM.Strong, nodes: [result] };
      } else if (mark.type === 'italic') {
        result = { $class: CM.Emph, nodes: [result] };
      } else if (mark.type === 'code') {
        result = { $class: CM.Code, nodes: [result] } as TemplateMarkNode;
      } else if (mark.type === 'link') {
        result = {
          $class: CM.Link,
          destination: (mark.attrs as { href?: string })?.href ?? '',
          title: (mark.attrs as { title?: string })?.title,
          nodes: [result],
        } as TemplateMarkNode;
      }
    }
    return result;
  }

  if (type === 'hardBreak') {
    // hardBreak in TipTap = Linebreak in TemplateMark (trailing backslash in markdown)
    return { $class: CM.Linebreak };
  }

  // ── Block elements ────────────────────────────────────────────────────────

  if (type === 'paragraph') {
    return {
      $class: CM.Paragraph,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'heading') {
    return {
      $class: CM.Heading,
      level: String(node.attrs?.level ?? 1),
      nodes: convertTipTapChildren(node.content ?? []),
    } as TemplateMarkNode;
  }

  if (type === 'blockquote') {
    return {
      $class: CM.BlockQuote,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'codeBlock') {
    return {
      $class: CM.CodeBlock,
      info: node.attrs?.language ?? null,
      text: (node.content ?? []).map(c => c.text ?? '').join(''),
    } as TemplateMarkNode;
  }

  // ── Lists ─────────────────────────────────────────────────────────────────

  if (type === 'listBlock') {
    const name = node.attrs?.name;
    const elementType = node.attrs?.elementType;
    const listType = node.attrs?.listType ?? 'bullet';

    // If listBlock has TemplateMark binding (name or elementType), use ListBlockDefinition
    // Otherwise, use plain CommonMark List
    if (name || elementType) {
      return {
        $class: TM.ListBlockDefinition,
        name: name ?? '',
        elementType: elementType ?? null,
        listType,
        tight: node.attrs?.tight ?? true,
        start: node.attrs?.start ?? 1,
        delimiter: node.attrs?.delimiter ?? null,
        nodes: convertTipTapChildren(node.content ?? []),
      } as TemplateMarkNode;
    } else {
      return {
        $class: CM.List,
        type: listType,
        tight: String(node.attrs?.tight ?? true),
        start: String(node.attrs?.start ?? 1),
        nodes: convertTipTapChildren(node.content ?? []),
      } as TemplateMarkNode;
    }
  }

  if (type === 'listItem') {
    return {
      $class: CM.Item,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'bulletList') {
    return {
      $class: CM.List,
      type: 'bullet',
      tight: 'true',
      nodes: convertTipTapChildren(node.content ?? []),
    } as TemplateMarkNode;
  }

  if (type === 'orderedList') {
    return {
      $class: CM.List,
      type: 'ordered',
      tight: 'true',
      start: String(node.attrs?.start ?? 1),
      nodes: convertTipTapChildren(node.content ?? []),
    } as TemplateMarkNode;
  }

  // ── TemplateMark clause and contract ──────────────────────────────────────

  if (type === 'clause') {
    return {
      $class: TM.ClauseDefinition,
      name: node.attrs?.name ?? '',
      src: node.attrs?.src ?? undefined,
      elementType: node.attrs?.elementType ?? undefined,
      error: node.attrs?.error ?? undefined,
      parseable: node.attrs?.parseable ?? true,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'contract') {
    return {
      $class: TM.ContractDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  // ── TemplateMark variables ────────────────────────────────────────────────

  if (type === 'variable') {
    return {
      $class: TM.VariableDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      identifiedBy: node.attrs?.identifiedBy ?? undefined,
      decorators: node.attrs?.decorators ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'formattedVariable') {
    return {
      $class: TM.FormattedVariableDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      format: node.attrs?.format ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'enumVariable') {
    return {
      $class: TM.EnumVariableDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      enumValues: node.attrs?.enumValues ?? [],
      value: node.attrs?.value ?? undefined,
    };
  }

  // ── TemplateMark formula ──────────────────────────────────────────────────

  if (type === 'formula') {
    return {
      $class: TM.FormulaDefinition,
      name: '',
      elementType: node.attrs?.elementType ?? undefined,
      dependencies: node.attrs?.dependencies ?? [],
      code: node.attrs?.codeContents
        ? { $class: TM.Code, type: 'TYPESCRIPT', contents: node.attrs.codeContents }
        : undefined,
      value: node.attrs?.value ?? undefined,
    };
  }

  // ── TemplateMark inline conditionals/optionals ────────────────────────────

  if (type === 'conditional') {
    let whenTrue: TemplateMarkNode[] = [];
    let whenFalse: TemplateMarkNode[] = [];
    try { whenTrue = JSON.parse(node.attrs?.whenTrueJson ?? '[]'); } catch { /* ignore */ }
    try { whenFalse = JSON.parse(node.attrs?.whenFalseJson ?? '[]'); } catch { /* ignore */ }
    return {
      $class: TM.ConditionalDefinition,
      name: node.attrs?.name ?? '',
      condition: node.attrs?.condition ?? undefined,
      dependencies: node.attrs?.dependencies ?? [],
      isTrue: node.attrs?.isTrue ?? false,
      whenTrue,
      whenFalse,
    };
  }

  if (type === 'optional') {
    let whenSome: TemplateMarkNode[] = [];
    let whenNone: TemplateMarkNode[] = [];
    try { whenSome = JSON.parse(node.attrs?.whenSomeJson ?? '[]'); } catch { /* ignore */ }
    try { whenNone = JSON.parse(node.attrs?.whenNoneJson ?? '[]'); } catch { /* ignore */ }
    return {
      $class: TM.OptionalDefinition,
      name: node.attrs?.name ?? '',
      hasSome: node.attrs?.hasSome ?? false,
      whenSome,
      whenNone,
    };
  }

  if (type === 'withBlock') {
    return {
      $class: TM.WithDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  // ── TemplateMark iteration ────────────────────────────────────────────────

  if (type === 'foreach') {
    return {
      $class: TM.ForeachDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'join') {
    return {
      $class: TM.JoinDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      separator: node.attrs?.separator ?? ', ',
      locale: node.attrs?.locale ?? undefined,
      listFormatType: node.attrs?.listFormatType ?? undefined,
    };
  }

  // ── TemplateMark block definitions ────────────────────────────────────────

  if (type === 'withBlockDef') {
    return {
      $class: TM.WithBlockDefinition,
      name: node.attrs?.name ?? '',
      elementType: node.attrs?.elementType ?? undefined,
      nodes: convertTipTapChildren(node.content ?? []),
    };
  }

  if (type === 'conditionalBlock') {
    // Extract branches from nested structure
    const trueBranch = node.content?.find((c) => c.type === 'conditionalBranchTrue');
    const falseBranch = node.content?.find((c) => c.type === 'conditionalBranchFalse');
    return {
      $class: TM.ConditionalBlockDefinition,
      name: node.attrs?.name ?? '',
      condition: node.attrs?.condition ?? undefined,
      whenTrue: convertTipTapChildren(trueBranch?.content ?? []),
      whenFalse: convertTipTapChildren(falseBranch?.content ?? []),
    };
  }

  if (type === 'optionalBlock') {
    // Extract branches from nested structure
    const someBranch = node.content?.find((c) => c.type === 'optionalBranchSome');
    const noneBranch = node.content?.find((c) => c.type === 'optionalBranchNone');
    return {
      $class: TM.OptionalBlockDefinition,
      name: node.attrs?.name ?? '',
      whenSome: convertTipTapChildren(someBranch?.content ?? []),
      whenNone: convertTipTapChildren(noneBranch?.content ?? []),
    };
  }

  // Skip branch wrapper nodes (they're handled by parent)
  if (type === 'conditionalBranchTrue' || type === 'conditionalBranchFalse' ||
      type === 'optionalBranchSome' || type === 'optionalBranchNone') {
    return convertTipTapChildren(node.content ?? []);
  }

  // ── CommonMark media and HTML ─────────────────────────────────────────────

  if (type === 'image') {
    const altTextNode: TemplateMarkNode[] = node.attrs?.alt
      ? [{ $class: CM.Text, text: node.attrs.alt } as TemplateMarkNode]
      : [];
    return {
      $class: CM.Image,
      destination: node.attrs?.src ?? '',
      title: node.attrs?.title ?? null,
      nodes: altTextNode,
    } as TemplateMarkNode;
  }

  if (type === 'thematicBreak' || type === 'horizontalRule') {
    return { $class: CM.ThematicBreak };
  }

  if (type === 'htmlInline') {
    return {
      $class: CM.HtmlInline,
      text: node.attrs?.text ?? '',
    } as TemplateMarkNode;
  }

  if (type === 'htmlBlock') {
    return {
      $class: CM.HtmlBlock,
      text: node.attrs?.text ?? '',
    } as TemplateMarkNode;
  }

  // Skip doc nodes
  if (type === 'doc') {
    return null;
  }

  return null;
}

/**
 * Convert an array of TipTap nodes to TemplateMark nodes.
 */
export function convertTipTapChildren(nodes: JSONContent[]): TemplateMarkNode[] {
  const result: TemplateMarkNode[] = [];
  for (const n of nodes) {
    const converted = tipTapNodeToTM(n);
    if (!converted) continue;
    if (Array.isArray(converted)) {
      result.push(...converted);
    } else {
      result.push(converted);
    }
  }
  return result;
}
