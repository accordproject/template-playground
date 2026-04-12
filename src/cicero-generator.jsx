import { useState, useCallback, useRef, useEffect } from "react";

// ─── PROMPT DEFINITIONS ─────────────────────────────────────────────────────

const COORDINATOR_SYSTEM = `You are a legal-technology analyst for Accord Project Cicero templates.
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

const AGENT1_SYSTEM = `You are an Accord Project TemplateMark author.
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

const AGENT2_SYSTEM = `You are a Concerto data model author for Accord Project.
// Accord Project Target: Cicero TypeScript Runtime (2025)
// Concerto: v3.x (versioned namespaces, strict mode)

Given a Contract Brief and a grammar.tem.md file, produce a model.cto file.

CONCERTO CTO SYNTAX REFERENCE:
- Versioned namespace: namespace org.example.mytemplate@0.1.0
- Standard imports:
  import org.accordproject.time.* from https://models.accordproject.org/time@0.3.0.cto
  import org.accordproject.money.MonetaryAmount from https://models.accordproject.org/money@0.3.0.cto
  import org.accordproject.contract.* from https://models.accordproject.org/accordproject/contract.cto
  import org.accordproject.runtime.* from https://models.accordproject.org/accordproject/runtime.cto
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

const AGENT3_SYSTEM = `You are an Accord Project contract logic author.
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

const AGENT4_SYSTEM = `You are an Accord Project template validator.
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

// ─── API CALL HELPER ────────────────────────────────────────────────────────

async function callAgent(systemPrompt, userContent, maxTokens = 4096) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text.replace(/```(?:json|markdown|typescript|cto)?\n?/g, "").replace(/```$/g, "").trim();
}

function tryParseJSON(text) {
  try {
    // Find the first { and last } for resilient parsing
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "coordinator", label: "Contract Brief", icon: "§" },
  { id: "agent1", label: "TemplateMark", icon: "¶" },
  { id: "agent2", label: "Concerto Model", icon: "◇" },
  { id: "agent3", label: "Logic", icon: "λ" },
  { id: "agent4", label: "Validator", icon: "✓" },
  { id: "package", label: "Package", icon: "⊞" },
];

function StepIndicator({ currentStep, completedSteps, failedStep }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "0 0 28px 0" }}>
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isFailed = failedStep === step.id;
        const isPast = completedSteps.includes(step.id);
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
                  transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                  background: isFailed
                    ? "#dc2626"
                    : isCompleted
                    ? "#16a34a"
                    : isCurrent
                    ? "#1e293b"
                    : "#e2e8f0",
                  color: isFailed || isCompleted || isCurrent ? "#fff" : "#94a3b8",
                  boxShadow: isCurrent ? "0 0 0 3px rgba(30,41,59,0.18)" : "none",
                  animation: isCurrent ? "pulse 2s infinite" : "none",
                }}
              >
                {isFailed ? "✕" : isCompleted ? "✓" : step.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? "#1e293b" : isPast ? "#16a34a" : "#94a3b8",
                  marginTop: 5,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: isPast ? "#16a34a" : "#e2e8f0",
                  borderRadius: 1,
                  marginBottom: 18,
                  transition: "background 0.4s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CODE VIEWER ────────────────────────────────────────────────────────────

function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
        border: "1px solid #1e293b",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
            color: "#94a3b8",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          {filename}
          <span style={{ color: "#475569", marginLeft: 8 }}>{language}</span>
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "1px solid #334155",
            borderRadius: 5,
            color: copied ? "#4ade80" : "#94a3b8",
            fontSize: 11,
            padding: "3px 10px",
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            transition: "all 0.2s",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          fontSize: 12.5,
          lineHeight: 1.6,
          fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
          color: "#e2e8f0",
          overflowX: "auto",
          maxHeight: 420,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {code}
      </pre>
    </div>
  );
}

// ─── VALIDATION REPORT ──────────────────────────────────────────────────────

function ValidationReport({ report }) {
  if (!report) return null;
  const parsed = typeof report === "string" ? tryParseJSON(report) : report;
  if (!parsed) return <CodeBlock code={report} language="json" filename="validation-report.json" />;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          padding: "10px 14px",
          borderRadius: 8,
          background: parsed.status === "PASS" ? "#052e16" : "#450a0a",
          border: `1px solid ${parsed.status === "PASS" ? "#16a34a" : "#dc2626"}`,
        }}
      >
        <span style={{ fontSize: 20 }}>{parsed.status === "PASS" ? "✓" : "✕"}</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: parsed.status === "PASS" ? "#4ade80" : "#fca5a5",
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.05em",
          }}
        >
          VALIDATION {parsed.status}
        </span>
      </div>
      {parsed.checks && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {parsed.checks.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 6,
                background: c.status === "PASS" ? "#f0fdf4" : c.status === "WARN" ? "#fefce8" : "#fef2f2",
                border: `1px solid ${c.status === "PASS" ? "#bbf7d0" : c.status === "WARN" ? "#fef08a" : "#fecaca"}`,
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <span style={{ flexShrink: 0, fontSize: 13 }}>
                {c.status === "PASS" ? "✓" : c.status === "WARN" ? "⚠" : "✕"}
              </span>
              <div>
                <span style={{ color: "#475569", fontWeight: 600 }}>[{c.category}]</span>{" "}
                <span style={{ color: "#1e293b" }}>{c.message}</span>
                {c.fix && (
                  <div style={{ color: "#9333ea", marginTop: 2, fontSize: 11 }}>Fix: {c.fix}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

export default function CiceroTemplateGenerator() {
  const [documentText, setDocumentText] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [isContract, setIsContract] = useState(false);

  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [failedStep, setFailedStep] = useState(null);
  const [logs, setLogs] = useState([]);

  // Outputs
  const [contractBrief, setContractBrief] = useState(null);
  const [grammarTem, setGrammarTem] = useState(null);
  const [modelCto, setModelCto] = useState(null);
  const [logicTs, setLogicTs] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [packageJson, setPackageJson] = useState(null);
  const [requestJson, setRequestJson] = useState(null);

  const [activeTab, setActiveTab] = useState("brief");
  const logRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    setRunning(false);
    setCurrentStep(null);
    setCompletedSteps([]);
    setFailedStep(null);
    setLogs([]);
    setContractBrief(null);
    setGrammarTem(null);
    setModelCto(null);
    setLogicTs(null);
    setValidationReport(null);
    setPackageJson(null);
    setRequestJson(null);
    setActiveTab("brief");
  };

  const generate = async () => {
    if (!documentText.trim()) return;
    reset();
    setRunning(true);

    const userMeta = [];
    if (templateName) userMeta.push(`Template name: ${templateName}`);
    if (namespace) userMeta.push(`Namespace: ${namespace}`);
    userMeta.push(`Type: ${isContract ? "Contract (AccordContract)" : "Clause (AccordClause)"}`);
    const metaBlock = userMeta.length ? `\n\nUser-supplied metadata:\n${userMeta.join("\n")}` : "";

    try {
      // ── Step 0: Coordinator ──
      setCurrentStep("coordinator");
      addLog("Coordinator: Analyzing document and generating Contract Brief...");
      const briefRaw = await callAgent(
        COORDINATOR_SYSTEM,
        `<source_document>\n${documentText}\n</source_document>${metaBlock}`
      );
      const briefObj = tryParseJSON(briefRaw);
      if (!briefObj) throw new Error("Coordinator did not return valid JSON. Raw output: " + briefRaw.slice(0, 300));
      setContractBrief(briefObj);
      setCompletedSteps((p) => [...p, "coordinator"]);
      addLog(`Coordinator: Brief generated — ${briefObj.variables?.length || 0} variables identified.`);

      const briefStr = JSON.stringify(briefObj, null, 2);

      // ── Step 1: Agent 1 — TemplateMark ──
      setCurrentStep("agent1");
      addLog("Agent 1: Generating grammar.tem.md...");
      const grammar = await callAgent(
        AGENT1_SYSTEM,
        `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<source_document>\n${documentText}\n</source_document>`
      );
      setGrammarTem(grammar);
      setCompletedSteps((p) => [...p, "agent1"]);
      addLog("Agent 1: grammar.tem.md generated.");

      // ── Step 2: Agent 2 — Concerto Model ──
      setCurrentStep("agent2");
      addLog("Agent 2: Generating model.cto...");
      const model = await callAgent(
        AGENT2_SYSTEM,
        `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${grammar}\n</grammar_tem_md>`
      );
      setModelCto(model);
      setCompletedSteps((p) => [...p, "agent2"]);
      addLog("Agent 2: model.cto generated.");

      // ── Step 3: Agent 3 — Logic ──
      setCurrentStep("agent3");
      addLog("Agent 3: Generating logic.ts...");
      const logic = await callAgent(
        AGENT3_SYSTEM,
        `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${grammar}\n</grammar_tem_md>\n\n<model_cto>\n${model}\n</model_cto>\n\n<source_document>\n${documentText}\n</source_document>`,
        6000
      );
      setLogicTs(logic);
      setCompletedSteps((p) => [...p, "agent3"]);
      addLog("Agent 3: logic.ts generated.");

      // ── Step 4: Agent 4 — Validator ──
      setCurrentStep("agent4");
      addLog("Agent 4: Validating cross-consistency...");

      let finalGrammar = grammar;
      let finalModel = model;
      let finalLogic = logic;
      let report = null;

      for (let iteration = 0; iteration < 2; iteration++) {
        const valRaw = await callAgent(
          AGENT4_SYSTEM,
          `<contract_brief>\n${briefStr}\n</contract_brief>\n\n<grammar_tem_md>\n${finalGrammar}\n</grammar_tem_md>\n\n<model_cto>\n${finalModel}\n</model_cto>\n\n<logic_ts>\n${finalLogic}\n</logic_ts>`,
          4096
        );
        report = tryParseJSON(valRaw) || valRaw;

        if (typeof report === "object" && report.status === "PASS") {
          addLog(`Agent 4: Validation PASSED (iteration ${iteration + 1}).`);
          break;
        }

        if (typeof report === "object" && report.correctedArtifacts) {
          if (report.correctedArtifacts["grammar.tem.md"]) {
            finalGrammar = report.correctedArtifacts["grammar.tem.md"];
            setGrammarTem(finalGrammar);
            addLog("Agent 4: Applied corrections to grammar.tem.md");
          }
          if (report.correctedArtifacts["model.cto"]) {
            finalModel = report.correctedArtifacts["model.cto"];
            setModelCto(finalModel);
            addLog("Agent 4: Applied corrections to model.cto");
          }
          if (report.correctedArtifacts["logic.ts"]) {
            finalLogic = report.correctedArtifacts["logic.ts"];
            setLogicTs(finalLogic);
            addLog("Agent 4: Applied corrections to logic.ts");
          }
        }

        if (iteration === 0) {
          addLog("Agent 4: Issues found, re-validating with corrections...");
        } else {
          addLog("Agent 4: Maximum validation iterations reached.");
        }
      }

      setValidationReport(report);
      setCompletedSteps((p) => [...p, "agent4"]);

      // ── Step 5: Package Generation ──
      setCurrentStep("package");
      addLog("Generating package.json and request.json...");

      const pkg = {
        name: briefObj.templateName || "generated-template",
        version: briefObj.version || "0.1.0",
        description: "Generated from source document",
        runtime: "typescript",
        cicero: {
          template: briefObj.isContract ? "contract" : "clause",
        },
        dependencies: {},
      };
      setPackageJson(JSON.stringify(pkg, null, 2));

      const req = { $class: `${briefObj.namespace}@${briefObj.version}.${briefObj.requestType?.name || "Request"}`, $timestamp: "2025-01-01T00:00:00Z" };
      if (briefObj.requestType?.fields) {
        for (const f of briefObj.requestType.fields) {
          const sampleVar = briefObj.variables?.find((v) => v.name === f.name);
          req[f.name] = sampleVar?.sampleValue ?? (f.type === "DateTime" ? "2025-06-15T00:00:00Z" : f.type === "Double" ? 0 : f.type === "Integer" ? 0 : f.type === "Boolean" ? false : "");
        }
      }
      setRequestJson(JSON.stringify(req, null, 2));

      setCompletedSteps((p) => [...p, "package"]);
      setCurrentStep(null);
      addLog("✓ Template generation complete.");
      setActiveTab("grammar");
    } catch (err) {
      setFailedStep(currentStep);
      addLog(`ERROR: ${err.message}`);
      setCurrentStep(null);
    } finally {
      setRunning(false);
    }
  };

  const hasOutput = grammarTem || modelCto || logicTs;

  const TABS = [
    { id: "brief", label: "Contract Brief", ready: !!contractBrief },
    { id: "grammar", label: "grammar.tem.md", ready: !!grammarTem },
    { id: "model", label: "model.cto", ready: !!modelCto },
    { id: "logic", label: "logic.ts", ready: !!logicTs },
    { id: "validation", label: "Validation", ready: !!validationReport },
    { id: "package", label: "Package Files", ready: !!packageJson },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf9",
        fontFamily: "'Charter', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600&display=swap');
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(30,41,59,0.18); } 50% { box-shadow: 0 0 0 6px rgba(30,41,59,0.08); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus, input:focus, select:focus { outline: none; border-color: #1e293b !important; box-shadow: 0 0 0 3px rgba(30,41,59,0.08) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* ── HEADER ── */}
      <header
        style={{
          padding: "32px 40px 24px",
          borderBottom: "1px solid #e7e5e4",
          background: "#fafaf9",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 900,
                fontFamily: "'Fraunces', Georgia, serif",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              AI Template Generator
            </h1>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: "#94a3b8",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "#f1f5f9",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              Accord Project
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              color: "#78716c",
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontWeight: 300,
            }}
          >
            Multi-agent system for generating complete Cicero templates from legal documents
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 40px 60px" }}>
        {/* ── STEP INDICATOR ── */}
        {(running || hasOutput) && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} failedStep={failedStep} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: hasOutput ? "380px 1fr" : "1fr", gap: 28 }}>
          {/* ── LEFT: INPUT ── */}
          <div style={{ animation: "fadeUp 0.35s ease-out" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e7e5e4",
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 18px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1e293b",
                  fontFamily: "'Fraunces', Georgia, serif",
                  letterSpacing: "-0.01em",
                }}
              >
                Source Document
              </h2>

              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your legal/contractual text here...&#10;&#10;Example: Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 2 days of delay penalty amounting to 10.5% of the total value..."
                style={{
                  width: "100%",
                  minHeight: hasOutput ? 160 : 200,
                  padding: 14,
                  borderRadius: 8,
                  border: "1px solid #d6d3d1",
                  fontSize: 13.5,
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  lineHeight: 1.65,
                  color: "#1e293b",
                  resize: "vertical",
                  background: "#fafaf9",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#78716c",
                      fontFamily: "'IBM Plex Mono', monospace",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Template Name
                  </label>
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. lateDelivery"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d6d3d1",
                      fontSize: 12.5,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#1e293b",
                      background: "#fafaf9",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#78716c",
                      fontFamily: "'IBM Plex Mono', monospace",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Namespace
                  </label>
                  <input
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="e.g. org.example.late"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d6d3d1",
                      fontSize: 12.5,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#1e293b",
                      background: "#fafaf9",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#78716c",
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Type
                </label>
                <button
                  onClick={() => setIsContract(false)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: !isContract ? "#1e293b" : "#d6d3d1",
                    background: !isContract ? "#1e293b" : "#fff",
                    color: !isContract ? "#fff" : "#78716c",
                    fontSize: 11,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Clause
                </button>
                <button
                  onClick={() => setIsContract(true)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: isContract ? "#1e293b" : "#d6d3d1",
                    background: isContract ? "#1e293b" : "#fff",
                    color: isContract ? "#fff" : "#78716c",
                    fontSize: 11,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Contract
                </button>
              </div>

              <button
                onClick={generate}
                disabled={running || !documentText.trim()}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: running ? "#475569" : "#0f172a",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Fraunces', Georgia, serif",
                  cursor: running ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s",
                  opacity: !documentText.trim() ? 0.4 : 1,
                  letterSpacing: "-0.01em",
                }}
              >
                {running && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                )}
                {running ? "Generating Template..." : "Generate Cicero Template"}
              </button>
            </div>

            {/* ── LOG PANEL ── */}
            {logs.length > 0 && (
              <div
                ref={logRef}
                style={{
                  marginTop: 16,
                  background: "#0f172a",
                  borderRadius: 10,
                  padding: 14,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid #1e293b",
                }}
              >
                {logs.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: l.msg.startsWith("ERROR") ? "#fca5a5" : l.msg.startsWith("✓") ? "#4ade80" : "#94a3b8",
                      lineHeight: 1.7,
                      animation: "fadeUp 0.25s ease-out",
                    }}
                  >
                    <span style={{ color: "#475569" }}>{l.time}</span> {l.msg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: OUTPUT ── */}
          {hasOutput && (
            <div style={{ animation: "fadeUp 0.4s ease-out" }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e7e5e4",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Tab bar */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #e7e5e4",
                    overflowX: "auto",
                    background: "#fafaf9",
                  }}
                >
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => tab.ready && setActiveTab(tab.id)}
                      disabled={!tab.ready}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderBottom: activeTab === tab.id ? "2px solid #0f172a" : "2px solid transparent",
                        background: "none",
                        color: !tab.ready ? "#cbd5e1" : activeTab === tab.id ? "#0f172a" : "#78716c",
                        fontSize: 11.5,
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: tab.ready ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.02em",
                        transition: "all 0.15s",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ padding: 20, maxHeight: 600, overflowY: "auto" }}>
                  {activeTab === "brief" && contractBrief && (
                    <CodeBlock
                      code={JSON.stringify(contractBrief, null, 2)}
                      language="json"
                      filename="contract-brief.json"
                    />
                  )}
                  {activeTab === "grammar" && grammarTem && (
                    <CodeBlock code={grammarTem} language="templatemark" filename="text/grammar.tem.md" />
                  )}
                  {activeTab === "model" && modelCto && (
                    <CodeBlock code={modelCto} language="concerto" filename="model/model.cto" />
                  )}
                  {activeTab === "logic" && logicTs && (
                    <CodeBlock code={logicTs} language="typescript" filename="logic/logic.ts" />
                  )}
                  {activeTab === "validation" && validationReport && (
                    <ValidationReport report={validationReport} />
                  )}
                  {activeTab === "package" && packageJson && (
                    <>
                      <CodeBlock code={packageJson} language="json" filename="package.json" />
                      {requestJson && (
                        <CodeBlock code={requestJson} language="json" filename="request.json" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
