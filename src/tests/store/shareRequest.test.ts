import { beforeEach, describe, expect, it, vi } from "vitest";
import useAppStore from "../../store/store";
import { compress, decompress } from "../../utils/compression/compression";
import * as latePayment from "../../samples/latePaymentPenalty";
import * as counter from "../../samples/counterLogic";

const initialState = useAppStore.getState();
const rebuild = vi.fn().mockResolvedValue(undefined);
const compileLogic = vi.fn().mockResolvedValue(undefined);

const resetRecipient = () => {
  useAppStore.setState({ ...initialState, rebuild, compileLogic }, true);
};

describe("shared simulation requests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resetRecipient();
  });

  it.each([
    { sample: latePayment, requestJson: JSON.stringify({ ...latePayment.REQUEST, invoiceValue: 2500 }, null, 2) },
    { sample: counter, requestJson: JSON.stringify({ ...counter.REQUEST, increment: 7 }, null, 2) },
  ])("restores the edited request for $sample.NAME in a fresh recipient", async ({ sample, requestJson }) => {
    useAppStore.setState({
      templateMarkdown: sample.TEMPLATE,
      modelCto: sample.MODEL,
      data: JSON.stringify(sample.DATA),
      logicTs: sample.LOGIC,
      requestJson,
    });

    const link = new URL(useAppStore.getState().generateShareableLink());
    const encoded = link.hash.slice("#data=".length);
    expect(decompress(encoded).requestJson).toBe(requestJson);

    resetRecipient();
    await useAppStore.getState().loadFromLink(encoded);

    expect(useAppStore.getState().requestJson).toBe(requestJson);
    expect(useAppStore.getState().logicTs).toBe(sample.LOGIC);
    expect(compileLogic).toHaveBeenCalledTimes(1);
  });

  it.each(["", '{ "invoiceValue":'])("preserves an unfinished request verbatim: %j", async (requestJson) => {
    useAppStore.setState({ logicTs: latePayment.LOGIC, requestJson });
    const link = new URL(useAppStore.getState().generateShareableLink());
    resetRecipient();

    await useAppStore.getState().loadFromLink(link.hash.slice("#data=".length));

    expect(useAppStore.getState().requestJson).toBe(requestJson);
  });

  it.each([
    { description: "text-only", logicTs: undefined },
    { description: "logic", logicTs: latePayment.LOGIC },
  ])("still loads older $description links without a request field", async ({ logicTs }) => {
    const requestBeforeLoading = useAppStore.getState().requestJson;
    const legacyLink = compress({
      templateMarkdown: latePayment.TEMPLATE,
      modelCto: latePayment.MODEL,
      data: JSON.stringify(latePayment.DATA),
      agreementHtml: "",
      ...(logicTs ? { logicTs } : {}),
    });

    await useAppStore.getState().loadFromLink(legacyLink);

    expect(useAppStore.getState().error).toBeUndefined();
    expect(useAppStore.getState().templateMarkdown).toBe(latePayment.TEMPLATE);
    expect(useAppStore.getState().requestJson).toBe(requestBeforeLoading);
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(compileLogic).toHaveBeenCalledTimes(logicTs ? 1 : 0);
  });

  it("ignores a non-string request field instead of putting it into the editor", async () => {
    const requestBeforeLoading = useAppStore.getState().requestJson;
    const link = compress({
      templateMarkdown: latePayment.TEMPLATE,
      modelCto: latePayment.MODEL,
      data: JSON.stringify(latePayment.DATA),
      agreementHtml: "",
      requestJson: { invoiceValue: 1000 },
    });

    await useAppStore.getState().loadFromLink(link);

    expect(useAppStore.getState().error).toBeUndefined();
    expect(useAppStore.getState().requestJson).toBe(requestBeforeLoading);
  });
});
