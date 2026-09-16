import { useEffect, useRef } from "react";
import useAppStore from "../../store/store";
import { pendingLogic } from "../../editors/logicSource";

/**
 * Compiles the logic when a step opens, once per visit: whatever the Logic
 * editor holds goes through store.setLogicTs if it changed since the last
 * compile or was never compiled. Nothing happens for an empty editor or the
 * untouched skeleton (see pendingLogic), while a compile is running, or
 * after a failed compile of the same source — that one shows as failed
 * until the source changes.
 *
 * Used by the Logic step, so a template that ships logic opens with both
 * chips ticked and the bar full as soon as its logic compiles, and by
 * Simulate, so there is something to run. There is no compile button.
 * Returns the pending source, or null when no logic is written.
 */
export const useCompileOnArrival = (): string | null => {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const setLogicTs = useAppStore((s) => s.setLogicTs);

  const pending = pendingLogic(editorLogicTs, logicTs, modelCto);
  const attempted = useRef(false);
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    if (pending === null || isCompiling) return;
    const stale = pending !== logicTs || (!compiledLogicJs && compilationErrors.length === 0);
    if (stale) void setLogicTs(pending);
  }, [pending, logicTs, compiledLogicJs, compilationErrors, isCompiling, setLogicTs]);

  return pending;
};
