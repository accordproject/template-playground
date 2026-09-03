/**
 * Views of the step-based onboarding flow (work in progress).
 *
 * welcome  → hero landing
 * 1        → "Choose a template type" gallery
 * 2..5     → editor steps (Text, Model, Data, Logic) with the right-hand help rail
 * 6        → Simulate (runs list + request/response)
 * 7        → Deploy (placeholder — contents TBD)
 */
export type DesignV2View = "welcome" | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type EditorStep = 2 | 3 | 4 | 5;

export interface StepDefinition {
  id: DesignV2View;
  icon: string;
  label: string;
  meta: string;
}

export const STEPS: StepDefinition[] = [
  { id: 1, icon: "1", label: "Template", meta: "pick a starting point" },
  { id: 2, icon: "2", label: "Text", meta: "text.md" },
  { id: 3, icon: "3", label: "Model", meta: "model.cto" },
  { id: 4, icon: "4", label: "Data", meta: "data.json" },
  { id: 5, icon: "5", label: "Logic", meta: "logic.ts" },
  { id: 6, icon: "6", label: "Simulate", meta: "run requests" },
  { id: 7, icon: "7", label: "Deploy", meta: "publish & share" },
];
