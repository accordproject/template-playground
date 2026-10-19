import { useMemo } from "react";
import { Button, Space, Typography, message } from "antd";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import LogicMonaco from "../../editors/LogicMonaco";
import { describeLogicModel, scaffoldFromModel } from "../../editors/logicSource";
import { STEP_ID } from "../../types/designV2.types";
import HelpRail, { HelpRailReopen, type ChecklistItem, type ChecklistTone } from "./HelpRail";
import { LOGIC } from "./constants";
import { logicStatus, type LogicStatus } from "./logicStatus";
import { useCompileOnArrival } from "./useCompileOnArrival";

/** Icon and tone of the "init() & trigger()" chip for each compile state. */
const PAIR: Record<LogicStatus, { icon: string; tone: ChecklistTone }> = {
  compiled: { icon: "✓", tone: "done" },
  failed: { icon: "✕", tone: "error" },
  compiling: { icon: "◌", tone: "todo" },
  dirty: { icon: "◉", tone: "todo" },
  notCompiled: { icon: "◉", tone: "todo" },
  empty: { icon: "○", tone: "todo" },
};

/**
 * Step "Logic" — logic.ts in the TypeScript editor, laid out as in the mock:
 * a header ("n of 2 done") carrying the two parts of the job as chips
 * (request/response types, init() & trigger()), and the editor right under it.
 * The chips hold label and state; the longer hints live in their tooltips.
 *
 * The editor is LogicMonaco, the store-bound Monaco the legacy panel uses.
 * There is no compile button: opening this step, or Simulate, compiles what
 * the editor holds (useCompileOnArrival → store.setLogicTs). A template that
 * ships logic therefore opens with both chips ticked and the bar full as
 * soon as its logic compiles; a compile error turns the chip red.
 * The types chip reads model.cto (describeLogicModel) for a request and a
 * response transaction and links to the Data step; the init/trigger
 * chip and the help-rail checklist mirror the store's compile state.
 * A template without logic opens without an editor: the card says so (and
 * that Simulate is skipped), and "Start from boilerplate" writes a skeleton
 * built from the model into the editor. Nothing is written until then.
 */
export const LogicView = () => {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const setEditorLogicTs = useAppStore((s) => s.setEditorLogicTs);
  const setView = useDesignV2Store((s) => s.setView);

  useCompileOnArrival();

  const model = useMemo(() => describeLogicModel(modelCto), [modelCto]);
  const typesOk = Boolean(model?.request && model?.response);
  const typesTag =
    model?.request && model.response ? LOGIC.typesFound(model.request.name, model.response.name) : LOGIC.typesMissing;

  const status = logicStatus({ editorLogicTs, logicTs, isCompiling, compilationErrors, compiledLogicJs });
  const pair = PAIR[status];
  const done = (typesOk ? 1 : 0) + (status === "compiled" ? 1 : 0);

  const hasLogic = editorLogicTs.trim() !== "";

  const copyLogic = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(editorLogicTs);
      void message.success(LOGIC.copied);
    } catch {
      void message.error(LOGIC.copyFailed);
    }
  };

  // Icon and label only: the chips in the card and the footer carry the detail.
  const checklist: ChecklistItem[] = [
    { label: LOGIC.chips.types.label, tone: typesOk ? "done" : "todo" },
    { label: LOGIC.chips.pair.label, tone: pair.tone },
  ];

  return (
    <div className="nd-view nd-view-editor nd-view-logic">
      <div className="nd-editor-column">
        <div className="nd-editor-title">
          <div className="nd-editor-icon nd-editor-icon-ink">{LOGIC.icon}</div>
          <div className="nd-editor-title-text">
            <h1>{LOGIC.title}</h1>
            <p className="nd-editor-subtitle">{LOGIC.subtitle}</p>
          </div>
          <Button size="small" onClick={() => void copyLogic()}>
            {LOGIC.copy}
          </Button>
          <HelpRailReopen />
        </div>

        <section className="nd-editor-card nd-pane nd-logic-card" aria-label={LOGIC.paneLabel}>
          <div className="nd-logic-head">
            <div className="nd-logic-head-row">
              <span className="nd-badge nd-badge-blue">{LOGIC.badge}</span>
              <span className="nd-mono nd-editor-file">{LOGIC.file}</span>
              <ol className="nd-logic-chips" aria-label={LOGIC.chipsLabel}>
                <li className="nd-logic-chip" title={typesOk ? LOGIC.chips.types.hint : LOGIC.typesMissingHint}>
                  <span className={`nd-check-icon nd-check-icon-${typesOk ? "done" : "todo"}`} aria-hidden="true">
                    {typesOk ? "✓" : "○"}
                  </span>
                  <span className="nd-mono nd-logic-chip-label">{LOGIC.chips.types.label}</span>
                  <span className={`nd-logic-chip-tag nd-logic-chip-tag-${typesOk ? "done" : "todo"}`}>{typesTag}</span>
                  <Button type="link" size="small" className="nd-logic-chip-action" onClick={() => setView(STEP_ID.modelData)}>
                    {LOGIC.chips.types.action}
                  </Button>
                </li>
                <li className="nd-logic-chip" title={status === "failed" ? compilationErrors[0]?.message : LOGIC.chips.pair.hint}>
                  <span className={`nd-check-icon nd-check-icon-${pair.tone}`} aria-hidden="true">{pair.icon}</span>
                  <span className="nd-mono nd-logic-chip-label">{LOGIC.chips.pair.label}</span>
                  {LOGIC.status[status] && (
                    <span className={`nd-logic-chip-tag nd-logic-chip-tag-${pair.tone}`}>{LOGIC.status[status]}</span>
                  )}
                </li>
              </ol>
              <div className="nd-spacer" />
              <span className={`nd-mono nd-logic-done ${done === 2 ? "nd-logic-done-all" : ""}`}>
                {LOGIC.doneCount(done, 2)}
              </span>
            </div>
          </div>

          {hasLogic ? (
            <div className="nd-editor-card-body nd-editor-card-body-editor nd-logic-editor">
              <LogicMonaco />
            </div>
          ) : (
            <div className="nd-editor-card-body nd-logic-empty">
              <Space direction="vertical" size={12} align="center">
                <Typography.Text strong>{LOGIC.empty.title}</Typography.Text>
                <Typography.Text type="secondary">{LOGIC.empty.body}</Typography.Text>
                <Button type="primary" onClick={() => setEditorLogicTs(scaffoldFromModel(model))}>
                  {LOGIC.empty.start}
                </Button>
              </Space>
            </div>
          )}
        </section>
      </div>
      <HelpRail
        checklist={{ title: LOGIC.help.checklistTitle, items: checklist }}
        why={LOGIC.help.why}
        how={LOGIC.help.how}
      />
    </div>
  );
};

export default LogicView;
