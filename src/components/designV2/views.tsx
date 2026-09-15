import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import HelpRail from "./HelpRail";
import useDesignV2Store from "../../store/designV2Store";
import {
  STEPS,
  STEP_ID,
  STEP_KEY,
  isEditorStep,
  countStepsAfterTemplate,
  LOGIC_ONLY_STEP_KEYS,
  type EditorStepKey,
  type DesignV2View,
} from "../../types/designV2.types";
import {
  ROUTES,
  WELCOME,
  START,
  START_SAMPLES,
  EDITOR,
  SIMULATE,
  DEPLOY,
  type EditorMeta,
  type StartSample,
} from "./constants";

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
        <Button type="primary" size="large" shape="round" onClick={onStart}>
          {WELCOME.start} →
        </Button>
        <Button ghost size="large" shape="round" onClick={() => navigate(ROUTES.learnIntro)}>{WELCOME.howItWorks}</Button>
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

interface SampleCardProps {
  sample: StartSample;
  selected: boolean;
  onPick: () => void;
}

/** One gallery card: a miniature document on top, name / steps / tags underneath. */
const SampleCard = ({ sample, selected, onPick }: SampleCardProps) => {
  const steps = START.stepsLabel(countStepsAfterTemplate(sample.logic));
  const tags = sample.logic
    ? [START.tags.text, START.tags.model, START.tags.logic]
    : [START.tags.text, START.tags.model];
  const classes = [
    "nd-sample-card",
    `nd-sample-card-${sample.accent}`,
    sample.logic ? "nd-sample-card-logic" : "",
    selected ? "nd-sample-card-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      aria-label={START.cardLabel(sample.name, steps, sample.note)}
      onClick={onPick}
    >
      <div className="nd-sample-thumb">
        <div className="nd-sample-page">
          <div className="nd-sample-body">
            {sample.body.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="nd-sample-foot">
        <div className="nd-sample-foot-row">
          <span className="nd-sample-name">{sample.name}</span>
          <span className="nd-mono nd-sample-steps">{steps}</span>
          {selected && <span className="nd-sample-tick" aria-hidden="true">✓</span>}
        </div>
        <div className="nd-sample-foot-row nd-sample-foot-tags">
          {tags.map((tag) => (
            <span key={tag} className={`nd-tag nd-tag-${tag}`}>{tag}</span>
          ))}
          <span className="nd-spacer" />
          <span className="nd-sample-note">{sample.note}</span>
        </div>
      </div>
    </button>
  );
};

/** "Choose a template type" gallery with sample cards. */
export const StartView = () => {
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);
  const includeLogic = useDesignV2Store((s) => s.includeLogic);
  const selectTemplate = useDesignV2Store((s) => s.selectTemplate);
  const setIncludeLogic = useDesignV2Store((s) => s.setIncludeLogic);

  return (
    <div className="nd-view nd-view-start">
      <div className="nd-start-head">
        <span className="nd-start-title">{START.title}</span>
        <span className="nd-start-hint">{START.hint}</span>
        <div className="nd-spacer" />
        <Button type="dashed" size="small" onClick={() => selectTemplate(START.blankName)}>
          {START.blank}
        </Button>
        <Button size="small">{START.draftWithAi}</Button>
        <label className="nd-checkbox">
          <input
            type="checkbox"
            checked={includeLogic}
            onChange={(e) => setIncludeLogic(e.target.checked)}
          />{" "}
          {START.includeLogic}{" "}
          <span className="nd-start-hint">
            {START.includeLogicHint(LOGIC_ONLY_STEP_KEYS.map((key) => STEP_ID[key]))}
          </span>
        </label>
      </div>
      <div className="nd-sample-grid">
        {START_SAMPLES.map((sample) => (
          <SampleCard
            key={sample.name}
            sample={sample}
            selected={selectedTemplate === sample.name}
            onPick={() => selectTemplate(sample.name, sample.logic)}
          />
        ))}
      </div>
    </div>
  );
};

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
            <Button size="small">{EDITOR.scaffoldFromModel}</Button>
          )}
        </div>
        <div className="nd-editor-card">
          <div className="nd-editor-card-head">
            <span className="nd-mono nd-editor-file">{meta.file}</span>
            <span className="nd-badge nd-badge-teal">{meta.badge}</span>
            <div className="nd-spacer" />
            <Button type="text" size="small">{EDITOR.format}</Button>
            <Button type="text" size="small">{EDITOR.copy}</Button>
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
