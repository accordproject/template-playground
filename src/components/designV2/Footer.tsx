import { Button } from "antd";
import { FIRST_STEP, LAST_STEP, STEP_ID, type DesignV2View } from "../../types/designV2.types";
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
        <Button type="text" onClick={onBack}>
          {FOOTER.back}
        </Button>
      )}
      {isLogic && (
        <Button type="primary" ghost>
          {FOOTER.applyAndCompile}
        </Button>
      )}
      {canNext && (
        <Button type="primary" size="large" onClick={onNext}>
          {isFirst ? FOOTER.startWithTemplate : FOOTER.next}
        </Button>
      )}
    </footer>
  );
};

export default Footer;
