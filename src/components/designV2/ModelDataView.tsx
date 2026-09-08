import { useMemo, type ReactNode } from "react";
import { Button, message } from "antd";
import useAppStore from "../../store/store";
import TemplateModel from "../../editors/editorsContainer/TemplateModel";
import AgreementData from "../../editors/editorsContainer/AgreementData";
import { formatConcertoModel } from "../../utils/formatConcertoModel";
import { summarizeModel, summarizeData, splitError } from "../../utils/modelDataStats";
import HelpRail from "./HelpRail";
import { MODEL_DATA } from "./constants";

interface EditorPaneProps {
  /** Accessible name of the pane region ("Model" / "Data"). */
  label: string;
  file: string;
  badge: string;
  badgeClass: string;
  actions: ReactNode;
  /** Rebuild error routed to this pane, if any. */
  error?: string;
  /** Status shown when there is no error, e.g. "✓ parses". */
  okText: string;
  /** Extra facts on the right of the status bar. */
  facts: readonly string[];
  children: ReactNode;
}

/** One half of the split screen: file header, Monaco editor, status bar. */
const EditorPane = ({ label, file, badge, badgeClass, actions, error, okText, facts, children }: EditorPaneProps) => (
  <section className="nd-editor-card nd-pane" aria-label={label}>
    <div className="nd-editor-card-head">
      <span className="nd-mono nd-editor-file">{file}</span>
      <span className={`nd-badge ${badgeClass}`}>{badge}</span>
      <div className="nd-spacer" />
      {actions}
    </div>
    <div className="nd-editor-card-body nd-editor-card-body-editor">{children}</div>
    <div className="nd-editor-card-foot" role="status">
      {error ? (
        <span className="nd-status-err" title={error}>
          {MODEL_DATA.errorPrefix} {error}
        </span>
      ) : (
        <span className="nd-status-ok">{okText}</span>
      )}
      <div className="nd-spacer" />
      {facts.map((fact, i) => (
        <span key={i} className="nd-status-fact">
          {i > 0 && <span className="nd-status-sep" aria-hidden="true">|</span>}
          {fact}
        </span>
      ))}
    </div>
  </section>
);

/**
 * Step 3 — Model & Data, side by side.
 *
 * Left: model.cto in the Concerto editor. Right: data.json in the JSON editor.
 * Both are the legacy playground containers (TemplateModel / AgreementData),
 * so edits flow through the app store exactly as in the old layout: the store
 * rebuilds the agreement, and its single `error` string is routed to the pane
 * it belongs to by splitError(). Only the chrome around the editors is new.
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

  const model = useMemo(() => summarizeModel(editorModelCto), [editorModelCto]);
  const data = useMemo(
    () => summarizeData(editorAgreementData, model.templateFields),
    [editorAgreementData, model.templateFields]
  );
  const errors = splitError(error);

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

  const resetData = () => {
    const sample = samples.find((s) => s.NAME === sampleName);
    if (!sample) {
      void message.warning(MODEL_DATA.data.resetUnavailable);
      return;
    }
    const original = JSON.stringify(sample.DATA, null, 2);
    setEditorAgreementData(original);
    void setData(original);
    void message.success(MODEL_DATA.data.resetDone(sample.NAME));
  };

  const modelFacts = [
    model.namespace ?? MODEL_DATA.model.noNamespace,
    model.templateConcept
      ? MODEL_DATA.model.template(model.templateConcept, model.templateFields.length)
      : MODEL_DATA.model.noTemplate,
  ];
  const dataFacts = [MODEL_DATA.data.required(data.present, data.required)];
  const dataError = errors.data ?? (data.parses ? undefined : MODEL_DATA.data.invalidJson);

  return (
    <div className="nd-view nd-view-editor nd-view-model-data">
      <div className="nd-editor-column">
        <div className="nd-editor-title">
          <div className="nd-editor-icon">{MODEL_DATA.icon}</div>
          <div className="nd-editor-title-text">
            <h1>{MODEL_DATA.title}</h1>
            <p className="nd-editor-subtitle">{MODEL_DATA.subtitle}</p>
          </div>
        </div>

        <div className="nd-split">
          <EditorPane
            label={MODEL_DATA.model.paneLabel}
            file={MODEL_DATA.model.file}
            badge={MODEL_DATA.model.badge}
            badgeClass="nd-badge-teal"
            error={errors.model}
            okText={MODEL_DATA.model.ok}
            facts={modelFacts}
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

          <EditorPane
            label={MODEL_DATA.data.paneLabel}
            file={MODEL_DATA.data.file}
            badge={MODEL_DATA.data.badge}
            badgeClass="nd-badge-blue"
            error={dataError}
            okText={MODEL_DATA.data.ok}
            facts={dataFacts}
            actions={
              <>
                <Button type="text" size="small" onClick={formatData}>
                  {MODEL_DATA.format}
                </Button>
                <Button type="text" size="small" onClick={resetData}>
                  {MODEL_DATA.reset}
                </Button>
              </>
            }
          >
            <AgreementData />
          </EditorPane>
        </div>
      </div>
      <HelpRail />
    </div>
  );
};

export default ModelDataView;
