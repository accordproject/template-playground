import { ModelManager } from "@accordproject/concerto-core";
import { loadBundledModels } from "../modelCache";

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

  // 2. Validate CTO model syntax using ModelManager. The bundled Accord
  // Project models are preloaded so imports targeting them resolve without
  // any network call.
  try {
    const modelManager = new ModelManager({ strict: true });
    loadBundledModels(modelManager);
    modelManager.addCTOModel(model, undefined, true);
  } catch (error) {
    throw new Error(`Invalid CTO model: ${error instanceof Error ? error.message : String(error)}`);
  }
}
