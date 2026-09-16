import { Button } from "antd";
import useAppStore from "../../store/store";
import { FIRST_STEP, LAST_STEP, STEP_ID, type DesignV2View } from "../../types/designV2.types";
import { FOOTER } from "./constants";
import { runStats } from "./simulateRuns";

interface FooterProps {
  view: DesignV2View;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Bottom bar: problems pill on the left, Back / Next on the right.
 * The pill mirrors the app store: green "no problems", or a red "✕ error"
 * followed by the store's full message — `error` from the rebuild, or the
 * first compilation error on the Logic and Simulate steps (the logic is
 * compiled when Simulate opens; there is no compile button). On Simulate
 * the pill counts the failed runs instead ("✕ 1 failed run · run #3").
 */
const Footer = ({ view, onBack, onNext }: FooterProps) => {
  const rebuildError = useAppStore((s) => s.error);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const executionHistory = useAppStore((s) => s.executionHistory);
  const canBack = view !== FIRST_STEP;
  const canNext = view !== LAST_STEP;
  const isLogic = view === STEP_ID.logic;
  const isSimulate = view === STEP_ID.simulate;
  const error = rebuildError ?? (isLogic || isSimulate ? compilationErrors[0]?.message : undefined);
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
      {canNext && (
        <Button type="primary" size="large" onClick={onNext}>
          {FOOTER.next}
        </Button>
      )}
    </footer>
  );
};

export default Footer;
