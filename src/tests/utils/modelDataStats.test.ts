import { describe, it, expect } from 'vitest';
import { summarizeModel, summarizeData, splitError } from '../../utils/modelDataStats';
import { MODEL, DATA } from '../../samples/counterLogic';

describe('summarizeModel', () => {
  it('reads the namespace, the @template concept and its fields from the counter sample', () => {
    const summary = summarizeModel(MODEL);
    expect(summary.namespace).toBe('org.acme.counter@1.0.0');
    expect(summary.templateConcept).toBe('CounterContract');
    expect(summary.templateFields).toEqual([
      { name: 'owner', type: 'String', optional: false },
      { name: 'maxCount', type: 'Integer', optional: false },
    ]);
    // CounterContract, CounterRequest, CounterResponse, CounterUpdated, CounterState
    expect(summary.typeCount).toBe(5);
    expect(summary.fieldCount).toBe(10);
  });

  it('marks optional fields and handles arrays and relationships', () => {
    const summary = summarizeModel(`namespace test@1.0.0
@template
concept T {
  o String name
  o String[] tags optional
  --> Party signer
}
enum Kind { o A o B }`);
    expect(summary.templateFields).toEqual([
      { name: 'name', type: 'String', optional: false },
      { name: 'tags', type: 'String', optional: true },
      { name: 'signer', type: 'Party', optional: false },
    ]);
    expect(summary.typeCount).toBe(2);
  });

  it('reports nothing for an empty or template-less model', () => {
    expect(summarizeModel('')).toEqual({
      namespace: null,
      templateConcept: null,
      templateFields: [],
      typeCount: 0,
      fieldCount: 0,
    });
    const noTemplate = summarizeModel('namespace a@1.0.0\nconcept X {\n  o String y\n}');
    expect(noTemplate.namespace).toBe('a@1.0.0');
    expect(noTemplate.templateConcept).toBeNull();
    expect(noTemplate.templateFields).toEqual([]);
    expect(noTemplate.fieldCount).toBe(1);
  });
});

describe('summarizeData', () => {
  const fields = summarizeModel(MODEL).templateFields;

  it('counts the required fields the sample data provides', () => {
    expect(summarizeData(JSON.stringify(DATA), fields)).toEqual({ parses: true, required: 2, present: 2 });
  });

  it('counts missing and null fields as absent', () => {
    expect(summarizeData('{ "owner": "Alice" }', fields).present).toBe(1);
    expect(summarizeData('{ "owner": "Alice", "maxCount": null }', fields).present).toBe(1);
  });

  it('ignores optional fields in the required count', () => {
    const withOptional = [...fields, { name: 'note', type: 'String', optional: true }];
    expect(summarizeData(JSON.stringify(DATA), withOptional).required).toBe(2);
  });

  it('flags text that is not a JSON object', () => {
    expect(summarizeData('{ not json', fields)).toEqual({ parses: false, required: 2, present: 0 });
    expect(summarizeData('[1, 2]', fields).parses).toBe(false);
    expect(summarizeData('null', fields).parses).toBe(false);
  });
});

describe('splitError', () => {
  it('returns nothing when there is no error', () => {
    expect(splitError(undefined)).toEqual({});
    expect(splitError(null)).toEqual({});
    expect(splitError('')).toEqual({});
  });

  it('sends CTO syntax errors to the model pane', () => {
    expect(splitError('Invalid CTO model: Line 3 column 5')).toEqual({ model: 'Invalid CTO model: Line 3 column 5' });
    expect(splitError('c:Line 3 column 5 unexpected token')).toEqual({ model: 'c:Line 3 column 5 unexpected token' });
  });

  it('sends JSON and instance errors to the data pane', () => {
    expect(splitError('Invalid JSON data: Unexpected token')).toEqual({ data: 'Invalid JSON data: Unexpected token' });
    expect(splitError('Error: Instance is missing required field maxCount')).toEqual({
      data: 'Error: Instance is missing required field maxCount',
    });
  });
});
