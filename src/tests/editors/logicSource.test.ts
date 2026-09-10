import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOGIC_BOILERPLATE,
  describeLogicModel,
  scaffoldFromModel,
  nextLogicSource,
} from '../../editors/logicSource';
import * as counter from '../../samples/counterLogic';
import * as latePayment from '../../samples/latePaymentPenalty';
import * as employment from '../../samples/employmentOffer';

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
    const model = describeLogicModel(employment.MODEL);
    expect(model?.template?.name).toBe('EmploymentOffer');
    expect(model?.request).toBeUndefined();
    expect(model?.response).toBeUndefined();
  });

  it('is null for an empty or unparsable model', () => {
    expect(describeLogicModel('')).toBeNull();
    expect(describeLogicModel('namespace {')).toBeNull();
  });
});

describe('scaffoldFromModel', () => {
  it('builds init() and trigger() with the model’s $class names and required fields', () => {
    const src = scaffoldFromModel(describeLogicModel(counter.MODEL));
    expect(src).toContain("import type { ICounterContract, ICounterRequest } from './org.acme.counter@1.0.0';");
    expect(src).toContain('class ContractLogic extends TemplateLogic<any>');
    expect(src).toContain('async init(data: ICounterContract)');
    expect(src).toContain("$class: 'org.acme.counter@1.0.0.CounterState'");
    expect(src).toContain("stateId: 'contract-state'");
    expect(src).toContain('count: 0,');
    expect(src).toContain("owner: '',");
    expect(src).toContain('async trigger(data: ICounterContract, request: ICounterRequest, state: any)');
    expect(src).toContain("$class: 'org.acme.counter@1.0.0.CounterResponse'");
    expect(src).toContain('$timestamp: new Date(),');
    expect(src).toContain("message: '',");
    expect(src).toContain('newCount: 0,');
    expect(src).toContain('export default ContractLogic;');
  });

  it('marks non-primitive fields with their type', () => {
    const src = scaffoldFromModel(describeLogicModel(latePayment.MODEL));
    expect(src).toContain('penalty: 0,');
    expect(src).toContain('sellerMayTerminate: false,');
  });

  it('falls back to the generic boilerplate without request/response', () => {
    expect(scaffoldFromModel(describeLogicModel(employment.MODEL))).toBe(DEFAULT_LOGIC_BOILERPLATE);
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
