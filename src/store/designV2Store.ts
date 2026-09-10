import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { STEPS, FIRST_STEP, type DesignV2View } from "../types/designV2.types";

/** The two panes of the Model & Data split screen. */
export type ModelDataPane = "model" | "data";
export type ModelDataPanes = Record<ModelDataPane, boolean>;

/**
 * State for the design-v2 (step-based) layout.
 *
 * Kept separate from the main app store on purpose: v2 state stays
 * self-contained while sections are ported over, and the legacy store can be
 * retired without untangling it later.
 */
export interface DesignV2State {
  /** Current view: the welcome hero or one of the numbered steps. */
  view: DesignV2View;
  /** Whether the right-hand preview drawer is open. */
  previewOpen: boolean;
  /** Name of the template card picked on the Start step; null until the user picks one. */
  selectedTemplate: string | null;
  /** Which panes of the Model & Data step are open; at least one always is. */
  modelDataPanes: ModelDataPanes;
  /** Whether the right-hand help rail is shown next to the editor steps. */
  helpRailOpen: boolean;

  setView: (view: DesignV2View) => void;
  /** Leave the welcome hero and open the first step. */
  start: () => void;
  goBack: () => void;
  goNext: () => void;
  setPreviewOpen: (open: boolean) => void;
  togglePreview: () => void;
  /** Pick a template card (or the blank template). */
  selectTemplate: (name: string) => void;
  /** Open or close one pane of the Model & Data step. Closing the last open pane is ignored. */
  setPaneOpen: (pane: ModelDataPane, open: boolean) => void;
  setHelpRailOpen: (open: boolean) => void;
}

const stepIndexOf = (view: DesignV2View) => STEPS.findIndex((s) => s.id === view);

const useDesignV2Store = create<DesignV2State>()(
  devtools(
    (set, get) => ({
      view: "welcome",
      previewOpen: false,
      selectedTemplate: null,
      modelDataPanes: { model: true, data: true },
      helpRailOpen: true,

      setView: (view) => set({ view }, false, "designV2/setView"),
      start: () => set({ view: FIRST_STEP }, false, "designV2/start"),
      goBack: () => {
        const index = stepIndexOf(get().view);
        if (index > 0) set({ view: STEPS[index - 1].id }, false, "designV2/goBack");
      },
      goNext: () => {
        const index = stepIndexOf(get().view);
        if (index >= 0 && index < STEPS.length - 1) {
          set({ view: STEPS[index + 1].id }, false, "designV2/goNext");
        }
      },
      setPreviewOpen: (open) => set({ previewOpen: open }, false, "designV2/setPreviewOpen"),
      togglePreview: () =>
        set((state) => ({ previewOpen: !state.previewOpen }), false, "designV2/togglePreview"),
      selectTemplate: (name) => set({ selectedTemplate: name }, false, "designV2/selectTemplate"),
      setPaneOpen: (pane, open) =>
        set(
          (state) => {
            const panes = { ...state.modelDataPanes, [pane]: open };
            if (!panes.model && !panes.data) return state;
            return { modelDataPanes: panes };
          },
          false,
          "designV2/setPaneOpen"
        ),
      setHelpRailOpen: (open) => set({ helpRailOpen: open }, false, "designV2/setHelpRailOpen"),
    }),
    { name: "DesignV2Store" }
  )
);

export default useDesignV2Store;
