import type { LogicExecutionResult } from '../../../store/store';

/** Counter Contract runs as initContract / triggerContract would record them. */
const base = {
  stateBefore: null,
  stage: 'run' as const,
  durationMs: 5,
  executedAt: '2026-09-13T10:00:00.000Z',
};

export const initRun: LogicExecutionResult = {
  ...base,
  id: 'init',
  method: 'init',
  request: { $class: 'org.acme.counter@1.0.0.CounterContract', owner: 'Alice', maxCount: 10 },
  response: { state: { count: 0 }, events: [] },
  stateAfter: { $class: 'org.acme.counter@1.0.0.CounterState', stateId: 'counter-state', count: 0, owner: 'Alice' },
  events: [],
  error: null,
};

export const okRun: LogicExecutionResult = {
  ...base,
  id: '#1',
  method: 'trigger',
  request: { $class: 'org.acme.counter@1.0.0.CounterRequest', increment: 2 },
  response: { $class: 'org.acme.counter@1.0.0.CounterResponse', message: "Alice's count is now 2 (of 10)", newCount: 2 },
  stateBefore: { count: 0, owner: 'Alice' },
  stateAfter: { $class: 'org.acme.counter@1.0.0.CounterState', count: 2, owner: 'Alice' },
  events: [{ $class: 'org.acme.counter@1.0.0.CounterUpdated', previousCount: 0, nextCount: 2 }],
  error: null,
};

export const failedRun: LogicExecutionResult = {
  ...base,
  id: '#2',
  method: 'trigger',
  request: { $class: 'org.acme.counter@1.0.0.CounterRequest', increment: 9 },
  response: null,
  stateBefore: { count: 2, owner: 'Alice' },
  stateAfter: { count: 2, owner: 'Alice' },
  events: [],
  error: 'Error: Count 11 exceeds the maximum of 10 for Alice',
};

/** The request text was not JSON, so nothing reached trigger(). */
export const parseFailedRun: LogicExecutionResult = {
  ...base,
  id: '#3',
  method: 'trigger',
  stage: 'parse',
  request: {},
  response: null,
  stateBefore: { count: 2, owner: 'Alice' },
  stateAfter: { count: 2, owner: 'Alice' },
  events: [],
  error: 'SyntaxError: Unexpected non-whitespace character after JSON at position 70',
};
