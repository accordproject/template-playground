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
import { ExecutionSettings, DEFAULT_EXECUTION_SETTINGS } from '../types/components/Settings.types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/it';

interface AppState {
  templateMarkdown: string;
  editorValue: string;
  modelCto: string;
  editorModelCto: string;
  data: string;
  editorAgreementData: string;
  agreementHtml: string;
  error: string | undefined;
  warnings: string[];
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
  // Settings Panel
  isSettingsPanelOpen: boolean;
  executionSettings: ExecutionSettings;
  setSettingsPanelOpen: (visible: boolean) => void;
  updateExecutionSettings: (settings: Partial<ExecutionSettings>) => void;
}

export interface DecompressedData {
  templateMarkdown: string;
  modelCto: string;
  data: string;
  agreementHtml: string;
}

/**
 * Result of a template rebuild operation
 */
interface RebuildResult {
  html: string;
  warnings: string[];
}

const rebuildDeBounce = debounce(rebuild, 500);

/**
 * Rebuilds the template with the given data and validation mode.
 * In strict mode, validation errors are thrown.
 * In lenient mode, certain validation errors are converted to warnings.
 */
async function rebuild(
  template: string, 
  model: string, 
  dataString: string,
  validationMode: 'strict' | 'lenient' = 'strict',
  locale: string = 'en-US',
  clauseExpansion: boolean = false
): Promise<RebuildResult> {
  // Set global dayjs locale to ensure formatting respects the setting
  // The locale string might need to be trimmed to the language code for dayjs (e.g. 'en-US' -> 'en')
  // but dayjs handles 'en-US' by falling back to 'en' usually.
  // For 'fr', 'de', 'es', 'it', we imported the specific locales.
  // Note: 'en' is built-in.
  if (locale.startsWith('fr')) dayjs.locale('fr');
  else if (locale.startsWith('de')) dayjs.locale('de');
  else if (locale.startsWith('es')) dayjs.locale('es');
  else if (locale.startsWith('it')) dayjs.locale('it');
  else dayjs.locale('en');

  const warnings: string[] = [];
  
  // ModelManager strict option controls versioned namespace imports, not data validation
  // But we align it with validationMode to be safe
  const modelManager = new ModelManager({ strict: validationMode === 'strict' });
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
  
  // Parse data string to JSON
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let data: unknown;
  try {
    data = JSON.parse(dataString);
  } catch (parseError) {
    if (validationMode === 'lenient') {
      warnings.push(`JSON parse warning: ${String(parseError)}`);
      data = {};
    } else {
      throw parseError;
    }
  }
  
  // In lenient mode, we wrap the generation in a try-catch to convert errors to warnings
  let ciceroMark;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    ciceroMark = await engine.generate(templateMarkDom, data as any, { locale });
  } catch (genError) {
    if (validationMode === 'lenient') {
      // Check if it's a validation-related error that we can recover from
      const errorMessage = String(genError);
      if (errorMessage.includes('Unknown field') || 
          errorMessage.includes('Missing required field') ||
          errorMessage.includes('unknown property') ||
          errorMessage.includes('unexpected property') ||
          errorMessage.includes('Unexpected properties') ||
          errorMessage.includes('not valid') ||
          errorMessage.includes('Instance') ||
          errorMessage.includes('Additional property') ||
          errorMessage.includes('Value')) {
        warnings.push(`Validation warning: ${errorMessage}`);
        // Return empty HTML with warnings in lenient mode
        return { html: '<p><em>Template could not be fully rendered due to validation issues. See warnings.</em></p>', warnings };
      }
    }
    throw genError;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const ciceroMarkJson = ciceroMark.toJSON() as any;



  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  let html = await transform(
    ciceroMarkJson,
    "ciceromark_parsed",
    ["html"],
    {},
    { verbose: false }
  ) as string;

  if (clauseExpansion) {
    // Post-process HTML to inject clause labels
    // CiceroMark clauses render as blockquotes. We look for identifying attributes.
    // If the transformer outputs 'name' or 'data-name' or similar, we can use it.
    // We'll assume standard CiceroMark HTML output which usually includes the clause name.
    
    // Regex to find blockquotes and check for name attribute
    // Example: <blockquote name="payer">
    html = html.replace(/<blockquote([^>]*)>/g, (match, attributes) => {
      const nameMatch = attributes.match(/name=["']([^"']+)["']/) || attributes.match(/data-clause=["']([^"']+)["']/);
      if (nameMatch) {
        const clauseName = nameMatch[1];
        return `<blockquote${attributes}><div class="clause-label">▾ Clause: ${clauseName}</div>`;
      }
      return match;
    });
  }

  return { html, warnings };
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

/* --- Helper to safely load execution settings --- */
const getInitialExecutionSettings = (): ExecutionSettings => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('executionSettings');
      if (saved) {
        return { ...DEFAULT_EXECUTION_SETTINGS, ...(JSON.parse(saved) as Partial<ExecutionSettings>) };
      }
    } catch (e) { /* ignore */ }
  }
  return DEFAULT_EXECUTION_SETTINGS;
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
      warnings: [],
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
        const { templateMarkdown, modelCto, data, executionSettings } = get();
        try {
          const result = await rebuildDeBounce(
            templateMarkdown, 
            modelCto, 
            data, 
            executionSettings.validationMode,
            executionSettings.locale,
            executionSettings.clauseExpansion
          );
          set(() => ({ 
            agreementHtml: result.html, 
            warnings: result.warnings,
            error: undefined 
          }));
        } catch (error: unknown) {
          set(() => ({
          error: formatError(error),
          isProblemPanelVisible: true,
          warnings: [],
        }));
      }
      },
      setTemplateMarkdown: async (template: string) => {
        set(() => ({ templateMarkdown: template }));
        const { modelCto, data, executionSettings } = get();
        try {
          const result = await rebuildDeBounce(
            template, 
            modelCto, 
            data,
            executionSettings.validationMode,
            executionSettings.locale,
            executionSettings.clauseExpansion
          );
          set(() => ({ 
            agreementHtml: result.html, 
            warnings: result.warnings,
            error: undefined 
          }));
        } catch (error: unknown) {
          set(() => ({
          error: formatError(error),
          isProblemPanelVisible: true,
          warnings: [],
          }));
        }
      },
      setEditorValue: (value: string) => {
        set(() => ({ editorValue: value }));
      },
      setModelCto: async (model: string) => {
        set(() => ({ modelCto: model }));
        const { templateMarkdown, data, executionSettings } = get();
        try {
          const result = await rebuildDeBounce(
            templateMarkdown, 
            model, 
            data,
            executionSettings.validationMode,
            executionSettings.locale,
            executionSettings.clauseExpansion
          );
          set(() => ({ 
            agreementHtml: result.html, 
            warnings: result.warnings,
            error: undefined 
          }));
        } catch (error: unknown) {
          set(() => ({
          error: formatError(error),
          isProblemPanelVisible: true,
          warnings: [],
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
            data,
            get().executionSettings.validationMode,
            get().executionSettings.locale,
            get().executionSettings.clauseExpansion
          );
          set(() => ({ 
            agreementHtml: result.html, 
            warnings: result.warnings,
            error: undefined 
          }));
        } catch (error: unknown) {
          set(() => ({
          error: formatError(error),
          isProblemPanelVisible: true,
          warnings: [],
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
      // Settings Panel
      isSettingsPanelOpen: false,
      executionSettings: getInitialExecutionSettings(),
      setSettingsPanelOpen: (visible: boolean) => {
        set({ isSettingsPanelOpen: visible });
      },
      updateExecutionSettings: (settings: Partial<ExecutionSettings>) => {
        const oldSettings = get().executionSettings;
        set((state) => ({
          executionSettings: { ...state.executionSettings, ...settings }
        }));
        
        // Save to localStorage for persistence
        const currentSettings = get().executionSettings;
        const updatedSettings = { ...currentSettings, ...settings };
        if (typeof window !== 'undefined') {
          localStorage.setItem('executionSettings', JSON.stringify(updatedSettings));
        }

        // Trigger rebuild if validation mode or locale changed
        if (
          (settings.validationMode && settings.validationMode !== oldSettings.validationMode) ||
          (settings.locale && settings.locale !== oldSettings.locale) ||
          (settings.clauseExpansion !== undefined && settings.clauseExpansion !== oldSettings.clauseExpansion)
        ) {
          void get().rebuild();
        }
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
