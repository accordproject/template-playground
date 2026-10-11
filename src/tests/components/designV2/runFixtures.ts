import type { LogicExecutionResult } from '../../../store/store';
import { DATA } from '../../../samples/latePaymentPenalty';

/**
 * Late Payment Penalty runs, as initContract / triggerContract would record
 * them. It is the gallery's logic template, so the v2 tests tell the same
 * story as the cards: a penalty per invoice, a running total in the state.
 */
const NS = 'org.acme.latepayment@1.0.0';
const base = {
  stateBefore: null,
  stage: 'run' as const,
  durationMs: 5,
  executedAt: '2026-09-13T10:00:00.000Z',
};
const openingState = { $class: `${NS}.LatePaymentState`, stateId: 'late-payment-state', count: 0, totalPenalty: 0, isTerminated: false };
const stateAfterOne = { ...openingState, count: 1, totalPenalty: 210 };

export const initRun: LogicExecutionResult = {
  ...base,
  id: 'init',
  method: 'init',
  request: DATA,
  response: { state: openingState, events: [] },
  stateAfter: openingState,
  events: [],
  error: null,
};

/** An invoice of 1000 paid four days late: two penalty periods of 10.5 % → 210. */
export const okRun: LogicExecutionResult = {
  ...base,
  id: '#1',
  method: 'trigger',
  request: { $class: `${NS}.LatePaymentRequest`, forceMajeure: false, agreedPayment: '2026-07-01T00:00:00.000Z', invoiceValue: 1000 },
  response: { $class: `${NS}.LatePaymentResponse`, penalty: 210, sellerMayTerminate: false },
  stateBefore: openingState,
  stateAfter: stateAfterOne,
  events: [{ $class: `${NS}.LatePaymentEvent`, penaltyCalculated: true, contractTerminated: false }],
  error: null,
};

/** The template data lost its penaltyDuration, so trigger() threw; the state is untouched. */
export const failedRun: LogicExecutionResult = {
  ...base,
  id: '#2',
  method: 'trigger',
  request: { $class: `${NS}.LatePaymentRequest`, forceMajeure: false, agreedPayment: '2026-07-01T00:00:00.000Z', invoiceValue: 2500 },
  response: null,
  stateBefore: stateAfterOne,
  stateAfter: stateAfterOne,
  events: [],
  error: "TypeError: Cannot read properties of undefined (reading 'amount')",
};

/** The request text was not JSON, so nothing reached trigger(). */
export const parseFailedRun: LogicExecutionResult = {
  ...base,
  id: '#3',
  method: 'trigger',
  stage: 'parse',
  request: {},
  response: null,
  stateBefore: stateAfterOne,
  stateAfter: stateAfterOne,
  events: [],
  error: 'SyntaxError: Unexpected non-whitespace character after JSON at position 70',
};
