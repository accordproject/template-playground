/**
 * Multi-agent orchestration logic for Cicero template generation.
 * This module contains the prompt definitions and pipeline execution logic.
 */

import { AIConfig } from '../../types/components/AIAssistant.types';
import { 
  ContractBrief, 
  ValidationReport, 
  StepId,
  LogEntry,
  GeneratorOutputs 
} from './types';

// ─── PROMPT DEFINITIONS ─────────────────────────────────────────────────────

export const COORDINATOR_SYSTEM = `You are a legal-technology analyst for Accord Project Cicero templates.
// Accord Project Target: Cicero TypeScript Runtime (2025)
// Concerto: v3.x (versioned namespaces, strict mode)
// TemplateMark: CommonMark + AP extensions
// Logic: TypeScript (TemplateLogic base class)

Analyze the provided legal document and produce a structured "Contract Brief" JSON.

Output ONLY a valid JSON object (no markdown fences, no explanation) with this schema:
{
  "templateName": string,         // camelCase name
  "namespace": string,            // e.g. "org.example.latedelivery"
  "version": "0.1.0",
  "isContract": boolean,          // true = AccordContract, false = AccordClause
  "variables": [
    {
      "name": string,             // camelCase property name
      "type": string,             // Concerto type: String, Double, Integer, DateTime, Duration, Boolean, MonetaryAmount, or custom enum/concept
      "description": string,
      "sampleValue": any,
      "format": string | null     // e.g. "DD/MM/YYYY" for dates, "0,0.00 CCC" for amounts
    }
  ],
  "enumerations": [
    { "name": string, "values": string[] }
  ],
  "conditionalProvisions": [
    { "variable": string, "description": string, "whenTrue": string, "whenFalse": string }
  ],
  "obligations": [
    { "name": string, "type": "event", "fields": [{"name": string, "type": string}], "trigger": string }
  ],
  "requestType": {
    "name": string,
    "fields": [{ "name": string, "type": string }]
  },
  "responseType": {
    "name": string,
    "fields": [{ "name": string, "type": string }]
  },
  "stateType": {
    "name": string,
    "fields": [{ "name": string, "type": string, "initialValue": any }]
  } | null,
  "computedTextPassages": [
    { "location": string, "expression": string, "dependencies": string[] }
  ]
}`;

export const AGENT1_SYSTEM = `You are an Accord Project TemplateMark author.
// Accord Project Target: Cicero TypeScript Runtime (2025)

Given a source legal document and a Contract Brief, produce a grammar.tem.md file.

TEMPLATEMARK SYNTAX REFERENCE:
| Feature | Syntax | When to Use |
|---|---|---|
| Simple variable | {{variableName}} | Atomic values: String, Double, Integer, Long, Boolean, enum, DateTime, Duration |
| Formatted variable | {{variableName as "FORMAT"}} | Dates (DD/MM/YYYY), amounts (0,0.00 CCC), large numbers (0,0) |
| Conditional block | {{#if boolVar}}...{{else}}...{{/if}} | Boolean-dependent text |
| Optional block | {{#optional optVar}}...{{else}}...{{/optional}} | Text present only when an optional field has a value |
| With block | {{#with complexVar}}...{{/with}} | Scoping into a nested complex type |
| Join block (inline) | {{#join arrayVar separator=", "}}...{{/join}} | Inline comma-separated lists from arrays |
| Unordered list | {{#ulist arrayVar}}\\n...\\n{{/ulist}} | Bulleted lists from arrays |
| Ordered list | {{#olist arrayVar}}\\n...\\n{{/olist}} | Numbered lists from arrays |
| Clause block | {{#clause clauseName}}...{{/clause}} | Embedding a clause inside a contract |
| Template formula | {{% return expression %}} | Computed/derived text evaluated at draft time (TypeScript expression) |

CRITICAL RULES:
- Every {{variableName}} must correspond exactly to a property name in the Concerto model's @template asset.
- String values in instance text appear between double quotes.
- Enum values appear without quotes.
- Duration values appear as <number> <unit> (e.g., 15 days).
- {{% return ... %}} formulas are TypeScript expressions; they can reference any field name from the template model.
- The file must be valid CommonMark with TemplateMark extensions.
- For contracts (not clauses), the top level must use {{#clause name}}...{{/clause}} blocks.

RULES:
1. Preserve the natural language of the source document as faithfully as possible.
2. Replace every variable value with the appropriate TemplateMark variable syntax.
3. Use formatted variables for dates and monetary amounts.
4. Use conditional blocks ({{#if}}) for Boolean-dependent text.
5. Use optional blocks ({{#optional}}) for provisions that may be absent.
6. Use {{% return ... %}} for any derived/computed text.
7. Use {{#with}} to scope into complex nested types.
8. Use {{#join}}, {{#ulist}}, or {{#olist}} for repeated items.
9. Every variable name must be in camelCase and match the Contract Brief.
10. Do NOT invent variable names not in the Contract Brief.

Output ONLY the contents of grammar.tem.md, nothing else. No markdown code fences.`;

export const AGENT2_SYSTEM = `You are a Concerto data model author for Accord Project.
// Accord Project Target: Cicero TypeScript Runtime (2025)
// Concerto: v3.x (versioned namespaces, strict mode)

Given a Contract Brief and a grammar.tem.md file, produce a model.cto file.

CONCERTO CTO SYNTAX REFERENCE:
- Versioned namespace: namespace org.example.mytemplate@0.1.0
- Standard imports:
  import org.accordproject.time@0.3.0.Duration from https://models.accordproject.org/time@0.3.0.cto
  import org.accordproject.money@0.3.0.MonetaryAmount from https://models.accordproject.org/money@0.3.0.cto
  import org.accordproject.contract@0.2.0.{Contract, Clause} from https://models.accordproject.org/accordproject/contract@0.2.0.cto
  import org.accordproject.runtime@0.2.0.{Obligation, Request, Response, State} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto
- Enumerations: enum Name { o VALUE1 o VALUE2 }
- @template decorator on root asset
- Root asset extends AccordClause or AccordContract
- Concepts for nested types: concept Name { o Type field }
- Transactions extend Request or Response
- State extends State
- Events extend Event
- Primitive types: String, Boolean, Integer, Long, Double, DateTime
- Arrays: o TypeName[] propertyName
- Optional: o TypeName propertyName optional

RULES:
1. Use a versioned namespace matching the Contract Brief.
2. Decorate the root asset with @template.
3. Extend AccordClause or AccordContract per the Contract Brief.
4. Every variable in grammar.tem.md must have a corresponding property with an EXACTLY matching name (camelCase) in the @template asset.
5. Use Accord Project standard library types for Duration, MonetaryAmount, etc.
6. Define request, response, state, and event types as needed.
7. State extends State; Request extends Request; Response extends Response; events extend Event.
8. Use "optional" keyword for fields that may be absent.
9. Use [] suffix for array-typed fields.
10. All enumerations from the Contract Brief must be defined.
11. Import standard Accord Project models as needed.

Output ONLY the contents of model.cto, nothing else. No markdown code fences.`;

export const AGENT3_SYSTEM = `You are an Accord Project contract logic author.
// Accord Project Target: Cicero TypeScript Runtime (2025)

Given a Contract Brief, a grammar.tem.md, and a model.cto, produce a logic.ts file.

TYPESCRIPT LOGIC REFERENCE:
- The class must extend TemplateLogic<ITemplateModel> where ITemplateModel is the generated interface for the @template asset.
- Always include the // @ts-ignore comment before the class declaration (TemplateLogic is runtime-injected).
- Import interfaces from './generated/{namespace}' — interface names are I + type name (e.g., IMyRequest).
- init() returns { state: IMyState }. Omit init() entirely if stateless.
- trigger() receives data (contract params), request (incoming event), state (current state or never if stateless).
- trigger() returns { result: IMyResponse; state?: IMyState; emit?: object[] }.
- Every returned object must include $class with the fully qualified Concerto type name including version.
- Response objects must include $timestamp: new Date().
- State objects must include $identifier.
- Use throw new Error(message) for precondition failures.
- Emit obligations in the emit array. Each must have a $class matching an event type in model.cto.
- If state is unchanged, either omit the state field or spread-copy it.
- The logic is pure TypeScript — standard library functions, Math, Date, etc. are all available.
- export default ClassName; is required at the end.

RULES:
1. Import generated interfaces from './generated/{namespace}'. Interface names are 'I' + the Concerto type name.
2. Class must extend TemplateLogic<ITemplateModel> with // @ts-ignore above it.
3. Implement init() ONLY if the contract has state. Otherwise omit it.
4. Implement trigger() to handle the request type defined in model.cto.
5. Access contract parameters via data.* (matching @template asset properties).
6. Access request fields via request.* (matching request transaction properties).
7. Every returned object must have $class set to the fully qualified type name.
8. Response objects must include $timestamp: new Date().
9. State objects must include $identifier.
10. Use throw new Error() for preconditions (e.g., date validation).
11. Emit obligations/events in the emit array when the contract requires it.
12. Use export default ClassName; at the end.
13. Encode the business rules from the source document faithfully: penalty calculations, caps, thresholds, termination conditions, payment schedules, deadline logic.

Output ONLY the contents of logic.ts, nothing else. No markdown code fences.`;

export const AGENT4_SYSTEM = `You are an Accord Project template validator.
// Accord Project Target: Cicero TypeScript Runtime (2025)

Given three artifacts (grammar.tem.md, model.cto, logic.ts) and a Contract Brief, verify their mutual consistency and correctness.

Perform ALL of the following checks:

TEMPLATE <-> MODEL:
- Every {{variable}} in grammar.tem.md has a matching property in the @template asset in model.cto (exact name match, compatible type).
- No orphaned model properties (every @template property is used in the template).
- Block types match model types ({{#if}} -> Boolean, {{#optional}} -> optional, etc.).
- Formula identifiers reference valid @template properties.

MODEL <-> LOGIC:
- Imported interfaces match model types (I + TypeName).
- trigger() signature matches Request, Response, State types.
- Every $class value matches a fully qualified type in model.cto.
- Every field access (data.X, request.X, state.X) exists in the model.
- init() present iff State type is defined.

TEMPLATE <-> LOGIC:
- Template formulas are valid TypeScript against model properties.
- Logic implements the business rules described in the template text.

STRUCTURAL:
- model.cto has valid Concerto CTO syntax.
- grammar.tem.md has balanced TemplateMark block delimiters.
- logic.ts has valid class structure and export default.

Output ONLY a valid JSON object (no markdown fences, no explanation):
{
  "status": "PASS" | "FAIL",
  "checks": [
    {
      "category": "template-model" | "model-logic" | "template-logic" | "structural",
      "check": string,
      "status": "PASS" | "FAIL" | "WARN",
      "message": string,
      "fix": string | null
    }
  ],
  "correctedArtifacts": {
    "grammar.tem.md": corrected_string | null,
    "model.cto": corrected_string | null,
    "logic.ts": corrected_string | null
  }
}`;

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Attempts to parse JSON from text, with resilient handling of markdown fences.
 */
export function tryParseJSON<T>(text: string): T | null {
  try {
    // Find the first { and last } for resilient parsing
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Cleans LLM output by removing markdown code fences.
 */
export function cleanLLMOutput(text: string): string {
  return text
    .replace(/```(?:json|markdown|typescript|cto)?\n?/g, '')
    .replace(/```$/g, '')
    .trim();
}

// ─── LLM CALL ABSTRACTION ───────────────────────────────────────────────────

// Non-chat completion models that don't work with /v1/chat/completions
const NON_CHAT_MODELS = [
  'gpt-3.5-turbo-instruct',
  'davinci-002',
  'babbage-002',
  'text-davinci-003',
  'text-davinci-002',
  'text-curie-001',
  'text-babbage-001',
  'text-ada-001',
];

export interface CallAgentOptions {
  systemPrompt: string;
  userContent: string;
  maxTokens?: number;
  aiConfig: AIConfig;
}

/**
 * Calls an LLM agent with the given prompts.
 * Uses the configured AI provider (Anthropic or OpenAI-compatible) based on `aiConfig`.
 */
export async function callAgent({
  systemPrompt,
  userContent,
  maxTokens = 4096,
  aiConfig,
}: CallAgentOptions): Promise<string> {
  // Validate that we're using a chat model for OpenAI
  if (aiConfig.provider === 'openai' && aiConfig.model) {
    const modelLower = aiConfig.model.toLowerCase();
    if (NON_CHAT_MODELS.some(m => modelLower.includes(m))) {
      throw new Error(
        `The model "${aiConfig.model}" is a completion model, not a chat model. ` +
        `Please select a chat model like gpt-4o, gpt-4-turbo, or gpt-3.5-turbo in your AI settings.`
      );
    }
  }
  
  // Determine API endpoint and headers based on provider
  const isAnthropic = aiConfig.provider === 'anthropic';
  
  if (isAnthropic) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': aiConfig.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: aiConfig.model || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await response.json() as {
      error?: { message?: string };
      content?: Array<{ type: string; text?: string }>;
    };

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text || '')
      .join('\n');

    return cleanLLMOutput(text);
  } else {
    // For OpenAI-compatible providers
    const endpoint = aiConfig.provider === 'openai' 
      ? 'https://api.openai.com/v1/chat/completions'
      : aiConfig.customEndpoint 
        ? `${aiConfig.customEndpoint}/chat/completions`
        : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    });

    const data = await response.json() as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const text = data.choices?.[0]?.message?.content || '';
    return cleanLLMOutput(text);
  }
}

// ─── PIPELINE EXECUTION ─────────────────────────────────────────────────────

export interface PipelineCallbacks {
  onStepStart: (step: StepId) => void;
  onStepComplete: (step: StepId) => void;
  onStepFail: (step: StepId, error: Error) => void;
  onLog: (entry: LogEntry) => void;
  onOutputUpdate: (outputs: Partial<GeneratorOutputs>) => void;
}

export interface PipelineOptions {
  documentText: string;
  templateName: string;
  namespace: string;
  isContract: boolean;
  aiConfig: AIConfig;
  callbacks: PipelineCallbacks;
  abortSignal?: AbortSignal;
}

/**
 * Executes the multi-agent template generation pipeline.
 */
export async function runGenerationPipeline(options: PipelineOptions): Promise<GeneratorOutputs> {
  const { documentText, templateName, namespace, isContract, aiConfig, callbacks, abortSignal } = options;

  const addLog = (msg: string) => {
    callbacks.onLog({ time: new Date().toLocaleTimeString(), msg });
  };

  const outputs: GeneratorOutputs = {
    contractBrief: null,
    grammarTem: null,
    modelCto: null,
    logicTs: null,
    validationReport: null,
    packageJson: null,
    requestJson: null,
  };

  // Build metadata block
  const userMeta: string[] = [];
  if (templateName) userMeta.push(`Template name: ${templateName}`);
  if (namespace) userMeta.push(`Namespace: ${namespace}`);
  userMeta.push(`Type: ${isContract ? 'Contract (AccordContract)' : 'Clause (AccordClause)'}`);
  const metaBlock = userMeta.length ? `\n\nUser-supplied metadata:\n${userMeta.join('\n')}` : '';

  try {
    // ── Step 0: Coordinator ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('coordinator');
    addLog('Coordinator: Analyzing document and generating Contract Brief...');

    const briefRaw = await callAgent({
      systemPrompt: COORDINATOR_SYSTEM,
      userContent: `<source_document>\n${documentText}\n</source_document>${metaBlock}`,
      aiConfig,
    });

    const briefObj = tryParseJSON<ContractBrief>(briefRaw);
    if (!briefObj) {
      throw new Error('Coordinator did not return valid JSON. Raw output: ' + briefRaw.slice(0, 300));
    }

    outputs.contractBrief = briefObj;
    callbacks.onOutputUpdate({ contractBrief: briefObj });
    callbacks.onStepComplete('coordinator');
    addLog(`Coordinator: Brief generated — ${briefObj.variables?.length || 0} variables identified.`);

    const briefStr = JSON.stringify(briefObj, null, 2);

    // ── Step 1: Agent 1 — TemplateMark ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('agent1');
    addLog('Agent 1: Generating grammar.tem.md...');

    const grammar = await callAgent({
      systemPrompt: AGENT1_SYSTEM,
      userContent: `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<source_document>\n${documentText}\n</source_document>`,
      aiConfig,
    });

    outputs.grammarTem = grammar;
    callbacks.onOutputUpdate({ grammarTem: grammar });
    callbacks.onStepComplete('agent1');
    addLog('Agent 1: grammar.tem.md generated.');

    // ── Step 2: Agent 2 — Concerto Model ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('agent2');
    addLog('Agent 2: Generating model.cto...');

    const model = await callAgent({
      systemPrompt: AGENT2_SYSTEM,
      userContent: `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${grammar}\n</grammar_tem_md>`,
      aiConfig,
    });

    outputs.modelCto = model;
    callbacks.onOutputUpdate({ modelCto: model });
    callbacks.onStepComplete('agent2');
    addLog('Agent 2: model.cto generated.');

    // ── Step 3: Agent 3 — Logic ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('agent3');
    addLog('Agent 3: Generating logic.ts...');

    const logic = await callAgent({
      systemPrompt: AGENT3_SYSTEM,
      userContent: `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${grammar}\n</grammar_tem_md>\n\n<model_cto>\n${model}\n</model_cto>\n\n<source_document>\n${documentText}\n</source_document>`,
      maxTokens: 6000,
      aiConfig,
    });

    outputs.logicTs = logic;
    callbacks.onOutputUpdate({ logicTs: logic });
    callbacks.onStepComplete('agent3');
    addLog('Agent 3: logic.ts generated.');

    // ── Step 4: Agent 4 — Validator ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('agent4');
    addLog('Agent 4: Validating cross-consistency...');

    let finalGrammar = grammar;
    let finalModel = model;
    let finalLogic = logic;
    let report: ValidationReport | string | null = null;

    for (let iteration = 0; iteration < 2; iteration++) {
      if (abortSignal?.aborted) throw new Error('Generation cancelled');

      const valRaw = await callAgent({
        systemPrompt: AGENT4_SYSTEM,
        userContent: `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${finalGrammar}\n</grammar_tem_md>\n\n<model_cto>\n${finalModel}\n</model_cto>\n\n<logic_ts>\n${finalLogic}\n</logic_ts>`,
        aiConfig,
      });

      report = tryParseJSON<ValidationReport>(valRaw) || valRaw;

      if (typeof report === 'object' && report.status === 'PASS') {
        addLog(`Agent 4: Validation PASSED (iteration ${iteration + 1}).`);
        break;
      }

      if (typeof report === 'object' && report.correctedArtifacts) {
        if (report.correctedArtifacts['grammar.tem.md']) {
          finalGrammar = report.correctedArtifacts['grammar.tem.md'];
          outputs.grammarTem = finalGrammar;
          callbacks.onOutputUpdate({ grammarTem: finalGrammar });
          addLog('Agent 4: Applied corrections to grammar.tem.md');
        }
        if (report.correctedArtifacts['model.cto']) {
          finalModel = report.correctedArtifacts['model.cto'];
          outputs.modelCto = finalModel;
          callbacks.onOutputUpdate({ modelCto: finalModel });
          addLog('Agent 4: Applied corrections to model.cto');
        }
        if (report.correctedArtifacts['logic.ts']) {
          finalLogic = report.correctedArtifacts['logic.ts'];
          outputs.logicTs = finalLogic;
          callbacks.onOutputUpdate({ logicTs: finalLogic });
          addLog('Agent 4: Applied corrections to logic.ts');
        }
      }

      if (iteration === 0) {
        addLog('Agent 4: Issues found, re-validating with corrections...');
      } else {
        addLog('Agent 4: Maximum validation iterations reached.');
      }
    }

    outputs.validationReport = report;
    callbacks.onOutputUpdate({ validationReport: report });
    callbacks.onStepComplete('agent4');

    // ── Step 5: Package Generation ──
    if (abortSignal?.aborted) throw new Error('Generation cancelled');
    callbacks.onStepStart('package');
    addLog('Generating package.json and request.json...');

    const pkg = {
      name: briefObj.templateName || 'generated-template',
      version: briefObj.version || '0.1.0',
      description: 'Generated from source document',
      runtime: 'typescript',
      cicero: {
        template: briefObj.isContract ? 'contract' : 'clause',
      },
      dependencies: {},
    };
    outputs.packageJson = JSON.stringify(pkg, null, 2);

    const req: Record<string, unknown> = {
      $class: `${briefObj.namespace}@${briefObj.version}.${briefObj.requestType?.name || 'Request'}`,
      $timestamp: '2025-01-01T00:00:00Z',
    };

    if (briefObj.requestType?.fields) {
      for (const f of briefObj.requestType.fields) {
        const sampleVar = briefObj.variables?.find((v) => v.name === f.name);
        req[f.name] = sampleVar?.sampleValue ?? getDefaultValueForType(f.type);
      }
    }
    outputs.requestJson = JSON.stringify(req, null, 2);

    callbacks.onOutputUpdate({ packageJson: outputs.packageJson, requestJson: outputs.requestJson });
    callbacks.onStepComplete('package');
    addLog('✓ Template generation complete.');

    return outputs;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${errorMessage}`);
    throw error;
  }
}

/**
 * Returns a default value for a given Concerto type.
 */
function getDefaultValueForType(type: string): unknown {
  switch (type) {
    case 'DateTime':
      return '2025-06-15T00:00:00Z';
    case 'Double':
    case 'Integer':
    case 'Long':
      return 0;
    case 'Boolean':
      return false;
    default:
      return '';
  }
}
