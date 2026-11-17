import type { WebMcpToolDescriptor, WebMcpToolResult } from "./modelcontext";
import useAppStore from "../store/store";
import { validateConcertoModel, validateJson } from "./guardrails";

/**
 * In-page WebMCP panel tools for smart legal contract authoring and simulation.
 * Read tools are marked with readOnlyHint: true.
 * State-modifying and simulation tools are marked with consequentialHint: true.
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
    name: "get_template",
    description: "Returns the current TemplateMark markdown source from the Template panel.",
    inputSchema: NO_ARGS,
    annotations: {
      readOnlyHint: true,
    },
    execute() {
      return text(useAppStore.getState().templateMarkdown);
    },
  },
  {
    name: "get_template_text",
    description: "Alias for get_template. Returns the current TemplateMark source from the Template panel.",
    inputSchema: NO_ARGS,
    annotations: {
      readOnlyHint: true,
    },
    execute() {
      return text(useAppStore.getState().templateMarkdown);
    },
  },
  {
    name: "get_model",
    description: "Returns the current Concerto model (CTO) from the model.cto panel.",
    inputSchema: NO_ARGS,
    annotations: {
      readOnlyHint: true,
    },
    execute() {
      return text(useAppStore.getState().modelCto);
    },
  },
  {
    name: "get_data",
    description: "Returns the current JSON contract data from the data.json panel.",
    inputSchema: NO_ARGS,
    annotations: {
      readOnlyHint: true,
    },
    execute() {
      return text(useAppStore.getState().data);
    },
  },
  {
    name: "set_model",
    description:
      "Writes a Concerto model (CTO) to the model.cto panel. The root concept must be annotated with the @template decorator (`@template\\nconcept MyContract { ... }`). The model is validated before being committed; an invalid model is rejected and the panel remains unchanged.",
    inputSchema: stringArg(
      "cto",
      "The full Concerto model source: a versioned namespace declaration plus concept definitions with a @template decorator on the root concept."
    ),
    annotations: {
      consequentialHint: true,
    },
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
      "Writes JSON contract data to the data.json panel. The value must parse as JSON or it is rejected and the panel remains unchanged.",
    inputSchema: stringArg("data", "The full JSON data document as a string."),
    annotations: {
      consequentialHint: true,
    },
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
    name: "set_template",
    description:
      "Writes TemplateMark source to the Template panel. Must be a non-empty string.",
    inputSchema: stringArg("text", "The full TemplateMark source."),
    annotations: {
      consequentialHint: true,
    },
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
  {
    name: "set_template_text",
    description:
      "Alias for set_template. Writes TemplateMark source to the Template panel. Must be a non-empty string.",
    inputSchema: stringArg("text", "The full TemplateMark source."),
    annotations: {
      consequentialHint: true,
    },
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
  {
    name: "simulate_contract",
    description:
      "Simulates the contract logic against an optional JSON request. Initializes the contract if not yet initialized, dispatches triggerContract(), and returns the execution response, updated state, and emitted events.",
    inputSchema: {
      type: "object",
      properties: {
        request: {
          type: "string",
          description: "Optional JSON request string. If omitted, uses current requestJson in the editor.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      consequentialHint: true,
    },
    async execute(args) {
      const store = useAppStore.getState();
      const requestStr = readString(args, "request");
      if (requestStr !== null) {
        const error = validateJson(requestStr);
        if (error) return text(`Rejected: invalid JSON request — ${error}`);
        store.setRequestJson(requestStr);
      }

      try {
        if (store.executionHistory.length === 0) {
          await store.initContract();
        }
        await store.triggerContract();

        const latestHistory = useAppStore.getState().executionHistory;
        const lastRun = latestHistory[latestHistory.length - 1];
        if (!lastRun) {
          return text("Simulation completed with no execution output.");
        }
        if (lastRun.error) {
          return text(`Simulation failed (${lastRun.stage}): ${lastRun.error}`);
        }
        return text(
          JSON.stringify(
            {
              method: lastRun.method,
              response: lastRun.response,
              state: lastRun.stateAfter,
              events: lastRun.events,
            },
            null,
            2
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return text(`Simulation execution error: ${message}`);
      }
    },
  },
];
