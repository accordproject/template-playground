/**
 * Views of the step-based onboarding flow (work in progress).
 *
 * welcome  → hero landing
 * template → "Choose a template type" gallery
 * text, model, data, logic → editor steps with the right-hand help rail
 * simulate → runs list + request/response
 * deploy   → placeholder — contents TBD
 *
 * STEPS is the single source of truth for step order. Everything else
 * (ids, keys, first/last step, editor steps) is derived from it so that
 * reordering or adding a step never requires touching a component.
 */
export const STEPS = [
  { id: 1, key: "template", icon: "1", label: "Template", meta: "pick a starting point" },
  { id: 2, key: "text", icon: "2", label: "Text", meta: "text.md" },
  { id: 3, key: "model", icon: "3", label: "Model", meta: "model.cto" },
  { id: 4, key: "data", icon: "4", label: "Data", meta: "data.json" },
  { id: 5, key: "logic", icon: "5", label: "Logic", meta: "logic.ts" },
  { id: 6, key: "simulate", icon: "6", label: "Simulate", meta: "run requests" },
  { id: 7, key: "deploy", icon: "7", label: "Deploy", meta: "publish & share" },
] as const;

export type StepDefinition = (typeof STEPS)[number];
export type StepId = StepDefinition["id"];
export type StepKey = StepDefinition["key"];
export type DesignV2View = "welcome" | StepId;

/** Steps rendered with the generic editor card + help rail. */
export const EDITOR_STEP_KEYS = ["text", "model", "data", "logic"] as const satisfies readonly StepKey[];
export type EditorStepKey = (typeof EDITOR_STEP_KEYS)[number];

/** Lookup tables derived from STEPS: key → id and id → key. */
export const STEP_ID = Object.fromEntries(STEPS.map((s) => [s.key, s.id])) as Record<StepKey, StepId>;
export const STEP_KEY = Object.fromEntries(STEPS.map((s) => [s.id, s.key])) as Record<StepId, StepKey>;

export const FIRST_STEP: StepId = STEPS[0].id;
export const LAST_STEP: StepId = STEPS[STEPS.length - 1].id;

export const isEditorStep = (key: StepKey): key is EditorStepKey =>
  (EDITOR_STEP_KEYS as readonly StepKey[]).includes(key);
