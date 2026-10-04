import { ModelManager } from "@accordproject/concerto-core";
import { loadBundledModels } from "../utils/modelCache";

/**
 * Write-side guardrails for the WebMCP panel tools. They validate agent-supplied
 * content before it is committed to the store so a malformed schema or JSON
 * payload is rejected instead of corrupting a panel.
 */

/**
 * Validate a Concerto model (CTO) the same way the app validates before a
 * rebuild: parsed by ModelManager with the bundled Accord Project namespaces
 * preloaded and network access disabled, so unbundled imports fail here rather
 * than slipping through. Also enforces that the model declares a root concept
 * annotated with `@template`, as every Accord Project template requires.
 * Returns null when valid, else an error message.
 */
export function validateConcertoModel(cto: string): string | null {
  if (typeof cto !== "string" || cto.trim().length === 0) {
    return "model is empty";
  }
  try {
    const modelManager = new ModelManager({ offline: true });
    loadBundledModels(modelManager);
    const modelFile = modelManager.addCTOModel(cto, undefined, false); // false → run validation
    const declarations = modelFile.getAllDeclarations() as Array<{
      getDecorator(name: string): unknown;
    }>;
    const hasTemplateConcept = declarations.some(
      (declaration) => declaration.getDecorator("template") != null
    );
    if (!hasTemplateConcept) {
      return "the root concept must be annotated with a @template decorator";
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Returns null when the string parses as JSON, else an error message. */
export function validateJson(data: string): string | null {
  if (typeof data !== "string" || data.trim().length === 0) {
    return "data is empty";
  }
  try {
    JSON.parse(data);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
