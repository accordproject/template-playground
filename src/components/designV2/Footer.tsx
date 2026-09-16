import { Button } from "antd";
import useAppStore from "../../store/store";
import { nextLogicSource } from "../../editors/logicSource";
import { FIRST_STEP, LAST_STEP, STEP_ID, type DesignV2View } from "../../types/designV2.types";
import { FOOTER } from "./constants";
import { runStats } from "./simulateRuns";

interface FooterProps {
  view: DesignV2View;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Bottom bar: problems pill on the left, Back / Apply & Compile / Next on the right.
 * The pill mirrors the app store: green "no problems", or a red "✕ error"
 * followed by the store's full message — `error` from the rebuild, or the
 * first compilation error on the Logic step. On Simulate the pill counts the
 * failed runs instead ("✕ 1 failed run · run #3"). "Apply & Compile" commits
 * the logic through store.setLogicTs, exactly like the legacy logic panel.
 */
const Footer = ({ view, onBack, onNext }: FooterProps) => {
  const rebuildError = useAppStore((s) => s.error);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const executionHistory = useAppStore((s) => s.executionHistory);
  const canBack = view !== FIRST_STEP;
  const canNext = view !== LAST_STEP;
  const isLogic = view === STEP_ID.logic;
  const isSimulate = view === STEP_ID.simulate;
  const error = rebuildError ?? (isLogic ? compilationErrors[0]?.message : undefined);
  const logicDirty = editorLogicTs !== logicTs;
  const runs = runStats(executionHistory);
  const failedRuns = isSimulate && runs.lastFailedId ? FOOTER.failedRuns(runs.failed, runs.lastFailedId) : undefined;

  return (
    <footer className="nd-footer">
      {failedRuns ? (
        <span className="nd-problem-pill nd-problem-pill-err" role="status">{failedRuns}</span>
      ) : error ? (
        <div className="nd-problem" role="status" aria-label={FOOTER.problemLabel}>
          <span className="nd-problem-pill nd-problem-pill-err">{FOOTER.problem}</span>
          <span className="nd-problem-text" title={error}>{error}</span>
        </div>
      ) : (
        <span className="nd-problem-pill nd-problem-pill-ok" role="status">{FOOTER.noProblems}</span>
      )}
      <div className="nd-spacer" />
      {canBack && (
        <Button type="text" onClick={onBack}>
          {FOOTER.back}
        </Button>
      )}
      {isLogic && (
        <Button
          type="primary"
          ghost={!logicDirty}
          loading={isCompiling}
          disabled={isCompiling}
          onClick={() => void setLogicTs(nextLogicSource(editorLogicTs, logicTs, modelCto))}
        >
          {logicDirty ? FOOTER.applyAndCompileDirty : FOOTER.applyAndCompile}
        </Button>
      )}
      {canNext && (
        <Button type="primary" size="large" onClick={onNext}>
          {FOOTER.next}
        </Button>
      )}
    </footer>
  );
};

export default Footer;
