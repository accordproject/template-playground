import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { ModelDataView } from "./ModelDataView";
import { TextView } from "./TextView";
import { LogicView } from "./LogicView";
import SimulateView from "./SimulateView";
import SampleArt from "./SampleArt";
import useDesignV2Store from "../../store/designV2Store";
import { usePickTemplate } from "./usePickTemplate";
import { STEP_KEY, type DesignV2View } from "../../types/designV2.types";
import {
  ROUTES,
  WELCOME,
  START,
  START_SAMPLES,
  DEPLOY,
  type StartSample,
} from "./constants";

/*
 * Welcome hero, template gallery and the Deploy placeholder. Each is swapped
 * in by DesignV2Layout based on `view`; the editor steps live in their own files.
 */

interface WelcomeViewProps {
  onStart: () => void;
}

/**
 * Dark hero card: Accord Project wordmark, headline and the two CTAs.
 */
export const WelcomeView = ({ onStart }: WelcomeViewProps) => {
  const navigate = useNavigate();
  return (
  <div className="nd-view nd-view-welcome">
    <div className="nd-hero">
      <div className="nd-hero-grid" />
      <img className="nd-hero-logo" src={WELCOME.logoSrc} alt={WELCOME.logoAlt} />
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
    </div>
  </div>
  );
};

interface SampleCardProps {
  sample: StartSample;
  /** The card's template is the one currently loaded (e.g. after Back from a later step). */
  current: boolean;
  onOpen: () => void;
}

/**
 * One gallery card: an illustration on top; name, tagline, a short list
 * of what the template demonstrates and its own "Start with this template"
 * button underneath. Nothing else on the card is clickable — picking and
 * opening a template is one click.
 */
const SampleCard = ({ sample, current, onOpen }: SampleCardProps) => {
  const classes = [
    "nd-sample-card",
    `nd-sample-card-${sample.accent}`,
    current ? "nd-sample-card-current" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes} aria-current={current ? "true" : undefined} aria-label={sample.name}>
      <div className="nd-sample-art">
        <SampleArt kind={sample.art} />
      </div>
      <div className="nd-sample-foot">
        <div className="nd-sample-foot-row">
          <span className="nd-sample-name">{sample.name}</span>
          {current && <span className="nd-sample-current">{START.current}</span>}
        </div>
        <p className="nd-sample-tagline">{sample.tagline}</p>
        <ul className="nd-sample-learn" aria-label={START.learnLabel(sample.name)}>
          {sample.demonstrates.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <Button
          type="primary"
          block
          className="nd-sample-open"
          aria-label={START.openLabel(sample.name)}
          onClick={onOpen}
        >
          {START.open}
        </Button>
      </div>
    </article>
  );
};

/**
 * "Choose a template" gallery: a curated set of cards, each opening the flow
 * on its template in one click. "+ Start blank" does the same with the empty template.
 */
export const StartView = () => {
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);
  const goNext = useDesignV2Store((s) => s.goNext);
  const pick = usePickTemplate();
  const open = (name: string) => {
    pick(name);
    goNext();
  };

  return (
    <div className="nd-view nd-view-start">
      <div className="nd-start-head">
        <span className="nd-start-title">{START.title}</span>
        <span className="nd-start-hint">{START.hint}</span>
        <div className="nd-spacer" />
        <Button type="dashed" size="small" onClick={() => open(START.blankName)}>
          {START.blank}
        </Button>
      </div>
      <div className="nd-sample-grid">
        {START_SAMPLES.map((sample) => (
          <SampleCard
            key={sample.name}
            sample={sample}
            current={selectedTemplate === sample.name}
            onOpen={() => open(sample.name)}
          />
        ))}
      </div>
    </div>
  );
};

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
  if (key === "template") return <StartView />;
  if (key === "modelData") return <ModelDataView />;
  if (key === "text") return <TextView />;
  if (key === "logic") return <LogicView />;
  if (key === "simulate") return <SimulateView />;
  return <DeployView />;
};
