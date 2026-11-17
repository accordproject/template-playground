import { describe, it, expect, beforeEach, vi } from "vitest";
import { webMcpTools } from "../../mcp/tools";
import useAppStore from "../../store/store";

describe("webMcpTools", () => {
  beforeEach(() => {
    useAppStore.setState({
      templateMarkdown: "Hello {{name}}",
      modelCto: `namespace org.accordproject.test@1.0.0
@template
concept TestClause {
  o String name
}`,
      data: '{"name":"World"}',
      requestJson: '{"$class":"org.accordproject.test.Request"}',
      executionHistory: [],
      initContract: vi.fn().mockResolvedValue(undefined),
      triggerContract: vi.fn().mockImplementation(() => {
        useAppStore.setState((s) => ({
          executionHistory: [
            ...s.executionHistory,
            {
              id: "#1",
              method: "trigger",
              request: { $class: "org.accordproject.test.Request" },
              response: { result: "ok" },
              stateBefore: null,
              stateAfter: { status: "active" },
              events: [],
              error: null,
              stage: "run",
              durationMs: 5,
              executedAt: new Date().toISOString(),
            },
          ],
        }));
        return Promise.resolve();
      }),
    });
  });

  const findTool = (name: string) => {
    const tool = webMcpTools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return tool;
  };

  it("exports read tools with readOnlyHint annotation", () => {
    const readToolNames = ["get_template", "get_template_text", "get_model", "get_data"];
    for (const name of readToolNames) {
      const tool = findTool(name);
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.consequentialHint).toBeUndefined();
    }
  });

  it("exports write and simulation tools with consequentialHint annotation", () => {
    const writeToolNames = [
      "set_template",
      "set_template_text",
      "set_model",
      "set_data",
      "simulate_contract",
    ];
    for (const name of writeToolNames) {
      const tool = findTool(name);
      expect(tool.annotations?.consequentialHint).toBe(true);
      expect(tool.annotations?.readOnlyHint).toBeUndefined();
    }
  });

  it("reads template markdown using get_template and get_template_text", async () => {
    const getTemplate = findTool("get_template");
    const getTemplateText = findTool("get_template_text");

    const result1 = await getTemplate.execute({});
    const result2 = await getTemplateText.execute({});

    expect(result1.content[0].text).toBe("Hello {{name}}");
    expect(result2.content[0].text).toBe("Hello {{name}}");
  });

  it("reads model CTO using get_model", async () => {
    const getModel = findTool("get_model");
    const result = await getModel.execute({});
    expect(result.content[0].text).toContain("namespace org.accordproject.test@1.0.0");
  });

  it("reads contract data using get_data", async () => {
    const getData = findTool("get_data");
    const result = await getData.execute({});
    expect(result.content[0].text).toBe('{"name":"World"}');
  });

  it("writes valid template markdown with set_template and set_template_text", async () => {
    const setTemplate = findTool("set_template");
    const result = await setTemplate.execute({ text: "Updated {{title}}" });
    expect(result.content[0].text).toBe("Template panel updated.");
    expect(useAppStore.getState().templateMarkdown).toBe("Updated {{title}}");

    const setTemplateText = findTool("set_template_text");
    const result2 = await setTemplateText.execute({ text: "Another {{title}}" });
    expect(result2.content[0].text).toBe("Template panel updated.");
    expect(useAppStore.getState().templateMarkdown).toBe("Another {{title}}");
  });

  it("rejects empty or missing text in set_template", async () => {
    const setTemplate = findTool("set_template");
    const result = await setTemplate.execute({ text: "   " });
    expect(result.content[0].text).toContain("Rejected");
    expect(result.content[0].text).toContain("non-empty string");

    const resultMissing = await setTemplate.execute({});
    expect(resultMissing.content[0].text).toContain("Rejected");
  });

  it("writes valid model CTO with set_model", async () => {
    const setModel = findTool("set_model");
    const newCto = `namespace org.accordproject.updated@1.0.0
@template
concept UpdatedClause {
  o String updated
}`;
    const result = await setModel.execute({ cto: newCto });
    expect(result.content[0].text).toBe("model.cto updated.");
    expect(useAppStore.getState().modelCto).toBe(newCto);
  });

  it("rejects invalid CTO without @template decorator in set_model", async () => {
    const setModel = findTool("set_model");
    const invalidCto = `namespace org.accordproject.updated@1.0.0
concept NoTemplateClause {
  o String updated
}`;
    const result = await setModel.execute({ cto: invalidCto });
    expect(result.content[0].text).toContain("Rejected: invalid Concerto model");
    expect(result.content[0].text).toContain("@template");
    // Ensure store was not modified
    expect(useAppStore.getState().modelCto).not.toBe(invalidCto);
  });

  it("writes valid JSON with set_data", async () => {
    const setData = findTool("set_data");
    const result = await setData.execute({ data: '{"updated":true}' });
    expect(result.content[0].text).toBe("data.json updated.");
    expect(useAppStore.getState().data).toBe('{"updated":true}');
  });

  it("rejects malformed JSON in set_data", async () => {
    const setData = findTool("set_data");
    const result = await setData.execute({ data: '{ not json }' });
    expect(result.content[0].text).toContain("Rejected: invalid JSON");
  });

  it("executes simulate_contract and returns execution results", async () => {
    const simulate = findTool("simulate_contract");
    const result = await simulate.execute({ request: '{"$class":"org.accordproject.test.Request","amount":100}' });

    expect(useAppStore.getState().initContract).toHaveBeenCalled();
    expect(useAppStore.getState().triggerContract).toHaveBeenCalled();

    const output = JSON.parse(result.content[0].text) as {
      method: string;
      response: { result: string };
      state: { status: string };
    };
    expect(output.method).toBe("trigger");
    expect(output.response.result).toBe("ok");
    expect(output.state.status).toBe("active");
  });

  it("rejects invalid request JSON in simulate_contract", async () => {
    const simulate = findTool("simulate_contract");
    const result = await simulate.execute({ request: "{ invalid json }" });
    expect(result.content[0].text).toContain("Rejected: invalid JSON request");
  });
});
