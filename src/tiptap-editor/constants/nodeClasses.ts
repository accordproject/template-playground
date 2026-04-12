/**
 * Node class constants for TemplateMark and CommonMark.
 * 
 * These are the fully qualified $class values from the Concerto models.
 * Using constants avoids typos and enables IDE autocomplete and refactoring.
 * 
 * @see https://models.accordproject.org/markdown/templatemark@0.5.0.cto
 * @see https://models.accordproject.org/markdown/commonmark@0.5.0.cto
 */

// ── Namespace versions ────────────────────────────────────────────────────────

export const COMMONMARK_NS = 'org.accordproject.commonmark@0.5.0';
export const TEMPLATEMARK_NS = 'org.accordproject.templatemark@0.5.0';

// ── CommonMark node classes ───────────────────────────────────────────────────

/** CommonMark node $class constants */
export const CM = {
  Document: `${COMMONMARK_NS}.Document`,
  Paragraph: `${COMMONMARK_NS}.Paragraph`,
  Heading: `${COMMONMARK_NS}.Heading`,
  Text: `${COMMONMARK_NS}.Text`,
  Strong: `${COMMONMARK_NS}.Strong`,
  Emph: `${COMMONMARK_NS}.Emph`,
  Code: `${COMMONMARK_NS}.Code`,
  CodeBlock: `${COMMONMARK_NS}.CodeBlock`,
  Link: `${COMMONMARK_NS}.Link`,
  Image: `${COMMONMARK_NS}.Image`,
  List: `${COMMONMARK_NS}.List`,
  Item: `${COMMONMARK_NS}.Item`,
  BlockQuote: `${COMMONMARK_NS}.BlockQuote`,
  ThematicBreak: `${COMMONMARK_NS}.ThematicBreak`,
  Softbreak: `${COMMONMARK_NS}.Softbreak`,
  Linebreak: `${COMMONMARK_NS}.Linebreak`,
  HtmlInline: `${COMMONMARK_NS}.HtmlInline`,
  HtmlBlock: `${COMMONMARK_NS}.HtmlBlock`,
} as const;

// ── TemplateMark node classes ─────────────────────────────────────────────────

/** TemplateMark node $class constants */
export const TM = {
  // Document-level
  ContractDefinition: `${TEMPLATEMARK_NS}.ContractDefinition`,
  ClauseDefinition: `${TEMPLATEMARK_NS}.ClauseDefinition`,
  
  // Variables
  VariableDefinition: `${TEMPLATEMARK_NS}.VariableDefinition`,
  FormattedVariableDefinition: `${TEMPLATEMARK_NS}.FormattedVariableDefinition`,
  EnumVariableDefinition: `${TEMPLATEMARK_NS}.EnumVariableDefinition`,
  
  // Formula
  FormulaDefinition: `${TEMPLATEMARK_NS}.FormulaDefinition`,
  Code: `${TEMPLATEMARK_NS}.Code`,
  
  // Inline conditionals/optionals
  ConditionalDefinition: `${TEMPLATEMARK_NS}.ConditionalDefinition`,
  OptionalDefinition: `${TEMPLATEMARK_NS}.OptionalDefinition`,
  WithDefinition: `${TEMPLATEMARK_NS}.WithDefinition`,
  
  // Block conditionals/optionals
  ConditionalBlockDefinition: `${TEMPLATEMARK_NS}.ConditionalBlockDefinition`,
  OptionalBlockDefinition: `${TEMPLATEMARK_NS}.OptionalBlockDefinition`,
  WithBlockDefinition: `${TEMPLATEMARK_NS}.WithBlockDefinition`,
  
  // Lists and iteration
  ListBlockDefinition: `${TEMPLATEMARK_NS}.ListBlockDefinition`,
  ForeachDefinition: `${TEMPLATEMARK_NS}.ForeachDefinition`,
  JoinDefinition: `${TEMPLATEMARK_NS}.JoinDefinition`,
} as const;

// ── Type exports ──────────────────────────────────────────────────────────────

export type CommonMarkClass = typeof CM[keyof typeof CM];
export type TemplateMarkClass = typeof TM[keyof typeof TM];
export type NodeClass = CommonMarkClass | TemplateMarkClass;
