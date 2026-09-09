import { Button, message } from "antd";
import useAppStore from "../../store/store";
import TemplateMarkdown from "../../editors/editorsContainer/TemplateMarkdown";
import {
  MarkdownEditorProvider,
  useMarkdownEditorContext,
  type MarkdownEditorCommands,
} from "../../contexts/MarkdownEditorContext";
import HelpRail, { HelpRailReopen, type ChecklistItem } from "./HelpRail";
import { TEXT } from "./constants";

/**
 * Formatting buttons of the text editor. They call the same commands the
 * legacy toolbar uses (MarkdownEditorContext), so bold / heading / list
 * behave exactly as in the old layout; only the look is new.
 */
const TextToolbar = () => {
  const { commands } = useMarkdownEditorContext();
  const run = (key: keyof MarkdownEditorCommands) => () => commands?.[key]();
  return (
    <div className="nd-text-toolbar" role="toolbar" aria-label={TEXT.toolbarLabel}>
      {TEXT.toolbar.map(({ key, label, title, className }) => (
        <Button
          key={key}
          type="text"
          size="small"
          className={className}
          title={title}
          aria-label={title}
          disabled={!commands}
          onClick={run(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

/**
 * Step "Text" — text.md in the TemplateMark editor.
 *
 * The editor is the legacy TemplateMarkdown container, so edits flow through
 * the app store and rebuild the agreement as in the old layout. The status
 * bar mirrors the store's error; the full message is in the footer.
 */
export const TextView = () => {
  const editorValue = useAppStore((s) => s.editorValue);
  const error = useAppStore((s) => s.error);

  const copyText = async () => {
    await navigator.clipboard?.writeText(editorValue);
    void message.success(TEXT.copied);
  };

  const checklist: ChecklistItem[] = [{ label: TEXT.help.checks.renders, tone: error ? "error" : "done" }];

  return (
    <MarkdownEditorProvider>
      <div className="nd-view nd-view-editor nd-view-text">
        <div className="nd-editor-column">
          <div className="nd-editor-title">
            <div className="nd-editor-icon nd-editor-icon-amber">{TEXT.icon}</div>
            <div className="nd-editor-title-text">
              <h1>{TEXT.title}</h1>
              <p className="nd-editor-subtitle">{TEXT.subtitle}</p>
            </div>
            <HelpRailReopen />
          </div>

          <section className="nd-editor-card nd-pane nd-pane-amber" aria-label={TEXT.paneLabel}>
            <div className="nd-editor-card-head">
              <span className="nd-mono nd-editor-file">{TEXT.file}</span>
              <span className="nd-badge nd-badge-amber">{TEXT.badge}</span>
              <div className="nd-spacer" />
              <TextToolbar />
              <Button type="text" size="small" onClick={() => void copyText()}>
                {TEXT.copy}
              </Button>
            </div>
            <div className="nd-editor-card-body nd-editor-card-body-editor">
              <TemplateMarkdown />
            </div>
            <div className="nd-editor-card-foot" role="status">
              {error ? (
                <span className="nd-status-err" title={error}>{TEXT.error}</span>
              ) : (
                <span className="nd-status-ok">{TEXT.ok}</span>
              )}
            </div>
          </section>
        </div>
        <HelpRail
          checklist={{ title: TEXT.help.checklistTitle, items: checklist }}
          why={TEXT.help.why}
          how={TEXT.help.how}
        />
      </div>
    </MarkdownEditorProvider>
  );
};

export default TextView;
