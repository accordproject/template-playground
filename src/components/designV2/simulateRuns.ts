import type { LogicExecutionResult } from "../../store/store";
import { SIMULATE } from "./constants";

/*
 * Pure helpers that turn a LogicExecutionResult (src/store/store.ts) into the
 * one-line labels and counts the Simulate step and the footer show.
 * Kept free of React so they can be unit-tested.
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
