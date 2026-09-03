import { useNavigate } from "react-router-dom";
import HelpRail from "./HelpRail";
import { STEPS, type EditorStep, type DesignV2View } from "./types";

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
        Contracts that
        <br />
        <span className="nd-hero-title-accent">run themselves.</span>
      </h1>
      <p className="nd-hero-sub">
        Write the agreement once — as data, text and rules — and watch it execute.
        <br />
        Seven steps, no setup.
      </p>
      <div className="nd-hero-actions">
        <button type="button" className="nd-btn-hero" onClick={onStart}>
          Start building <span>→</span>
        </button>
        <button type="button" className="nd-btn-hero-outline" onClick={() => navigate("/learn/intro")}>How it works ↗</button>
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
      <span className="nd-start-title">Choose a template type</span>
      <span className="nd-start-hint">everything stays editable later</span>
      <div className="nd-spacer" />
      <button type="button" className="nd-btn-dashed">+ Blank</button>
      <button type="button" className="nd-btn-outline-sm">✦ Draft with AI</button>
      <label className="nd-checkbox">
        <input type="checkbox" defaultChecked /> include logic{" "}
        <span className="nd-start-hint">steps 4 &amp; 5</span>
      </label>
    </div>
    <div className="nd-sample-grid">
      {Array.from({ length: 3 }).map((_, i) => (
        <button key={i} type="button" className="nd-sample-card" aria-label={`Template ${i + 1}`} />
      ))}
    </div>
  </div>
);

const EDITOR_META: Record<EditorStep, { icon: string; title: string; file: string; badge: string }> = {
  2: { icon: "¶", title: "Write the contract text", file: "text.md", badge: "TemplateMark" },
  3: { icon: "◇", title: "Define the data model", file: "model.cto", badge: "Concerto" },
  4: { icon: "{}", title: "Fill in the data", file: "data.json", badge: "instance" },
  5: { icon: "ƒ", title: "Add the logic", file: "logic.ts", badge: "TypeScript" },
};

interface EditorViewProps {
  step: EditorStep;
}

/** Steps 2–5: title block, editor card (header / body / status bar) and the help rail. */
export const EditorView = ({ step }: EditorViewProps) => {
  const meta = EDITOR_META[step];
  return (
    <div className="nd-view nd-view-editor">
      <div className="nd-editor-column">
        <div className="nd-editor-title">
          <div className="nd-editor-icon">{meta.icon}</div>
          <div className="nd-editor-title-text">
            <h1>{meta.title}</h1>
          </div>
          {step === 5 && (
            <button type="button" className="nd-btn-outline-sm">✦ Scaffold from model</button>
          )}
        </div>
        <div className="nd-editor-card">
          <div className="nd-editor-card-head">
            <span className="nd-mono nd-editor-file">{meta.file}</span>
            <span className="nd-badge nd-badge-teal">{meta.badge}</span>
            <div className="nd-spacer" />
            <button type="button" className="nd-btn-ghost-sm">≡ format</button>
            <button type="button" className="nd-btn-ghost-sm">⧉ copy</button>
          </div>
          <div className="nd-editor-card-body">
            <div className="nd-placeholder nd-placeholder-block" />
          </div>
          <div className="nd-editor-card-foot">
            <span className="nd-status-ok">✓ ok</span>
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
      <h1>Simulate</h1>
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
      <h1>Deploy</h1>
    </div>
    <div className="nd-export-grid">
      {["Download PDF", "Share link", "Copy to clipboard"].map((label) => (
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
  if (view === 1) return <StartView />;
  if (view === 6) return <SimulateView />;
  if (view === 7) return <DeployView />;
  return <EditorView step={view} />;
};
