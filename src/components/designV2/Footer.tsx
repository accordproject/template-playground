import { FIRST_STEP, LAST_STEP, STEP_ID, type DesignV2View } from "./types";
import { FOOTER } from "./constants";

interface FooterProps {
  view: DesignV2View;
  onBack: () => void;
  onNext: () => void;
}

/** Bottom bar: problems pill on the left, Back / Apply & Compile / Next on the right. */
const Footer = ({ view, onBack, onNext }: FooterProps) => {
  const isFirst = view === FIRST_STEP;
  const canBack = !isFirst;
  const canNext = view !== LAST_STEP;
  const isLogic = view === STEP_ID.logic;

  return (
    <footer className="nd-footer">
      <span className="nd-problem-pill nd-problem-pill-ok">{FOOTER.noProblems}</span>
      <div className="nd-spacer" />
      {canBack && (
        <button type="button" className="nd-btn-ghost" onClick={onBack}>
          {FOOTER.back}
        </button>
      )}
      {isLogic && (
        <button type="button" className="nd-btn-compile">
          {FOOTER.applyAndCompile}
        </button>
      )}
      {canNext && (
        <button type="button" className="nd-btn-primary" onClick={onNext}>
          {isFirst ? FOOTER.startWithTemplate : FOOTER.next}
        </button>
      )}
    </footer>
  );
};

export default Footer;
