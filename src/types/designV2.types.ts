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

/**
 * Build a lookup from STEPS, failing fast on duplicate keys so a mistake in
 * the step list surfaces at module load instead of hiding behind a cast.
 */
function stepLookup<K extends PropertyKey, V>(
  pick: (step: StepDefinition) => readonly [K, V]
): Record<K, V> {
  const lookup: Partial<Record<K, V>> = {};
  for (const step of STEPS) {
    const [key, value] = pick(step);
    if (key in lookup) throw new Error(`Duplicate step ${String(key)} in STEPS`);
    lookup[key] = value;
  }
  return lookup as Record<K, V>;
}

/** Lookup tables derived from STEPS: key → id and id → key. */
export const STEP_ID = stepLookup((s) => [s.key, s.id] as const);
export const STEP_KEY = stepLookup((s) => [s.id, s.key] as const);

export const FIRST_STEP: StepId = STEPS[0].id;
export const LAST_STEP: StepId = STEPS[STEPS.length - 1].id;

export const isEditorStep = (key: StepKey): key is EditorStepKey =>
  (EDITOR_STEP_KEYS as readonly StepKey[]).includes(key);

/** Steps that only make sense when the template includes logic. */
export const LOGIC_ONLY_STEP_KEYS = ["logic", "simulate"] as const satisfies readonly StepKey[];

/**
 * Number of steps a user walks through after picking a template.
 * Without logic the logic-only steps are skipped, so a plain text + model
 * template has fewer steps than one with rules.
 */
export const countStepsAfterTemplate = (includeLogic: boolean): number =>
  STEPS.filter(
    (step) =>
      step.key !== "template" &&
      (includeLogic || !(LOGIC_ONLY_STEP_KEYS as readonly StepKey[]).includes(step.key))
  ).length;
