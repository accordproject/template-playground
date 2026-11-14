import { ModelManager } from "@accordproject/concerto-core";
import { TemplateMarkInterpreter } from "@accordproject/template-engine";
import { TemplateMarkTransformer } from "@accordproject/markdown-template";
import { loadBundledModels } from "../utils/modelCache";
import type { SerializedRebuildError } from "../constants/rebuildSandbox";

/**
 * Renders a TemplateMark template against its model and data, producing a
 * CiceroMark document as plain JSON.
 *
 * This is the part of the rebuild that evaluates user-authored code: the
 * Template Engine compiles and runs `{{% ... %}}` formulas with
 * `new Function`. It must therefore only ever run inside the rendering
 * sandbox worker (`rebuild.worker.ts`), never on the main thread. The
 * conversion from CiceroMark to HTML runs no user code and stays in the
 * page (see `rebuild()` in `store.ts`).
 *
 * @param template - TemplateMark markdown source
 * @param model - Concerto CTO model source
 * @param dataString - JSON data, as a string
 * @returns the CiceroMark document as JSON
 * @throws whatever the transformer or engine throws
 */
export async function generateCiceroMark(
  template: string,
  model: string,
  dataString: string,
): Promise<unknown> {
  const modelManager = new ModelManager({ offline: true });
  /*
   * Preload the bundled Accord Project models so imports like
   * `https://models.accordproject.org/accordproject/contract@0.2.0.cto`
   * resolve from the bundle without a network round-trip. Combined with
   * offline:true, any namespace not in the bundle will fail validation
   * rather than triggering a network fetch.
   */
  loadBundledModels(modelManager);
  modelManager.addCTOModel(model, undefined, true);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const engine = new TemplateMarkInterpreter(modelManager as any, {});
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const templateMarkTransformer = new TemplateMarkTransformer();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const templateMarkDom = templateMarkTransformer.fromMarkdownTemplate(
    { content: template },
    modelManager,
    "contract",
    { verbose: false },
  ) as object;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = JSON.parse(dataString);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  const ciceroMark = await engine.generate(templateMarkDom, data);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return ciceroMark.toJSON() as unknown;
}

/**
 * Reduces an error thrown by the rendering pipeline to plain data that can
 * cross the `postMessage` boundary.
 *
 * Engine and Concerto errors are often class instances with non-cloneable
 * members, so they cannot be posted as-is. The shape produced here mirrors
 * exactly what `formatError()` in `store.ts` reads (`code`, `errors`,
 * `renderedMessage`, arrays and strings), so the Problems panel shows the
 * same text as it did when rendering ran in the page.
 */
export function serializeRebuildError(error: unknown): SerializedRebuildError {
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    return error.map((entry) => serializeRebuildError(entry));
  }
  if (error && typeof error === "object" && "code" in error) {
    const obj = error as {
      code?: unknown;
      errors?: unknown;
      renderedMessage?: unknown;
      message?: unknown;
    };
    return {
      code: toCloneable(obj.code),
      errors: obj.errors === undefined ? undefined : serializeRebuildError(obj.errors),
      renderedMessage: toCloneable(obj.renderedMessage),
      message: typeof obj.message === "string" ? obj.message : undefined,
    };
  }
  // `formatError` stringifies everything else, so do the same here.
  return String(error);
}

function toCloneable(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;
    default:
      return String(value);
  }
}
