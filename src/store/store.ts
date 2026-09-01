import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { debounce } from "ts-debounce";
import { ModelManager } from "@accordproject/concerto-core";
import { TemplateMarkInterpreter } from "@accordproject/template-engine";
import { TypeScriptCompilationContext } from "@accordproject/template-engine/lib/TypeScriptCompilationContext";
import { SMART_LEGAL_CONTRACT_BASE64 } from "@accordproject/template-engine/lib/runtime/declarations";
import { TemplateMarkTransformer } from "@accordproject/markdown-template";
import { transform } from "@accordproject/markdown-transform";
import { SAMPLES, Sample } from "../samples";
import * as playground from "../samples/playground";
import { compress, decompress } from "../utils/compression/compression";
// Import removed: compileLogicTs is now a no-op
import {
  AIConfig,
  ChatState,
  KeyProtectionLevel,
} from "../types/components/AIAssistant.types";
import type {
  ExecutionEngine,
  InitResponse,
  LLMMode,
  TriggerResponse,
} from "../ai-assistant/llm";
import { validateBeforeRebuild } from "../utils/validators";
import { loadBundledModels, BUNDLED_MODELS } from "../utils/modelCache";
import { sandboxResolvers } from "./sandboxResolvers";
import tour from "../components/Tour";

/**
 * A single step in a stateful template's execution chain: either the Init
 * step (index 0 — `request`/`priorState`/`result` all `null`) or a
 * subsequent trigger. Mirrors the shape `LLMExecutor.trigger()` (and the
 * sandboxed TS logic) already speak — `priorState` in, `result` + `state` +
 * `events` out — plus `edited`, which marks a step whose `state` was
 * hand-edited in the runner rather than produced by a run.
 *
 * Persisted to localStorage (see `getInitialChain`/`persistChain`) so a page
 * refresh doesn't lose the sequence. This was previously `LogicExecutionResult`,
 * an unused placeholder for the same idea — renamed and filled in here.
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
  init: () => Promise<void>;
  loadSample: (name: string) => Promise<void>;
  generateShareableLink: () => string;
  loadFromLink: (compressedData: string) => Promise<void>;
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
  buildTemplateFromMemory: () => Promise<void>;
  
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
   * Also clears the execution chain (see below) and its persisted copy.
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
): Promise<string> {
  /*
   * Validate inputs before expensive operations
   * This fails fast on invalid JSON or CTO syntax without running network calls
   */
  await validateBeforeRebuild(template, model, dataString);
  const modelManager = new ModelManager({ offline: true });
  /*
   * Preload the bundled Accord Project models so imports like
   * `https://models.accordproject.org/accordproject/contract@0.2.0.cto`
   * resolve from the bundle without a network round-trip. Combined with
   * offline:true, any namespace not in the bundle will fail validation
   * rather than triggering a network fetch.
   */
  loadBundledModels(modelManager);
  modelManager.addCTOModel(model, undefined, true);
  const engine = new TemplateMarkInterpreter(modelManager as any, {});
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const templateMarkTransformer = new TemplateMarkTransformer();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const templateMarkDom = templateMarkTransformer.fromMarkdownTemplate(
    { content: template },
    modelManager,
    "contract",
    { verbose: false },
  ) as object;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = JSON.parse(dataString);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  const ciceroMark = await engine.generate(templateMarkDom, data);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const ciceroMarkJson = ciceroMark.toJSON() as unknown;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const result = (await transform(
    ciceroMarkJson,
    "ciceromark_parsed",
    ["html"],
    {},
    { verbose: false },
  )) as string;
  return result;
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
    if (saved === "disabled" || saved === "fallback" || saved === "force") {
      return saved;
    }
  }
  return "disabled";
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
  if (chain.length === 0) {
    localStorage.removeItem(CHAIN_STORAGE_KEY);
  } else {
    localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(chain));
  }
};

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
        logicTs: "",
        editorLogicTs: "",
        compiledLogicJs: null,
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
            set(() => ({
              sampleName: sample.NAME,
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
            const hasLogic = Boolean(logicTs && logicTs.trim().length > 0);
            /*
             * A shared link loads a different template — nothing the last one
             * produced (including its execution chain) applies here. This was
             * a pre-existing gap (loadSample already did this); the chain
             * persisting across page loads makes it worth closing now, since
             * otherwise a stale chain could leak into an unrelated template.
             */
            get().resetExecution();
            set(() => ({
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
          } catch (error) {
            set(() => ({
              error:
                "Failed to load shared content: " +
                (error instanceof Error ? error.message : "Unknown error"),
              isProblemPanelVisible: true,
            }));
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

        buildTemplateFromMemory: async () => {
          set({ templateObject: null });
          try {
            const { Template: CiceroTemplate } =
              await import("@accordproject/cicero-core");
            const JSZip = (await import("jszip")).default;
            const { templateMarkdown, modelCto, logicTs } = get();

            // Construct package.json required by the Template archive
            const packageJson = {
              name: "playground-template",
              version: "1.0.0",
              accordproject: {
                template: "contract",
                cicero: "^1.0.0",
              },
            };

            // Build an in-memory zip file (.cta archive equivalent)
            const zip = new JSZip();
            zip.file("package.json", JSON.stringify(packageJson));
            zip.file("text/grammar.tem.md", templateMarkdown);
            zip.file("model/model.cto", modelCto);

            // Inject offline models so fromArchive resolves external imports locally
            for (const bundledModel of BUNDLED_MODELS) {
              zip.file(`model/${bundledModel.fileName}`, bundledModel.source);
            }

            if (logicTs) {
              zip.file("logic/logic.ts", logicTs);
            }

            // Generate buffer and load via fromArchive API
            const content = await zip.generateAsync({ type: "uint8array" });
            const { Buffer } = await import("buffer");
            const template = await CiceroTemplate.fromArchive(
              Buffer.from(content),
              { offline: true },
            );

            const { isStatefulTemplate } = await import("../ai-assistant/llm");
            /*
             * A template is stateful when its model declares a State type — the
             * rule cicero-core's isStateful() applies, and the one the LLM
             * executor derives its schema from. The runner also treats logic
             * with an init() as stateful: a template whose State does not
             * extend the runtime base is malformed, but its sandboxed logic
             * still has state to seed, and hiding Init would strand it.
             */
            set({
              templateObject: template,
              isTemplateStateful:
                isStatefulTemplate(template) || logicDefinesInit(logicTs),
            });
            if (import.meta.env.DEV)
              console.log(
                "Successfully built Template object from JSZip archive!",
                template,
              );
          } catch (error) {
            console.error("Error building template from memory:", error);
          }
        },

        compileLogic: async () => {
          set({
            isCompiling: true,
            compilationErrors: [],
            compiledLogicJs: null,
          });
          try {
            const state = get();
            if (!state.logicTs || !state.modelCto) {
              set({ isCompiling: false, compilationErrors: [] });
              return;
            }

            const { TemplateArchiveProcessor } =
              await import("@accordproject/template-engine");

            /*
             * Always rebuild the Template object from the latest in-memory sources
             * to ensure the compiler has the most up-to-date grammar and model.
             */
            await get().buildTemplateFromMemory();

            const templateToCompile = get().templateObject;
            if (!templateToCompile) {
              set({
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
                  const contextStr = new TypeScriptCompilationContext(
                    templateToCompile.getModelManager(),
                    fqn,
                  ).getCompilationContext();
                  const declarationsStr = atob(SMART_LEGAL_CONTRACT_BASE64);
                  const prependedText = `\n${contextStr}\n${declarationsStr}\n                `;
                  lineOffset = prependedText.split("\n").length - 1;
                }
              } catch (e) {
                console.error("Failed to calculate compilation line offset", e);
              }

              set({
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
               * This handles: export class Foo, export default class Foo, export default Foo.
               */
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
                set({
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

              set({
                isCompiling: false,
                compiledLogicJs: code,
                compilationErrors: [],
              });
            }
          } catch (error: unknown) {
            set({
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
            "../ai-assistant/llm"
          );
          const executorConfig = buildLLMExecutorConfig(aiConfig, llmExecutionMode);

          /*
           * The LLM executor derives its JSON Schema from the template's own
           * ModelManager, so it needs a Template object. Rebuild it every run:
           * templates without logic never go through compileLogic() (which is
           * what usually builds one), and an edited model would otherwise be
           * executed against a stale schema.
           */
          await get().buildTemplateFromMemory();
          const template = get().templateObject;
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
           * a trigger result that this init did not produce.
           */
          get().resetExecution();
          set({ executingOperation: 'init' });

          try {
            const parsedData: unknown = JSON.parse(data);
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
            const initStep: ChainStep = {
              label: 'Init',
              request: null,
              priorState: null,
              result: null,
              state: (output.state ?? {}) as object,
              events: (output.events ?? []) as object[],
              edited: false,
            };
            const chain = [initStep];

            set({
              executionChain: chain,
              selectedChainIndex: 0,
              isContractInitialized: true,
              lastExecutionEngine: useTypeScript ? 'typescript' : 'llm',
              compilationErrors: []
            });
            syncChainDisplay(initStep);
            persistChain(chain);
          } catch (err: unknown) {
            set({
              compilationErrors: [{ message: `Execution Error: ${formatError(err)}` }],
              isProblemPanelVisible: true
            });
          } finally {
            set({ executingOperation: null });
          }
        },

        triggerContract: async () => {
          const { compiledLogicJs, data, requestJson, executionState, isTemplateStateful, isContractInitialized, llmExecutionMode, executeInSandbox, executionChain, selectedChainIndex } = get();

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

          try {
            const parsedData: unknown = JSON.parse(data);
            const parsedRequest: unknown = JSON.parse(requestJson);
            const parsedState: unknown = executionState ? JSON.parse(executionState) : {};

            const output = useTypeScript
              ? (await executeInSandbox(compiledLogicJs!, 'trigger', [parsedData, parsedRequest, parsedState])) as { result?: unknown, state?: unknown, events?: unknown[] }
              : (await get().executeWithLLM('trigger', { data: parsedData, request: parsedRequest, priorState: parsedState })) as { result?: unknown, state?: unknown, events?: unknown[] };

            /*
             * Extract and store execution artifacts.
             * The executionResponse holds the result payload, while state and events
             * are updated for subsequent trigger operations or UI rendering.
             */
            set({
              executionResponse: output.result ? JSON.stringify(output.result, null, 2) : '',
              executionState: output.state ? JSON.stringify(output.state, null, 2) : executionState,
              executionEvents: output.events ? JSON.stringify(output.events, null, 2) : '[]',
              lastExecutionEngine: useTypeScript ? 'typescript' : 'llm',
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
                events: (output.events ?? []) as object[],
                edited: false,
              };
              const chain = [...executionChain, newStep];
              set({ executionChain: chain, selectedChainIndex: chain.length - 1 });
              persistChain(chain);
            }
          } catch (err: unknown) {
            set({
              compilationErrors: [{ message: `Execution Error: ${formatError(err)}` }],
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