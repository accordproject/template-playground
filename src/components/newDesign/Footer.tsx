import type { NewDesignView } from "./types";

interface FooterProps {
  view: NewDesignView;
  onBack: () => void;
  onNext: () => void;
}

/** Bottom bar: problems pill on the left, Back / Apply & Compile / Next on the right. */
const Footer = ({ view, onBack, onNext }: FooterProps) => {
  const canBack = view !== 1;
  const canNext = view !== 7;
  const isLogic = view === 5;

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
          {view === 1 ? "Start with this template" : "Next →"}
        </button>
      )}
    </footer>
  );
};

export default Footer;
