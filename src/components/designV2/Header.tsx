import { Button, Dropdown, type MenuProps } from "antd";
import { QuestionOutlined, UserOutlined, InfoOutlined, BookOutlined, CaretDownFilled } from "@ant-design/icons";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
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
  onNavigate: (view: DesignV2View) => void;
  /** Steps the flow passes over; shown greyed out and not clickable. */
  isSkipped?: (view: DesignV2View) => boolean;
}

/**
 * White header: eyebrow + sample name row, followed by the stepper (one entry per item in STEPS).
 * The name row shows the template picked on the Start step, falling back to the loaded sample.
 * The stepper has two forms: the cards, and a compact picker that replaces them on narrow
 * screens (see DesignV2Layout.css). Both are rendered; CSS decides which one is shown.
 * The Write | Preview switch is not here: it sits on the Text and Data
 * steps, where the preview matters (see PreviewToggle.tsx).
 */
const Header = ({ view, onNavigate, isSkipped = () => false }: HeaderProps) => {
  const showChrome = view !== "welcome";
  const sampleName = useAppStore((s) => s.sampleName);
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);

  const currentIndex = STEPS.findIndex((step) => step.id === view);
  const currentStep = currentIndex >= 0 ? STEPS[currentIndex] : undefined;

  /** The compact picker's button: "Step 4 of 6 · Logic". */
  const pickerLabel = currentStep
    ? HEADER.stepPosition(currentIndex + 1, STEPS.length, currentStep.label)
    : HEADER.stepPickerLabel;

  /** The same steps as the cards, for the compact picker on narrow screens. */
  const stepItems: MenuProps["items"] = STEPS.map((step) => {
    const skipped = isSkipped(step.id);
    return {
      key: String(step.id),
      label: `${step.label} · ${skipped ? HEADER.skippedMeta : step.meta}`,
      disabled: skipped,
      title: skipped ? HEADER.skippedHint : undefined,
      onClick: () => onNavigate(step.id),
    };
  });

  return (
    <header className="nd-header">
      <div className="nd-header-row">
        <div className="nd-header-titles">
          <div className="nd-eyebrow">{HEADER.eyebrow}</div>
          {showChrome && (
            <div className="nd-header-sample">
              <span className="nd-header-sample-name">{selectedTemplate ?? sampleName}</span>
            </div>
          )}
        </div>
        <div className="nd-spacer" />
        <div className="nd-header-actions">
          <Button
            type="text"
            size="small"
            href={URLS.templateDocs}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${HEADER.docs} (opens in a new tab)`}
          >
            {HEADER.docs}
          </Button>
          <Dropdown menu={{ items: HELP_MENU }} trigger={["click"]} placement="bottomRight">
            <Button type="text" size="small" aria-label={HEADER.helpMenuLabel}>
              {HEADER.help} <CaretDownFilled className="nd-help-caret" />
            </Button>
          </Dropdown>
        </div>
      </div>

      {showChrome && (
        <>
          <nav className="nd-stepper nd-stepper-cards" aria-label={HEADER.stepperLabel}>
            {STEPS.map((step) => {
              const active = step.id === view;
              const skipped = isSkipped(step.id);
              return (
                <button
                  key={String(step.id)}
                  type="button"
                  aria-current={active ? "step" : undefined}
                  className={`nd-step ${active ? "nd-step-active" : ""} ${skipped ? "nd-step-skipped" : ""}`}
                  disabled={skipped}
                  title={skipped ? HEADER.skippedHint : undefined}
                  onClick={() => onNavigate(step.id)}
                >
                  <span className="nd-step-badge">{step.icon}</span>
                  <span className="nd-step-text">
                    <span className="nd-step-label">{step.label}</span>
                    <span className="nd-step-meta">{skipped ? HEADER.skippedMeta : step.meta}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <nav className="nd-stepper-compact" aria-label={HEADER.stepperLabel}>
            <Dropdown
              menu={{ items: stepItems, selectable: true, selectedKeys: [String(view)] }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button className="nd-stepper-compact-button" aria-label={pickerLabel}>
                <span>{pickerLabel}</span>
                <CaretDownFilled className="nd-help-caret" />
              </Button>
            </Dropdown>
          </nav>
        </>
      )}
    </header>
  );
};

export default Header;
