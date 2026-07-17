import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { debounce } from "ts-debounce";
import { ModelManager } from "@accordproject/concerto-core";
import { TemplateMarkInterpreter } from "@accordproject/template-engine";
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
import { validateBeforeRebuild } from "../utils/validators";
import { loadBundledModels, BUNDLED_MODELS } from "../utils/modelCache";
import { sandboxResolvers } from "./sandboxResolvers";

// A single trigger execution result, stored in history
export interface LogicExecutionResult {
  response: object;
  stateBefore: object;
  stateAfter: object;
  events: object[];
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
  // Update live editor value without compiling
  setEditorLogicTs: (ts: string) => void;
  // Commit logic — applies editorLogicTs, compiles to JS, resets execution state
  setLogicTs: (ts: string) => Promise<void>;
  // Force a recompilation of the committed logicTs
  compileLogic: () => Promise<void>;
  // Build an official template archive from memory strings
  buildTemplateFromMemory: () => Promise<void>;
  // Register the sandbox iframe reference
  setSandboxRef: (iframe: HTMLIFrameElement | null) => void;
  // Mark the sandbox as ready after receiving the ready signal
  setSandboxReady: (ready: boolean) => void;
  // Execute compiled logic inside the sandboxed iframe
  executeInSandbox: (
    code: string,
    method: string,
    args: unknown[],
  ) => Promise<unknown>;
  executionState: string;
  executionEvents: string;
  executionResponse: string;
  requestJson: string;
  setRequestJson: (json: string) => void;
  initContract: () => Promise<void>;
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

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => {
      const initialTheme = getInitialTheme();
      const initialPanels = getInitialPanelState(); // Load saved panels

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
        executionId: 0,

        executionState: '',
        executionEvents: '',
        executionResponse: '',

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
              // Reset logic state when switching samples
              logicTs,
              editorLogicTs: logicTs,
              compiledLogicJs: null,
              compilationErrors: [],
              isCompiling: false,
              // Adapt layout based on whether template has logic
              isLogicPanelVisible: hasLogic,
              isContractRunnerVisible: hasLogic,
              isPreviewVisible: !hasLogic,
              requestJson: sample.REQUEST ? JSON.stringify(sample.REQUEST, null, 2) : '{}',
            }));

            // Persist the adaptive layout state
            savePanelState({
              ...get(),
              isLogicPanelVisible: hasLogic,
              isContractRunnerVisible: hasLogic,
              isPreviewVisible: !hasLogic,
            });

            await get().rebuild();
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

            set({ templateObject: template });
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
            if (!state.logicTs || !state.logicTs.trim()) {
              set({
                isCompiling: false,
                compilationErrors: [{
                  message: "Logic editor cannot be empty. Please provide valid TypeScript logic.",
                }],
                isProblemPanelVisible: true
              });
              return;
            }
            if (!state.modelCto) {
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
              set({
                isCompiling: false,
                isProblemPanelVisible: true,
                compilationErrors: actualErrors.slice(0, 1).map((e: any) => ({
                  message: e.renderedMessage || e.text,
                  line: e.line,
                  column: e.character,
                  length: e.length,
                })),
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

        initContract: async () => {
          const { compiledLogicJs, data } = get();
          if (!compiledLogicJs) {
            return;
          }

          try {
            const parsedData = JSON.parse(data);
            const output = await get().executeInSandbox(compiledLogicJs, 'init', [parsedData]) as { state?: unknown; events?: unknown[] };

            set({
              executionState: output.state ? JSON.stringify(output.state, null, 2) : '',
              executionEvents: output.events ? JSON.stringify(output.events, null, 2) : '[]',
              compilationErrors: []
            });
          } catch (err: unknown) {
            set({
              compilationErrors: [{ message: `Execution Error: ${formatError(err)}` }],
              isProblemPanelVisible: true
            });
          }
        },

        triggerContract: async () => {
          const { compiledLogicJs, data, requestJson, executionState, executeInSandbox } = get();
          if (!compiledLogicJs) return;

          if (!executionState) {
            set({
              compilationErrors: [{ message: "Execution Error: Contract must be initialized before triggering." }],
              isProblemPanelVisible: true
            });
            return;
          }

          try {
            const parsedData = JSON.parse(data);
            const parsedRequest = JSON.parse(requestJson);
            const parsedState = JSON.parse(executionState);

            const output = (await executeInSandbox(compiledLogicJs, 'trigger', [parsedData, parsedRequest, parsedState])) as { result?: unknown, state?: unknown, events?: unknown[] };

            /*
             * Extract and store execution artifacts.
             * The executionResponse holds the result payload, while state and events
             * are updated for subsequent trigger operations or UI rendering.
             */
            set({
              executionResponse: output.result ? JSON.stringify(output.result, null, 2) : '',
              executionState: output.state ? JSON.stringify(output.state, null, 2) : executionState,
              executionEvents: output.events ? JSON.stringify(output.events, null, 2) : '[]',
              compilationErrors: []
            });
          } catch (err: unknown) {
            set({
              compilationErrors: [{ message: `Execution Error: ${formatError(err)}` }],
              isProblemPanelVisible: true
            });
          }
        },
      };
    }),
  ),
);

export default useAppStore;

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
