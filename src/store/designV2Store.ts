import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { STEPS, FIRST_STEP, type DesignV2View } from "../components/designV2/types";

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

  setView: (view: DesignV2View) => void;
  /** Leave the welcome hero and open the first step. */
  start: () => void;
  goBack: () => void;
  goNext: () => void;
  setPreviewOpen: (open: boolean) => void;
  togglePreview: () => void;
}

const stepIndexOf = (view: DesignV2View) => STEPS.findIndex((s) => s.id === view);

const useDesignV2Store = create<DesignV2State>()(
  devtools(
    (set, get) => ({
      view: "welcome",
      previewOpen: false,

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
    }),
    { name: "DesignV2Store" }
  )
);

export default useDesignV2Store;
