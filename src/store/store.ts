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
import { AIConfig, ChatState, KeyProtectionLevel } from '../types/components/AIAssistant.types';
import { validateBeforeRebuild } from "../utils/validators";
import { loadBundledModels } from "../utils/modelCache";

/** A single trigger execution result, stored in history */
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

  // ── Existing template / model / data fields ────────────────────────────
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

  // ── Logic / execution fields (NEW) ────────────────────────────────────
  /** Committed TypeScript logic source (triggers compilation) */
  logicTs: string;
  /** Live editor value — not committed until user clicks Apply */
  editorLogicTs: string;
  /** Resulting compiled JS payload (reserved for US-02). Null while compilation is unimplemented/stale/failed. */
  compiledLogicJs: string | null;
  /** True while compilation is running (reserved for US-02). */
  isCompiling: boolean;
  /** Compilation diagnostics (reserved for US-02). */
  compilationErrors: { message: string; line?: number; column?: number }[];


  // ── Existing action signatures ─────────────────────────────────────────
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
  startTour: () => void;
  isModelCollapsed: boolean;
  isTemplateCollapsed: boolean;
  isDataCollapsed: boolean;
  isLogicTsCollapsed: boolean;
  isRequestCollapsed: boolean;
  isResponseCollapsed: boolean;
  isStateCollapsed: boolean;
  toggleModelCollapse: () => void;
  toggleTemplateCollapse: () => void;
  toggleDataCollapse: () => void;
  toggleLogicTsCollapse: () => void;
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

  // ── Logic action signatures (NEW) ─────────────────────────────────────
  /** Update live editor value without compiling */
  setEditorLogicTs: (ts: string) => void;
  /** Commit logic — applies editorLogicTs, compiles to JS, resets execution state */
  setLogicTs: (ts: string) => Promise<void>;
  /** Force a recompilation of the committed logicTs */
  compileLogic: () => Promise<void>;

}

export interface DecompressedData {
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
}

const rebuildDeBounce = debounce(rebuild, 500);

async function rebuild(template: string, model: string, dataString: string): Promise<string> {
  // Validate inputs before expensive operations
  // This fails fast on invalid JSON or CTO syntax without running network calls
  await validateBeforeRebuild(template, model, dataString);
  // @ts-expect-error `offline` is supported at runtime but not yet in published typings
  const modelManager = new ModelManager({ strict: true, offline: true });
  // Preload the bundled Accord Project models so imports like
  // `https://models.accordproject.org/accordproject/contract@0.2.0.cto`
  // resolve from the bundle without a network round-trip. Combined with
  // offline:true, any namespace not in the bundle will fail validation
  // rather than triggering a network fetch.
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
    { verbose: false }
  ) as object;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = JSON.parse(dataString);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  const ciceroMark = await engine.generate(templateMarkDom, data);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const ciceroMarkJson = ciceroMark.toJSON() as unknown;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const result = await transform(
    ciceroMarkJson,
    "ciceromark_parsed",
    ["html"],
    {},
    { verbose: false }
  ) as string;
  return result;
}

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      return { backgroundColor: '#121212', textColor: '#ffffff' };
    } else if (savedTheme === 'light') {
      return { backgroundColor: '#ffffff', textColor: '#121212' };
    }
  }
  // Default to light theme
  return { backgroundColor: '#ffffff', textColor: '#121212' };
};

/* --- Helper to safely load panel state --- */
const getInitialPanelState = () => {
  const defaults = {
    isEditorsVisible: true,
    isPreviewVisible: true,
    isProblemPanelVisible: false,
    isLogicPanelVisible: false,
    isAIChatOpen: false,
  };
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ui-panels');
      if (saved) return { ...defaults, ...(JSON.parse(saved) as Partial<AppState>) };
    } catch (e) { /* ignore */ }
  }
  return defaults;
};

/* --- Helper to safely save panel state --- */
const savePanelState = (state: Partial<AppState>) => {
  if (typeof window !== 'undefined') {
    const panels = {
      isEditorsVisible: state.isEditorsVisible,
      isPreviewVisible: state.isPreviewVisible,
      isProblemPanelVisible: state.isProblemPanelVisible,
      isLogicPanelVisible: state.isLogicPanelVisible,
      isAIChatOpen: state.isAIChatOpen,
    };
    localStorage.setItem('ui-panels', JSON.stringify(panels));
  }
};

const getInitialLineNumbers = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('showLineNumbers');
    if (saved !== null) {
      return saved === 'true';
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
        isModelCollapsed: false,
        isTemplateCollapsed: false,
        isDataCollapsed: false,
        isLogicTsCollapsed: false,
        isRequestCollapsed: false,
        isResponseCollapsed: false,
        isStateCollapsed: false,
        showLineNumbers: getInitialLineNumbers(),
        isSettingsOpen: false,
        keyProtectionLevel: null,
        isLogicFeatureEnabled:
          typeof window !== 'undefined'
            ? localStorage.getItem('isLogicFeatureEnabled') === 'true'
            : false,
        setLogicFeatureEnabled: (value: boolean) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('isLogicFeatureEnabled', String(value));
          }
          set({ isLogicFeatureEnabled: value });
        },
        // ── Logic initial state ────────────────────────────────────────────
        logicTs: '',
        editorLogicTs: '',
        compiledLogicJs: null,
        isCompiling: false,
        compilationErrors: [],


        toggleModelCollapse: () => set((state) => ({ isModelCollapsed: !state.isModelCollapsed })),
        toggleTemplateCollapse: () => set((state) => ({ isTemplateCollapsed: !state.isTemplateCollapsed })),
        toggleDataCollapse: () => set((state) => ({ isDataCollapsed: !state.isDataCollapsed })),
        toggleLogicTsCollapse: () => set((state) => ({ isLogicTsCollapsed: !state.isLogicTsCollapsed })),
        toggleRequestCollapse: () => set((state) => ({ isRequestCollapsed: !state.isRequestCollapsed })),
        toggleResponseCollapse: () => set((state) => ({ isResponseCollapsed: !state.isResponseCollapsed })),
        toggleStateCollapse: () => set((state) => ({ isStateCollapsed: !state.isStateCollapsed })),
        setShowLineNumbers: (value: boolean) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('showLineNumbers', String(value));
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
            await get().rebuild();
          }
        },
        loadSample: async (name: string) => {
          const sample = SAMPLES.find((s) => s.NAME === name);
          if (sample) {
            const logicTs = sample.LOGIC ?? '';
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
            }));
            await get().rebuild();
          }
        },

        rebuild: async () => {
          const { templateMarkdown, modelCto, data } = get();
          try {
            const result = await rebuildDeBounce(templateMarkdown, modelCto, data);
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
              data
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
          });
          return `${window.location.origin}/#data=${compressedData}`;
        },
        loadFromLink: async (compressedData: string) => {
          try {
            const { templateMarkdown, modelCto, data, agreementHtml } = decompress(compressedData);
            if (!templateMarkdown || !modelCto || !data) {
              throw new Error("Invalid share link data");
            }
            set(() => ({
              templateMarkdown,
              editorValue: templateMarkdown,
              modelCto,
              editorModelCto: modelCto,
              data,
              editorAgreementData: data,
              agreementHtml,
              error: undefined,
              logicTs: '',
              editorLogicTs: '',
              compiledLogicJs: null,
              compilationErrors: [],
              isCompiling: false,
            }));
            await get().rebuild();
          } catch (error) {
            set(() => ({
              error: "Failed to load shared content: " + (error instanceof Error ? error.message : "Unknown error"),
              isProblemPanelVisible: true,
            }));
          }
        },
        toggleDarkMode: () => {
          set((state) => {
            const isDark = state.backgroundColor === '#121212';
            const newTheme = {
              backgroundColor: isDark ? '#ffffff' : '#121212',
              textColor: isDark ? '#121212' : '#ffffff',
            };

            if (typeof window !== 'undefined') {
              const themeValue = isDark ? 'light' : 'dark';
              localStorage.setItem('theme', themeValue);
              try {
                document.documentElement.setAttribute('data-theme', themeValue);
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
        updateChatState: (partial) => set((state) => ({
          chatState: { ...state.chatState, ...partial }
        })),
        setAIConfig: (config) => set({ aiConfig: config }),
        setChatAbortController: (controller) => set({ chatAbortController: controller }),
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
          console.log('Starting tour...');
        },

        // ── Logic actions (NEW) ────────────────────────────────────────────

        setEditorLogicTs: (ts: string) => {
          set(() => ({ editorLogicTs: ts }));
        },

        setLogicTs: async (ts: string) => {
          set(() => ({ logicTs: ts, editorLogicTs: ts }));
          await get().compileLogic();
        },

        compileLogic: async () => {
          set({ isCompiling: true, compilationErrors: [], compiledLogicJs: null });
          try {
            const state = get();
            if (!state.logicTs || !state.modelCto) {
              set({ isCompiling: false, compilationErrors: [] });
              return;
            }

            const { TemplateArchiveProcessor } = await import("@accordproject/template-engine");
            const { ModelManager } = await import("@accordproject/concerto-core");
            const { loadBundledModels } = await import("../utils/modelCache");
            
            // Build ModelManager from current CTO
            // @ts-expect-error offline is supported
            const modelManager = new ModelManager({ strict: true, offline: true });
            loadBundledModels(modelManager);
            modelManager.addCTOModel(get().modelCto, undefined, true);

            // Determine Fully Qualified Name from current data gracefully
            let fullyQualifiedName = "org.accordproject.contract.TemplateModel";
            try {
              const dataObj = JSON.parse(get().data);
              if (dataObj["$class"]) {
                fullyQualifiedName = dataObj["$class"];
              }
            } catch (e) {
              // Ignore invalid JSON, default to base TemplateModel
            }

            // Duck-type a Template object to satisfy TemplateArchiveProcessor
            const mockTemplate = {
              getLogicManager: () => ({
                getLanguage: () => 'typescript',
                getScriptManager: () => ({
                  getScriptsForTarget: () => [{
                    getIdentifier: () => 'logic/logic.ts',
                    getContents: () => get().logicTs
                  }]
                })
              }),
              getModelManager: () => modelManager,
              getTemplateModel: () => ({
                getFullyQualifiedName: () => fullyQualifiedName
              })
            };

            const processor = new TemplateArchiveProcessor(mockTemplate as any);
            const compiledCode = await processor.compileLogic();
            const result = compiledCode['logic/logic.ts'];
            
            // Filter out bogus error 2391 caused by syntax errors in the engine's own shim (TemplateLogic.init)
            const actualErrors = result.errors ? result.errors.filter((e: any) => e.code !== 2391) : [];

            if (actualErrors.length > 0) {
              set({ 
                isCompiling: false, 
                compilationErrors: actualErrors.map((e: any) => ({
                  message: e.renderedMessage || e.text,
                  line: e.line,
                  column: e.character
                }))
              });
            } else {
              // Encode as Base64 data module for dynamic import (US-02 Requirement)
            const bytes = new TextEncoder().encode(result.code);
            const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
            const base64Encoded = btoa(binary);
            const dataModuleUrl = `data:text/javascript;base64,${base64Encoded}`;
              
              set({ 
                isCompiling: false, 
                compiledLogicJs: dataModuleUrl,
                compilationErrors: []
              });
            }
          } catch (error: unknown) {
            set({
              isCompiling: false,
              compilationErrors: [{ message: error instanceof Error ? error.message : String(error) }]
            });
          }
        },
      }
    })
  )
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
      const errorObj = error as { code?: unknown; errors?: unknown; renderedMessage?: unknown };
      const sub = errorObj.errors ? formatError(errorObj.errors) : "";
      const msg = String(errorObj.renderedMessage ?? "");
      return `Error: ${String(errorObj.code ?? "")} ${sub} ${msg}`;
    }
    default:
      return String(error);
  }
}
