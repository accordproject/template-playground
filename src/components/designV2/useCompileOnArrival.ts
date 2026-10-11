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

type LogicState = Pick<ReturnType<typeof useAppStore.getState>, "logicTs" | "compiledLogicJs" | "compilationErrors">;

/** True when the pending source was never compiled, or differs from what was compiled last. */
const isStale = (pending: string, s: LogicState) =>
  pending !== s.logicTs || (!s.compiledLogicJs && s.compilationErrors.length === 0);

/** Compiles the logic once when the step opens, if it is written and stale. */
export const useCompileOnArrival = () => {
  const pending = usePendingLogic();
  const logicTs = useAppStore((s) => s.logicTs);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const attempted = useRef(false);
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    if (pending === null || isCompiling) return;
    if (isStale(pending, { logicTs, compiledLogicJs, compilationErrors })) void setLogicTs(pending);
  }, [pending, logicTs, compiledLogicJs, compilationErrors, isCompiling, setLogicTs]);
};

/**
 * Compiles the logic (if written and stale) and says whether Simulate may
 * open: true when nothing is written — Simulate shows its "no logic" dialog —
 * or when the logic compiles; false when it does not. Reads the store
 * directly: it runs from a click handler, not from render.
 */
export const ensureLogicCompiles = async (): Promise<boolean> => {
  const before = useAppStore.getState();
  const pending = pendingLogic(before.editorLogicTs, before.logicTs, before.modelCto);
  if (pending === null) return true;
  if (isStale(pending, before)) await before.setLogicTs(pending);
  const after = useAppStore.getState();
  return Boolean(after.compiledLogicJs) && after.compilationErrors.length === 0;
};
