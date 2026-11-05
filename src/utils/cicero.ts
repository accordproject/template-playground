/**
 * cicero-core facts the importer and the template library share: which
 * Cicero version this playground runs, and which template version ranges
 * that Cicero accepts. cicero-core is loaded on first use.
 */

const loadCicero = () => import("@accordproject/cicero-core");

/** The Cicero version this playground runs (cicero-core's own). */
export const ciceroVersion = async (): Promise<string> => (await loadCicero()).version as string;

/**
 * Whether this playground's Cicero accepts templates that target `range`,
 * by Cicero's own rule: the range is satisfied, or falls in Cicero's
 * compatibility window (2.0.0 up to this release). The same rule
 * Template.fromArchive enforces, applied through the public
 * TemplateLibrary.filterTemplateIndexCiceroVersion.
 */
export const ciceroAccepts = async (range: unknown): Promise<boolean> => {
  if (typeof range !== "string" || !range) return false;
  const { TemplateLibrary } = await loadCicero();
  const kept = TemplateLibrary.filterTemplateIndexCiceroVersion({ template: { ciceroVersion: range } }, await ciceroVersion()) as object;
  return Object.keys(kept).length === 1;
};
