import { Button, Dropdown, type MenuProps } from "antd";
import { QuestionOutlined, UserOutlined, InfoOutlined, BookOutlined, CaretDownFilled } from "@ant-design/icons";
import useAppStore from "../../store/store";
import { STEPS, type DesignV2View } from "../../types/designV2.types";
import { HEADER, URLS } from "./constants";

const externalLink = (label: string, href: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

/** Same links as the legacy navbar's Help dropdown. */
const HELP_MENU: MenuProps["items"] = [
  {
    type: "group",
    label: HEADER.helpGroupInfo,
    children: [
      { key: "about", icon: <QuestionOutlined />, label: externalLink(HEADER.links.about, URLS.readme) },
      { key: "community", icon: <UserOutlined />, label: externalLink(HEADER.links.community, URLS.discord) },
      { key: "issues", icon: <InfoOutlined />, label: externalLink(HEADER.links.issues, URLS.issues) },
    ],
  },
  {
    type: "group",
    label: HEADER.helpGroupDocs,
    children: [
      { key: "documentation", icon: <BookOutlined />, label: externalLink(HEADER.links.documentation, URLS.engineDocs) },
    ],
  },
];

interface HeaderProps {
  view: DesignV2View;
  previewOpen: boolean;
  onNavigate: (view: DesignV2View) => void;
  onTogglePreview: () => void;
}

/** White header: eyebrow + sample name row, followed by the stepper (one entry per item in STEPS). */
const Header = ({ view, previewOpen, onNavigate, onTogglePreview }: HeaderProps) => {
  const showChrome = view !== "welcome";
  const sampleName = useAppStore((s) => s.sampleName);

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
          <Button type="text" size="small">{HEADER.docs}</Button>
          <Dropdown menu={{ items: HELP_MENU }} trigger={["click"]} placement="bottomRight">
            <Button type="text" size="small" aria-label={HEADER.helpMenuLabel}>
              {HEADER.help} <CaretDownFilled className="nd-help-caret" />
            </Button>
          </Dropdown>
          <Button size="small">{HEADER.advanced}</Button>
          <Button
            size="small"
            type={previewOpen ? "primary" : "default"}
            ghost={previewOpen}
            onClick={onTogglePreview}
            aria-pressed={previewOpen}
          >
            {HEADER.preview}
          </Button>
        </div>
      </div>

      {showChrome && (
        <nav className="nd-stepper" aria-label={HEADER.stepperLabel}>
          {STEPS.map((step) => {
            const active = step.id === view;
            return (
              <button
                key={String(step.id)}
                type="button"
                aria-current={active ? "step" : undefined}
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
        </nav>
      )}
    </header>
  );
};

export default Header;
