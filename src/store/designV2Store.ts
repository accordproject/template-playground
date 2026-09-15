import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { STEPS, FIRST_STEP, type DesignV2View } from "../types/designV2.types";

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
  /** Whether the logic steps are part of the flow (see LOGIC_ONLY_STEP_KEYS). */
  includeLogic: boolean;

  setView: (view: DesignV2View) => void;
  /** Leave the welcome hero and open the first step. */
  start: () => void;
  goBack: () => void;
  goNext: () => void;
  setPreviewOpen: (open: boolean) => void;
  togglePreview: () => void;
  /**
   * Pick a template card. When the card declares whether it ships logic,
   * the "include logic" toggle follows it; otherwise the toggle is left alone.
   */
  selectTemplate: (name: string, logic?: boolean) => void;
  setIncludeLogic: (on: boolean) => void;
}

const stepIndexOf = (view: DesignV2View) => STEPS.findIndex((s) => s.id === view);

const useDesignV2Store = create<DesignV2State>()(
  devtools(
    (set, get) => ({
      view: "welcome",
      previewOpen: false,
      selectedTemplate: null,
      includeLogic: true,

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
      selectTemplate: (name, logic) =>
        set(
          (state) => ({ selectedTemplate: name, includeLogic: logic ?? state.includeLogic }),
          false,
          "designV2/selectTemplate"
        ),
      setIncludeLogic: (on) => set({ includeLogic: on }, false, "designV2/setIncludeLogic"),
    }),
    { name: "DesignV2Store" }
  )
);

export default useDesignV2Store;
