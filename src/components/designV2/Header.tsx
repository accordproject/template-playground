import { useState } from "react";
import { QuestionOutlined, UserOutlined, InfoOutlined, BookOutlined, CaretDownFilled } from "@ant-design/icons";
import useAppStore from "../../store/store";
import { STEPS, type DesignV2View } from "./types";
import { HEADER, URLS } from "./constants";

/** Same links as the legacy navbar's Help dropdown. */
const HELP_LINKS = {
  info: [
    { label: HEADER.links.about, href: URLS.readme, icon: <QuestionOutlined /> },
    { label: HEADER.links.community, href: URLS.discord, icon: <UserOutlined /> },
    { label: HEADER.links.issues, href: URLS.issues, icon: <InfoOutlined /> },
  ],
  docs: [
    { label: HEADER.links.documentation, href: URLS.engineDocs, icon: <BookOutlined /> },
  ],
};

interface HeaderProps {
  view: DesignV2View;
  previewOpen: boolean;
  onNavigate: (view: DesignV2View) => void;
  onTogglePreview: () => void;
}

/** White header: eyebrow + sample name row, followed by the six-step stepper. */
const Header = ({ view, previewOpen, onNavigate, onTogglePreview }: HeaderProps) => {
  const showChrome = view !== "welcome";
  const sampleName = useAppStore((s) => s.sampleName);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <header className="nd-header">
      <div className="nd-header-row">
        <div className="nd-header-titles">
          <div className="nd-eyebrow">{HEADER.eyebrow}</div>
          {showChrome && (
            <div className="nd-header-sample">
              <span className="nd-header-sample-name">{sampleName}</span>
            </div>
          )}
        </div>
        <div className="nd-spacer" />
        <div className="nd-header-actions">
          <button type="button" className="nd-btn-ghost">{HEADER.docs}</button>
          <div className="nd-help">
            <button
              type="button"
              className={`nd-btn-ghost ${helpOpen ? "nd-btn-ghost-active" : ""}`}
              aria-haspopup="menu"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((v) => !v)}
            >
              {HEADER.help} <CaretDownFilled className="nd-help-caret" />
            </button>
            {helpOpen && (
              <>
                <div className="nd-help-backdrop" onClick={() => setHelpOpen(false)} />
                <div className="nd-help-menu" role="menu" aria-label={HEADER.helpMenuLabel}>
                  <div className="nd-help-group">{HEADER.helpGroupInfo}</div>
                  {HELP_LINKS.info.map((l) => (
                    <a key={l.label} role="menuitem" className="nd-help-item" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setHelpOpen(false)}>
                      {l.icon}
                      <span>{l.label}</span>
                    </a>
                  ))}
                  <div className="nd-help-group">{HEADER.helpGroupDocs}</div>
                  {HELP_LINKS.docs.map((l) => (
                    <a key={l.label} role="menuitem" className="nd-help-item" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setHelpOpen(false)}>
                      {l.icon}
                      <span>{l.label}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
          <button type="button" className="nd-btn-outline">{HEADER.advanced}</button>
          <button
            type="button"
            className={`nd-btn-outline ${previewOpen ? "nd-btn-outline-active" : ""}`}
            onClick={onTogglePreview}
            aria-pressed={previewOpen}
          >
            {HEADER.preview}
          </button>
        </div>
      </div>

      {showChrome && (
        <div className="nd-stepper" role="tablist" aria-label={HEADER.stepperLabel}>
          {STEPS.map((step) => {
            const active = step.id === view;
            return (
              <button
                key={String(step.id)}
                type="button"
                role="tab"
                aria-selected={active}
                className={`nd-step ${active ? "nd-step-active" : ""}`}
                onClick={() => onNavigate(step.id)}
              >
                <span className="nd-step-badge">{step.icon}</span>
                <span className="nd-step-text">
                  <span className="nd-step-label">{step.label}</span>
                  <span className="nd-step-meta">{step.meta}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Header;
