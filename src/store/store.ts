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
}

export interface DecompressedData {
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
}

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

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => {
      const initialTheme = getInitialTheme();
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
      isAIChatOpen: false,
      error: undefined,
      samples: SAMPLES,
      chatState: {
        messages: [],
        isLoading: false,
        error: null,
      },
      aiConfig: null,
      chatAbortController: null,
      isEditorsVisible: true,
      isPreviewVisible: true,
      isProblemPanelVisible: false,
      setEditorsVisible: (value) => {
        const state = get();
        if (!value && !state.isPreviewVisible) {
          return;
        }
        set({ isEditorsVisible: value });
      },
      setPreviewVisible: (value) => {
        const state = get();
        if (!value && !state.isEditorsVisible) {
          return;
        }
        set({ isPreviewVisible: value });
      },
      setProblemPanelVisible: (value) => set({ isProblemPanelVisible: value }),
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
        } catch (error: any) {
          set(() => ({ error: formatError(error), isProblemPanelVisible: true }));
        }
      },
      setTemplateMarkdown: async (template: string) => {
        set(() => ({ templateMarkdown: template }));
        const { modelCto, data } = get();
        try {
          const result = await rebuildDeBounce(template, modelCto, data);
          set(() => ({ agreementHtml: result, error: undefined }));
        } catch (error: any) {
          set(() => ({ error: formatError(error), isProblemPanelVisible: true }));
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
          set(() => ({ agreementHtml: result, error: undefined })); // Clear error on success
        } catch (error: any) {
          set(() => ({ error: formatError(error), isProblemPanelVisible: true }));
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
          set(() => ({ agreementHtml: result, error: undefined })); // Clear error on success
        } catch (error: any) {
          set(() => ({ error: formatError(error), isProblemPanelVisible: true }));
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
        return `${window.location.origin}?data=${compressedData}`;
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
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
          }
          
          return newTheme;
        });
      },
      setAIConfigOpen: (isOpen: boolean) => set(() => ({ isAIConfigOpen: isOpen })),
      setAIChatOpen: (isOpen: boolean) => set(() => ({ isAIChatOpen: isOpen })),
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