import { Tour, Step } from "shepherd.js";

/**
 * Returns progress indicator HTML
 * Example: Step 2/15
 */
export function getProgress(tour: Tour): string {

  const step = tour.getCurrentStep();

  if (!step) return "";

  const current =
    tour.steps.findIndex(
      (s: Step) => s.id === step.id
    ) + 1;

  const total = tour.steps.length;

  return `
    <span class="tour-progress">
      Step ${current}/${total}
    </span>
  `;
}