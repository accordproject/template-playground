import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOGIC_BOILERPLATE,
  defaultRequestFromModel,
  describeLogicModel,
  needsDefaultRequest,
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

const RUNTIME_REQUEST = JSON.stringify({ $class: 'org.accordproject.runtime@0.2.0.Request' }, null, 2);

describe('defaultRequestFromModel', () => {
  it('uses the model’s request transaction, filling its required fields', () => {
    const request = JSON.parse(defaultRequestFromModel(describeLogicModel(latePayment.MODEL))) as {
      $class: string;
      forceMajeure: boolean;
      invoiceValue: number;
      agreedPayment: string;
    };

    expect(request.$class).toBe('org.acme.latepayment@1.0.0.LatePaymentRequest');
    expect(request.forceMajeure).toBe(false);
    expect(request.invoiceValue).toBe(0);
    expect(Number.isNaN(Date.parse(request.agreedPayment))).toBe(false);
  });

  it('leaves optional fields out and fills required arrays', () => {
    const model = describeLogicModel(`namespace org.acme.request@1.0.0

transaction TestRequest {
  o String[] tags
  o String note optional
}

transaction TestResponse {
  o String outcome
}`);

    expect(JSON.parse(defaultRequestFromModel(model))).toEqual({
      $class: 'org.acme.request@1.0.0.TestRequest',
      tags: [],
    });
  });

  it('builds required concepts, enums and scalars, as the maintainer asked', () => {
    const model = describeLogicModel(`namespace org.acme.payment@1.0.0

enum Status {
  o PENDING
  o PAID
}

scalar Percentage extends Double

concept MonetaryAmount {
  o Double amount
  o String currency
}

transaction PaymentRequest {
  o MonetaryAmount amount
  o Status status
  o Percentage rate
}

transaction PaymentResponse {
  o String outcome
}`);

    expect(JSON.parse(defaultRequestFromModel(model))).toEqual({
      $class: 'org.acme.payment@1.0.0.PaymentRequest',
      amount: { $class: 'org.acme.payment@1.0.0.MonetaryAmount', amount: 0, currency: '' },
      status: 'PENDING',
      rate: 0,
    });
  });

  it('stops at a concept that contains itself', () => {
    const model = describeLogicModel(`namespace org.acme.tree@1.0.0

concept Node {
  o String label
  o Node next
}

transaction TreeRequest {
  o Node root
}

transaction TreeResponse {
  o String outcome
}`);

    expect(JSON.parse(defaultRequestFromModel(model))).toEqual({
      $class: 'org.acme.tree@1.0.0.TreeRequest',
      root: { $class: 'org.acme.tree@1.0.0.Node', label: '' },
    });
  });

  it('is the runtime Request when the model declares none, as the boilerplate expects', () => {
    expect(defaultRequestFromModel(describeLogicModel(helloworld.MODEL))).toBe(RUNTIME_REQUEST);
    expect(defaultRequestFromModel(null)).toBe(RUNTIME_REQUEST);
  });
});

describe('needsDefaultRequest', () => {
  const model = describeLogicModel(latePayment.MODEL);

  it('replaces an empty request', () => {
    expect(needsDefaultRequest('', model)).toBe(true);
    expect(needsDefaultRequest('  \n', model)).toBe(true);
  });

  it('replaces JSON that is not a request', () => {
    expect(needsDefaultRequest('{ "increment": 1 }', model)).toBe(true);
    expect(needsDefaultRequest('{"$class":', model)).toBe(true);
    expect(needsDefaultRequest('null', model)).toBe(true);
  });

  it('replaces another model’s request', () => {
    expect(needsDefaultRequest(JSON.stringify(counter.REQUEST), model)).toBe(true);
  });

  it('keeps the model’s own request', () => {
    expect(needsDefaultRequest(JSON.stringify(latePayment.REQUEST), model)).toBe(false);
  });

  it('keeps the runtime Request only when the model declares no request of its own', () => {
    expect(needsDefaultRequest(RUNTIME_REQUEST, describeLogicModel(helloworld.MODEL))).toBe(false);
    expect(needsDefaultRequest(RUNTIME_REQUEST, model)).toBe(true);
    expect(needsDefaultRequest(RUNTIME_REQUEST, null)).toBe(false);
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
