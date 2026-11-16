import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAppStore from '../../store/store';
import * as helloworld from '../../samples/helloworld';
import * as latePayment from '../../samples/latePaymentPenalty';

const RUNTIME_REQUEST = 'org.accordproject.runtime@0.2.0.Request';
const requestClass = (json: string) => (JSON.parse(json) as { $class?: string }).$class;

/*
 * Every template starts with a request Simulate can send: the model's own
 * request transaction, or the runtime Request when it declares none. The
 * Counter request a sample without one used to get did not belong to its
 * model, so Send failed until the user replaced it (#1043, #1121).
 */
describe('the request Simulate starts with', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ rebuild: vi.fn().mockResolvedValue(undefined) });
  });

  it('matches the startup template, whose model declares no request', () => {
    expect(requestClass(useAppStore.getState().requestJson)).toBe(RUNTIME_REQUEST);
  });

  it('matches a sample that ships no request', async () => {
    await useAppStore.getState().loadSample(helloworld.NAME);

    expect(requestClass(useAppStore.getState().requestJson)).toBe(RUNTIME_REQUEST);
  });

  it('keeps the request a sample ships', async () => {
    await useAppStore.getState().loadSample(latePayment.NAME);

    expect(useAppStore.getState().requestJson).toBe(JSON.stringify(latePayment.REQUEST, null, 2));
  });

  it('gives an imported template without a request one for its own model', async () => {
    await useAppStore.getState().loadImportedTemplate({
      name: 'Imported Hello',
      templateMarkdown: 'Hi {{name}}',
      modelCto: helloworld.MODEL,
      data: '{"name":"Ana"}',
    });

    expect(requestClass(useAppStore.getState().requestJson)).toBe(RUNTIME_REQUEST);
  });

  it("keeps an imported template's own request", async () => {
    const requestJson = JSON.stringify(latePayment.REQUEST, null, 2);
    await useAppStore.getState().loadImportedTemplate({
      name: 'Imported Late Payment',
      templateMarkdown: 'Late payment',
      modelCto: latePayment.MODEL,
      data: '{}',
      requestJson,
    });

    expect(useAppStore.getState().requestJson).toBe(requestJson);
  });

  it("replaces an imported template's request when it belongs to another model", async () => {
    await useAppStore.getState().loadImportedTemplate({
      name: 'Imported Hello',
      templateMarkdown: 'Hi {{name}}',
      modelCto: helloworld.MODEL,
      data: '{"name":"Ana"}',
      requestJson: '{"$class":"org.acme.counter@1.0.0.CounterRequest","increment":1}',
    });

    expect(requestClass(useAppStore.getState().requestJson)).toBe(RUNTIME_REQUEST);
  });

  it("replaces an imported template's runtime Request when its model declares a request", async () => {
    await useAppStore.getState().loadImportedTemplate({
      name: 'Imported Late Payment',
      templateMarkdown: 'Late payment',
      modelCto: latePayment.MODEL,
      data: '{}',
      requestJson: JSON.stringify({ $class: RUNTIME_REQUEST }, null, 2),
    });

    expect(requestClass(useAppStore.getState().requestJson)).toBe(latePayment.REQUEST.$class);
  });
});
