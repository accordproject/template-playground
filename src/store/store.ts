import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { debounce } from "ts-debounce";
import { ModelManager } from "@accordproject/concerto-core";
import { TemplateMarkInterpreter } from "@accordproject/template-engine";
import { TemplateMarkTransformer } from "@accordproject/markdown-template";
import { transform } from "@accordproject/markdown-transform";
import { SAMPLES, Sample } from "@/samples";
import * as playground from "@samples/playground";
import { compress, decompress } from "@utils/compression/compression";

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
      setEditorValue: (value: string) => {
        set(() => ({ editorValue: value }));
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