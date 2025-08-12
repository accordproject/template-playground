import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("ts-debounce", () => ({
  debounce: <T extends (...args: any[]) => any>(fn: T, _delay: number): T => fn,
}));

vi.mock("@accordproject/concerto-core", () => ({
  ModelManager: class {
    addCTOModel(content: string, fileName?: string) {
      return;
    }
    updateExternalModels() {
      return Promise.resolve();
    }
  },
}));

vi.mock("@accordproject/template-engine", () => ({
  TemplateMarkInterpreter: class {
    generate() {
      return Promise.resolve({ toJSON: () => ({}) });
    }
  },
}));

vi.mock("@accordproject/markdown-template", () => ({
  TemplateMarkTransformer: class {
    fromMarkdownTemplate({ content }: any) {
      return {}; // dummy object
    }
  },
}));

// Mock decompress utility
// vi.mock("../../../utils/compression/compression", () => ({
//   decompress: vi.fn().mockReturnValue({
//     templateMarkdown: "link template",
//     modelCto: "link model",
//     data: "{}",
//     agreementHtml: "link html",
//   }),
// }));

vi.mock("../../utils/compression/compression", () => ({
  compress: vi.fn().mockReturnValue("compressed-string"),
  decompress: vi.fn().mockReturnValue({
    templateMarkdown: "link template",
    modelCto: "link model",
    data: "{}",
    agreementHtml: "link html",
  }),
}));

vi.mock("@accordproject/markdown-transform", () => ({
  transform: () => Promise.resolve("<p>rebuilt-html</p>"),
}));

import useAppStore from "../../store/store";
import * as playground from "../../samples/playground";
import { SAMPLES } from "../../samples";

// Helper to reset store state before each test
const resetStore = () => {
  useAppStore.setState({
    backgroundColor: "#ffffff",
    textColor: "#121212",
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
  });
};

describe("AppStore", () => {
  // Reset state before each test for isolation
  beforeEach(() => {
    resetStore();
  });

  /** Basic State Variables Tests **/
  describe("Basic State Variables", () => {
    it("initializes backgroundColor correctly", () => {
      const store = useAppStore.getState();
      expect(store.backgroundColor).toBe("#ffffff");
    });

    it("initializes textColor correctly", () => {
      const store = useAppStore.getState();
      expect(store.textColor).toBe("#121212");
    });

    it("initializes sampleName correctly", () => {
      const store = useAppStore.getState();
      expect(store.sampleName).toBe(playground.NAME);
    });

    it("initializes templateMarkdown correctly", () => {
      const store = useAppStore.getState();
      expect(store.templateMarkdown).toBe(playground.TEMPLATE);
    });

    it("initializes editorValue correctly", () => {
      const store = useAppStore.getState();
      expect(store.editorValue).toBe(playground.TEMPLATE);
    });

    it("initializes modelCto correctly", () => {
      const store = useAppStore.getState();
      expect(store.modelCto).toBe(playground.MODEL);
    });

    it("initializes editorModelCto correctly", () => {
      const store = useAppStore.getState();
      expect(store.editorModelCto).toBe(playground.MODEL);
    });

    it("initializes data correctly", () => {
      const store = useAppStore.getState();
      expect(store.data).toBe(JSON.stringify(playground.DATA, null, 2));
    });

    it("initializes editorAgreementData correctly", () => {
      const store = useAppStore.getState();
      expect(store.editorAgreementData).toBe(
        JSON.stringify(playground.DATA, null, 2)
      );
    });

    it("initializes agreementHtml correctly", () => {
      const store = useAppStore.getState();
      expect(store.agreementHtml).toBe("");
    });

    it("initializes error correctly", () => {
      const store = useAppStore.getState();
      expect(store.error).toBeUndefined();
    });

    it("initializes samples correctly", () => {
      const store = useAppStore.getState();
      expect(store.samples).toEqual(SAMPLES);
    });
  });

  /** Setter Methods Tests **/
  describe("Setter Methods", () => {
    it("setTemplateMarkdown updates templateMarkdown", async () => {
      const newTemplate = "new template";
      await useAppStore.getState().setTemplateMarkdown(newTemplate);
      expect(useAppStore.getState().templateMarkdown).toBe(newTemplate);
    });

    it("setEditorValue updates editorValue", () => {
      const newValue = "new editor value";
      useAppStore.getState().setEditorValue(newValue);
      expect(useAppStore.getState().editorValue).toBe(newValue);
    });

    it("setModelCto updates modelCto", async () => {
      const newModel = "new model";
      await useAppStore.getState().setModelCto(newModel);
      expect(useAppStore.getState().modelCto).toBe(newModel);
    });

    it("setEditorModelCto updates editorModelCto", () => {
      const newModel = "new editor model";
      useAppStore.getState().setEditorModelCto(newModel);
      expect(useAppStore.getState().editorModelCto).toBe(newModel);
    });

    it("setData updates data", async () => {
      const newData = "{}";
      await useAppStore.getState().setData(newData);
      expect(useAppStore.getState().data).toBe(newData);
    });

    it("setEditorAgreementData updates editorAgreementData", () => {
      const newData = "{}";
      useAppStore.getState().setEditorAgreementData(newData);
      expect(useAppStore.getState().editorAgreementData).toBe(newData);
    });
  });

  /** Other Methods Tests **/
  describe("Other Methods", () => {
    it("toggleDarkMode switches colors", () => {
      const initialBackground = useAppStore.getState().backgroundColor;
      const initialText = useAppStore.getState().textColor;
      useAppStore.getState().toggleDarkMode();
      expect(useAppStore.getState().backgroundColor).toBe(initialText);
      expect(useAppStore.getState().textColor).toBe(initialBackground);
    });

    it("generateShareableLink returns a link with data", () => {
      const link = useAppStore.getState().generateShareableLink();
      expect(link).toContain("data=");
    });

    it("rebuild updates agreementHtml", async () => {
      await useAppStore.getState().rebuild();
      expect(useAppStore.getState().agreementHtml).toBe("<p>rebuilt-html</p>");
    });

    it("init calls rebuild when no URL data", async () => {
      // Force window.location.search to be empty.
      Object.defineProperty(window, "location", {
        writable: true,
        value: { origin: "http://localhost", search: "" },
      });

      await useAppStore.getState().init();
      expect(useAppStore.getState().agreementHtml).toBe("<p>rebuilt-html</p>");
    });

    it("loadSample updates state with sample data", async () => {
      const sample = SAMPLES[0];
      await useAppStore.getState().loadSample(sample.NAME);
      expect(useAppStore.getState().sampleName).toBe(sample.NAME);
      expect(useAppStore.getState().templateMarkdown).toBe(sample.TEMPLATE);
      expect(useAppStore.getState().modelCto).toBe(sample.MODEL);
      expect(useAppStore.getState().data).toBe(
        JSON.stringify(sample.DATA, null, 2)
      );
    });

    it("loadFromLink updates state from compressed data", async () => {
      await useAppStore.getState().loadFromLink("fakeCompressedData");
      expect(useAppStore.getState().templateMarkdown).toBe("link template");
      expect(useAppStore.getState().modelCto).toBe("link model");
      expect(useAppStore.getState().data).toBe("{}");
      expect(useAppStore.getState().agreementHtml).toBe("link html");
    });
  });
});
