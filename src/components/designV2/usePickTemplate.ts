import { useCallback } from "react";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import * as playground from "../../samples/playground";
import { START_BLANK, START_SAMPLES, sampleNameFor } from "./constants";

/** The card the flow starts on when the user has not picked one: the first in the gallery, the simplest template. */
export const DEFAULT_TEMPLATE = START_SAMPLES[0].name;

type WorkingCopy = {
  sampleName: string;
  editorValue: string;
  editorModelCto: string;
  editorAgreementData: string;
  editorLogicTs: string;
};

/**
 * Whether the app holds something other than the untouched starting sample:
 * another sample was loaded (in the classic playground, say) or the sources
 * were edited. "Start building" keeps such work instead of replacing it.
 */
export const hasWorkInProgress = (s: WorkingCopy): boolean =>
  s.sampleName !== playground.NAME ||
  s.editorValue !== playground.TEMPLATE ||
  s.editorModelCto !== playground.MODEL ||
  s.editorAgreementData !== JSON.stringify(playground.DATA, null, 2) ||
  s.editorLogicTs.trim() !== "";

/** The gallery card for a loaded sample, or the sample's own name when no card shows it. */
export const cardNameFor = (sampleName: string): string =>
  [...START_SAMPLES, START_BLANK].find((card) => card.sampleName === sampleName)?.name ?? sampleName;

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
