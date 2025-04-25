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
import { darkBackgroundColor, darkTextColor, lightBackgroundColor, lightTextColor } from "../constants";

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
  backgroundColor: string;
  textColor: string;
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
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          set(() => ({
            backgroundColor: darkBackgroundColor,
            textColor: darkTextColor,
          }));
          document.documentElement.setAttribute("data-theme", "dark");
        }
        else {
          set(() => ({
            backgroundColor: lightBackgroundColor,
            textColor: lightTextColor,
          }));
          document.documentElement.setAttribute("data-theme", "light");
        }
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
          set(() => ({ agreementHtml: result, error: undefined })); // Clear error on success
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
      },
      setTemplateMarkdown: async (template: string) => {
        set(() => ({ templateMarkdown: template }));
        const { modelCto, data } = get();
        try {
          const result = await rebuildDeBounce(template, modelCto, data);
          set(() => ({ agreementHtml: result, error: undefined })); // Clear error on success
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
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
          set(() => ({ error: formatError(error) }));
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
          set(() => ({ error: formatError(error) }));
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
          }));
        }
      },
      toggleDarkMode: () => {
        set((state) => {
          const isDark = state.backgroundColor === '#121212';
          const newBackgroundColor = isDark ? '#ffffff' : '#121212';
          const newTextColor = isDark ? '#121212' : '#ffffff';

          localStorage.setItem('theme', isDark ? 'light' : 'dark');
      
          return {
            backgroundColor: newBackgroundColor,
            textColor: newTextColor,
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