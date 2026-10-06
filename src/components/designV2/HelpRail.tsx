import { Button, Tabs } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import useDesignV2Store from "../../store/designV2Store";
import { HELP_RAIL } from "./constants";

export type ChecklistTone = "done" | "todo" | "error";

export interface ChecklistItem {
  label: string;
  tone: ChecklistTone;
  /** Small mono tag on the right, e.g. a type or a "2 / 2" count. */
  tag?: string;
}

export interface HelpChecklist {
  /** Card title, e.g. "THIS STEP NEEDS". */
  title: string;
  items: readonly ChecklistItem[];
}

export interface HelpLink {
  label: string;
  href: string;
}

export interface HelpWhy {
  note: string;
  links: readonly HelpLink[];
}

interface HelpRailProps {
  checklist?: HelpChecklist;
  why?: HelpWhy;
  /** Numbered "How it works" steps. */
  how?: readonly string[];
}

const TONE_ICON: Record<ChecklistTone, string> = { done: "✓", todo: "○", error: "✕" };

/**
 * Chip that brings the help rail back once it has been closed.
 * Renders nothing while the rail is open; place it in the step's title row.
 */
export const HelpRailReopen = () => {
  const open = useDesignV2Store((s) => s.helpRailOpen);
  const setOpen = useDesignV2Store((s) => s.setHelpRailOpen);
  if (open) return null;
  return (
    <Button type="dashed" size="small" onClick={() => setOpen(true)}>
      {HELP_RAIL.reopen}
    </Button>
  );
};

/**
 * Right-hand 286px help rail shown next to the editor steps.
 * Card 1: step checklist. Card 2: "Why this step" / "How it works" antd Tabs.
 * Steps that pass no content get empty cards (placeholder look).
 * The × in the first card hides the rail (designV2Store.helpRailOpen);
 * HelpRailReopen shows it again.
 */
const HelpRail = ({ checklist, why, how }: HelpRailProps) => {
  const open = useDesignV2Store((s) => s.helpRailOpen);
  const setOpen = useDesignV2Store((s) => s.setHelpRailOpen);
  const done = checklist?.items.filter((item) => item.tone === "done").length ?? 0;
  if (!open) return null;
  const tabs = [
    {
      key: "why",
      label: HELP_RAIL.tabWhy,
      children: (
        <div className="nd-card-body">
          {why && (
            <>
              <p className="nd-help-note">{why.note}</p>
              <div className="nd-help-links">
                {why.links.map((link) => (
                  <a key={link.href} className="nd-help-link" href={link.href} target="_blank" rel="noopener noreferrer">
                    ↗ {link.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: "how",
      label: HELP_RAIL.tabHow,
      children: (
        <div className="nd-card-body">
          {how && (
            <ol className="nd-help-how">
              {how.map((text, i) => (
                <li key={i}>
                  <span className="nd-help-how-n nd-mono">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ),
    },
  ];

  return (
    <aside className="nd-help-rail" aria-label={HELP_RAIL.ariaLabel}>
      <div className="nd-card">
        <div className="nd-card-head">
          <span className="nd-card-title">{checklist?.title ?? HELP_RAIL.checklist}</span>
          {checklist && (
            <span className="nd-mono nd-checklist-count">{HELP_RAIL.count(done, checklist.items.length)}</span>
          )}
          <Button
            type="text"
            size="small"
            className="nd-pane-close nd-help-close"
            aria-label={HELP_RAIL.close}
            icon={<CloseOutlined />}
            onClick={() => setOpen(false)}
          />
        </div>
        <ul className="nd-checklist">
          {checklist?.items.map((item) => (
            <li key={item.label} className={`nd-check nd-check-${item.tone}`}>
              <span className="nd-check-icon" aria-hidden="true">{TONE_ICON[item.tone]}</span>
              <span className="nd-check-label">{item.label}</span>
              {item.tag && <span className="nd-mono nd-check-tag" title={item.tag}>{item.tag}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="nd-card nd-card-tabs">
        <Tabs size="small" tabBarGutter={0} animated={false} items={tabs} />
      </div>
    </aside>
  );
};

export default HelpRail;
