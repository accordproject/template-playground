import { Tabs } from "antd";
import { HELP_RAIL } from "./constants";

const TAB_ITEMS = [
  { key: "why", label: HELP_RAIL.tabWhy, children: <div className="nd-card-body" /> },
  { key: "how", label: HELP_RAIL.tabHow, children: <div className="nd-card-body" /> },
];

/**
 * Right-hand 286px help rail shown next to the editor steps.
 * Card 1: step checklist. Card 2: "Why this step" / "How it works" antd Tabs.
 * Content is placeholder-only for now.
 */
const HelpRail = () => (
  <aside className="nd-help-rail" aria-label={HELP_RAIL.ariaLabel}>
    <div className="nd-card">
      <div className="nd-card-head">
        <span className="nd-card-title">{HELP_RAIL.checklist}</span>
      </div>
      <div className="nd-checklist" />
    </div>

    <div className="nd-card nd-card-tabs">
      <Tabs size="small" centered items={TAB_ITEMS} />
    </div>
  </aside>
);

export default HelpRail;
