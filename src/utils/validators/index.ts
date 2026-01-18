import { ModelManager } from "@accordproject/concerto-core";

/**
 * Validates template inputs before running expensive rebuild operations.
 * Uses official library validators to ensure zero false positives/negatives.
 * Only validates what can be checked without external dependencies.
 * 
 * @param template - Template markdown string (not validated - would require external models)
 * @param model - CTO model string
 * @param data - JSON data string
 * @throws Error with specific validation message if any input is invalid
 */
export async function validateBeforeRebuild(
  _template: string,
  model: string,
  data: string
): Promise<void> {
  // 1. Validate JSON (fastest check)
  try {
    JSON.parse(data);
  } catch (error) {
    throw new Error(`Invalid JSON data: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2. Validate CTO model syntax using ModelManager
  // This checks syntax but doesn't load external models (which would require network calls)
  try {
    const modelManager = new ModelManager({ strict: true });
    modelManager.addCTOModel(model, undefined, true);
    // Note: We skip updateExternalModels() to avoid expensive network calls
    // We also skip template validation since it may require external models
  } catch (error) {
    throw new Error(`Invalid CTO model: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Note: Template validation is skipped here because it requires external models
  // to be loaded, which would require network calls. The full rebuild will
  // validate the template after loading external models.
}
