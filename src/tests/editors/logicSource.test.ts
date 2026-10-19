import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOGIC_BOILERPLATE,
  describeLogicModel,
  scaffoldFromModel,
  nextLogicSource,
  pendingLogic,
} from '../../editors/logicSource';
import * as counter from '../../samples/counterLogic';
import * as latePayment from '../../samples/latePaymentPenalty';
import * as employment from '../../samples/employmentOffer';
import * as helloworld from '../../samples/helloworld';
import * as perishable from '../../samples/perishableGoods';

describe('describeLogicModel', () => {
  it('finds the template concept, request/response transactions and state asset', () => {
    const model = describeLogicModel(counter.MODEL);
    expect(model?.namespace).toBe('org.acme.counter@1.0.0');
    expect(model?.template?.name).toBe('CounterContract');
    expect(model?.request?.fqn).toBe('org.acme.counter@1.0.0.CounterRequest');
    expect(model?.response?.fqn).toBe('org.acme.counter@1.0.0.CounterResponse');
    expect(model?.state?.name).toBe('CounterState');
    expect(model?.state?.identifier).toBe('stateId');
    // System properties ($timestamp, $identifier) are not listed as fields.
    expect(model?.response?.fields.map((f) => f.name)).toEqual(['message', 'newCount']);
    expect(model?.state?.fields.map((f) => f.name)).toEqual(['stateId', 'count', 'owner']);
  });

  it('parses a model with unresolved imports (syntax only)', () => {
    const model = describeLogicModel(latePayment.MODEL);
    expect(model?.request?.name).toBe('LatePaymentRequest');
    expect(model?.response?.name).toBe('LatePaymentResponse');
  });

  it('reports no request/response for a model without transactions', () => {
    const model = describeLogicModel(helloworld.MODEL);
    expect(model?.template?.name).toBe('HelloWorld');
    expect(model?.request).toBeUndefined();
    expect(model?.response).toBeUndefined();
  });

  it('finds the request/response the gallery samples now declare', () => {
    const offer = describeLogicModel(employment.MODEL);
    expect(offer?.request?.name).toBe('AcceptanceRequest');
    expect(offer?.response?.name).toBe('AcceptanceResponse');
    expect(offer?.state?.name).toBe('OfferState');
  });

  it('reads types that extend the engine runtime types, and an @template asset', () => {
    const model = describeLogicModel(perishable.MODEL);
    expect(model?.template?.name).toBe('TemplateModel');
    expect(model?.request?.name).toBe('ShipmentReceived');
    expect(model?.response?.name).toBe('PriceCalculation');
    expect(model?.state?.name).toBe('PerishableGoodsState');
    // Own fields only: the runtime supertypes are imported, so not resolved.
    expect(model?.state?.fields.map((f) => f.name)).toEqual(['payoutMade', 'totalPaid']);
  });

  it('is null for an empty or unparsable model', () => {
    expect(describeLogicModel('')).toBeNull();
    expect(describeLogicModel('namespace {')).toBeNull();
  });
});

describe('scaffoldFromModel', () => {
  it('builds init() and trigger() with the model’s $class names and required fields', () => {
    const src = scaffoldFromModel(describeLogicModel(counter.MODEL));
    expect(src).toContain("import type { ICounterContract, ICounterRequest } from './generated/org.acme.counter@1.0.0';");
    expect(src).toContain('class ContractLogic extends TemplateLogic<any>');
    expect(src).toContain('async init(data: ICounterContract)');
    expect(src).toContain("$class: 'org.acme.counter@1.0.0.CounterState'");
    expect(src).toContain("stateId: 'contract-state'");
    expect(src).toContain('count: 0,');
    expect(src).toContain("owner: '',");
    expect(src).toContain('async trigger(data: ICounterContract, request: ICounterRequest, state: any)');
    expect(src).toContain("$class: 'org.acme.counter@1.0.0.CounterResponse'");
    expect(src).toContain('$timestamp: new Date().toISOString(),');
    expect(src).toContain("message: '',");
    expect(src).toContain('newCount: 0,');
    expect(src).toContain('export default ContractLogic;');
  });

  it('marks non-primitive fields with their type', () => {
    const src = scaffoldFromModel(describeLogicModel(latePayment.MODEL));
    expect(src).toContain('penalty: 0,');
    expect(src).toContain('sellerMayTerminate: false,');
  });

  it('gives the state the runtime State $class when the model declares no state asset', () => {
    expect(DEFAULT_LOGIC_BOILERPLATE).toContain("$class: 'org.accordproject.runtime@0.2.0.State'");
    expect(DEFAULT_LOGIC_BOILERPLATE).toContain('$timestamp: new Date().toISOString(),');
  });

  it('falls back to the generic boilerplate without request/response', () => {
    expect(scaffoldFromModel(describeLogicModel(helloworld.MODEL))).toBe(DEFAULT_LOGIC_BOILERPLATE);
    expect(scaffoldFromModel(null)).toBe(DEFAULT_LOGIC_BOILERPLATE);
  });
});

describe('nextLogicSource', () => {
  it('keeps the editor content when there is any', () => {
    expect(nextLogicSource('class X {}', '', counter.MODEL)).toBe('class X {}');
  });

  it('uses the model skeleton, or the boilerplate, when both editor and committed logic are empty', () => {
    expect(nextLogicSource('', '', counter.MODEL)).toBe(scaffoldFromModel(describeLogicModel(counter.MODEL)));
    expect(nextLogicSource('  ', '', '')).toBe(DEFAULT_LOGIC_BOILERPLATE);
  });
});

describe('pendingLogic', () => {
  it('is the editor content when something is written, the skeleton included', () => {
    const skeleton = scaffoldFromModel(describeLogicModel(counter.MODEL));
    expect(pendingLogic('class X {}')).toBe('class X {}');
    expect(pendingLogic(counter.LOGIC)).toBe(counter.LOGIC);
    expect(pendingLogic(skeleton)).toBe(skeleton);
  });

  it('is null for an empty editor', () => {
    expect(pendingLogic('')).toBeNull();
    expect(pendingLogic('  \n')).toBeNull();
  });
});
