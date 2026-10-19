/**
 * What logic.ts is written against, read from model.cto: the @template
 * concept, the request/response transactions and the state asset. From
 * those, a logic skeleton with the right $class names and fields; the
 * "what to commit on Apply & Compile" rule of the legacy LogicEditor; and
 * the "what Simulate compiles on arrival" rule of the design-v2 flow.
 */
import { ModelManager } from "@accordproject/concerto-core";

/*
 * The template engine's runtime base types (its utils.RUNTIME_*_FQN). The
 * engine type-checks logic against them: a state needs a $class, and
 * transaction timestamps are strings. Kept here rather than imported, so
 * that this module does not pull in the lazily loaded engine.
 */
const RUNTIME_STATE_FQN = "org.accordproject.runtime@0.2.0.State";
const RUNTIME_RESPONSE_FQN = "org.accordproject.runtime@0.2.0.Response";

/** Generic fallback when model.cto declares no request/response transactions. */
export const DEFAULT_LOGIC_BOILERPLATE = `// Write your contract logic here.

class ContractLogic extends TemplateLogic<any> {

  async init(data: any) {
    return {
      state: {
        $class: '${RUNTIME_STATE_FQN}',
        $identifier: 'contract-state',
      },
    };
  }

  async trigger(data: any, request: any, state: any) {
    return {
      result: {
        $class: '${RUNTIME_RESPONSE_FQN}',
        $timestamp: new Date().toISOString(),
      },
      state: {
        ...state,
      },
    };
  }
}

export default ContractLogic;
`;

export interface LogicField {
  name: string;
  /** Concerto type name: String, Integer, DateTime, or a concept/enum name. */
  type: string;
  isArray: boolean;
  isOptional: boolean;
}

export interface LogicType {
  name: string;
  /** Fully qualified name, the value of $class. */
  fqn: string;
  /** Declared (non-system) properties. */
  fields: LogicField[];
  /** `identified by` field of an asset, if any. */
  identifier?: string;
}

/** The parts of model.cto that logic.ts talks to. Each is missing when the model does not declare it. */
export interface LogicModel {
  namespace: string;
  /** The @template concept (or the first concept). */
  template?: LogicType;
  /** Transaction named *Request, else the first transaction. */
  request?: LogicType;
  /** Transaction named *Response, else the second transaction. */
  response?: LogicType;
  /** Asset named *State, else the first asset. */
  state?: LogicType;
}

/* Concerto's declaration classes, typed by the methods used here. */
interface ConcertoProperty {
  getName(): string;
  getType(): string;
  isArray(): boolean;
  isOptional(): boolean;
}
interface ConcertoDeclaration {
  getName(): string;
  getFullyQualifiedName(): string;
  getProperties(): ConcertoProperty[];
  getOwnProperties(): ConcertoProperty[];
  getIdentifierFieldName(): string | null;
  getDecorator(name: string): unknown;
  isTransaction(): boolean;
  isAsset(): boolean;
  isEvent(): boolean;
  isConcept(): boolean;
}

/*
 * Imports are not resolved, so anything that walks up to a supertype from
 * another namespace (`extends Request`, `extends State`, …) throws. Those
 * declarations fall back to the fields they declare themselves.
 */
const propertiesOf = (d: ConcertoDeclaration): ConcertoProperty[] => {
  try {
    return d.getProperties();
  } catch {
    return d.getOwnProperties();
  }
};

const identifierOf = (d: ConcertoDeclaration): string | undefined => {
  try {
    return d.getIdentifierFieldName() ?? undefined;
  } catch {
    return undefined;
  }
};

const toType = (d: ConcertoDeclaration): LogicType => ({
  name: d.getName(),
  fqn: d.getFullyQualifiedName(),
  identifier: identifierOf(d),
  fields: propertiesOf(d)
    .filter((p) => !p.getName().startsWith("$"))
    .map((p) => ({ name: p.getName(), type: p.getType(), isArray: p.isArray(), isOptional: p.isOptional() })),
});

const endingWith = (list: ConcertoDeclaration[], suffix: string) => list.find((d) => d.getName().endsWith(suffix));

/**
 * Parses model.cto (syntax only — imports are not resolved, so this works
 * offline and before the model validates) and picks out the logic types.
 * Null when the model is empty or does not parse.
 */
export const describeLogicModel = (modelCto: string): LogicModel | null => {
  if (modelCto.trim() === "") return null;
  try {
    const modelManager = new ModelManager({ offline: true });
    const modelFile = modelManager.addCTOModel(modelCto, undefined, true) as unknown as {
      getNamespace(): string;
      getAllDeclarations(): ConcertoDeclaration[];
    };
    const declarations = modelFile.getAllDeclarations();
    const transactions = declarations.filter((d) => d.isTransaction());
    const assets = declarations.filter((d) => d.isAsset());
    const concepts = declarations.filter((d) => d.isConcept() && !d.isTransaction() && !d.isAsset() && !d.isEvent());

    // @template may sit on an asset (`asset TemplateModel extends Contract`), not only on a concept.
    const template = declarations.find((d) => d.getDecorator("template")) ?? concepts[0];
    const request = endingWith(transactions, "Request") ?? transactions[0];
    const response = endingWith(transactions, "Response") ?? transactions.find((d) => d !== request);
    const stateAssets = assets.filter((d) => d !== template);
    const state = endingWith(stateAssets, "State") ?? stateAssets[0];

    return {
      namespace: modelFile.getNamespace(),
      template: template && toType(template),
      request: request && toType(request),
      response: response && toType(response),
      state: state && toType(state),
    };
  } catch {
    return null;
  }
};

const PRIMITIVE_PLACEHOLDER: Record<string, string> = {
  String: "''",
  Integer: "0",
  Long: "0",
  Double: "0",
  Boolean: "false",
  DateTime: "new Date()",
};

/** A first value for a field, with the type as a comment when it is not a primitive. */
const fieldLine = (field: LogicField, indent: string): string => {
  const value = field.isArray ? "[]" : (PRIMITIVE_PLACEHOLDER[field.type] ?? "undefined");
  const note = field.isArray || field.type in PRIMITIVE_PLACEHOLDER ? "" : ` // ${field.type}`;
  return `${indent}${field.name}: ${value},${note}`;
};

const fieldLines = (type: LogicType | undefined, indent: string, skip: string[] = []): string[] =>
  (type?.fields ?? [])
    .filter((f) => !f.isOptional && !skip.includes(f.name))
    .map((f) => fieldLine(f, indent));

/**
 * A logic skeleton for the model: init() returning the state asset and
 * trigger() returning the response transaction, each with its $class and
 * its required fields filled with first values. The engine compiles
 * logic.ts next to a generated `./generated/<namespace>` module that exports an
 * I<Name> interface per declaration, so data and request are typed through
 * an `import type` (erased on emit — the store runs the JS with new Function).
 * Falls back to the generic boilerplate when the model has no
 * request/response transactions.
 */
export const scaffoldFromModel = (model: LogicModel | null): string => {
  if (!model?.request || !model.response) return DEFAULT_LOGIC_BOILERPLATE;
  const { template, request, response, state } = model;
  const dataType = template ? `I${template.name}` : "any";
  const imported = [template, request].filter((t): t is LogicType => Boolean(t)).map((t) => `I${t.name}`);

  const stateLines = state
    ? [
        `        $class: '${state.fqn}',`,
        `        $identifier: 'contract-state',`,
        ...(state.identifier ? [`        ${state.identifier}: 'contract-state',`] : []),
        ...fieldLines(state, "        ", state.identifier ? [state.identifier] : []),
      ]
    : [`        $class: '${RUNTIME_STATE_FQN}',`, `        $identifier: 'contract-state',`];

  return `// Logic for ${model.namespace}. The model's types come from the generated module below.
import type { ${imported.join(", ")} } from './generated/${model.namespace}';

class ContractLogic extends TemplateLogic<any> {

  // Runs once: the contract's starting state.
  async init(data: ${dataType}) {
    return {
      state: {
${stateLines.join("\n")}
      },
      events: [],
    };
  }

  // Runs per request: read data, request and state; return the response and the new state.
  async trigger(data: ${dataType}, request: I${request.name}, state: any) {
    return {
      result: {
        $class: '${response.fqn}',
        $timestamp: new Date().toISOString(),
${fieldLines(response, "        ").join("\n")}
      },
      state: {
        ...state,
      },
      events: [],
    };
  }
}

export default ContractLogic;
`;
};

/**
 * Source to commit on "Apply & Compile": the editor content, or — when both
 * the editor and the committed logic are empty — a skeleton built from the
 * model (the generic boilerplate if the model has no request/response).
 */
export const nextLogicSource = (editorLogicTs: string, logicTs: string, modelCto: string): string =>
  editorLogicTs.trim() === '' && logicTs.trim() === '' ? scaffoldFromModel(describeLogicModel(modelCto)) : editorLogicTs;

/**
 * The logic the design-v2 Simulate step compiles when it opens: whatever is
 * in the editor — or null when nothing was written: the editor is empty, or
 * it still holds the untouched skeleton the Logic step offered and nothing
 * was ever committed. A template without logic is not silently given the
 * skeleton's stub behaviour; Simulate says it has no logic instead.
 */
export const pendingLogic = (editorLogicTs: string, logicTs: string, modelCto: string): string | null => {
  if (editorLogicTs.trim() === "") return null;
  if (logicTs.trim() === "" && editorLogicTs === scaffoldFromModel(describeLogicModel(modelCto))) return null;
  return editorLogicTs;
};
