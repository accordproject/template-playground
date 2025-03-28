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

const STORAGE_KEY = 'template-playground-state';

interface StorageState {
  editorValue: string;
  sampleName: string;
  lastSavedAt: string;
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
}

const persistState = (state: StorageState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    editorValue: state.editorValue,
    sampleName: state.sampleName,
    lastSavedAt: state.lastSavedAt,
    templateMarkdown: state.templateMarkdown,
    modelCto: state.modelCto,
    data: state.data,
    agreementHtml: state.agreementHtml
  }));
};

const loadPersistedState = (): StorageState | null => {
  const savedState = localStorage.getItem(STORAGE_KEY);
  return savedState ? JSON.parse(savedState) : null;
};

interface HistoryState {
  states: StorageState[];
  currentIndex: number;
}

interface AppState {
  pushState: (state: StorageState) => void;
  history: HistoryState;
  templateMarkdown: string;
  editorValue: string;
  modelCto: string;
  lastSavedAt: string;
  editorModelCto: string;
  data: string;
  editorAgreementData: string;
  agreementHtml: string;
  error: string | undefined;
  samples: Array<Sample>;
  sampleName: string;
  backgroundColor: string;
  textColor: string;
  setTemplateMarkdown: (template: string) => Promise<void>;
  setEditorValue: (value: string) => void;
  resetEditor: () => void;
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

const MAX_HISTORY = 50;

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => ({
  history: {
    states: [],
    currentIndex: -1
  },
      backgroundColor: '#ffffff',
      textColor: '#121212',
      sampleName: playground.NAME,
      lastSavedAt: new Date().toISOString(),
      templateMarkdown: playground.TEMPLATE,
      editorValue: playground.TEMPLATE,
      modelCto: playground.MODEL,
      editorModelCto: playground.MODEL,
      data: JSON.stringify(playground.DATA, null, 2),
      editorAgreementData: JSON.stringify(playground.DATA, null, 2),
      agreementHtml: "",
      error: undefined,
      samples: SAMPLES,
      init: async () => {
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get("data");
        if (compressedData) {
          await get().loadFromLink(compressedData);
        } else {
          const savedState = loadPersistedState();
          if (savedState) {
            const { editorValue, sampleName, lastSavedAt = new Date().toISOString(), templateMarkdown, modelCto, data, agreementHtml } = savedState;
            get().pushState(get());
set(() => ({
              editorValue,
              sampleName,
              lastSavedAt,
              templateMarkdown,
              modelCto,
              editorModelCto: modelCto,
              data,
              editorAgreementData: data,
              agreementHtml
            }));
          }
          await get().rebuild();
        }
      },
      loadSample: async (name: string) => {
        const sample = SAMPLES.find((s) => s.NAME === name);
        if (sample) {
          const lastSavedAt = new Date().toISOString();
          const data = JSON.stringify(sample.DATA, null, 2);
          get().pushState(get());
set(() => ({
            sampleName: sample.NAME,
            agreementHtml: '',
            error: undefined,
            templateMarkdown: sample.TEMPLATE,
            editorValue: sample.TEMPLATE,
            modelCto: sample.MODEL,
            editorModelCto: sample.MODEL,
            data,
            editorAgreementData: data,
            lastSavedAt
          }));
          persistState({
            editorValue: sample.TEMPLATE,
            sampleName: sample.NAME,
            lastSavedAt,
            templateMarkdown: sample.TEMPLATE,
            modelCto: sample.MODEL,
            data,
            agreementHtml: ''
          });
          await get().rebuild();
        }
      },
      rebuild: async () => {
        const { templateMarkdown, modelCto, data } = get();
        try {
          const result = await rebuildDeBounce(templateMarkdown, modelCto, data);
          const lastSavedAt = new Date().toISOString();
          get().pushState(get());
set(() => ({
            agreementHtml: result,
            error: undefined,
            lastSavedAt
          }));
          persistState({
            editorValue: templateMarkdown,
            sampleName: get().sampleName,
            lastSavedAt,
            templateMarkdown,
            modelCto,
            data,
            agreementHtml: result
          });
        } catch (error: any) {
          const lastSavedAt = new Date().toISOString();
          get().pushState(get());
set(() => ({
            error: formatError(error),
            lastSavedAt
          }));
          persistState({
            editorValue: templateMarkdown,
            sampleName: get().sampleName,
            lastSavedAt,
            templateMarkdown,
            modelCto,
            data,
            agreementHtml: get().agreementHtml
          });
        }
      },
      setTemplateMarkdown: async (template: string) => {
        const lastSavedAt = new Date().toISOString();
        get().pushState(get());
set(() => ({
          editorValue: template,
          templateMarkdown: template,
          lastSavedAt
        }));
        persistState({
          editorValue: template,
          sampleName: get().sampleName,
          lastSavedAt,
          templateMarkdown: template,
          modelCto: get().modelCto,
          data: get().data,
          agreementHtml: get().agreementHtml
        });
        await get().rebuild();
      },
      pushState: (state: StorageState) => {
  const { history } = get();
  const newStates = history.states.slice(0, history.currentIndex + 1);
  newStates.push(state);
  set({ history: { states: newStates.slice(-MAX_HISTORY), currentIndex: newStates.length - 1 } });
},
undo: () => {
  const { history } = get();
  if (history.currentIndex > 0) {
    const prevState = history.states[history.currentIndex - 1];
    set({
      ...prevState,
      history: { states: history.states, currentIndex: history.currentIndex - 1 }
    });
  }
},
redo: () => {
  const { history } = get();
  if (history.currentIndex < history.states.length - 1) {
    const nextState = history.states[history.currentIndex + 1];
    set({
      ...nextState,
      history: { states: history.states, currentIndex: history.currentIndex + 1 }
    });
  }
},
setEditorValue: async (value: string) => {
        const { modelCto, data } = get();
        try {
          get().pushState(get());
set(() => ({
            editorValue: value,
            templateMarkdown: value,
            lastSavedAt: new Date().toISOString()
          }));
          const result = await rebuildDeBounce(value, modelCto, data);
          get().pushState(get());
set(() => ({
            agreementHtml: result,
            error: undefined
          }));
          persistState(get());
        } catch (error: any) {
          get().pushState(get());
set(() => ({
            error: formatError(error)
          }));
          persistState(get());
        }
      },
      resetEditor: async () => {
        try {
          const currentState = get();
          const currentSample = SAMPLES.find((s) => s.NAME === currentState.sampleName) || SAMPLES[0];
          
          // Reset template-related states
          const lastSavedAt = new Date().toISOString();
          
          // Clear history first
          set(() => ({
            history: { states: [], currentIndex: -1 }
          }));

          // Reset to initial state
          set(() => ({
            templateMarkdown: currentSample.TEMPLATE,
            editorValue: currentSample.TEMPLATE,
            modelCto: currentSample.MODEL,  // Reset to sample's model
            editorModelCto: currentSample.MODEL,  // Reset to sample's model
            data: JSON.stringify(currentSample.DATA, null, 2),  // Reset to sample's data
            editorAgreementData: JSON.stringify(currentSample.DATA, null, 2),  // Reset to sample's data
            sampleName: currentState.sampleName,
            lastSavedAt,
            agreementHtml: "",  // Clear the HTML output
            error: undefined
          }));

          // Persist the reset state
          persistState(get());
          
          // Rebuild with the reset state
          await get().rebuild();
        } catch (error) {
          set(() => ({
            error: formatError(error)
          }));
        }
      },
      setModelCto: async (model: string) => {
        set(() => ({ modelCto: model }));
        const { templateMarkdown, data } = get();
        try {
          get().pushState(get());
set(() => ({
            modelCto: model,
            lastSavedAt: new Date().toISOString()
          }));
          const result = await rebuildDeBounce(templateMarkdown, model, data);
          get().pushState(get());
set(() => ({
            agreementHtml: result,
            error: undefined
          }));
          persistState(get());
        } catch (error: any) {
          get().pushState(get());
set(() => ({ error: formatError(error) }));
          persistState(get());
        }
      },
      setEditorModelCto: (value: string) => {
        get().pushState(get());
set(() => ({ editorModelCto: value }));
      },
      setData: async (data: string) => {
        set(() => ({ data }));
        try {
          get().pushState(get());
set(() => ({
            data,
            lastSavedAt: new Date().toISOString()
          }));
          const result = await rebuildDeBounce(
            get().templateMarkdown,
            get().modelCto,
            data
          );
          get().pushState(get());
set(() => ({
            agreementHtml: result,
            error: undefined
          }));
          persistState(get());
        } catch (error: any) {
          get().pushState(get());
set(() => ({
            error: formatError(error)
          }));
          persistState(get());
        }
      },
      setEditorAgreementData: (value: string) => {
        get().pushState(get());
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
          const { templateMarkdown, modelCto, data, agreementHtml } =
            decompress(compressedData);
          get().pushState(get());
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
          get().pushState(get());
set(() => ({
            error: "Failed to load data from the link",
          }));
        }
      },
      toggleDarkMode: () => {
        set((state) => {
          const isDark = state.backgroundColor === '#121212';
          return {
            backgroundColor: isDark ? '#ffffff' : '#121212',
            textColor: isDark ? '#121212' : '#ffffff',
          };
        });
      },
    }))
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