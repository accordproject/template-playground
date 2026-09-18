import type { WebMcpToolDescriptor, WebMcpToolResult } from "./navigator-modelcontext";
import useAppStore from "../store/store";
import { validateConcertoModel, validateJson } from "./guardrails";

/**
 * Thin WebMCP panel primitives. Inference/orchestration happens in the calling
 * agent (e.g. Claude): it reads a panel, reasons over it, and writes another.
 * Write tools validate their input before committing so an invalid schema or
 * JSON payload is rejected and the panel is left unchanged.
 */

function text(message: string): WebMcpToolResult {
  return { content: [{ type: "text", text: message }] };
}

const NO_ARGS: Record<string, unknown> = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

function stringArg(key: string, description: string): Record<string, unknown> {
  return {
    type: "object",
    properties: { [key]: { type: "string", description } },
    required: [key],
    additionalProperties: false,
  };
}

function readString(args: Record<string, unknown>, key: string): string | null {
  const value = args[key];
  return typeof value === "string" ? value : null;
}

export const webMcpTools: WebMcpToolDescriptor[] = [
  {
    name: "get_template_text",
    description: "Returns the current TemplateMark source from the Template panel.",
    inputSchema: NO_ARGS,
    execute() {
      return text(useAppStore.getState().templateMarkdown);
    },
  },
  {
    name: "get_model",
    description: "Returns the current Concerto model (CTO) from the model.cto panel.",
    inputSchema: NO_ARGS,
    execute() {
      return text(useAppStore.getState().modelCto);
    },
  },
  {
    name: "get_data",
    description: "Returns the current JSON data from the data.json panel.",
    inputSchema: NO_ARGS,
    execute() {
      return text(useAppStore.getState().data);
    },
  },
  {
    name: "set_model",
    description:
      "Writes a Concerto model (CTO) to the model.cto panel. IMPORTANT: annotate the root concept with the @template decorator (place `@template` on the line directly above that concept) — a model without it is rejected. The model is validated by the Concerto ModelManager (with the bundled Accord Project namespaces) before it is committed; an invalid model is rejected and the panel is left unchanged.",
    inputSchema: stringArg(
      "cto",
      "The full Concerto model source: a versioned namespace declaration plus the concept definitions. The root concept MUST be preceded by a @template decorator, e.g. `@template\\nconcept MyContract { ... }`."
    ),
    async execute(args) {
      const cto = readString(args, "cto");
      if (cto === null) return text("Rejected: `cto` (string) is required.");
      const error = validateConcertoModel(cto);
      if (error) return text(`Rejected: invalid Concerto model — ${error}`);
      const store = useAppStore.getState();
      store.setEditorModelCto(cto);
      await store.setModelCto(cto);
      return text("model.cto updated.");
    },
  },
  {
    name: "set_data",
    description:
      "Writes JSON to the data.json panel. The value must parse as JSON or it is rejected and the panel is left unchanged.",
    inputSchema: stringArg("data", "The full JSON data document as a string."),
    async execute(args) {
      const data = readString(args, "data");
      if (data === null) return text("Rejected: `data` (string) is required.");
      const error = validateJson(data);
      if (error) return text(`Rejected: invalid JSON — ${error}`);
      const store = useAppStore.getState();
      store.setEditorAgreementData(data);
      await store.setData(data);
      return text("data.json updated.");
    },
  },
  {
    name: "set_template_text",
    description:
      "Writes TemplateMark source to the Template panel. Must be a non-empty string.",
    inputSchema: stringArg("text", "The full TemplateMark source."),
    async execute(args) {
      const value = readString(args, "text");
      if (value === null || value.trim().length === 0) {
        return text("Rejected: `text` (non-empty string) is required.");
      }
      const store = useAppStore.getState();
      store.setEditorValue(value);
      await store.setTemplateMarkdown(value);
      return text("Template panel updated.");
    },
  },
];
