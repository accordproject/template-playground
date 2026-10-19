import { useEffect, useRef } from "react";
import useAppStore from "../../store/store";
import { pendingLogic } from "../../editors/logicSource";

/*
 * There is no compile button. The logic is compiled at two moments:
 *   - when the Logic step opens (useCompileOnArrival), so a template that
 *     ships logic shows both chips ticked and the bar full right away;
 *   - before Simulate opens (ensureLogicCompiles), from Next or the stepper,
 *     so a compile error keeps the user on Logic with the error in view.
 * Both skip an empty editor and the untouched skeleton (see pendingLogic).
 */

/** What would be compiled: the editor content, or null when no logic is written. */
export const usePendingLogic = (): string | null => {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  return pendingLogic(editorLogicTs, logicTs, modelCto);
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
    attempted.current = true;
    if (pending === null || isCompiling) return;
    if (isStale(pending, { logicTs, modelCto, compiledModelCto, compiledLogicJs, compilationErrors })) void setLogicTs(pending);
  }, [pending, logicTs, modelCto, compiledModelCto, compiledLogicJs, compilationErrors, isCompiling, setLogicTs]);
};

/** How many times ensureLogicCompiles compiles before giving up on sources that keep changing. */
const MAX_COMPILE_ATTEMPTS = 3;

/**
 * Compiles the logic (if written and stale) and says whether Simulate may
 * open: true when nothing is written — Simulate shows its "no logic" dialog —
 * or when the logic compiles; false when it does not. Reads the store
 * directly: it runs from a click handler, not from render.
 * Staleness is checked again after each compile: an edit made while it ran
 * (to the logic or to model.cto) is compiled too, so Simulate never opens on
 * logic compiled from sources that have since changed.
 */
export const ensureLogicCompiles = (): Promise<boolean> => {
  // Concurrent moves (Next, then the stepper, while compiling) share one gate:
  // separate loops would keep superseding each other's compiles.
  inFlightGate ??= runLogicGate().finally(() => {
    inFlightGate = null;
  });
  return inFlightGate;
};

let inFlightGate: Promise<boolean> | null = null;

const runLogicGate = async (): Promise<boolean> => {
  for (let attempt = 0; attempt < MAX_COMPILE_ATTEMPTS; attempt++) {
    const s = useAppStore.getState();
    const pending = pendingLogic(s.editorLogicTs, s.logicTs, s.modelCto);
    if (pending === null) return true;
    if (!isStale(pending, s)) return Boolean(s.compiledLogicJs) && s.compilationErrors.length === 0;
    await s.setLogicTs(pending);
  }
  const s = useAppStore.getState();
  const pending = pendingLogic(s.editorLogicTs, s.logicTs, s.modelCto);
  if (pending === null) return true;
  return !isStale(pending, s) && Boolean(s.compiledLogicJs) && s.compilationErrors.length === 0;
};
