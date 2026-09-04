import { FIRST_STEP, LAST_STEP, STEP_ID, type DesignV2View } from "./types";

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
      <span className="nd-problem-pill nd-problem-pill-ok">✓ no problems</span>
      <div className="nd-spacer" />
      {canBack && (
        <button type="button" className="nd-btn-ghost" onClick={onBack}>
          ← Back
        </button>
      )}
      {isLogic && (
        <button type="button" className="nd-btn-compile">
          Apply &amp; Compile
        </button>
      )}
      {canNext && (
        <button type="button" className="nd-btn-primary" onClick={onNext}>
          {isFirst ? "Start with this template" : "Next →"}
        </button>
      )}
    </footer>
  );
};

export default Footer;
