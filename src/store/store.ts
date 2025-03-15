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
}

const persistState = (state: StorageState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadPersistedState = (): StorageState | null => {
  const savedState = localStorage.getItem(STORAGE_KEY);
  return savedState ? JSON.parse(savedState) : null;
};

interface AppState {
  templateMarkdown: string;
  editorValue: string;
  modelCto: string;
  lastSavedAt?: string;
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

const useAppStore = create<AppState>()(
  immer(
    devtools((set, get) => ({
      backgroundColor: '#ffffff',
      textColor: '#121212',
      toggleDarkMode: () => {
        set((state) => {
          const isDark = state.backgroundColor === '#121212';
          return {
            backgroundColor: isDark ? '#ffffff' : '#121212',
            textColor: isDark ? '#121212' : '#ffffff',
          };
        });
      },
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
      init: async () => {
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get("data");
        if (compressedData) {
          await get().loadFromLink(compressedData);
        } else {
          const savedState = loadPersistedState();
          if (savedState) {
            const { editorValue, sampleName, lastSavedAt } = savedState;
            set(() => ({
              editorValue,
              sampleName,
              lastSavedAt,
              templateMarkdown: editorValue
            }));
          }
          await get().rebuild();
        }
      },
      loadSample: async (name: string) => {
        const sample = SAMPLES.find((s) => s.NAME === name);
        if (sample) {
          const lastSavedAt = new Date().toISOString();
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
            lastSavedAt
          }));
          persistState({ editorValue: sample.TEMPLATE, sampleName: sample.NAME, lastSavedAt });
          await get().rebuild();
        }
      },
      rebuild: async () => {
        const { templateMarkdown, modelCto, data } = get();
        try {
          const result = await rebuildDeBounce(templateMarkdown, modelCto, data);
          set(() => ({ agreementHtml: result, error: undefined }));
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
      },
      setTemplateMarkdown: async (template: string) => {
        const { modelCto, data } = get();
        try {
          const result = await rebuildDeBounce(template, modelCto, data);
          set(() => ({
            templateMarkdown: template,
            agreementHtml: result,
            error: undefined,
          }));
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
      },
      setEditorValue: async (value: string) => {
        set((state) => {
          state.editorValue = value;
          state.templateMarkdown = value;
          state.lastSavedAt = new Date().toISOString();
          persistState({ editorValue: value, sampleName: state.sampleName, lastSavedAt: state.lastSavedAt });
          return state;
        });
        await get().rebuild();
      },
      resetEditor: async () => {
        localStorage.removeItem(STORAGE_KEY);
        const currentState = get();
        const currentSample = SAMPLES.find((s) => s.NAME === currentState.sampleName);
        if (currentSample) {
          set(() => ({
            templateMarkdown: currentSample.TEMPLATE,
            editorValue: currentSample.TEMPLATE,
            modelCto: currentSample.MODEL,
            editorModelCto: currentSample.MODEL,
            data: JSON.stringify(currentSample.DATA, null, 2),
            editorAgreementData: JSON.stringify(currentSample.DATA, null, 2),
            lastSavedAt: new Date().toISOString(),
            error: undefined,
            agreementHtml: ""
          }));
          await get().rebuild();
        }
      },
      setModelCto: async (model: string) => {
        const { templateMarkdown, data } = get();
        try {
          const result = await rebuildDeBounce(templateMarkdown, model, data);
          set(() => ({
            modelCto: model,
            agreementHtml: result,
            error: undefined,
          }));
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
      },
      setEditorModelCto: (value: string) => {
        set(() => ({ editorModelCto: value }));
      },
      setData: async (data: string) => {
        try {
          const result = await rebuildDeBounce(
            get().templateMarkdown,
            get().modelCto,
            data
          );
          set(() => ({ agreementHtml: result, error: undefined }));
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
        set(() => ({ data }));
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
        return `${window.location.origin}/v1?data=${compressedData}`;
      },
      loadFromLink: async (compressedData: string) => {
        try {
          const { templateMarkdown, modelCto, data, agreementHtml } =
            decompress(compressedData);
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
        } catch (error) {
          set(() => ({
            error: "Failed to load data from the link",
          }));
        }
      },
    }))
  )
);

export default useAppStore;

function formatError(error: any): string {
  console.error(error);
  if (typeof error === "string") {
    return error;
  } else if (Array.isArray(error)) {
    return error.map((e) => formatError(e)).join("\n");
  } else if (error.code) {
    const sub = error.errors ? formatError(error.errors) : "";
    const msg = error.renderedMessage ? error.renderedMessage : "";
    return `Error: ${error.code} ${sub} ${msg}`;
  }
  return error.toString();
}