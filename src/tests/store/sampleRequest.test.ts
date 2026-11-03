import { describe, it, expect, beforeEach } from "vitest";
import useAppStore from "../../store/store";

describe("store sample request derivation", () => {
  beforeEach(() => {
    // Reset state before each test
    useAppStore.setState({
      requestJson: "",
      sampleName: "",
    });
  });

  it("does not leak CounterRequest into Blank template", async () => {
    await useAppStore.getState().loadSample("Blank template");
    const { requestJson } = useAppStore.getState();
    expect(requestJson).toBe("");
    expect(requestJson).not.toContain("CounterRequest");
  });

  it("does not leak CounterRequest into Consulting Agreement", async () => {
    await useAppStore.getState().loadSample("Consulting Agreement");
    const { requestJson } = useAppStore.getState();
    expect(requestJson).toBe("");
    expect(requestJson).not.toContain("CounterRequest");
  });

  it("loads sample REQUEST when declared in sample", async () => {
    await useAppStore.getState().loadSample("Counter Contract (with Logic)");
    const { requestJson } = useAppStore.getState();
    expect(requestJson).toContain("org.acme.counter@1.0.0.CounterRequest");
    expect(requestJson).toContain('"increment": 2');
  });

  it("scaffolds request from model if model defines a request transaction without sample.REQUEST", async () => {
    const customSample = {
      NAME: "Custom Sample",
      TEMPLATE: "# Custom",
      DATA: {},
      MODEL: `namespace org.custom@1.0.0
transaction CustomRequest {
  o String note
  o Integer count
}
concept CustomConcept {}
`,
    };

    useAppStore.setState({ samples: [...useAppStore.getState().samples, customSample as any] });
    await useAppStore.getState().loadSample("Custom Sample");
    const { requestJson } = useAppStore.getState();
    const parsed = JSON.parse(requestJson);
    expect(parsed.$class).toBe("org.custom@1.0.0.CustomRequest");
    expect(parsed.note).toBe("");
    expect(parsed.count).toBe(0);
  });
});
