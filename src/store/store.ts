import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { debounce } from "ts-debounce";
import { SAMPLES, Sample } from "../samples";
import { compress, decompress } from "../utils/compression/compression";

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

async function loadMarkdownProcessingLibs() {
  const [{ ModelManager }, { TemplateMarkInterpreter }, { TemplateMarkTransformer }, { transform }] =
    await Promise.all([
      import("@accordproject/concerto-core"),
      import("@accordproject/template-engine"),
      import("@accordproject/markdown-template"),
      import("@accordproject/markdown-transform"),
    ]);

  return { ModelManager, TemplateMarkInterpreter, TemplateMarkTransformer, transform };
}

const rebuild = debounce(async (template: string, model: string, dataString: string) => {
  const { ModelManager, TemplateMarkInterpreter, TemplateMarkTransformer, transform } =
    await loadMarkdownProcessingLibs();

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
}, 500);

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
      sampleName: "",
      templateMarkdown: "",
      editorValue: "",
      modelCto: "",
      editorModelCto: "",
      data: "",
      editorAgreementData: "",
      agreementHtml: "",
      error: undefined,
      samples: SAMPLES,
      init: async () => {
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get("data");
        if (compressedData) {
          await get().loadFromLink(compressedData);
        } else {
          await get().loadSample("default");
        }
      },
      loadSample: async (name: string) => {
        const playground = await import("../samples/playground");
        const sample = SAMPLES.find((s) => s.NAME === name) || playground;
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
      },
      rebuild: async () => {
        const { templateMarkdown, modelCto, data } = get();
        try {
          const result = await rebuild(templateMarkdown, modelCto, data);
          set(() => ({ agreementHtml: result, error: undefined }));
        } catch (error: any) {
          set(() => ({ error: formatError(error) }));
        }
      },
      setTemplateMarkdown: async (template: string) => {
        set(() => ({ templateMarkdown: template }));
        await get().rebuild();
      },
      setEditorValue: (value: string) => {
        set(() => ({ editorValue: value }));
      },
      setModelCto: async (model: string) => {
        set(() => ({ modelCto: model }));
        await get().rebuild();
      },
      setEditorModelCto: (value: string) => {
        set(() => ({ editorModelCto: value }));
      },
      setData: async (data: string) => {
        set(() => ({ data }));
        await get().rebuild();
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