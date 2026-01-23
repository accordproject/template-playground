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
import { AIConfig, ChatState } from '../types/components/AIAssistant.types';

const EDITOR_STATE_KEY = 'editor-state';

interface AppState {
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
  isAIConfigOpen: boolean;
  isAIChatOpen: boolean;
  backgroundColor: string;
  textColor: string;
  chatState: ChatState;
  aiConfig: AIConfig | null;
  chatAbortController: AbortController | null;
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
  setAIConfigOpen: (visible: boolean) => void;
  setAIChatOpen: (visible: boolean) => void;
  setChatState: (state: ChatState) => void;
  updateChatState: (partial: Partial<ChatState>) => void;
  setAIConfig: (config: AIConfig | null) => void;
  setChatAbortController: (controller: AbortController | null) => void;
  resetChat: () => void;
  isEditorsVisible: boolean;
  isPreviewVisible: boolean;
  isProblemPanelVisible: boolean;
  setEditorsVisible: (value: boolean) => void;
  setPreviewVisible: (value: boolean) => void;
  setProblemPanelVisible: (value: boolean) => void;
  startTour: () => void;
  isModelCollapsed: boolean;
  isTemplateCollapsed: boolean;
  isDataCollapsed: boolean;
  toggleModelCollapse: () => void;
  toggleTemplateCollapse: () => void;
  toggleDataCollapse: () => void;
}

export interface DecompressedData {
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
}

const rebuildDeBounce = debounce(rebuild, 500);

async function rebuild(template: string, model: string, dataString: string): Promise<string> {
  const modelManager = new ModelManager({ strict: true });
  modelManager.addCTOModel(model, undefined, true);
  await modelManager.updateExternalModels();
  const engine = new TemplateMarkInterpreter(modelManager, {});
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

/* --- Helper to safely load editor state --- */
const getInitialEditorState = () => {
  if(typeof window !== 'undefined'){
    try{
      const saved = localStorage.getItem(EDITOR_STATE_KEY);
      if(saved){
        return JSON.parse(saved);
      }
    } catch(e){
      /* ignore */ 
    }
  }
  return null;
};

/* --- Helper to safely save editor state --- */
const saveEditorState = (state: Partial<AppState>) => {
  if(typeof window !== 'undefined'){
    const editorData = {
      editorValue: state.editorValue,
      templateMarkdown: state.templateMarkdown,
      editorModelCto: state.editorModelCto,
      modelCto: state.modelCto,
      data: state.data,
      editorAgreementData: state.editorAgreementData,
    }
    localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(editorData));
  }  
};

const saveEditorStateDeBounced = debounce(saveEditorState, 1000);

/* --- Helper to safely save panel state --- */
const savePanelState = (state: Partial<AppState>) => {
  if (typeof window !== 'undefined') {
    const panels = {
      isEditorsVisible: state.isEditorsVisible,
      isPreviewVisible: state.isPreviewVisible,
      isProblemPanelVisible: state.isProblemPanelVisible,
      isAIChatOpen: state.isAIChatOpen,
    };
    localStorage.setItem('ui-panels', JSON.stringify(panels));
  }
};

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => {
      const initialTheme = getInitialTheme();
      const initialPanels = getInitialPanelState(); // Load saved panels

      return {
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
      isAIConfigOpen: false,
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
      isModelCollapsed: false,
      isTemplateCollapsed: false,
      isDataCollapsed: false,
      toggleModelCollapse: () => set((state) => ({ isModelCollapsed: !state.isModelCollapsed })),
      toggleTemplateCollapse: () => set((state) => ({ isTemplateCollapsed: !state.isTemplateCollapsed })),
      toggleDataCollapse: () => set((state) => ({ isDataCollapsed: !state.isDataCollapsed })),
      setEditorsVisible: (value) => {
        const state = get();
        if (!value && !state.isPreviewVisible) {
          return;
        }
        set({ isEditorsVisible: value });
        savePanelState({ ...get(), isEditorsVisible: value }); // Save change
      },
      setPreviewVisible: (value) => {
        const state = get();
        if (!value && !state.isEditorsVisible) {
          return;
        }
        set({ isPreviewVisible: value });
        savePanelState({ ...get(), isPreviewVisible: value }); // Save change
      },
      setProblemPanelVisible: (value) => {
        set({ isProblemPanelVisible: value });
        savePanelState({ ...get(), isProblemPanelVisible: value }); // Save change
      },
      init: async () => {
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get("data");
        if (compressedData) {
          await get().loadFromLink(compressedData);
        } else {
          const savedState = getInitialEditorState();
          if(savedState){
            set((prev) => ({
              templateMarkdown: savedState.templateMarkdown ?? prev.templateMarkdown,
              editorValue: savedState.editorValue ?? prev.editorValue,
              modelCto: savedState.modelCto ?? prev.modelCto,
              editorModelCto: savedState.editorModelCto ?? prev.editorModelCto,
              data: savedState.data ?? prev.data,
              editorAgreementData: savedState.editorAgreementData ?? prev.editorAgreementData,
            }));
          }
          await get().rebuild();
        }
      },
      loadSample: async (name: string) => {
        const sample = SAMPLES.find((s) => s.NAME === name);
        if (sample) {
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
        saveEditorStateDeBounced(get());
      },
      setEditorValue: (value: string) => {
        set(() => ({ editorValue: value }));
        saveEditorStateDeBounced(get());
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
        saveEditorStateDeBounced(get());
      },
      setEditorModelCto: (value: string) => {
        set(() => ({ editorModelCto: value }));
        saveEditorStateDeBounced(get());
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
        saveEditorStateDeBounced(get());
      },
      setEditorAgreementData: (value: string) => {
        set(() => ({ editorAgreementData: value }));
        saveEditorStateDeBounced(get());
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
      setAIConfigOpen: (isOpen: boolean) => set(() => ({ isAIConfigOpen: isOpen })),
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
      }
    })
  )
);


export default useAppStore;

function formatError(error: unknown): string {
  console.error(error);
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.map((e) => formatError(e)).join("\n");
  if (error && typeof error === "object" && "code" in error) {
    const errorObj = error as { code?: unknown; errors?: unknown; renderedMessage?: unknown };
    const sub = errorObj.errors ? formatError(errorObj.errors) : "";
    const msg = String(errorObj.renderedMessage ?? "");
    return `Error: ${String(errorObj.code ?? "")} ${sub} ${msg}`;
  }
  return String(error);
}
