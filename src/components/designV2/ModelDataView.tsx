import type { ReactNode } from "react";
import { Button, Tooltip, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import useAppStore from "../../store/store";
import useDesignV2Store, { type ModelDataPane } from "../../store/designV2Store";
import TemplateModel from "../../editors/editorsContainer/TemplateModel";
import AgreementData from "../../editors/editorsContainer/AgreementData";
import { formatConcertoModel } from "../../utils/formatConcertoModel";
import HelpRail, { HelpRailReopen, type ChecklistItem } from "./HelpRail";
import { MODEL_DATA } from "./constants";

interface EditorPaneProps {
  /** Accessible name of the pane region ("Model" / "Data"). */
  label: string;
  file: string;
  badge: string;
  badgeClass: string;
  /** When set, the badge is a link (opens in a new tab). */
  badgeHref?: string;
  badgeTitle?: string;
  actions: ReactNode;
  /** Rebuild error routed to this pane, if any. */
  error?: string;
  /** Status shown when there is no error, e.g. "✓ parses". */
  okText: string;
  /** Neutral status shown instead of okText when the check could not run. */
  pendingText?: string;
  onClose: () => void;
  /** False when this is the last open pane: the × stays visible but does nothing. */
  canClose: boolean;
  children: ReactNode;
}

/** One half of the split screen: file header, Monaco editor, status bar. */
const EditorPane = ({
  label, file, badge, badgeClass, badgeHref, badgeTitle, actions, error, okText, pendingText, onClose, canClose, children,
}: EditorPaneProps) => (
  <section className="nd-editor-card nd-pane" aria-label={label}>
    <div className="nd-editor-card-head">
      <span className="nd-mono nd-editor-file">{file}</span>
      {badgeHref ? (
        <a className={`nd-badge nd-badge-link ${badgeClass}`} href={badgeHref} title={badgeTitle} target="_blank" rel="noopener noreferrer">
          {badge} ↗
        </a>
      ) : (
        <span className={`nd-badge ${badgeClass}`}>{badge}</span>
      )}
      <div className="nd-spacer" />
      {actions}
      <Tooltip title={canClose ? undefined : MODEL_DATA.keepOneOpen}>
        <Button
          type="text"
          size="small"
          className="nd-pane-close"
          aria-label={MODEL_DATA.closePane(file)}
          aria-disabled={!canClose}
          icon={<CloseOutlined />}
          onClick={canClose ? onClose : undefined}
        />
      </Tooltip>
    </div>
    <div className="nd-editor-card-body nd-editor-card-body-editor">{children}</div>
    <div className="nd-editor-card-foot" role="status">
      {error ? (
        <span className="nd-status-err" title={error}>
          {MODEL_DATA.errorPrefix} {error}
        </span>
      ) : pendingText ? (
        <span className="nd-status-pending">{pendingText}</span>
      ) : (
        <span className="nd-status-ok">{okText}</span>
      )}
    </div>
  </section>
);

/**
 * Which pane the app store's single `error` string belongs to.
 * Display-only: the message itself comes from the store's validators and the
 * Accord template engine, this just decides where to show it. CTO syntax
 * errors ("Invalid CTO model", legacy "c:" prefix) and the engine's
 * "@template decorator" errors are model problems; everything else (invalid
 * JSON, an instance that does not match the model) is a data problem.
 */
const errorPane = (error: string | undefined): "model" | "data" | null => {
  if (!error) return null;
  return /^c:|Invalid CTO model|@template decorator/i.test(error) ? "model" : "data";
};

/**
 * Step 3 — Model & Data, side by side.
 *
 * Left: model.cto in the Concerto editor. Right: data.json in the JSON editor.
 * Both are the legacy playground containers (TemplateModel / AgreementData),
 * so edits flow through the app store exactly as in the old layout: the store
 * rebuilds the agreement and validates; its error is shown in the pane it
 * belongs to. Only the chrome around the editors is new — no validation of
 * its own.
 *
 * Either pane can be closed with its × so the other one takes the full
 * width; a "+ file" chip next to the title brings it back. At least one pane
 * always stays open (see designV2Store.setPaneOpen).
 */
export const ModelDataView = () => {
  const editorModelCto = useAppStore((s) => s.editorModelCto);
  const editorAgreementData = useAppStore((s) => s.editorAgreementData);
  const error = useAppStore((s) => s.error);
  const sampleName = useAppStore((s) => s.sampleName);
  const samples = useAppStore((s) => s.samples);
  const setEditorModelCto = useAppStore((s) => s.setEditorModelCto);
  const setModelCto = useAppStore((s) => s.setModelCto);
  const setEditorAgreementData = useAppStore((s) => s.setEditorAgreementData);
  const setData = useAppStore((s) => s.setData);
  const panes = useDesignV2Store((s) => s.modelDataPanes);
  const setPaneOpen = useDesignV2Store((s) => s.setPaneOpen);
  const openCount = Number(panes.model) + Number(panes.data);
  const closedPanes = (["model", "data"] as const).filter((pane) => !panes[pane]);

  const failing = errorPane(error);
  const modelError = failing === "model" ? error : undefined;
  const dataError = failing === "data" ? error : undefined;

  const formatModel = () => {
    try {
      const formatted = formatConcertoModel(editorModelCto);
      setEditorModelCto(formatted);
      void setModelCto(formatted);
    } catch {
      void message.error(MODEL_DATA.model.formatFailed);
    }
  };

  const copyModel = async () => {
    await navigator.clipboard?.writeText(editorModelCto);
    void message.success(MODEL_DATA.model.copied);
  };

  const formatData = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(editorAgreementData), null, 2);
      setEditorAgreementData(formatted);
      void setData(formatted);
    } catch {
      void message.error(MODEL_DATA.data.formatFailed);
    }
  };

  // "reset" puts the loaded sample's original data.json back; it is greyed out while nothing changed.
  const sample = samples.find((s) => s.NAME === sampleName);
  const sampleData = sample ? JSON.stringify(sample.DATA, null, 2) : undefined;
  const canReset = sampleData !== undefined && sampleData !== editorAgreementData;
  const resetData = () => {
    if (!sample || sampleData === undefined) {
      void message.warning(MODEL_DATA.data.resetUnavailable);
      return;
    }
    setEditorAgreementData(sampleData);
    void setData(sampleData);
    void message.success(MODEL_DATA.data.resetDone(sample.NAME));
  };

  // Checklist tones mirror the store's validation result and nothing else.
  const checks = MODEL_DATA.help.checks;
  const checklist: ChecklistItem[] = [
    { label: checks.modelParses, tone: modelError ? "error" : "done" },
    // Without a parsing model the data cannot be checked against anything.
    modelError
      ? { label: checks.dataValid, tone: "todo", tag: checks.needsModel }
      : { label: checks.dataValid, tone: dataError ? "error" : "done" },
  ];

  return (
    <div className="nd-view nd-view-editor nd-view-model-data">
      <div className="nd-editor-column">
        <div className="nd-editor-title">
          <div className="nd-editor-icon">{MODEL_DATA.icon}</div>
          <div className="nd-editor-title-text">
            <h1>{MODEL_DATA.title}</h1>
            <p className="nd-editor-subtitle">{MODEL_DATA.subtitle}</p>
          </div>
          {closedPanes.map((pane: ModelDataPane) => (
            <Button key={pane} type="dashed" size="small" onClick={() => setPaneOpen(pane, true)}>
              {MODEL_DATA.reopenPane(MODEL_DATA[pane].file)}
            </Button>
          ))}
          <HelpRailReopen />
        </div>

        <div className={`nd-split ${openCount === 1 ? "nd-split-single" : ""}`}>
          {panes.model && (
          <EditorPane
            label={MODEL_DATA.model.paneLabel}
            file={MODEL_DATA.model.file}
            badge={MODEL_DATA.model.badge}
            badgeClass="nd-badge-teal"
            badgeHref={MODEL_DATA.model.badgeHref}
            badgeTitle={MODEL_DATA.model.badgeTitle}
            error={modelError}
            okText={MODEL_DATA.model.ok}
            onClose={() => setPaneOpen("model", false)}
            canClose={openCount > 1}
            actions={
              <>
                <Button type="text" size="small" onClick={formatModel} disabled={!editorModelCto.trim()}>
                  {MODEL_DATA.format}
                </Button>
                <Button type="text" size="small" onClick={() => void copyModel()}>
                  {MODEL_DATA.copy}
                </Button>
              </>
            }
          >
            <TemplateModel />
          </EditorPane>
          )}

          {panes.data && (
          <EditorPane
            label={MODEL_DATA.data.paneLabel}
            file={MODEL_DATA.data.file}
            badge={MODEL_DATA.data.badge}
            badgeClass="nd-badge-blue"
            error={dataError}
            okText={MODEL_DATA.data.ok}
            pendingText={modelError ? MODEL_DATA.data.notChecked : undefined}
            onClose={() => setPaneOpen("data", false)}
            canClose={openCount > 1}
            actions={
              <>
                <Button type="text" size="small" onClick={formatData}>
                  {MODEL_DATA.format}
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={resetData}
                  disabled={!canReset}
                  title={sample ? MODEL_DATA.data.resetTitle(sample.NAME) : undefined}
                >
                  {MODEL_DATA.reset}
                </Button>
              </>
            }
          >
            <AgreementData />
          </EditorPane>
          )}
        </div>
      </div>
      <HelpRail
        checklist={{ title: MODEL_DATA.help.checklistTitle, items: checklist }}
        why={MODEL_DATA.help.why}
        how={MODEL_DATA.help.how}
      />
    </div>
  );
};

export default ModelDataView;
