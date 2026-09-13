import type { LogicExecutionResult } from "../../store/store";
import { SIMULATE } from "./constants";

/*
 * Pure helpers that turn a LogicExecutionResult (src/store/store.ts) into the
 * one-line labels the Simulate step shows: run summary, state after, events.
 * Kept free of React so they can be unit-tested and reused by the footer.
 */

type Scalar = string | number | boolean;

/** Pretty-printed JSON for the request / response panes. */
export const pretty = (value: unknown): string => JSON.stringify(value, null, 2) ?? "";

/** Scalar fields of an object, skipping Concerto metadata such as $class and $timestamp. */
const scalarFields = (value: object | null): Array<[string, Scalar]> =>
  Object.entries(value ?? {}).filter(
    (entry): entry is [string, Scalar] =>
      !entry[0].startsWith("$") &&
      (typeof entry[1] === "string" || typeof entry[1] === "number" || typeof entry[1] === "boolean")
  );

/** "count 3 · owner Alice" — a compact, generic description of any payload. */
export const describeFields = (value: object | null): string =>
  scalarFields(value)
    .map(([key, val]) => `${key} ${String(val)}`)
    .join(" · ");

/** "org.acme.counter@1.0.0.CounterUpdated" → "CounterUpdated". */
const shortClassName = (value: object): string => {
  const cls = (value as { $class?: unknown }).$class;
  return typeof cls === "string" ? cls.split(".").pop() ?? cls : "event";
};

/** One line for the runs list: what was sent and what came back. */
export const runSummary = (run: LogicExecutionResult): string => {
  if (run.method === "init") {
    return run.error ? SIMULATE.summary.initFailed : SIMULATE.summary.init;
  }
  if (run.stage === "parse") return `${run.id} — ${SIMULATE.summary.invalidRequest}`;
  const sent = describeFields(run.request) || run.id;
  if (run.error) return `${sent} — ${SIMULATE.summary.triggerFailed}`;
  const message = (run.response as { message?: unknown } | null)?.message;
  return typeof message === "string" ? `${sent} → "${message}"` : `${sent} → ok`;
};

/** "count 3 · owner Alice", with "(unchanged)" appended when the run failed. */
export const runStateSummary = (run: LogicExecutionResult): string => {
  const text = describeFields(run.stateAfter);
  if (!text) return "—";
  return run.error ? `${text} ${SIMULATE.summary.unchanged}` : text;
};

/** "1 · CounterUpdated" or "none". */
export const runEventsSummary = (run: LogicExecutionResult): string => {
  if (run.events.length === 0) return SIMULATE.eventsNone;
  return `${run.events.length} · ${shortClassName(run.events[run.events.length - 1])}`;
};

export interface RunStats {
  runs: number;
  ok: number;
  failed: number;
  /** Id of the most recent failed run, if any. */
  lastFailedId: string | null;
}

export const runStats = (history: readonly LogicExecutionResult[]): RunStats => {
  const failed = history.filter((run) => run.error !== null);
  return {
    runs: history.length,
    ok: history.length - failed.length,
    failed: failed.length,
    lastFailedId: failed.length ? failed[failed.length - 1].id : null,
  };
};
