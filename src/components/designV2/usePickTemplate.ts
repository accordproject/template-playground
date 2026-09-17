import { useCallback } from "react";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import { START_SAMPLES, sampleNameFor } from "./constants";

/** The card the flow starts on when the user has not picked one: the first in the gallery. */
export const DEFAULT_TEMPLATE = START_SAMPLES[0].name;

/**
 * Picking a template: records the card in the v2 store and loads its sample
 * into the app store right away, so every later step — reached through Next
 * or by jumping ahead in the stepper — sees that template.
 */
export const usePickTemplate = () => {
  const selectTemplate = useDesignV2Store((s) => s.selectTemplate);
  const loadSample = useAppStore((s) => s.loadSample);
  return useCallback(
    (name: string) => {
      selectTemplate(name);
      const sampleName = sampleNameFor(name);
      if (sampleName) void loadSample(sampleName);
    },
    [selectTemplate, loadSample]
  );
};
