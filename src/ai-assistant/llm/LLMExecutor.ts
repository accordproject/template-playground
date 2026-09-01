/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * Port of `src/llm/LLMExecutor.ts` on the template-engine `main` branch, which
 * the `TemplateArchiveProcessor` there calls when a template carries no
 * executable logic or when LLM execution is forced. The playground keeps its
 * own copy so the feature works against the published engine release, which
 * does not ship the LLM layer yet; the prompts, schema derivation and response
 * post-processing are kept faithful to the engine so behaviour matches once the
 * two are unified.
 */

import type { Template } from '@accordproject/cicero-core';
import { LLMExecutorConfig } from './LLMConfig';
import { BaseReasoner, ChatMessage, JsonSchema, createReasoner } from './Reasoners';
import { treeShakeModel } from './ModelManagerSchema';

/** The contract state. */
export type State = object;
/** A response/result returned by the contract logic. */
export type Response = object;
/** An event emitted by the contract logic. */
export type Event = object;

/** The result of triggering a template: the response, updated state, and events. */
export interface TriggerResponse {
  result: Response;
  state: State;
  events: Event[];
}

/** The result of initializing a template: the initial state. */
export interface InitResponse {
  state: State;
}

/** The fully-qualified name of the runtime State base type. */
const RUNTIME_STATE_FQN = 'org.accordproject.runtime@0.2.0.State';

/**
 * A JSON Schema `definitions` map as produced by the tree-shaker: keyed by
 * fully-qualified Concerto type name, each value is the JSON Schema fragment for
 * that type. Fragments may contain `$ref`s pointing at sibling definitions
 * (`#/definitions/<fqn>`), which `deepResolve` later inlines.
 */
type SchemaDefinitions = Record<string, Record<string, any>>;

/**
 * The request / response / state / event type names a template declares.
 * All root-type decisions come from the Template API.
 */
interface TemplateRootTypes {
  /** Concrete request types the template accepts. */
  requests: string[];
  /** Concrete response/result types the template can return. */
  responses: string[];
  /** Concrete state types the template carries (empty → stateless). */
  states: string[];
  /** Concrete event types the template can emit. */
  events: string[];
}

/**
 * Reads the root types declared by a template.
 * @param template - template instance
 * @returns request, response, state, and event types
 */
function getTemplateRoots(template: Template): TemplateRootTypes {
  const anyTemplate = template as any;
  return {
    requests: anyTemplate.getRequestTypes() as string[],
    responses: anyTemplate.getResponseTypes() as string[],
    states: anyTemplate.getStateTypes() as string[],
    events: anyTemplate.getEmitTypes() as string[],
  };
}

/**
 * Checks whether a template carries persistent state.
 *
 * cicero-core 2.x exposes `isStateful()`; the release the playground is pinned
 * to does not, so this falls back to the same rule that method applies — a
 * template is stateful when it declares a concrete State type of its own,
 * ignoring the bare runtime base.
 * @param template - template instance
 * @returns true when the template declares its own State type
 */
export function isStatefulTemplate(template: Template): boolean {
  const anyTemplate = template as any;
  if (typeof anyTemplate.isStateful === 'function') {
    return anyTemplate.isStateful() as boolean;
  }
  const states = (anyTemplate.getStateTypes() as string[]) ?? [];
  return states.some(fqn => fqn !== RUNTIME_STATE_FQN);
}

/**
 * Recursively stamps `additionalProperties: false` onto every object schema so
 * strict structured-output providers reject unexpected keys.
 * @param schema - the schema node to mutate in place
 * @returns the same schema node, with `additionalProperties: false` applied
 */
function enforceAdditionalPropertiesFalse(schema: Record<string, any>): Record<string, any> {
  if (schema.type === 'object' || schema.properties) {
    schema.additionalProperties = false;
    if (schema.properties) {
      for (const val of Object.values<any>(schema.properties)) {
        enforceAdditionalPropertiesFalse(val);
      }
    }
  }
  if (schema.items) {
    enforceAdditionalPropertiesFalse(schema.items);
  }
  return schema;
}

/**
 * Fully resolves all $ref pointers in a schema node, recursively. This produces
 * a self-contained schema with no dangling $refs.
 * @param node - the schema node to resolve
 * @param definitions - available schema definitions
 * @param visiting - the refs currently being resolved, guarding against cycles
 * @returns the resolved node
 */
function deepResolve(node: any, definitions: SchemaDefinitions, visiting = new Set<string>()): any {
  if (Array.isArray(node)) {
    return node.map(item => deepResolve(item, definitions, visiting));
  }
  if (node && typeof node === 'object') {
    if (node.$ref) {
      const refKey = (node.$ref as string).replace('#/definitions/', '');
      if (visiting.has(refKey)) {
        // Circular ref — leave as a plain object stub to avoid infinite loop
        return { type: 'object', additionalProperties: false };
      }
      const refDef = definitions[refKey];
      if (!refDef) throw new Error(`Schema definition not found: ${refKey}`);
      visiting = new Set(visiting); // clone so sibling refs aren't affected
      visiting.add(refKey);
      return deepResolve(refDef, definitions, visiting);
    }
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      result[k] = deepResolve(v, definitions, visiting);
    }
    return result;
  }
  return node;
}

/**
 * Schema keywords removed for structured-output providers.
 */
const UNSUPPORTED_KEYWORDS = new Set([
  'pattern',
  'format',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
]);

/**
 * Recursively strips provider-unsupported keywords (see {@link UNSUPPORTED_KEYWORDS})
 * from a schema node and pins the Concerto `$class` discriminator to a `const` of
 * its exact fully-qualified name, so the model emits the correct type tag.
 * @param node - the schema node to clean
 * @returns a cleaned copy of the node
 */
function cleanForStructuredOutput(node: any): any {
  if (Array.isArray(node)) {
    return node.map(cleanForStructuredOutput);
  }
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      if (UNSUPPORTED_KEYWORDS.has(k)) continue;
      if (k === 'default') continue; // model defaults aren't allowed in strict mode
      if (k === 'properties' && v && typeof v === 'object') {
        const props: Record<string, any> = {};
        for (const [propKey, propVal] of Object.entries(v as Record<string, any>)) {
          // Pin the Concerto type discriminator to its exact FQN.
          if (propKey === '$class' && propVal && propVal.default) {
            props[propKey] = { type: 'string', enum: [propVal.default] };
          } else {
            props[propKey] = cleanForStructuredOutput(propVal);
          }
        }
        out[k] = props;
        continue;
      }
      out[k] = cleanForStructuredOutput(v);
    }
    return out;
  }
  return node;
}

/**
 * Resolves a tree-shaken type into a standalone schema.
 * @param definitions - available schema definitions
 * @param fqn - fully-qualified type name
 * @returns a resolved schema for the requested type
 */
function resolveTypeSchema(definitions: SchemaDefinitions, fqn: string): Record<string, unknown> {
  const def = definitions[fqn];
  if (!def) throw new Error(`Type not found in tree-shaken model: ${fqn}`);
  const resolved = deepResolve(def, definitions);
  return cleanForStructuredOutput(enforceAdditionalPropertiesFalse(resolved));
}

/**
 * Resolves one or more type names into a schema.
 * @param definitions - available schema definitions
 * @param fqns - fully-qualified type names
 * @returns a schema or null when no types are provided
 */
function resolveUnionSchema(
  definitions: SchemaDefinitions,
  fqns: string[]
): Record<string, unknown> | null {
  if (fqns.length === 0) return null;
  if (fqns.length === 1) return resolveTypeSchema(definitions, fqns[0]);
  return { anyOf: fqns.map(fqn => resolveTypeSchema(definitions, fqn)) };
}

/**
 * Adds a description to a schema node.
 * @param def - schema node
 * @param description - description text
 * @returns the updated schema node
 */
function withDescription(
  def: Record<string, unknown>,
  description: string
): Record<string, unknown> {
  return { ...def, description };
}

/**
 * Closes a plain object schema to additional properties.
 * @param def - schema node
 * @returns the updated schema node
 */
function closeObjectSchema(def: Record<string, unknown>): Record<string, unknown> {
  if ('anyOf' in def) return def;
  return { ...def, additionalProperties: false };
}

/**
 * Build the JSON Schema fragment for the contract `state` property: the resolved
 * state definition for full-schema providers, or an open object otherwise.
 * @param full - whether to expand the resolved state definition
 * @param stateDef - the resolved state schema, or null when unavailable
 * @returns the `state` schema fragment
 */
function buildStateSchema(
  full: boolean,
  stateDef: Record<string, unknown> | null
): Record<string, unknown> {
  if (full && stateDef) {
    return closeObjectSchema(
      withDescription(stateDef, 'The contract state. Must match the Concerto state model.')
    );
  }
  return {
    type: 'object',
    description: 'The contract state. Must match the Concerto state model.',
    additionalProperties: false,
    properties: {},
  };
}

/**
 * Builds the schema for the `result` property.
 * @param full - whether to expand the resolved response definition
 * @param resultDef - the resolved response schema, or null when unavailable
 * @returns the `result` schema fragment
 */
function buildResultSchema(
  full: boolean,
  resultDef: Record<string, unknown> | null
): Record<string, unknown> {
  if (full && resultDef) {
    return closeObjectSchema(
      withDescription(resultDef, 'The response object. Must match the Concerto response model.')
    );
  }
  return {
    type: 'object',
    description: 'The response object. Must match the Concerto response model.',
    additionalProperties: false,
    properties: {},
  };
}

/**
 * Build the JSON Schema fragment for a single item of the `events` array: the
 * lone event definition, an `anyOf` across several, or an open object.
 * @param full - whether to expand the resolved event definitions
 * @param eventDefs - the resolved event schemas, or null when unavailable
 * @returns the event-item schema fragment
 */
function buildEventItemSchema(
  full: boolean,
  eventDefs: Record<string, unknown>[] | null
): Record<string, unknown> {
  if (full && eventDefs && eventDefs.length === 1) {
    return eventDefs[0];
  }
  if (full && eventDefs && eventDefs.length > 1) {
    // A template may emit more than one kind of event — each array item must
    // match one of them.
    return { anyOf: eventDefs };
  }
  return { type: 'object', additionalProperties: false, properties: {} };
}

/**
 * Build the full JSON Schema for an `init` response (`{ state }`).
 * @param full - whether to expand the resolved state definition
 * @param stateDef - the resolved state schema, or null when unavailable
 * @param stateless - true when the template carries no custom state
 * @returns the init-response schema
 */
function buildInitSchema(
  full: boolean,
  stateDef: Record<string, unknown> | null,
  stateless = false
): JsonSchema {
  if (stateless) {
    // Stateless templates carry no state — init always returns an empty object.
    return {
      type: 'object',
      properties: {
        state: {
          type: 'object',
          description: 'Empty state for a stateless template.',
          additionalProperties: false,
          properties: {},
        },
      },
      required: ['state'],
      additionalProperties: false,
    };
  }
  return {
    type: 'object',
    properties: {
      state: buildStateSchema(full, stateDef),
    },
    required: ['state'],
    additionalProperties: false,
  };
}

/**
 * Build the full JSON Schema for a `trigger` response (`{ result, events }`,
 * plus `state` for stateful templates).
 * @param full - whether to expand the resolved definitions
 * @param resultDef - the resolved response schema, or null when unavailable
 * @param stateDef - the resolved state schema, or null when unavailable
 * @param eventDefs - the resolved event schemas, or null when unavailable
 * @param stateless - true when the template carries no custom state
 * @returns the trigger-response schema
 */
function buildTriggerSchema(
  full: boolean,
  resultDef: Record<string, unknown> | null,
  stateDef: Record<string, unknown> | null,
  eventDefs: Record<string, unknown>[] | null,
  stateless = false
): JsonSchema {
  const properties: Record<string, unknown> = {
    result: buildResultSchema(full, resultDef),
    events: {
      type: 'array',
      items: buildEventItemSchema(full, eventDefs),
      description: 'Emitted events.',
    },
  };
  const required = ['result', 'events'];

  if (!stateless) {
    // Stateful templates must carry their updated state back in the response.
    properties.state = buildStateSchema(full, stateDef);
    required.push('state');
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

/**
 * Parse JSON from raw LLM output, tolerating a Markdown ```json ``` code fence.
 * @param text - the raw model output
 * @returns the parsed JSON value
 * @throws {Error} if no valid JSON can be extracted
 */
function extractJson(text: string): any {
  const raw = text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) return JSON.parse(match[1]);
    throw new Error(`LLM did not return valid JSON. Raw output: ${text}`);
  }
}

/**
 * Assert that a parsed value has the shape of an {@link InitResponse}.
 * @param value - the value to check
 * @throws {Error} if the value is not a valid init response
 */
function assertInitShape(value: any): asserts value is InitResponse {
  if (!value || typeof value !== 'object' || !value.state || typeof value.state !== 'object') {
    throw new Error('Invalid init response shape from LLM');
  }
}

/**
 * Assert that a parsed value has the shape of a {@link TriggerResponse}.
 * @param value - the value to check
 * @param stateless - true when `state` is not required (stateless template)
 * @throws {Error} if the value is not a valid trigger response
 */
function assertTriggerShape(value: any, stateless = false): asserts value is TriggerResponse {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid trigger response: not an object');
  if (!value.result || typeof value.result !== 'object')
    throw new Error('Invalid trigger response: missing result');
  if (!stateless && (!value.state || typeof value.state !== 'object'))
    throw new Error('Invalid trigger response: missing state (stateful template)');
  if (!Array.isArray(value.events))
    throw new Error('Invalid trigger response: events must be an array');
}

/**
 * Normalise a request's `$timestamp` to an ISO-8601 string. Concerto-
 * deserialized requests expose a `Date`; raw JSON requests expose a string.
 * @param request - the incoming request, may be undefined
 * @returns the request timestamp as an ISO string, or null when the request
 * carries no usable `$timestamp`
 */
function getRequestTimestamp(request: any): string | null {
  const raw = request?.$timestamp;
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Inject Accord Project runtime metadata (`$timestamp` on result/events,
 * `$identifier` on state), mirroring canonical Cicero engine output.
 * `$identifier` resolves via:
 * `state.$identifier → data.$identifier → data.clauseId → data.contractId → 'state-1'`.
 * @param response - the LLM response to enrich, mutated in place
 * @param timestamp - the ISO timestamp to stamp
 * @param data - the contract data, used to resolve the state `$identifier`
 * @returns the same response, with metadata applied
 */
function injectRuntimeMetadata<T extends { state?: any; result?: any; events?: any[] }>(
  response: T,
  timestamp: string,
  data?: any
): T {
  const rawState = response.state;
  const identifier: string =
    rawState?.$identifier || data?.$identifier || data?.clauseId || data?.contractId || 'state-1';

  if (response.result && typeof response.result === 'object') {
    response.result.$timestamp = timestamp;
  }

  if (
    response.state &&
    typeof response.state === 'object' &&
    Object.keys(response.state).length > 0
  ) {
    response.state.$identifier = identifier;
  }

  if (Array.isArray(response.events)) {
    for (const event of response.events) {
      if (event && typeof event === 'object') event.$timestamp = timestamp;
    }
  }

  return response;
}

/**
 * Executes an Accord Project template's `init` / `trigger` operations using an
 * LLM, deriving the request/response/state/event schemas from the template's own
 * ModelManager. Used as a fallback when a template carries no executable logic,
 * or when LLM execution is explicitly forced.
 */
export class LLMExecutor {
  /** The template being executed. */
  private readonly template: Template;
  private readonly config: LLMExecutorConfig;
  private readonly reasoner: BaseReasoner;
  private readonly fullSchema: boolean;

  /**
   * True when the template defines no custom State type. Stateless templates
   * return `{}` from init and omit `state` from trigger responses entirely.
   */
  private readonly stateless: boolean;

  /** Schema instances are per-executor so the object reference is stable for
   *  providers that cache grammars. The definitions are derived from the
   *  template's own ModelManager via tree-shaking — no external schema.json. */
  private readonly initSchema: JsonSchema;
  private readonly triggerSchema: JsonSchema;
  private readonly roots: TemplateRootTypes;
  private readonly promptSchema: Record<string, unknown> | null;

  /**
   * Creates an executor for a template.
   * @param template - template to execute
   * @param config - LLM configuration
   */
  constructor(template: Template, config: LLMExecutorConfig) {
    this.template = template;
    this.config = config;
    this.reasoner = createReasoner(config.provider);
    this.fullSchema = config.provider.isStructuredOutputSupported ?? false;
    this.stateless = !isStatefulTemplate(template);

    const roots = getTemplateRoots(template);
    this.roots = roots;
    const rootFqns = [...roots.requests, ...roots.responses, ...roots.states, ...roots.events];

    const { definitions } = rootFqns.length
      ? treeShakeModel(template, rootFqns)
      : { definitions: {} as Record<string, any> };

    const stateDef = resolveUnionSchema(definitions, roots.states);
    const resultDef = resolveUnionSchema(definitions, roots.responses);
    const requestDef = resolveUnionSchema(definitions, roots.requests);
    const eventDefs = roots.events.map(fqn => resolveTypeSchema(definitions, fqn));

    if (this.fullSchema) {
      this.initSchema = buildInitSchema(true, stateDef, this.stateless);
      this.triggerSchema = buildTriggerSchema(true, resultDef, stateDef, eventDefs, this.stateless);
      this.promptSchema = null;
    } else {
      this.initSchema = buildInitSchema(false, null, this.stateless);
      this.triggerSchema = buildTriggerSchema(false, null, null, null, this.stateless);
      this.promptSchema = {
        request: requestDef,
        response: resultDef,
        state: this.stateless ? null : stateDef,
        events: eventDefs.length ? eventDefs : null,
      };
    }

    if (config.verbose) {
      console.log(
        `[LLMExecutor] provider=${config.provider.provider} fullSchema=${String(this.fullSchema)} stateless=${String(this.stateless)}`
      );
    }
  }

  /** True when the template carries no persistent state. */
  get isStateless(): boolean {
    return this.stateless;
  }

  /**
   * Builds the shared prompt context.
   * @returns prompt context
   */
  private buildSharedContext() {
    const template = this.template as any;
    const metadata = template.getMetadata?.();
    const templateModel = template.getTemplateModel?.();

    return {
      templateName: metadata?.getName?.() ?? 'unknown-template',
      templateVersion: metadata?.getVersion?.() ?? null,
      contractText: template.getTemplate?.() ?? '',
      templateModelType: templateModel?.getFullyQualifiedName?.() ?? null,
      requestTypes: this.roots.requests,
      responseTypes: this.roots.responses,
      stateTypes: this.roots.states,
      emitTypes: this.roots.events,
      ...(this.promptSchema ? { schema: this.promptSchema } : {}),
    };
  }

  /**
   * Sends a request to the active reasoner with retries.
   * @param messages - the chat messages to send
   * @param schema - the JSON Schema the response must satisfy
   * @returns the model response content
   * @throws the last error if every attempt fails
   */
  private async ask(messages: ChatMessage[], schema: JsonSchema): Promise<{ content: string }> {
    const retries = this.config.provider.retries ?? 1;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (this.config.verbose && attempt > 0) {
          console.log(`[LLMExecutor] Retry attempt ${attempt}/${retries}`);
        }
        return await this.reasoner.complete(messages, schema);
      } catch (err) {
        lastError = err;
        if (this.config.verbose) {
          console.warn(`[LLMExecutor] attempt ${attempt} failed:`, err);
        }
      }
    }

    throw lastError;
  }

  /**
   * Computes the initial contract state.
   * @param data - the data for the template
   * @param currentTime - the current time, defaults to now
   * @param utcOffset - the UTC offset, defaults to zero
   * @returns the new state
   */
  async init(data: any, currentTime?: string, utcOffset?: number): Promise<InitResponse> {
    if (this.config.verbose) console.log('[LLMExecutor] INIT called');

    const context = this.buildSharedContext();
    const timestamp = currentTime ?? new Date().toISOString();

    const systemPrompt = this.stateless
      ? `You are a generic Accord Project contract runtime executor.
This template is STATELESS — it carries no persistent state between executions.

Task:
Return the initial (empty) state for this contract.`
      : `You are a generic Accord Project contract runtime executor.
You will receive:
- contract text
- Concerto model definitions
- template data

Task:
Compute the initial state of the contract.`;

    const userPrompt = JSON.stringify({
      operation: 'init',
      currentTime: timestamp,
      utcOffset: utcOffset ?? 0,
      data,
      context,
    });

    const response = await this.ask(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.initSchema
    );

    const parsed = extractJson(response.content);
    assertInitShape(parsed);
    return injectRuntimeMetadata(parsed, timestamp, data);
  }

  /**
   * Evaluates a trigger request.
   *
   * Stateful templates must always be evaluated against `priorState` — the
   * state produced by a prior call to {@link init} (or by a prior call to
   * `trigger`) — since there is no implicit "empty" state for a template that
   * declares custom State fields. Stateless templates ignore `priorState`.
   * @param data - the data for the template
   * @param request - the request to send to the contract logic
   * @param priorState - the state to evaluate the request against. Required for
   * stateful templates; ignored for stateless templates.
   * @param currentTime - the current time. Only used when the request carries no
   * `$timestamp`, which always takes precedence; defaults to now
   * @param utcOffset - the UTC offset, defaults to zero
   * @returns the response, updated state, and any events
   * @throws {Error} if the template is stateful and no priorState is supplied
   */
  async trigger(
    data: any,
    request: any,
    priorState?: any,
    currentTime?: string,
    utcOffset?: number
  ): Promise<TriggerResponse> {
    if (this.config.verbose) console.log('[LLMExecutor] TRIGGER called');

    if (!this.stateless && (!priorState || Object.keys(priorState).length === 0)) {
      throw new Error(
        'Stateful templates require priorState: call init() first and pass its ' +
          'returned state (or the state returned by a previous trigger()) as priorState.'
      );
    }

    const context = this.buildSharedContext();
    // The request's own `$timestamp` wins, then currentTime, then now.
    const timestamp = getRequestTimestamp(request) ?? currentTime ?? new Date().toISOString();

    const systemPrompt = this.stateless
      ? `You are a generic Accord Project contract runtime executor.
This template is STATELESS — outputs depend only on the current request and template model.

Task:
Evaluate contract behavior for this request.`
      : `You are a generic Accord Project contract runtime executor.
You will receive:
- contract text
- Concerto model definitions
- template data
- priorState (the state produced by init(), or by the previous trigger())
- incoming request/transaction

Task:
Evaluate contract behavior for this request, starting from priorState,
and return the updated state.`;

    const userPrompt = JSON.stringify({
      operation: 'trigger',
      currentTime: timestamp,
      utcOffset: utcOffset ?? 0,
      data,
      request,
      priorState: priorState ?? {},
      context,
    });

    const response = await this.ask(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.triggerSchema
    );

    const parsed = extractJson(response.content);
    assertTriggerShape(parsed, this.stateless);
    return injectRuntimeMetadata(parsed, timestamp, data);
  }
}
