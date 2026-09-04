import { useState } from "react";
import { HELP_RAIL } from "./constants";

/**
 * Right-hand 286px help rail shown next to the editor steps.
 * Card 1: step checklist. Card 2: "Why this step" / "How it works" tabs.
 * Content is placeholder-only for now.
 */
const HelpRail = () => {
  const [tab, setTab] = useState<"why" | "how">("why");

  return (
    <aside className="nd-help-rail" aria-label={HELP_RAIL.ariaLabel}>
      <div className="nd-card">
        <div className="nd-card-head">
          <span className="nd-card-title">{HELP_RAIL.checklist}</span>
        </div>
        <div className="nd-checklist" />
      </div>

      <div className="nd-card nd-card-tabs">
        <div className="nd-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "why"}
            className={`nd-tab ${tab === "why" ? "nd-tab-active" : ""}`}
            onClick={() => setTab("why")}
          >
            {HELP_RAIL.tabWhy}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "how"}
            className={`nd-tab ${tab === "how" ? "nd-tab-active" : ""}`}
            onClick={() => setTab("how")}
          >
            {HELP_RAIL.tabHow}
          </button>
        </div>
        <div className="nd-card-body" />
      </div>
    </aside>
  );
};

export default HelpRail;
