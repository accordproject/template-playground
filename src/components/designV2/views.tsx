import { useNavigate } from "react-router-dom";
import HelpRail from "./HelpRail";
import { STEPS, STEP_ID, STEP_KEY, isEditorStep, type EditorStepKey, type DesignV2View } from "./types";
import { ROUTES, WELCOME, START, EDITOR, SIMULATE, DEPLOY, type EditorMeta } from "./constants";

/*
 * Placeholder views for each step of the flow. Only structure — no real
 * editors or data yet. Each is swapped in by DesignV2Layout based on `view`.
 */

interface WelcomeViewProps {
  onStart: () => void;
}

/** Dark hero card with headline, CTAs and the Text → Model → Data → Logic → Run it strip. */
export const WelcomeView = ({ onStart }: WelcomeViewProps) => {
  const navigate = useNavigate();
  return (
  <div className="nd-view nd-view-welcome">
    <div className="nd-hero">
      <div className="nd-hero-grid" />
      <div className="nd-spacer" />
      <h1 className="nd-hero-title">
        {WELCOME.titleLine}
        <br />
        <span className="nd-hero-title-accent">{WELCOME.titleAccent}</span>
      </h1>
      <p className="nd-hero-sub">
        {WELCOME.subtitleLine1}
        <br />
        {WELCOME.subtitleLine2}
      </p>
      <div className="nd-hero-actions">
        <button type="button" className="nd-btn-hero" onClick={onStart}>
          {WELCOME.start} <span>→</span>
        </button>
        <button type="button" className="nd-btn-hero-outline" onClick={() => navigate(ROUTES.learnIntro)}>{WELCOME.howItWorks}</button>
      </div>
      <div className="nd-spacer" />
      <div className="nd-hero-strip">
        {STEPS.map((step, i) => {
          const last = i === STEPS.length - 1;
          return (
            <span key={String(step.id)} className="nd-hero-strip-item">
              <span className={last ? "nd-hero-strip-accent" : undefined}>{step.label}</span>
              {!last && (
                <span className={`nd-hero-arrow ${i === STEPS.length - 2 ? "nd-hero-arrow-accent" : ""}`}>→</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  </div>
  );
};

/** "Choose a template type" gallery with sample cards. */
export const StartView = () => (
  <div className="nd-view nd-view-start">
    <div className="nd-start-head">
      <span className="nd-start-title">{START.title}</span>
      <span className="nd-start-hint">{START.hint}</span>
      <div className="nd-spacer" />
      <button type="button" className="nd-btn-dashed">{START.blank}</button>
      <button type="button" className="nd-btn-outline-sm">{START.draftWithAi}</button>
      <label className="nd-checkbox">
        <input type="checkbox" defaultChecked /> {START.includeLogic}{" "}
        <span className="nd-start-hint">{START.includeLogicHint(STEP_ID.data, STEP_ID.logic)}</span>
      </label>
    </div>
    <div className="nd-sample-grid">
      {Array.from({ length: START.sampleCount }).map((_, i) => (
        <button key={i} type="button" className="nd-sample-card" aria-label={START.sampleCardLabel(i + 1)} />
      ))}
    </div>
  </div>
);

interface EditorViewProps {
  step: EditorStepKey;
}

/** Editor steps: title block, editor card (header / body / status bar) and the help rail. */
export const EditorView = ({ step }: EditorViewProps) => {
  const meta: EditorMeta = EDITOR.meta[step];
  return (
    <div className="nd-view nd-view-editor">
      <div className="nd-editor-column">
        <div className="nd-editor-title">
          <div className="nd-editor-icon">{meta.icon}</div>
          <div className="nd-editor-title-text">
            <h1>{meta.title}</h1>
          </div>
          {step === "logic" && (
            <button type="button" className="nd-btn-outline-sm">{EDITOR.scaffoldFromModel}</button>
          )}
        </div>
        <div className="nd-editor-card">
          <div className="nd-editor-card-head">
            <span className="nd-mono nd-editor-file">{meta.file}</span>
            <span className="nd-badge nd-badge-teal">{meta.badge}</span>
            <div className="nd-spacer" />
            <button type="button" className="nd-btn-ghost-sm">{EDITOR.format}</button>
            <button type="button" className="nd-btn-ghost-sm">{EDITOR.copy}</button>
          </div>
          <div className="nd-editor-card-body">
            <div className="nd-placeholder nd-placeholder-block" />
          </div>
          <div className="nd-editor-card-foot">
            <span className="nd-status-ok">{EDITOR.statusOk}</span>
          </div>
        </div>
      </div>
      <HelpRail />
    </div>
  );
};

/** Step 6: Simulate — empty placeholder until the runner UI is designed. */
export const SimulateView = () => (
  <div className="nd-view nd-view-simulate">
    <div className="nd-sim-head">
      <h1>{SIMULATE.title}</h1>
    </div>
    <div className="nd-editor-card">
      <div className="nd-editor-card-body">
        <div className="nd-placeholder nd-placeholder-block" />
      </div>
    </div>
  </div>
);

/** Step 7: Deploy — placeholder until the deploy flow is designed. */
export const DeployView = () => (
  <div className="nd-view nd-view-export">
    <div className="nd-export-head">
      <h1>{DEPLOY.title}</h1>
    </div>
    <div className="nd-export-grid">
      {DEPLOY.cards.map((label) => (
        <div key={label} className="nd-card nd-export-card">
          <span className="nd-export-label">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

interface ViewSwitchProps {
  view: DesignV2View;
  onStart: () => void;
}

export const ViewSwitch = ({ view, onStart }: ViewSwitchProps) => {
  if (view === "welcome") return <WelcomeView onStart={onStart} />;
  const key = STEP_KEY[view];
  if (isEditorStep(key)) return <EditorView step={key} />;
  if (key === "template") return <StartView />;
  if (key === "simulate") return <SimulateView />;
  return <DeployView />;
};
