import { useEffect, useRef } from "react";
import useAppStore, { currentTemplateGeneration } from "../../store/store";
import { pendingLogic } from "../../editors/logicSource";

/*
 * There is no compile button. The logic is compiled at two moments:
 *   - when the Logic step opens (useCompileOnArrival), so a template that
 *     ships logic shows both chips ticked and the bar full right away;
 *   - before Simulate opens (ensureLogicCompiles), from Next, Back or the stepper,
 *     so a compile error keeps the user on Logic with the error in view.
 * Both skip an empty editor (see pendingLogic).
 */

/** What would be compiled: the editor content, or null when no logic is written. */
export const usePendingLogic = (): string | null => {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  return pendingLogic(editorLogicTs);
};

type LogicState = Pick<
  ReturnType<typeof useAppStore.getState>,
  "logicTs" | "modelCto" | "compiledModelCto" | "compiledLogicJs" | "compilationErrors"
>;

/**
 * True when the pending source was never compiled, differs from what was
 * compiled last, or was compiled against a model.cto edited since (the
 * logic is type-checked against the model, so its result no longer holds).
 */
const isStale = (pending: string, s: LogicState) =>
  pending !== s.logicTs ||
  s.modelCto !== s.compiledModelCto ||
  (!s.compiledLogicJs && s.compilationErrors.length === 0);

/** Compiles the logic once when the step opens, if it is written and stale. */
export const useCompileOnArrival = () => {
  const pending = usePendingLogic();
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const compiledModelCto = useAppStore((s) => s.compiledModelCto);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const attempted = useRef(false);
  useEffect(() => {
    if (attempted.current) return;
    // A compile still running (started before leaving and coming back) may be
    // for sources edited since: wait for it, then check staleness.
    if (isCompiling) return;
    attempted.current = true;
    if (pending === null) return;
    if (isStale(pending, { logicTs, modelCto, compiledModelCto, compiledLogicJs, compilationErrors })) void setLogicTs(pending);
  }, [pending, logicTs, modelCto, compiledModelCto, compiledLogicJs, compilationErrors, isCompiling, setLogicTs]);
};

/** How many times ensureLogicCompiles compiles before giving up on sources that keep changing. */
const MAX_COMPILE_ATTEMPTS = 3;

/**
 * Compiles the logic (if written and stale) and says whether Simulate may
 * open (see LogicGateResult): "ok" when nothing is written or the logic
 * compiles, "failed" when it does not, "cancelled" when the template was
 * replaced meanwhile. Reads the store directly: it runs from a click
 * handler, not from render.
 * Staleness is checked again after each compile: an edit made while it ran
 * (to the logic or to model.cto) is compiled too, so Simulate never opens on
 * logic compiled from sources that have since changed.
 */
export const ensureLogicCompiles = (): Promise<LogicGateResult> => {
  // Concurrent moves (Next, then the stepper, while compiling) share one gate:
  // separate loops would keep superseding each other's compiles. A gate
  // started for a template that has since been replaced is not shared.
  const generation = currentTemplateGeneration();
  if (!inFlightGate || inFlightGate.generation !== generation) {
    const gate: InFlightGate = {
      generation,
      result: runLogicGate(generation).finally(() => {
        if (inFlightGate === gate) inFlightGate = null;
      }),
    };
    inFlightGate = gate;
  }
  return inFlightGate.result;
};

/**
 * "ok": Simulate may open (the logic compiles, or there is none); "failed":
 * it does not compile; "cancelled": the template was replaced while the gate
 * ran (a sample or shared link was loaded), so the move it guarded is void.
 */
export type LogicGateResult = "ok" | "failed" | "cancelled";

interface InFlightGate {
  generation: number;
  result: Promise<LogicGateResult>;
}
let inFlightGate: InFlightGate | null = null;

const verdict = (compiles: boolean): LogicGateResult => (compiles ? "ok" : "failed");

/**
 * Whether the last compile succeeded. compileLogic clears compiledLogicJs
 * before it runs and sets it only on success, so its presence is the test;
 * compilationErrors also collects execution errors from init/trigger, which
 * must not stop the move to Simulate.
 */
const compiledOk = (s: LogicState) => Boolean(s.compiledLogicJs);

const runLogicGate = async (generation: number): Promise<LogicGateResult> => {
  for (let attempt = 0; attempt < MAX_COMPILE_ATTEMPTS; attempt++) {
    const s = useAppStore.getState();
    const pending = pendingLogic(s.editorLogicTs);
    if (pending === null) return "ok";
    if (!isStale(pending, s)) return verdict(compiledOk(s));
    await s.setLogicTs(pending);
    // Edits within the same template are compiled again; a new template ends the gate.
    if (currentTemplateGeneration() !== generation) return "cancelled";
  }
  const s = useAppStore.getState();
  const pending = pendingLogic(s.editorLogicTs);
  if (pending === null) return "ok";
  return verdict(!isStale(pending, s) && compiledOk(s));
};
