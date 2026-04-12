/**
 * Type guards for TemplateMark and CommonMark nodes.
 * 
 * These provide runtime type checking with TypeScript type narrowing,
 * allowing safe property access without `as` type assertions.
 */
import { CM, TM } from '../constants/nodeClasses';
import type {
  TemplateMarkNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
  StrongNode,
  EmphNode,
  VariableDefinitionNode,
  FormattedVariableDefinitionNode,
  EnumVariableDefinitionNode,
  FormulaDefinitionNode,
  ConditionalDefinitionNode,
  OptionalDefinitionNode,
  WithDefinitionNode,
  ListBlockDefinitionNode,
  ForeachDefinitionNode,
  JoinDefinitionNode,
  ClauseDefinitionNode,
  ContractDefinitionNode,
  DocumentNode,
  WithBlockDefinitionNode,
  ConditionalBlockDefinitionNode,
  OptionalBlockDefinitionNode,
  ImageNode,
  ThematicBreakNode,
  HtmlInlineNode,
  HtmlBlockNode,
  ListNode,
  ItemNode,
} from './TemplateMark';

// ── CommonMark type guards ────────────────────────────────────────────────────

export function isTextNode(node: TemplateMarkNode): node is TextNode {
  return node.$class === CM.Text;
}

export function isParagraphNode(node: TemplateMarkNode): node is ParagraphNode {
  return node.$class === CM.Paragraph;
}

export function isHeadingNode(node: TemplateMarkNode): node is HeadingNode {
  return node.$class === CM.Heading;
}

export function isStrongNode(node: TemplateMarkNode): node is StrongNode {
  return node.$class === CM.Strong;
}

export function isEmphNode(node: TemplateMarkNode): node is EmphNode {
  return node.$class === CM.Emph;
}

export function isImageNode(node: TemplateMarkNode): node is ImageNode {
  return node.$class === CM.Image;
}

export function isListNode(node: TemplateMarkNode): node is ListNode {
  return node.$class === CM.List;
}

export function isItemNode(node: TemplateMarkNode): node is ItemNode {
  return node.$class === CM.Item;
}

export function isThematicBreakNode(node: TemplateMarkNode): node is ThematicBreakNode {
  return node.$class === CM.ThematicBreak;
}

export function isHtmlInlineNode(node: TemplateMarkNode): node is HtmlInlineNode {
  return node.$class === CM.HtmlInline;
}

export function isHtmlBlockNode(node: TemplateMarkNode): node is HtmlBlockNode {
  return node.$class === CM.HtmlBlock;
}

export function isDocumentNode(node: TemplateMarkNode): node is DocumentNode {
  return node.$class === CM.Document;
}

// ── TemplateMark type guards ──────────────────────────────────────────────────

export function isVariableDefinition(node: TemplateMarkNode): node is VariableDefinitionNode {
  return node.$class === TM.VariableDefinition;
}

export function isFormattedVariableDefinition(node: TemplateMarkNode): node is FormattedVariableDefinitionNode {
  return node.$class === TM.FormattedVariableDefinition;
}

export function isEnumVariableDefinition(node: TemplateMarkNode): node is EnumVariableDefinitionNode {
  return node.$class === TM.EnumVariableDefinition;
}

export function isFormulaDefinition(node: TemplateMarkNode): node is FormulaDefinitionNode {
  return node.$class === TM.FormulaDefinition;
}

export function isConditionalDefinition(node: TemplateMarkNode): node is ConditionalDefinitionNode {
  return node.$class === TM.ConditionalDefinition;
}

export function isOptionalDefinition(node: TemplateMarkNode): node is OptionalDefinitionNode {
  return node.$class === TM.OptionalDefinition;
}

export function isWithDefinition(node: TemplateMarkNode): node is WithDefinitionNode {
  return node.$class === TM.WithDefinition;
}

export function isListBlockDefinition(node: TemplateMarkNode): node is ListBlockDefinitionNode {
  return node.$class === TM.ListBlockDefinition;
}

export function isForeachDefinition(node: TemplateMarkNode): node is ForeachDefinitionNode {
  return node.$class === TM.ForeachDefinition;
}

export function isJoinDefinition(node: TemplateMarkNode): node is JoinDefinitionNode {
  return node.$class === TM.JoinDefinition;
}

export function isClauseDefinition(node: TemplateMarkNode): node is ClauseDefinitionNode {
  return node.$class === TM.ClauseDefinition;
}

export function isContractDefinition(node: TemplateMarkNode): node is ContractDefinitionNode {
  return node.$class === TM.ContractDefinition;
}

export function isWithBlockDefinition(node: TemplateMarkNode): node is WithBlockDefinitionNode {
  return node.$class === TM.WithBlockDefinition;
}

export function isConditionalBlockDefinition(node: TemplateMarkNode): node is ConditionalBlockDefinitionNode {
  return node.$class === TM.ConditionalBlockDefinition;
}

export function isOptionalBlockDefinition(node: TemplateMarkNode): node is OptionalBlockDefinitionNode {
  return node.$class === TM.OptionalBlockDefinition;
}

// ── Category guards ───────────────────────────────────────────────────────────

/** Check if a node is any kind of variable (Variable, Formatted, Enum) */
export function isAnyVariableDefinition(
  node: TemplateMarkNode
): node is VariableDefinitionNode | FormattedVariableDefinitionNode | EnumVariableDefinitionNode {
  return (
    isVariableDefinition(node) ||
    isFormattedVariableDefinition(node) ||
    isEnumVariableDefinition(node)
  );
}

/** Check if a node is a block definition (Clause, Contract, ConditionalBlock, etc.) */
export function isBlockDefinition(
  node: TemplateMarkNode
): node is ClauseDefinitionNode | ContractDefinitionNode | WithBlockDefinitionNode | ConditionalBlockDefinitionNode | OptionalBlockDefinitionNode {
  return (
    isClauseDefinition(node) ||
    isContractDefinition(node) ||
    isWithBlockDefinition(node) ||
    isConditionalBlockDefinition(node) ||
    isOptionalBlockDefinition(node)
  );
}

/** Check if a node has whenTrue/whenFalse branches */
export function hasConditionalBranches(
  node: TemplateMarkNode
): node is ConditionalDefinitionNode | ConditionalBlockDefinitionNode {
  return isConditionalDefinition(node) || isConditionalBlockDefinition(node);
}

/** Check if a node has whenSome/whenNone branches */
export function hasOptionalBranches(
  node: TemplateMarkNode
): node is OptionalDefinitionNode | OptionalBlockDefinitionNode {
  return isOptionalDefinition(node) || isOptionalBlockDefinition(node);
}
