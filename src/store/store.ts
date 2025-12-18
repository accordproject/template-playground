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
import { AIConfig, ChatState } from "../types/components/AIAssistant.types";

/* ================= Panel persistence ================= */

const getInitialPanelState = () => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("ui-panels");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    isEditorsVisible: true,
    isPreviewVisible: true,
    isProblemPanelVisible: false,
    isAIChatOpen: false,
  };
};

/* ================= Rebuild logic ================= */

const rebuildDeBounce = debounce(rebuild, 500);

async function rebuild(template: string, model: string, dataString: string) {
  const modelManager = new ModelManager({ strict: true });
  modelManager.addCTOModel(model, undefined, true);
  await modelManager.updateExternalModels();
  const engine = new TemplateMarkInterpreter(modelManager, {});
  const templateMarkTransformer = new TemplateMarkTransformer();
  const templateMarkDom = templateMarkTransformer.fromMarkdownTemplate(
    { content: template },
    modelManager,
    "contract",
    { verbose: false }
  );
  const data = JSON.parse(dataString);
  const ciceroMark = await engine.generate(templateMarkDom, data);
  return await transform(
    ciceroMark.toJSON(),
    "ciceromark_parsed",
    ["html"],
    {},
    { verbose: false }
  );
}

/* ================= Store types ================= */

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
  isEditorsVisible: boolean;
  isPreviewVisible: boolean;
  isProblemPanelVisible: boolean;

  isModelCollapsed: boolean;
  isTemplateCollapsed: boolean;
  isDataCollapsed: boolean;

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

  setEditorsVisible: (value: boolean) => void;
  setPreviewVisible: (value: boolean) => void;
  setProblemPanelVisible: (value: boolean) => void;
  setAIChatOpen: (visible: boolean) => void;

  toggleModelCollapse: () => void;
  toggleTemplateCollapse: () => void;
  toggleDataCollapse: () => void;

  setAIConfigOpen: (visible: boolean) => void;
  setChatState: (state: ChatState) => void;
  updateChatState: (partial: Partial<ChatState>) => void;
  setAIConfig: (config: AIConfig | null) => void;
  setChatAbortController: (controller: AbortController | null) => void;
  resetChat: () => void;
  startTour: () => void;
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
  return { backgroundColor: "#ffffff", textColor: "#121212" };
};



const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => {
      const initialTheme = getInitialTheme();
      const initialPanels = getInitialPanelState();

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
        error: undefined,

        samples: SAMPLES,

        isAIConfigOpen: false,
        isAIChatOpen: initialPanels.isAIChatOpen,
        isEditorsVisible: initialPanels.isEditorsVisible,
        isPreviewVisible: initialPanels.isPreviewVisible,
        isProblemPanelVisible: initialPanels.isProblemPanelVisible,

        isModelCollapsed: false,
        isTemplateCollapsed: false,
        isDataCollapsed: false,

        chatState: { messages: [], isLoading: false, error: null },
        aiConfig: null,
        chatAbortController: null,

        /* ===== panel visibility persistence ===== */

        setEditorsVisible: (value) => {
          const state = get();
          if (!value && !state.isPreviewVisible) return;
          localStorage.setItem("ui-panels", JSON.stringify({ ...state, isEditorsVisible: value }));
          set({ isEditorsVisible: value });
        },

        setPreviewVisible: (value) => {
          const state = get();
          if (!value && !state.isEditorsVisible) return;
          localStorage.setItem("ui-panels", JSON.stringify({ ...state, isPreviewVisible: value }));
          set({ isPreviewVisible: value });
        },

        setProblemPanelVisible: (value) => {
          localStorage.setItem("ui-panels", JSON.stringify({ ...get(), isProblemPanelVisible: value }));
          set({ isProblemPanelVisible: value });
        },

        setAIChatOpen: (visible) => {
          localStorage.setItem("ui-panels", JSON.stringify({ ...get(), isAIChatOpen: visible }));
          set({ isAIChatOpen: visible });
        },

        /* ===== upstream collapse toggles ===== */

        toggleModelCollapse: () => set((s) => ({ isModelCollapsed: !s.isModelCollapsed })),
        toggleTemplateCollapse: () => set((s) => ({ isTemplateCollapsed: !s.isTemplateCollapsed })),
        toggleDataCollapse: () => set((s) => ({ isDataCollapsed: !s.isDataCollapsed })),

        /* ===== upstream logic below unchanged ===== */

        init: async () => {
          const params = new URLSearchParams(window.location.search);
          const compressedData = params.get("data");
          if (compressedData) await get().loadFromLink(compressedData);
          else await get().rebuild();
        },

        loadSample: async (name) => {
          const sample = SAMPLES.find((s) => s.NAME === name);
          if (!sample) return;
          set({
            sampleName: sample.NAME,
            templateMarkdown: sample.TEMPLATE,
            editorValue: sample.TEMPLATE,
            modelCto: sample.MODEL,
            editorModelCto: sample.MODEL,
            data: JSON.stringify(sample.DATA, null, 2),
            editorAgreementData: JSON.stringify(sample.DATA, null, 2),
            agreementHtml: "",
            error: undefined,
          });
          await get().rebuild();
        },

        rebuild: async () => {
          try {
            const result = await rebuildDeBounce(
              get().templateMarkdown,
              get().modelCto,
              get().data
            );
            set({ agreementHtml: result, error: undefined });
          } catch (e: any) {
            set({ error: formatError(e), isProblemPanelVisible: true });
          }
        },

        setTemplateMarkdown: async (template) => {
          set({ templateMarkdown: template });
          await get().rebuild();
        },

        setEditorValue: (value) => set({ editorValue: value }),

        setModelCto: async (model) => {
          set({ modelCto: model });
          await get().rebuild();
        },

        setEditorModelCto: (value) => set({ editorModelCto: value }),

        setData: async (data) => {
          set({ data });
          await get().rebuild();
        },

        setEditorAgreementData: (value) => set({ editorAgreementData: value }),

        generateShareableLink: () => {
          const state = get();
          return `${window.location.origin}?data=${compress({
            templateMarkdown: state.templateMarkdown,
            modelCto: state.modelCto,
            data: state.data,
            agreementHtml: state.agreementHtml,
          })}`;
        },

        loadFromLink: async (compressedData) => {
          const decoded = decompress(compressedData);
          set({
            ...decoded,
            editorValue: decoded.templateMarkdown,
            editorModelCto: decoded.modelCto,
            editorAgreementData: decoded.data,
          });
          await get().rebuild();
        },

        toggleDarkMode: () => {
          set((state) => {
            const isDark = state.backgroundColor === "#121212";
            const newTheme = {
              backgroundColor: isDark ? "#ffffff" : "#121212",
              textColor: isDark ? "#121212" : "#ffffff",
            };
            if (typeof window !== "undefined") {
              localStorage.setItem("theme", isDark ? "light" : "dark");
            }
            return newTheme;
          });
        },

        setAIConfigOpen: (visible) => set({ isAIConfigOpen: visible }),
        setChatState: (state) => set({ chatState: state }),
        updateChatState: (partial) =>
          set((state) => ({ chatState: { ...state.chatState, ...partial } })),
        setAIConfig: (config) => set({ aiConfig: config }),
        setChatAbortController: (controller) => set({ chatAbortController: controller }),

        resetChat: () => {
          const { chatAbortController } = get();
          if (chatAbortController) chatAbortController.abort();
          set({ chatState: { messages: [], isLoading: false, error: null } });
        },

        startTour: () => {
          console.log("Starting tour...");
        },
      };
    })
  )
);

export default useAppStore;

function formatError(error: any): string {
  console.error(error);
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.map((e) => formatError(e)).join("\n");
  if (error.code) {
    const sub = error.errors ? formatError(error.errors) : "";
    const msg = error.renderedMessage || "";
    return `Error: ${error.code} ${sub} ${msg}`;
  }
  return error.toString();
}


