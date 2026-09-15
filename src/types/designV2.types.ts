/**
 * Views of the step-based onboarding flow (work in progress).
 *
 * welcome   → hero landing
 * template  → "Choose a template type" gallery
 * text      → text.md in the TemplateMark editor, with the help rail
 * modelData → split screen: model.cto on the left, data.json on the right
 * logic     → logic.ts in the TypeScript editor, compiled via the footer
 * simulate  → runs list + request/response
 * deploy    → placeholder — contents TBD
 *
 * Text comes before Model & Data: a template can be text only, and the model,
 * logic and simulator are optional additions on top of it.
 *
 * STEPS is the single source of truth for step order. Everything else
 * (ids, keys, first/last step, editor steps) is derived from it so that
 * reordering or adding a step never requires touching a component.
 */
export const STEPS = [
  { id: 1, key: "template", icon: "1", label: "Template", meta: "pick a starting point" },
  { id: 2, key: "text", icon: "2", label: "Text", meta: "text.md" },
  { id: 3, key: "modelData", icon: "3", label: "Model & Data", meta: "model.cto · data.json" },
  { id: 4, key: "logic", icon: "4", label: "Logic", meta: "logic.ts" },
  { id: 5, key: "simulate", icon: "5", label: "Simulate", meta: "run requests" },
  { id: 6, key: "deploy", icon: "6", label: "Deploy", meta: "publish & share" },
] as const;

export type StepDefinition = (typeof STEPS)[number];
export type StepId = StepDefinition["id"];
export type StepKey = StepDefinition["key"];
export type DesignV2View = "welcome" | StepId;

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

/** Number of steps a user walks through after picking a template. Every template ships logic, so it is the same for all. */
export const STEPS_AFTER_TEMPLATE = STEPS.filter((step) => step.key !== "template").length;
