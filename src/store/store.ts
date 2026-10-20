import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { debounce } from "ts-debounce";
import { SAMPLES, Sample } from "../samples";
import * as playground from "../samples/playground";
import { compress, decompress } from "../utils/compression/compression";
// Import removed: compileLogicTs is now a no-op
import {
  AIConfig,
  ChatState,
  KeyProtectionLevel,
} from "../types/components/AIAssistant.types";
import {
  ExecutionEngine,
  LLMMode,
} from "../ai-assistant/llmProviders";
import type {
  InitResponse,
  TriggerResponse,
} from "../ai-assistant/llmProviders";
import { validateBeforeRebuild } from "../utils/validators";
import { buildTemplateArchive } from "../utils/templateArchive";
import { sandboxResolvers } from "./sandboxResolvers";
import { rebuildInSandbox } from "./rebuildSandbox";
import tour from "../components/Tour";

/** sampleName of a template opened from a share link; design v2 starts on it instead of the first card. */
export const SHARED_TEMPLATE_NAME = "Shared template";

/**
 * A single step in a stateful template's execution chain: either the Init
 * step (index 0 — `request`/`priorState`/`result` all `null`) or a
 * subsequent trigger. Mirrors the shape `LLMExecutor.trigger()` (and the
 * sandboxed TS logic) already speak — `priorState` in, `result` + `state` +
 * `events` out — plus `edited`, which marks a step whose `state` was
 * hand-edited in the runner rather than produced by a run.
 *
 * Persisted to localStorage (see `getInitialChain`/`persistChain`) so a page
 * refresh doesn't lose the sequence. This is the "current chain" model used
 * to drive the stepper UI; `executionHistory` (below) is a parallel, flatter
 * log of every run (including failed ones) used by the Simulate view.
 */
export interface ChainStep {
  /** Label shown in the stepper ("Init", "Trigger 1", ...). */
  label: string;
  /** The request payload evaluated for this step. `null` for the Init step. */
  request: object | null;
  /** The state this step was evaluated against. `null` for the Init step. */
  priorState: object | null;
  /** The response returned by this step. `null` for the Init step. */
  result: object | null;
  /** The resulting state after this step. */
  state: object;
  /** Events emitted by this step. */
  events: object[];
  /** True once this step's `state` was hand-edited rather than produced by a run. */
  edited: boolean;
}

/**
 * One `init` or `trigger` execution, stored in `executionHistory` to track the
 * evolution of the contract state over time. Unlike `executionChain`, failed
 * runs are kept too, so the Simulate view can show what was sent and why it
 * was rejected. Populated alongside `executionChain` by `initContract` and
 * `triggerContract`, from whichever engine (compiled TypeScript or LLM) ran.
 */
export interface LogicExecutionResult {
  /** "init" for the initialisation run, then "#1", "#2", … for triggers. */
  id: string;
  method: "init" | "trigger";
  /** Contract data for `init`, the request payload for `trigger`. */
  request: object;
  /** `result` of a trigger, or `{ state, events }` of an init. Null when the run failed. */
  response: object | null;
  stateBefore: object | null;
  stateAfter: object | null;
  events: object[];
  /** Formatted error message when the run threw; null on success. */
  error: string | null;
  /**
   * Where a failed run stopped: "parse" when the request/data JSON could not
   * be read (nothing was sent to the logic), "run" when the logic itself, or
   * the engine invoking it, threw.
   */
  stage: "parse" | "run";
  durationMs: number;
  executedAt: string; // ISO timestamp
}

interface AppState {
  activeTab: "build" | "simulate";
  setActiveTab: (tab: "build" | "simulate") => void;
  templateMarkdown: string;
  editorValue: string;
  modelCto: string;
  editorModelCto: string;
  data: string;
  editorAgreementData: string;
  agreementHtml: string;
  error: string | undefined;
  samples: Array<Sample>;
  sampleName: string;
  /**
   * data.json as it was when the current template was imported (archive,
   * library or share link), for the Data step's reset; null for bundled
   * samples, which reset to their own data.
   */
  importedData: string | null;
  isAIChatOpen: boolean;
  backgroundColor: string;
  textColor: string;
  chatState: ChatState;
  aiConfig: AIConfig | null;
  chatAbortController: AbortController | null;
  // Committed TypeScript logic source (triggers compilation)
  logicTs: string;
  // Live editor value — not committed until user clicks Apply
  editorLogicTs: string;
  // Resulting compiled JS payload. Null while compilation is stale/failed.
  compiledLogicJs: string | null;
  // model.cto the last compilation ran against; logic compiled against an older model is stale.
  compiledModelCto: string | null;
  // True while compilation is running.
  isCompiling: boolean;
  // Compilation diagnostics.
  compilationErrors: {
    message: string;
    line?: number;
    column?: number;
    length?: number;
  }[];
  // Official Template object instance loaded from cicero-core
  templateObject: import("@accordproject/cicero-core").Template | null;
  // Reference to the sandbox iframe element
  sandboxIframe: HTMLIFrameElement | null;
  // Whether the sandbox has signaled readiness
  isSandboxReady: boolean;
  // Whether logic execution is in progress
  isExecuting: boolean;
  /**
   * Which of the two runner actions is in flight. `isExecuting` gates the
   * sandbox against concurrent runs and so is shared, but the buttons need to
   * know *whose* run it is — otherwise triggering a request spins the Init
   * button too.
   */
  executingOperation: "init" | "trigger" | null;
  // Monotonically increasing counter for deduplicating concurrent results
  executionId: number;
  setTemplateMarkdown: (template: string) => Promise<void>;
  setEditorValue: (value: string) => void;
  setModelCto: (model: string) => Promise<void>;
  setEditorModelCto: (value: string) => void;
  setData: (data: string) => Promise<void>;
  setEditorAgreementData: (value: string) => void;
  rebuild: () => Promise<void>;
  /**
   * Renders the current text, model and data right now, bypassing the
   * debounce, and returns the HTML (or, with "markdown", plain Markdown)
   * without touching the store. For exports, which must never use an
   * agreementHtml that is still catching up with an edit. Throws the
   * rendering error.
   */
  renderAgreement: (format?: AgreementFormat) => Promise<string>;
  init: () => Promise<void>;
  loadSample: (name: string) => Promise<void>;
  generateShareableLink: () => string;
  loadFromLink: (compressedData: string) => Promise<void>;
  /**
   * Replaces the whole template with imported content (a `.cta`, a library
   * template). Throws on failure, so the caller can show the reason.
   */
  loadImportedTemplate: (content: {
    name: string;
    templateMarkdown: string;
    modelCto: string;
    data: string;
    logicTs?: string;
    /** Pre-rendered agreement from a share link; omitted for archives, which render on load. */
    agreementHtml?: string;
    /** Sample request for Simulate (an archive's request.json); empty when there is none. */
    requestJson?: string;
  }) => Promise<void>;
  toggleDarkMode: () => void;
  setAIChatOpen: (visible: boolean) => void;
  setChatState: (state: ChatState) => void;
  updateChatState: (partial: Partial<ChatState>) => void;
  setAIConfig: (config: AIConfig | null) => void;
  setChatAbortController: (controller: AbortController | null) => void;
  resetChat: () => void;
  isEditorsVisible: boolean;
  isPreviewVisible: boolean;
  isProblemPanelVisible: boolean;
  isLogicPanelVisible: boolean;
  setEditorsVisible: (value: boolean) => void;
  setPreviewVisible: (value: boolean) => void;
  setLogicPanelVisible: (value: boolean) => void;
  setProblemPanelVisible: (value: boolean) => void;
  isContractRunnerVisible: boolean;
  setContractRunnerVisible: (value: boolean) => void;
  startTour: () => void;
  isModelCollapsed: boolean;
  isTemplateCollapsed: boolean;
  isDataCollapsed: boolean;
  isRequestCollapsed: boolean;
  isResponseCollapsed: boolean;
  isStateCollapsed: boolean;
  toggleModelCollapse: () => void;
  toggleTemplateCollapse: () => void;
  toggleDataCollapse: () => void;
  toggleRequestCollapse: () => void;
  toggleResponseCollapse: () => void;
  toggleStateCollapse: () => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (value: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (value: boolean) => void;
  keyProtectionLevel: KeyProtectionLevel | null;
  setKeyProtectionLevel: (level: KeyProtectionLevel | null) => void;
  isLogicFeatureEnabled: boolean;
  setLogicFeatureEnabled: (value: boolean) => void;
  /** Feature flag for the new playground design (work in progress). */
  isDesignV2Enabled: boolean;
  setDesignV2Enabled: (value: boolean) => void;
  /**
   * Updates the live editor value without committing or triggering compilation.
   * @param ts - The current TypeScript source from the editor
   */
  setEditorLogicTs: (ts: string) => void;

  /**
   * Commits the logic source, synchronizes the editor state, and triggers an immediate compilation.
   * @param ts - The new TypeScript source to commit
   */
  setLogicTs: (ts: string) => Promise<void>;

  /**
   * Orchestrates the compilation of the currently committed `logicTs` via the
   * TemplateArchiveProcessor. Updates state with the resulting JS code or
   * extracts and surfaces compilation diagnostic markers if it fails.
   */
  compileLogic: () => Promise<void>;
  /**
   * Builds an official Template object from the current in-memory string contents
   * (grammar, model, logic) using JSZip. This object is required by the engine for compilation.
   */
  /**
   * Builds a Template object from the given sources (default: the store's,
   * read at call time) and returns it, or null when the build fails. Only
   * the latest build updates templateObject.
   */
  buildTemplateFromMemory: (sources?: TemplateSources) => Promise<import("@accordproject/cicero-core").Template | null>;

  /**
   * Registers the reference to the sandboxed iframe element once mounted.
   * @param iframe - The HTMLIFrameElement instance
   */
  setSandboxRef: (iframe: HTMLIFrameElement | null) => void;

  /**
   * Marks the sandbox as ready to receive execution requests.
   * Called when the iframe signals it has successfully initialized.
   * @param ready - True if ready, false otherwise
   */
  setSandboxReady: (ready: boolean) => void;

  /**
   * Executes a compiled contract logic method inside the isolated iframe sandbox.
   * Coordinates the cross-origin postMessage workflow and registers a resolver
   * to await the asynchronous response from the Web Worker.
   *
   * @param code - The compiled JavaScript code string to execute
   * @param method - The contract logic method to invoke ('init' or 'trigger')
   * @param args - The arguments array to pass to the method
   * @returns A Promise resolving to the method's output payload
   */
  executeInSandbox: (
    code: string,
    method: string,
    args: unknown[],
  ) => Promise<unknown>;
  executionState: string;
  executionEvents: string;
  /**
   * The active execution response payload (JSON string) for display in the UI.
   */
  executionResponse: string;

  /**
   * How the Contract Runner picks an execution engine, mirroring the
   * `llmConfig.mode` the template-engine's `TemplateArchiveProcessor` takes:
   * `disabled` runs only the compiled TypeScript logic, `fallback` falls back to
   * the LLM when there is no compiled logic, and `force` always runs the LLM.
   */
  llmExecutionMode: LLMMode;
  setLLMExecutionMode: (mode: LLMMode) => void;

  /**
   * Whether the loaded template declares its own State type. Stateful templates
   * must be initialized before a request can be triggered; stateless ones carry
   * no state and skip init entirely.
   */
  isTemplateStateful: boolean;

  /**
   * Whether `init` has run successfully for the engine currently selected.
   * Kept separate from `executionState` because a template may legitimately
   * initialize to an empty state, which would otherwise read as "never
   * initialized" and leave Send Request disabled forever.
   */
  isContractInitialized: boolean;

  /**
   * Discards every execution artifact and returns the runner to its pre-init
   * state. Called when the engine changes, since a response, state or event
   * produced by one engine says nothing about what the next one would do.
   * Also clears the execution chain and the execution history (and their
   * persisted copies).
   */
  resetExecution: () => void;

  /**
   * The full execution history for a stateful template: index 0 is the Init
   * step, each following entry is one `triggerContract()` call. Empty for a
   * stateless template — `priorState` is meaningless there and every request
   * is independent (see `LLMExecutor.trigger`/`this.stateless`).
   */
  executionChain: ChainStep[];

  /**
   * Which step of `executionChain` is on display. `-1` when the chain is
   * empty. `executionResponse`/`executionState`/`executionEvents` always
   * mirror `executionChain[selectedChainIndex]`, so the existing Response/
   * State/Events tabs keep working unchanged.
   */
  selectedChainIndex: number;

  /**
   * Selects a step in the chain and syncs the display fields to it.
   * @param index - index into `executionChain`
   */
  selectChainStep: (index: number) => void;

  /**
   * Hand-edits the resulting state of the currently selected chain step.
   * Marks the step `edited`. Never touches or recomputes later steps — those
   * were computed against the state as it stood before this edit, and
   * silently recomputing them would mean re-running the LLM/TS logic for
   * every one of them. Call `discardChainAfter` first if that staleness
   * needs clearing instead.
   * @param stateJson - the edited state as a JSON string
   * @returns an error message if `stateJson` is not valid JSON, otherwise `null`
   */
  editChainStepState: (stateJson: string) => string | null;

  /**
   * Truncates the chain to just `index` (inclusive), discarding every step
   * after it. Use once a step's state has been edited and the steps
   * computed after it no longer reflect that edit.
   * @param index - the last step to keep
   */
  discardChainAfter: (index: number) => void;

  /** Which engine produced the artifacts currently on display. */
  lastExecutionEngine: ExecutionEngine | null;

  /**
   * Every run since the last `init`, oldest first, mirroring `executionChain`
   * but flat and including failed runs. `initContract` starts a fresh
   * history; `triggerContract` appends one entry per request, failed or not.
   */
  executionHistory: LogicExecutionResult[];
  clearExecutionHistory: () => void;

  /**
   * Runs `init` or `trigger` through the LLM executor, using the provider,
   * model and API key held in `aiConfig`.
   *
   * @param operation - the contract operation to evaluate
   * @param payload - the contract data, and for `trigger` the request and the
   * state to evaluate it against
   * @returns the operation's output
   */
  executeWithLLM: (
    operation: "init" | "trigger",
    payload: { data: unknown; request?: unknown; priorState?: unknown },
  ) => Promise<InitResponse | TriggerResponse>;


  /** The current request payload (JSON string) used as input for the next trigger. */
  requestJson: string;
  setRequestJson: (json: string) => void;

  /**
   * Initializes the contract logic. Dispatches the `init` method to the sandbox
   * using the current contract data, and stores the resulting state and events.
   */
  initContract: () => Promise<void>;

  /**
   * Triggers the contract logic. Dispatches the `trigger` method to the sandbox
   * using the current data, request, and accumulated state, then updates the UI
   * with the resulting response, new state, and events.
   */
  triggerContract: () => Promise<void>;
}

/**
 * Thrown by renderAgreement when the text, model or data changed while it
 * rendered (even if changed back): the result may be of other sources, so
 * an export must not use it. Callers that tolerate ordinary render errors
 * still have to let this one through.
 */
export class SourcesChangedError extends Error {
  constructor() {
    super("The template changed while it was being rendered — try again.");
    this.name = "SourcesChangedError";
  }
}

/**
 * What a render produces. "markdown" is the agreement as plain Markdown:
 * values filled in and formatting kept, without TemplateMark's clause or
 * formula markup (CiceroMark → unquoted CiceroMark → Markdown). "text" is
 * markdown-transform's plain-text target: the same, without the formatting.
 */
export type AgreementFormat = "html" | "markdown" | "text";

const AGREEMENT_TARGETS: Record<AgreementFormat, string[]> = {
  html: ["html"],
  markdown: ["ciceromark_unquoted", "markdown"],
  text: ["ciceromark_unquoted", "plaintext"],
};

export interface DecompressedData {
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
  logicTs?: string;
}

const rebuildDeBounce = debounce(rebuild, 500);

async function rebuild(
  template: string,
  model: string,
  dataString: string,
  format: AgreementFormat = "html",
): Promise<string> {
  /*
   * Validate inputs before expensive operations
   * This fails fast on invalid JSON or CTO syntax without running network calls
   */
  await validateBeforeRebuild(template, model, dataString);
  /*
   * Rendering runs the Template Engine, which evaluates the template's
   * `{{% ... %}}` formulas with `new Function`. Shared links can carry any
   * formula, so that step runs in the rendering sandbox (a null-origin
   * iframe hosting a worker, see `RebuildSandboxFrame.tsx`) rather than in
   * the page. Only the resulting CiceroMark JSON comes back.
   */
  // markdown-transform is several MB, so it is loaded on first use rather than
  // imported statically; that lets the UI render before it arrives. The
  // download starts here so it overlaps with rendering in the sandbox.
  const markdownTransform = import("@accordproject/markdown-transform");
  const ciceroMarkJson = await rebuildInSandbox(template, model, dataString);
  return convertCiceroMark(ciceroMarkJson, format, markdownTransform);
}

/**
 * Converts a rendered agreement (CiceroMark JSON, as the rendering sandbox
 * returns it) to HTML or Markdown. It runs no user code, so it stays on the
 * main thread. markdown-transform is passed in when its download has
 * already started, and loaded here otherwise.
 */
export async function convertCiceroMark(
  ciceroMarkJson: unknown,
  format: AgreementFormat,
  markdownTransform = import("@accordproject/markdown-transform"),
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { transform } = await markdownTransform;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return (await transform(
    ciceroMarkJson,
    "ciceromark_parsed",
    AGREEMENT_TARGETS[format],
    {},
    { verbose: false },
  )) as string;
}

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      return { backgroundColor: "#121212", textColor: "#ffffff" };
    } else if (savedTheme === "light") {
      return { backgroundColor: "#ffffff", textColor: "#121212" };
    }
  }
  // Default to light theme
  return { backgroundColor: "#ffffff", textColor: "#121212" };
};

// Helper to safely load panel state
const getInitialPanelState = () => {
  const defaults = {
    isEditorsVisible: true,
    isPreviewVisible: true,
    isProblemPanelVisible: false,
    isLogicPanelVisible: false,
    isContractRunnerVisible: false,
    isAIChatOpen: false,
  };
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("ui-panels");
      if (saved)
        return { ...defaults, ...(JSON.parse(saved) as Partial<AppState>) };
    } catch (e) {
      // ignore
    }
  }
  return defaults;
};

// Helper to safely save panel state
const savePanelState = (state: Partial<AppState>) => {
  if (typeof window !== "undefined") {
    const panels = {
      isEditorsVisible: state.isEditorsVisible,
      isPreviewVisible: state.isPreviewVisible,
      isProblemPanelVisible: state.isProblemPanelVisible,
      isLogicPanelVisible: state.isLogicPanelVisible,
      isContractRunnerVisible: state.isContractRunnerVisible,
      isAIChatOpen: state.isAIChatOpen,
    };
    localStorage.setItem("ui-panels", JSON.stringify(panels));
  }
};

const getInitialLineNumbers = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("showLineNumbers");
    if (saved !== null) {
      return saved === "true";
    }
  }
  return true; // Default to showing line numbers
};

/**
 * Reads the persisted execution mode. Defaults to `disabled` so a playground
 * without AI settings behaves exactly as it did before the LLM engine existed.
 */
const getInitialLLMExecutionMode = (): LLMMode => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("llmExecutionMode");
    if (saved === LLMMode.Disabled || saved === LLMMode.Fallback || saved === LLMMode.Force) {
      return saved as LLMMode;
    }
  }
  return LLMMode.Disabled;
};

const CHAIN_STORAGE_KEY = "contractRunnerChain";

/**
 * Reads the persisted execution chain. Storage is a single flat key, the
 * same pattern `llmExecutionMode` uses above — it holds whatever chain the
 * runner last had on screen. `loadSample`/`loadFromLink` clear it, so a
 * chain from one template never bleeds into another.
 */
const getInitialChain = (): ChainStep[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(CHAIN_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ChainStep[];
    } catch (e) {
      // ignore malformed/stale data
    }
  }
  return [];
};

/** Persists the execution chain, or clears storage once it's empty. */
const persistChain = (chain: ChainStep[]) => {
  if (typeof window === "undefined") return;
   try {
     if (chain.length === 0) {
       localStorage.removeItem(CHAIN_STORAGE_KEY);
     } else {
       localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(chain));
     }
   } catch {
     // ignore storage quota / access errors
  }
};

/** The sources a Template object is built from. */
export type TemplateSources = Pick<AppState, "templateMarkdown" | "modelCto" | "logicTs">;

/**
 * Revision of the sources an agreement is rendered from (text, model and
 * data), bumped on every change to any of them (see the subscription after
 * the store). renderAgreement compares it, not the strings, so an edit that
 * is undone while a render runs still voids that render.
 */
let renderSourceRevision = 0;
/**
 * Revision of the logic as edited (editorLogicTs), bumped the same way. Kept
 * apart from renderSourceRevision because the logic doesn't change the
 * rendered agreement; exports that also carry the logic (Share link) check
 * both.
 */
let logicEditRevision = 0;
export const currentLogicEditRevision = () => logicEditRevision;

/** Id of the latest compileLogic run; older runs drop their result (see compileLogic). */
let latestCompileRun = 0;
/**
 * Generation of the template sources, bumped each time they are replaced (a
 * sample or a shared link is loaded). Work started for one template — such
 * as the design-v2 gate in front of Simulate — compares it to cancel itself
 * once the template has changed underneath it.
 */
let templateGeneration = 0;
export const currentTemplateGeneration = () => templateGeneration;
/** Id of the latest buildTemplateFromMemory call; older builds do not update templateObject. */
let latestTemplateBuild = 0;
/**
 * Called when the template sources are replaced: drops the result of any
 * compilation still running, so a compile of the discarded logic cannot
 * publish into the new template, cancels template builds still running, so
 * none can put the discarded template back in templateObject, and starts a
 * new template generation. The caller resets the cached template itself
 * (TEMPLATE_CACHE_RESET) in the same update as the new sources.
 */
const invalidateCompilations = () => {
  latestCompileRun++;
  latestTemplateBuild++;
  templateGeneration++;
};

/**
 * The cached Template object and what it said about the template, as for a
 * template not yet built. A template without logic is never compiled, so
 * nothing else would replace the previous template's; the legacy runner
 * rebuilds when templateObject is null.
 */
const TEMPLATE_CACHE_RESET = { templateObject: null, isTemplateStateful: true } as const;

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => {
      const initialTheme = getInitialTheme();
      const initialPanels = getInitialPanelState(); // Load saved panels
      const initialChain = getInitialChain();
      const initialChainIndex = initialChain.length - 1;
      const initialChainStep = initialChainIndex >= 0 ? initialChain[initialChainIndex] : null;

      /**
       * Mirrors a chain step onto the display fields the Response/State/Events
       * tabs already read (`executionResponse`/`executionState`/`executionEvents`),
       * so selecting, editing or discarding chain steps doesn't require those
       * tabs to change how they get their data.
       */
      const syncChainDisplay = (step: ChainStep | null) =>
        set({
          executionResponse: step?.result ? JSON.stringify(step.result, null, 2) : '',
          executionState: step ? JSON.stringify(step.state, null, 2) : '',
          executionEvents: step ? JSON.stringify(step.events, null, 2) : '[]',
        });

      return {
        activeTab: "build",
        setActiveTab: (tab: "build" | "simulate") => set({ activeTab: tab }),
        backgroundColor: initialTheme.backgroundColor,
        textColor: initialTheme.textColor,
        sampleName: playground.NAME,
        importedData: null,
        templateMarkdown: playground.TEMPLATE,
        editorValue: playground.TEMPLATE,
        modelCto: playground.MODEL,
        editorModelCto: playground.MODEL,
        data: JSON.stringify(playground.DATA, null, 2),
        editorAgreementData: JSON.stringify(playground.DATA, null, 2),
        agreementHtml: "",
        isAIChatOpen: initialPanels.isAIChatOpen,
        error: undefined,
        samples: SAMPLES,
        chatState: {
          messages: [],
          isLoading: false,
          error: null,
        },
        aiConfig: null,
        chatAbortController: null,
        isEditorsVisible: initialPanels.isEditorsVisible,
        isPreviewVisible: initialPanels.isPreviewVisible,
        isProblemPanelVisible: initialPanels.isProblemPanelVisible,
        isLogicPanelVisible: initialPanels.isLogicPanelVisible,
        isContractRunnerVisible: initialPanels.isContractRunnerVisible,
        isModelCollapsed: false,
        isTemplateCollapsed: false,
        isDataCollapsed: false,
        isRequestCollapsed: false,
        isResponseCollapsed: false,
        isStateCollapsed: false,
        showLineNumbers: getInitialLineNumbers(),
        isSettingsOpen: false,
        keyProtectionLevel: null,
        isLogicFeatureEnabled:
          typeof window !== "undefined"
            ? localStorage.getItem("isLogicFeatureEnabled") === "true"
            : false,
        setLogicFeatureEnabled: (value: boolean) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("isLogicFeatureEnabled", String(value));
          }
          set({ isLogicFeatureEnabled: value });
        },
        isDesignV2Enabled:
          typeof window !== "undefined"
            ? localStorage.getItem("isDesignV2Enabled") === "true"
            : false,
        setDesignV2Enabled: (value: boolean) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("isDesignV2Enabled", String(value));
          }
          set({ isDesignV2Enabled: value });
        },
        logicTs: "",
        editorLogicTs: "",
        compiledLogicJs: null,
        compiledModelCto: null,
        isCompiling: false,
        compilationErrors: [],
        templateObject: null,
        sandboxIframe: null,
        isSandboxReady: false,
        isExecuting: false,
        executingOperation: null,
        executionId: 0,

        executionState: initialChainStep ? JSON.stringify(initialChainStep.state, null, 2) : '',
        executionEvents: initialChainStep ? JSON.stringify(initialChainStep.events, null, 2) : '',
        executionResponse: initialChainStep?.result ? JSON.stringify(initialChainStep.result, null, 2) : '',

        executionHistory: [],
        clearExecutionHistory: () => set({ executionHistory: [] }),

        llmExecutionMode: getInitialLLMExecutionMode(),
        setLLMExecutionMode: (mode: LLMMode) => {
          if (get().llmExecutionMode === mode) return;
          if (typeof window !== "undefined") {
            localStorage.setItem("llmExecutionMode", mode);
          }
          /*
           * Artifacts belong to the engine that produced them. Carrying a
           * response, state or event list across a mode switch would let the
           * previous engine's run stand in for one the new engine never made —
           * and, because Send Request unlocks on init, would let a request run
           * against an engine that was never initialized.
           */
          set({ llmExecutionMode: mode });
          get().resetExecution();
        },
        // Assumed stateful until a Template object says otherwise, so the Init
        // step stays visible for templates that have not been built yet.
        isTemplateStateful: true,
        // A restored chain already has an Init step, so Send Request should
        // stay usable across a refresh rather than forcing Init again.
        isContractInitialized: initialChain.length > 0,
        resetExecution: () => {
          set({
            executionResponse: '',
            executionState: '',
            executionEvents: '',
            isContractInitialized: false,
            lastExecutionEngine: null,
            executionChain: [],
            selectedChainIndex: -1,
            executionHistory: [],
          });
          persistChain([]);
        },
        lastExecutionEngine: null,

        executionChain: initialChain,
        selectedChainIndex: initialChainIndex,
        selectChainStep: (index: number) => {
          const step = get().executionChain[index];
          if (!step) return;
          set({ selectedChainIndex: index });
          syncChainDisplay(step);
        },
        editChainStepState: (stateJson: string) => {
          const { executionChain, selectedChainIndex } = get();
          const step = executionChain[selectedChainIndex];
          if (!step) return "No step selected.";

          let parsed: object;
          try {
            parsed = JSON.parse(stateJson) as object;
          } catch {
            return "Enter valid JSON before saving.";
          }

          const chain = executionChain.map((s, i) =>
            i === selectedChainIndex ? { ...s, state: parsed, edited: true } : s,
          );
          set({ executionChain: chain });
          syncChainDisplay(chain[selectedChainIndex]);
          persistChain(chain);
          return null;
        },
        discardChainAfter: (index: number) => {
          const { executionChain, selectedChainIndex } = get();
          if (index >= executionChain.length - 1) return;

          const chain = executionChain.slice(0, index + 1);
          const newSelected = Math.min(selectedChainIndex, index);
          set({ executionChain: chain, selectedChainIndex: newSelected });
          syncChainDisplay(chain[newSelected] ?? null);
          persistChain(chain);
        },

        requestJson: '{\n  "$class": "org.acme.counter@1.0.0.CounterRequest",\n  "increment": 1\n}',
        setRequestJson: (json: string) => set({ requestJson: json }),

        toggleModelCollapse: () =>
          set((state) => ({ isModelCollapsed: !state.isModelCollapsed })),
        toggleTemplateCollapse: () =>
          set((state) => ({ isTemplateCollapsed: !state.isTemplateCollapsed })),
        toggleDataCollapse: () =>
          set((state) => ({ isDataCollapsed: !state.isDataCollapsed })),
        toggleRequestCollapse: () =>
          set((state) => ({ isRequestCollapsed: !state.isRequestCollapsed })),
        toggleResponseCollapse: () =>
          set((state) => ({ isResponseCollapsed: !state.isResponseCollapsed })),
        toggleStateCollapse: () =>
          set((state) => ({ isStateCollapsed: !state.isStateCollapsed })),
        setShowLineNumbers: (value: boolean) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("showLineNumbers", String(value));
          }
          set({ showLineNumbers: value });
        },
        setSettingsOpen: (value: boolean) => set({ isSettingsOpen: value }),
        setEditorsVisible: (value) => {
          const state = get();
          if (!value && !state.isPreviewVisible && !state.isLogicPanelVisible) {
            return;
          }
          set({ isEditorsVisible: value });
          savePanelState({ ...get(), isEditorsVisible: value }); // Save change
        },
        setPreviewVisible: (value) => {
          const state = get();
          if (!value && !state.isEditorsVisible && !state.isLogicPanelVisible) {
            return;
          }
          set({ isPreviewVisible: value });
          savePanelState({ ...get(), isPreviewVisible: value }); // Save change
        },
        setProblemPanelVisible: (value) => {
          set({ isProblemPanelVisible: value });
          savePanelState({ ...get(), isProblemPanelVisible: value }); // Save change
        },
        setContractRunnerVisible: (value) => {
          const state = get();
          const updates: Partial<AppState> = { isContractRunnerVisible: value };

          if (value && state.isPreviewVisible) {
            updates.isPreviewVisible = false;
          }

          set(updates);
          savePanelState({ ...state, ...updates });
        },
        setLogicPanelVisible: (value) => {
          const state = get();
          if (!value && !state.isEditorsVisible && !state.isPreviewVisible) {
            return;
          }
          set({ isLogicPanelVisible: value });
          savePanelState({ ...get(), isLogicPanelVisible: value }); // Save change
        },
        init: async () => {
          const params = new URLSearchParams(window.location.search);
          const compressedData = params.get("data");
          if (compressedData) {
            await get().loadFromLink(compressedData);
          } else {
            // Ensure layout is valid for the initial template if recovering from a logic-based session
            const state = get();
            const sampleHasLogic = !!state.samples.find((sample) => sample.NAME === state.sampleName)?.LOGIC;
            const hasLogic = sampleHasLogic || state.logicTs.trim().length > 0 || state.editorLogicTs.trim().length > 0;

            if (!hasLogic) {
              set({
                isEditorsVisible: true,
                isPreviewVisible: true,
                isLogicPanelVisible: false,
                isContractRunnerVisible: false
              });
              savePanelState({
                ...get(),
                isEditorsVisible: true,
                isPreviewVisible: true,
                isLogicPanelVisible: false,
                isContractRunnerVisible: false
              });
            }
            await get().rebuild();
          }
        },
        loadSample: async (name: string) => {
          const sample = SAMPLES.find((s) => s.NAME === name);
          if (sample) {
            const state = get();
            const logicTs = sample.LOGIC ?? "";
            const hasLogic = !!sample.LOGIC && state.isLogicFeatureEnabled;
            const defaultRequest = '{\n  "$class": "org.acme.counter@1.0.0.CounterRequest",\n  "increment": 1\n}';
            const requestJson = sample.REQUEST ? JSON.stringify(sample.REQUEST, null, 2) : defaultRequest;
            invalidateCompilations();
            set(() => ({
              ...TEMPLATE_CACHE_RESET,
              sampleName: sample.NAME,
              importedData: null,
              agreementHtml: undefined,
              error: undefined,
              templateMarkdown: sample.TEMPLATE,
              editorValue: sample.TEMPLATE,
              modelCto: sample.MODEL,
              editorModelCto: sample.MODEL,
              data: JSON.stringify(sample.DATA, null, 2),
              editorAgreementData: JSON.stringify(sample.DATA, null, 2),
              requestJson,
              // Reset logic state when switching samples
              logicTs,
              editorLogicTs: logicTs,
              compiledLogicJs: null,
              compilationErrors: [],
              isCompiling: false,
              // A new sample is a new contract — nothing the last one produced
              // applies to it, including having been initialized.
              executionResponse: '',
              executionState: '',
              executionEvents: '',
              executionHistory: [],
              isContractInitialized: false,
              lastExecutionEngine: null,
              executionChain: [],
              selectedChainIndex: -1,
              // Adapt layout based on whether template has logic
              isLogicPanelVisible: hasLogic,
              isContractRunnerVisible: hasLogic,
              isPreviewVisible: !hasLogic,
            }));
            persistChain([]);

            // Persist the adaptive layout state
            savePanelState({
              ...get(),
              isLogicPanelVisible: hasLogic,
              isContractRunnerVisible: hasLogic,
              isPreviewVisible: !hasLogic,
            });

            await get().rebuild();

            // Auto-trigger logic tour when a user opens a logic contract sample for the first time
            if (hasLogic && typeof window !== "undefined" && !localStorage.getItem("hasVisitedLogicTour")) {
              localStorage.setItem("hasVisitedLogicTour", "true");
              setTimeout(() => {
                try {
                  void tour.show("logic-transition-prompt");
                } catch (e) {
                  console.error("Failed to auto-start logic tour:", e);
                }
              }, 400);
            }
          }
        },

        renderAgreement: async (format: AgreementFormat = "html") => {
          const { templateMarkdown, modelCto, data } = get();
          const revision = renderSourceRevision;
          let html: string;
          try {
            html = await rebuild(templateMarkdown, modelCto, data, format);
          } catch (error: unknown) {
            // A render that failed after the sources changed failed for sources that are gone.
            if (renderSourceRevision !== revision) throw new SourcesChangedError();
            throw new Error(formatError(error));
          }
          /*
           * The sandbox answers a superseded request with the newer render's
           * result. If the sources changed while this one was in flight, the
           * HTML may be of another template, so it is not handed out — even if
           * they were changed back (an edit then Undo), which comparing the
           * strings would miss.
           */
          if (renderSourceRevision !== revision) {
            throw new SourcesChangedError();
          }
          return html;
        },
        rebuild: async () => {
          const { templateMarkdown, modelCto, data } = get();
          try {
            const result = await rebuildDeBounce(
              templateMarkdown,
              modelCto,
              data,
            );
            set(() => ({ agreementHtml: result, error: undefined }));
          } catch (error: unknown) {
            set(() => ({
              error: formatError(error),
              isProblemPanelVisible: true,
            }));
          }
        },
        setTemplateMarkdown: async (template: string) => {
          set(() => ({ templateMarkdown: template }));
          const { modelCto, data } = get();
          try {
            const result = await rebuildDeBounce(template, modelCto, data);
            set(() => ({ agreementHtml: result, error: undefined }));
          } catch (error: unknown) {
            set(() => ({
              error: formatError(error),
              isProblemPanelVisible: true,
            }));
          }
        },
        setEditorValue: (value: string) => {
          set(() => ({ editorValue: value }));
        },
        setModelCto: async (model: string) => {
          set(() => ({ modelCto: model }));
          const { templateMarkdown, data } = get();
          try {
            const result = await rebuildDeBounce(templateMarkdown, model, data);
            set(() => ({ agreementHtml: result, error: undefined }));
          } catch (error: unknown) {
            set(() => ({
              error: formatError(error),
              isProblemPanelVisible: true,
            }));
          }
        },
        setEditorModelCto: (value: string) => {
          set(() => ({ editorModelCto: value }));
        },
        setData: async (data: string) => {
          set(() => ({ data }));
          try {
            const result = await rebuildDeBounce(
              get().templateMarkdown,
              get().modelCto,
              data,
            );
            set(() => ({ agreementHtml: result, error: undefined }));
          } catch (error: unknown) {
            set(() => ({
              error: formatError(error),
              isProblemPanelVisible: true,
            }));
          }
        },
        setEditorAgreementData: (value: string) => {
          set(() => ({ editorAgreementData: value }));
        },
        generateShareableLink: () => {
          const state = get();
          const compressedData = compress({
            templateMarkdown: state.templateMarkdown,
            modelCto: state.modelCto,
            data: state.data,
            agreementHtml: state.agreementHtml,
            ...(state.logicTs?.trim() ? { logicTs: state.logicTs } : {}),
          });
          return `${window.location.origin}/#data=${compressedData}`;
        },
        loadFromLink: async (compressedData: string) => {
          try {
            const { templateMarkdown, modelCto, data, agreementHtml, logicTs } =
              decompress(compressedData);
            if (!templateMarkdown || !modelCto || !data) {
              throw new Error("Invalid share link data");
            }
            await get().loadImportedTemplate({
              name: SHARED_TEMPLATE_NAME,
              templateMarkdown,
              modelCto,
              data,
              logicTs,
              agreementHtml,
            });
          } catch (error) {
            set(() => ({
              error:
                "Failed to load shared content: " +
                (error instanceof Error ? error.message : "Unknown error"),
              isProblemPanelVisible: true,
            }));
          }
        },
        loadImportedTemplate: async ({
          name,
          templateMarkdown,
          modelCto,
          data,
          logicTs,
          agreementHtml,
          requestJson,
        }: {
          name: string;
          templateMarkdown: string;
          modelCto: string;
          data: string;
          logicTs?: string;
          agreementHtml?: string;
          requestJson?: string;
        }) => {
          const hasLogic = Boolean(logicTs && logicTs.trim().length > 0);
          /*
           * A loaded link or archive is a different template — nothing the
           * last one produced (including its execution chain/history) applies
           * here. This was a pre-existing gap (loadSample already did this);
           * the chain persisting across page loads makes it worth closing,
           * since otherwise a stale chain could leak into an unrelated
           * template.
           */
          get().resetExecution();
          // Compiles still running belong to the previous template (see invalidateCompilations).
          invalidateCompilations();
          set(() => ({
            ...TEMPLATE_CACHE_RESET,
            // Never reuse a bundled sample's name: views look samples up by it
            // (the Data step's reset would load that sample's data).
            sampleName: SAMPLES.some((sample) => sample.NAME === name) ? `${name} (imported)` : name,
            importedData: data,
            // The previous template's request means nothing to this one.
            requestJson: requestJson ?? "",
            templateMarkdown,
            editorValue: templateMarkdown,
            modelCto,
            editorModelCto: modelCto,
            data,
            editorAgreementData: data,
            agreementHtml,
            error: undefined,
            logicTs: logicTs || "",
            editorLogicTs: logicTs || "",
            compiledLogicJs: null,
            compilationErrors: [],
            isCompiling: false,
            isLogicPanelVisible: hasLogic,
          }));
          if (hasLogic) {
            get().setLogicFeatureEnabled(true);
            savePanelState({ ...get(), isLogicPanelVisible: true });
          }
          await get().rebuild();
          if (hasLogic) {
            await get().compileLogic();
          }
        },
        toggleDarkMode: () => {
          set((state) => {
            const isDark = state.backgroundColor === "#121212";
            const newTheme = {
              backgroundColor: isDark ? "#ffffff" : "#121212",
              textColor: isDark ? "#121212" : "#ffffff",
            };

            if (typeof window !== "undefined") {
              const themeValue = isDark ? "light" : "dark";
              localStorage.setItem("theme", themeValue);
              try {
                document.documentElement.setAttribute("data-theme", themeValue);
              } catch (e) {
                // ignore
              }
            }

            return newTheme;
          });
        },
        setAIChatOpen: (isOpen: boolean) => {
          set(() => ({ isAIChatOpen: isOpen }));
          savePanelState({ ...get(), isAIChatOpen: isOpen }); // Save change
        },
        setChatState: (state) => set({ chatState: state }),
        updateChatState: (partial) =>
          set((state) => ({
            chatState: { ...state.chatState, ...partial },
          })),
        setAIConfig: (config) => set({ aiConfig: config }),
        setChatAbortController: (controller) =>
          set({ chatAbortController: controller }),
        setKeyProtectionLevel: (level) => set({ keyProtectionLevel: level }),
        resetChat: () => {
          const { chatAbortController } = get();
          if (chatAbortController) {
            chatAbortController.abort();
          }
          get().setChatState({
            messages: [],
            isLoading: false,
            error: null,
          });
        },
        startTour: () => {
          console.log("Starting tour...");
        },
        setEditorLogicTs: (ts: string) => {
          set(() => ({ editorLogicTs: ts }));
        },

        setLogicTs: async (ts: string) => {
          set(() => ({ logicTs: ts, editorLogicTs: ts }));
          await get().compileLogic();
        },

        buildTemplateFromMemory: async (sources) => {
          // Read the sources before any await, so a later edit cannot slip into this build.
          const { templateMarkdown, modelCto, logicTs } = sources ?? get();
          const build = ++latestTemplateBuild;
          set({ templateObject: null });
          try {
            const { Template: CiceroTemplate } =
              await import("@accordproject/cicero-core");

            // The same .cta archive the Deploy step downloads, loaded via fromArchive.
            const content = await buildTemplateArchive({ templateMarkdown, modelCto, logicTs });
            const { Buffer } = await import("buffer");
            const template = await CiceroTemplate.fromArchive(
              Buffer.from(content),
              { offline: true },
            );

            // const { isStatefulTemplate } = await import("../ai-assistant/llmProviders");
            /*
             * A template is stateful when its model declares a State type — the
             * rule cicero-core's isStateful() applies, and the one the LLM
             * executor derives its schema from. The runner also treats logic
             * with an init() as stateful: a template whose State does not
             * extend the runtime base is malformed, but its sandboxed logic
             * still has state to seed, and hiding Init would strand it.
             */
            if (build === latestTemplateBuild) {
              set({
                templateObject: template,
                isTemplateStateful:
                  template.isStateful() || logicDefinesInit(logicTs),
              });
            }
            if (import.meta.env.DEV)
              console.log(
                "Successfully built Template object from JSZip archive!",
                template,
              );
            return template as AppState["templateObject"];
          } catch (error) {
            console.error("Error building template from memory:", error);
            return null;
          }
        },

        compileLogic: async () => {
          /*
           * Compilations can overlap (a model edit, then Simulate, while one
           * is still running). Each run compiles one snapshot of the sources,
           * taken before any await: it builds its own Template object from
           * it and records that snapshot's model with its result. Only the
           * latest run publishes, so an older run finishing late cannot pass
           * off old-model output as current.
           */
          const run = ++latestCompileRun;
          const { templateMarkdown, modelCto, logicTs } = get();
          const sources: TemplateSources = { templateMarkdown, modelCto, logicTs };
          const compiledModelCto = modelCto;
          const publish = (result: Partial<AppState>) => {
            if (run === latestCompileRun) set({ ...result, compiledModelCto });
          };
          set({
            isCompiling: true,
            compilationErrors: [],
            compiledLogicJs: null,
            compiledModelCto: null,
          });
          try {
            if (!logicTs || !modelCto) {
              publish({ isCompiling: false, compilationErrors: [] });
              return;
            }

            const { TemplateArchiveProcessor } =
              await import("@accordproject/template-engine");
            // Superseded while the engine loaded: stop before the build, which updates shared state.
            if (run !== latestCompileRun) return;

            /*
             * Build the Template object from this run's snapshot and compile
             * that one — never the shared templateObject, which another run's
             * build may have replaced. A failed build is reported as such.
             */
            const templateToCompile = await get().buildTemplateFromMemory(sources);
            if (run !== latestCompileRun) return;

            if (!templateToCompile) {
              publish({
                isCompiling: false,
                compilationErrors: [
                  {
                    message:
                      "Failed to initialize Template object from memory.",
                    line: 0,
                    column: 0,
                  },
                ],
              });
              return;
            }

            const processor = new TemplateArchiveProcessor(templateToCompile);
            const compiledCode = await processor.compileLogic();
            const result = compiledCode["logic/logic.ts"];

            // Filter out bogus error 2391 caused by syntax errors in the engine's own shim (TemplateLogic.init)
            const actualErrors = result.errors
              ? result.errors.filter((e: any) => e.code !== 2391)
              : [];

            if (actualErrors.length > 0) {
              // Calculate the line offset of the user's logic code dynamically
              let lineOffset = 0;
              try {
                if (
                  templateToCompile &&
                  typeof templateToCompile.getModelManager === "function" &&
                  typeof templateToCompile.getTemplateModel === "function"
                ) {
                  const templateModel = templateToCompile.getTemplateModel();
                  const fqn = templateModel && typeof templateModel.getFullyQualifiedName === "function"
                    ? templateModel.getFullyQualifiedName()
                    : undefined;
                  const { TypeScriptCompilationContext } = await import(
                    "@accordproject/template-engine/lib/TypeScriptCompilationContext"
                  );
                  const contextStr = new TypeScriptCompilationContext(
                    templateToCompile.getModelManager(),
                    fqn,
                  ).getCompilationContext();
                  // const declarationsStr = atob(SMART_LEGAL_CONTRACT_BASE64);
                  const prependedText = `\n${contextStr}          `;
                  lineOffset = prependedText.split("\n").length - 1;
                }
              } catch (e) {
                console.error("Failed to calculate compilation line offset", e);
              }

              publish({
                isCompiling: false,
                isProblemPanelVisible: true,
                compilationErrors: actualErrors.map((e: any) => {
                  const errorLine = e.line !== undefined ? e.line - lineOffset : undefined;
                  return {
                    message: e.renderedMessage || e.text,
                    line: errorLine !== undefined ? Math.max(0, errorLine) + 1 : undefined,
                    column: e.character !== undefined ? e.character + 1 : undefined,
                    length: e.length,
                  };
                }),
              });
            } else {
              let code = result.code;

              /*
               * Strip export keywords so we can evaluate natively via new Function().
               * This handles: export class Foo, export default class Foo, export default Foo,
               * and the `export {};` marker TypeScript emits for a module whose only
               * imports are type-only and which has no exports of its own.
               */
              code = code.replace(/^export\s*\{\s*\};?\s*$/gm, "");
              code = code.replace(/^export\s+class/gm, "class");
              code = code.replace(/^export\s+default/gm, "");

              /*
               * Append a return statement so new Function() yields the class constructor.
               * Guard: if no class extending TemplateLogic is found, the compiled code
               * is malformed — report a compilation error instead of silently producing
               * code that would cause `new undefined()` at runtime.
               */
              const match = code.match(
                /class\s+(\w+)\s+extends\s+TemplateLogic/,
              );
              if (!match) {
                publish({
                  isCompiling: false,
                  isProblemPanelVisible: true,
                  compilationErrors: [
                    {
                      message:
                        "Compiled output does not contain a class extending TemplateLogic. Ensure your logic class extends TemplateLogic.",
                    },
                  ],
                });
                return;
              }
              code += `\nreturn ${match[1]};\n`;

              publish({
                isCompiling: false,
                compiledLogicJs: code,
                compilationErrors: [],
              });
            }
          } catch (error: unknown) {
            publish({
              isCompiling: false,
              isProblemPanelVisible: true,
              compilationErrors: [
                {
                  message:
                    error instanceof Error ? error.message : String(error),
                },
              ],
            });
          }
        },

        setSandboxRef: (iframe: HTMLIFrameElement | null) => {
          set({ sandboxIframe: iframe });
        },

        setSandboxReady: (ready: boolean) => {
          set({ isSandboxReady: ready });
        },

        executeInSandbox: (
          code: string,
          method: string,
          args: unknown[],
        ): Promise<unknown> => {
          const { sandboxIframe, isSandboxReady, isExecuting } = get();

          if (!isSandboxReady || !sandboxIframe?.contentWindow) {
            return Promise.reject(
              new Error(
                "Sandbox is not ready. Please wait for initialization.",
              ),
            );
          }

          /*
           * Gate on isExecuting to prevent concurrent Worker spawns.
           * If called while another execution is in flight, reject immediately.
           */
          if (isExecuting) {
            return Promise.reject(
              new Error(
                "An execution is already in progress. Please wait for it to complete.",
              ),
            );
          }

          // Increment executionId safely using current state
          const nextId = get().executionId + 1;
          set({ executionId: nextId, isExecuting: true });

          /*
           * Client-side fallback timeout — if the iframe itself fails to start
           * a Worker (e.g. Blob URL creation fails), the internal 5s kill-switch
           * never fires and the Promise would hang forever. This outer timeout
           * ensures we always settle.
           */
          const CLIENT_TIMEOUT_MS = 6000;

          return new Promise((resolve, reject) => {
            const clientTimeout = setTimeout(() => {
              sandboxResolvers.delete(nextId);
              set({ isExecuting: false });
              reject(
                new Error(
                  `Execution timed out after ${CLIENT_TIMEOUT_MS}ms (client-side fallback)`,
                ),
              );
            }, CLIENT_TIMEOUT_MS);

            // Register a resolver so SandboxFrame can route the response
            sandboxResolvers.set(
              nextId,
              (msg: {
                success?: boolean;
                result?: unknown;
                error?: string;
              }) => {
                clearTimeout(clientTimeout);
                set({ isExecuting: false });
                if (msg.success) {
                  resolve(msg.result ?? {});
                } else {
                  reject(new Error(msg.error || "Execution failed"));
                }
              },
            );

            /*
             * Dispatch the execution request to the sandbox iframe.
             * Uses '*' as targetOrigin because the iframe is sandboxed with a
             * null origin. The iframe validates inbound messages structurally.
             */
            sandboxIframe.contentWindow?.postMessage(
              {
                type: "execute",
                code,
                method,
                args,
                executionId: nextId,
              },
              "*",
            );
          });
        },

        executeWithLLM: async (operation, payload) => {
          const { aiConfig, llmExecutionMode, isExecuting } = get();

          /*
           * Mirrors the guard in executeInSandbox: one execution at a time, so a
           * second click can't race the first back into the state artifacts.
           */
          if (isExecuting) {
            throw new Error(
              "An execution is already in progress. Please wait for it to complete.",
            );
          }

          const { buildLLMExecutorConfig, getLLMExecutor } = await import(
            "../ai-assistant/llmProviders"
          );
          if (!aiConfig) {
            throw new Error('AI is not configured. Open Settings → AI Configuration to set it up.');
          }
          const executorConfig = buildLLMExecutorConfig(aiConfig, llmExecutionMode);
          /*
           * The LLM executor derives its JSON Schema from the template's own
           * ModelManager, so it needs a Template object. Rebuild it every run:
           * templates without logic never go through compileLogic() (which is
           * what usually builds one), and an edited model would otherwise be
           * executed against a stale schema.
           */
          const template = await get().buildTemplateFromMemory();
          if (!template) {
            throw new Error(
              "Could not build a template from the current model and grammar.",
            );
          }

          const executor = getLLMExecutor(template, executorConfig);

          set({ isExecuting: true });
          try {
            return operation === "init"
              ? await executor.init(payload.data)
              : await executor.trigger(
                  payload.data,
                  payload.request,
                  payload.priorState,
                );
          } finally {
            set({ isExecuting: false });
          }
        },

        initContract: async () => {
          const { compiledLogicJs, data, llmExecutionMode } = get();

          /*
           * Engine selection follows TemplateArchiveProcessor: the template's own
           * logic runs unless the LLM is forced, and the LLM only steps in when
           * it is forced or there is no compiled logic to fall back from.
           */
          const forceLLM = llmExecutionMode === 'force';
          const useTypeScript = !forceLLM && !!compiledLogicJs;
          const useLLM = forceLLM || (llmExecutionMode !== 'disabled' && !compiledLogicJs);

          if (!useTypeScript && !useLLM) {
            if (compiledLogicJs) return;
            set({
              compilationErrors: [{ message: "Execution Error: No executable logic found and LLM fallback is disabled." }],
              isProblemPanelVisible: true
            });
            return;
          }

          /*
           * Init starts a fresh run of the contract, so anything left over from
           * the last one goes first — otherwise the Response tab keeps showing
           * a trigger result that this init did not produce. This also clears
           * executionHistory, since a fresh init starts a fresh history too.
           */
          get().resetExecution();
          set({ executingOperation: 'init' });

          const startedAt = Date.now();
          let parsedData: object = {};

          try {
            parsedData = JSON.parse(data) as object;
            const output = useTypeScript
              ? (await get().executeInSandbox(compiledLogicJs!, 'init', [parsedData])) as { state?: unknown; events?: unknown[] }
              : (await get().executeWithLLM('init', { data: parsedData })) as { state?: unknown; events?: unknown[] };

            /*
             * Init is step 0 of the chain, not a separate artifact — every
             * later trigger's priorState traces back to this one. The button
             * (see ContractRequestEditor) confirms with the user before
             * calling this when a chain already exists, so clearing it here
             * is safe.
             */
            const events = Array.isArray(output.events) ? (output.events as object[]) : [];
            const initStep: ChainStep = {
              label: 'Init',
              request: null,
              priorState: null,
              result: null,
              state: (output.state ?? {}) as object,
              events,
              edited: false,
            };
            const chain = [initStep];
            const historyEntry: LogicExecutionResult = {
              id: 'init',
              method: 'init',
              request: parsedData,
              response: { state: initStep.state, events },
              stateBefore: null,
              stateAfter: initStep.state,
              events,
              error: null,
              stage: 'run',
              durationMs: Date.now() - startedAt,
              executedAt: new Date(startedAt).toISOString(),
            };

            set({
              executionChain: chain,
              selectedChainIndex: 0,
              executionHistory: [historyEntry],
              isContractInitialized: true,
              lastExecutionEngine: useTypeScript ? ExecutionEngine.TypeScript : ExecutionEngine.LLM,
              compilationErrors: []
            });
            syncChainDisplay(initStep);
            persistChain(chain);
          } catch (err: unknown) {
            const message = formatError(err);
            set({
              executionHistory: [{
                id: 'init',
                method: 'init',
                request: parsedData,
                response: null,
                stateBefore: null,
                stateAfter: null,
                events: [],
                error: message,
                stage: 'run',
                durationMs: Date.now() - startedAt,
                executedAt: new Date(startedAt).toISOString(),
              }],
              compilationErrors: [{ message: `Execution Error: ${message}` }],
              isProblemPanelVisible: true
            });
          } finally {
            set({ executingOperation: null });
          }
        },

        triggerContract: async () => {
          const { compiledLogicJs, data, requestJson, executionState, isTemplateStateful, isContractInitialized, llmExecutionMode, executeInSandbox, executionChain, selectedChainIndex, executionHistory } = get();

          const forceLLM = llmExecutionMode === 'force';
          const useTypeScript = !forceLLM && !!compiledLogicJs;
          const useLLM = forceLLM || (llmExecutionMode !== 'disabled' && !compiledLogicJs);

          if (!useTypeScript && !useLLM) {
            if (compiledLogicJs) return;
            set({
              compilationErrors: [{ message: "Execution Error: No executable logic found and LLM fallback is disabled." }],
              isProblemPanelVisible: true
            });
            return;
          }

          /*
           * Stateful templates have no implicit empty state — they must be
           * triggered against the state produced by init() or a previous
           * trigger(). Gate on the init flag rather than on executionState:
           * a contract that legitimately initializes to an empty state has
           * still been initialized. Stateless templates skip the check.
           */
          if (isTemplateStateful && !isContractInitialized) {
            set({
              compilationErrors: [{ message: "Execution Error: Contract must be initialized before triggering." }],
              isProblemPanelVisible: true
            });
            return;
          }

          /*
           * A Send Request only ever extends the chain linearly, from
           * whichever step's state is currently loaded. Sending from a past
           * step would mean branching the chain, which trigger()'s single
           * priorState-in/state-out contract doesn't model — so require the
           * latest step to be selected first (mirrored by the disabled Send
           * Request button in ContractRequestEditor).
           */
          if (
            isTemplateStateful &&
            executionChain.length > 0 &&
            selectedChainIndex !== executionChain.length - 1
          ) {
            set({
              compilationErrors: [{ message: "Execution Error: Select the latest step in the chain before sending a new request." }],
              isProblemPanelVisible: true
            });
            return;
          }

          set({ executingOperation: 'trigger' });

          const startedAt = Date.now();
          const triggerCount = executionHistory.filter((r) => r.method === "trigger").length;
          const historyId = `#${triggerCount + 1}`;
          let parsedRequest: object = {};
          let parsedState: object | null = null;
          let stage: LogicExecutionResult["stage"] = "run";

          try {
            const parsedData = JSON.parse(data) as object;
            try {
              parsedState = executionState ? (JSON.parse(executionState) as object) : {};
            } catch (parseErr) {
              stage = "parse";
              throw parseErr;
            }
            try {
              parsedRequest = JSON.parse(requestJson) as object;
            } catch (parseErr) {
              // Nothing reaches the logic: report it as a request problem, not a trigger() failure
              stage = "parse";
              throw parseErr;
            }

            const output = useTypeScript
              ? (await executeInSandbox(compiledLogicJs!, 'trigger', [parsedData, parsedRequest, parsedState])) as { result?: unknown, state?: unknown, events?: unknown[] }
              : (await get().executeWithLLM('trigger', { data: parsedData, request: parsedRequest, priorState: parsedState })) as { result?: unknown, state?: unknown, events?: unknown[] };

            const events = Array.isArray(output.events) ? (output.events as object[]) : [];

            /*
             * Extract and store execution artifacts.
             * The executionResponse holds the result payload, while state and events
             * are updated for subsequent trigger operations or UI rendering.
             */
            set({
              executionResponse: output.result ? JSON.stringify(output.result, null, 2) : '',
              executionState: output.state ? JSON.stringify(output.state, null, 2) : executionState,
              executionEvents: output.events ? JSON.stringify(output.events, null, 2) : '[]',
              lastExecutionEngine: useTypeScript ? ExecutionEngine.TypeScript : ExecutionEngine.LLM,
              executionHistory: [...executionHistory, {
                id: historyId,
                method: 'trigger',
                request: parsedRequest,
                response: (output.result as object | undefined) ?? null,
                stateBefore: parsedState,
                stateAfter: (output.state as object | undefined) ?? parsedState,
                events,
                error: null,
                stage: 'run',
                durationMs: Date.now() - startedAt,
                executedAt: new Date(startedAt).toISOString(),
              }],
              compilationErrors: []
            });

            /*
             * Stateless templates ignore priorState entirely (this.stateless in
             * LLMExecutor) — each Send Request is independent, so there is no
             * chain to extend.
             */
            if (isTemplateStateful) {
              const newStep: ChainStep = {
                label: `Trigger ${executionChain.length}`,
                request: parsedRequest as object,
                priorState: parsedState as object,
                result: (output.result ?? {}) as object,
                state: (output.state ?? parsedState) as object,
                events,
                edited: false,
              };
              const chain = [...executionChain, newStep];
              set({ executionChain: chain, selectedChainIndex: chain.length - 1 });
              persistChain(chain);
            }
          } catch (err: unknown) {
            const message = formatError(err);
            set({
              executionHistory: [...executionHistory, {
                id: historyId,
                method: 'trigger',
                request: parsedRequest,
                response: null,
                // State is left untouched by a failed trigger, so before === after
                stateBefore: parsedState,
                stateAfter: parsedState,
                events: [],
                error: message,
                stage,
                durationMs: Date.now() - startedAt,
                executedAt: new Date(startedAt).toISOString(),
              }],
              compilationErrors: [{ message: `Execution Error: ${message}` }],
              isProblemPanelVisible: true
            });
          } finally {
            set({ executingOperation: null });
          }
        },
      };
    }),
  ),
);

// Any change to the rendered sources, by whichever setter, starts a new revision (see renderSourceRevision).
useAppStore.subscribe((state, previous) => {
  if (
    state.templateMarkdown !== previous.templateMarkdown ||
    state.modelCto !== previous.modelCto ||
    state.data !== previous.data
  ) {
    renderSourceRevision++;
  }
  if (state.editorLogicTs !== previous.editorLogicTs) logicEditRevision++;
});

export default useAppStore;

/**
 * Whether template logic defines an `init` method, mirroring the check the
 * engine makes before calling one. Used to decide whether the runner shows the
 * Init step for a template whose model does not declare a State type.
 * @param source - the template's TypeScript logic
 * @returns true when the logic declares an init method
 */
function logicDefinesInit(source: string): boolean {
  return /(^|[\s;}])init\s*\(/.test(source);
}

function formatError(error: unknown): string {
  console.error(error);
  switch (true) {
    case typeof error === "string":
      return error as string;
    case Array.isArray(error):
      return (error as unknown[]).map((e) => formatError(e)).join("\n");
    case Boolean(error && typeof error === "object" && "code" in error): {
      const errorObj = error as {
        code?: unknown;
        errors?: unknown;
        renderedMessage?: unknown;
      };
      const sub = errorObj.errors ? formatError(errorObj.errors) : "";
      const msg = String(errorObj.renderedMessage ?? "");
      return `Error: ${String(errorObj.code ?? "")} ${sub} ${msg}`;
    }
    default:
      return String(error);
  }
}