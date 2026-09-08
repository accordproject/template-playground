/**
 * Lightweight, synchronous summaries of the model (.cto) and data (.json)
 * editors for the Design v2 "Model & Data" step status bars.
 *
 * These are display hints only. The real validation still happens in the
 * store's rebuild (validateBeforeRebuild + the template engine); its error
 * message is routed to the right pane by splitError().
 */

export interface TemplateField {
  name: string;
  type: string;
  optional: boolean;
}

export interface ModelSummary {
  /** `namespace` line, e.g. "org.acme.counter@1.0.0"; null when missing. */
  namespace: string | null;
  /** Name of the concept annotated with @template; null when missing. */
  templateConcept: string | null;
  /** Fields declared on the @template concept. */
  templateFields: TemplateField[];
  /** Every concept / asset / participant / transaction / event / enum / scalar. */
  typeCount: number;
  /** Every `o` and `-->` field in the file. */
  fieldCount: number;
}

export interface DataSummary {
  /** Whether the editor text is parseable JSON with an object at the top. */
  parses: boolean;
  /** Required (non-optional) fields of the @template concept. */
  required: number;
  /** How many of those required fields the data provides. */
  present: number;
}

const TYPE_DECL = /^\s*(?:abstract\s+)?(?:concept|asset|participant|transaction|event|enum|scalar)\s+\w+/gm;
const FIELD_DECL = /^\s*(?:o|-->)\s+(\S+?)(?:\[\])?\s+(\w+)(.*)$/gm;
const NAMESPACE = /^\s*namespace\s+(\S+)/m;
const TEMPLATE_CONCEPT = /@template[^\n]*\n\s*(?:abstract\s+)?concept\s+(\w+)[^{]*\{([^}]*)\}/;

const parseFields = (body: string): TemplateField[] => {
  const fields: TemplateField[] = [];
  for (const match of body.matchAll(FIELD_DECL)) {
    const [, type, name, rest] = match;
    fields.push({ name, type, optional: /\boptional\b/.test(rest) });
  }
  return fields;
};

export const summarizeModel = (cto: string): ModelSummary => {
  const template = TEMPLATE_CONCEPT.exec(cto);
  return {
    namespace: NAMESPACE.exec(cto)?.[1] ?? null,
    templateConcept: template?.[1] ?? null,
    templateFields: template ? parseFields(template[2]) : [],
    typeCount: cto.match(TYPE_DECL)?.length ?? 0,
    fieldCount: parseFields(cto).length,
  };
};

export const summarizeData = (json: string, templateFields: readonly TemplateField[]): DataSummary => {
  const required = templateFields.filter((f) => !f.optional);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { parses: false, required: required.length, present: 0 };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { parses: false, required: required.length, present: 0 };
  }
  const obj = parsed as Record<string, unknown>;
  const present = required.filter((f) => f.name in obj && obj[f.name] !== null).length;
  return { parses: true, required: required.length, present };
};

export interface SplitError {
  model?: string;
  data?: string;
}

/**
 * Route the store's single `error` string to the pane it belongs to.
 * CTO syntax errors (validateBeforeRebuild's "Invalid CTO model", or the
 * legacy "c:" prefix) go to the model pane; everything else — invalid JSON or
 * an instance that does not match the model — goes to the data pane.
 */
export const splitError = (error: string | undefined | null): SplitError => {
  if (!error) return {};
  if (/^c:|Invalid CTO model/i.test(error)) return { model: error };
  return { data: error };
};
