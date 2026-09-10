import { Button, Tooltip, message } from "antd";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import LogicMonaco from "../../editors/LogicMonaco";
import { DEFAULT_LOGIC_BOILERPLATE } from "../../editors/logicSource";
import { STEP_ID } from "../../types/designV2.types";
import HelpRail, { HelpRailReopen, type ChecklistItem, type ChecklistTone } from "./HelpRail";
import { LOGIC } from "./constants";
import { logicStatus, type LogicStatus } from "./logicStatus";

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
 * a progress header ("n of 2 done") carrying the two parts of the job as chips
 * (request/response types, init() & trigger()), and the editor right under it.
 * The chips hold label and state; the longer hints live in their tooltips.
 *
 * The editor is LogicMonaco, the store-bound Monaco the legacy panel uses.
 * Compiling happens through the footer's "Apply & Compile" (store.setLogicTs).
 * The types row points at the Model & Data step, where they are declared;
 * the init/trigger row and the help-rail checklist mirror the store's
 * compile state — nothing here inspects the code itself.
 */
export const LogicView = () => {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const setEditorLogicTs = useAppStore((s) => s.setEditorLogicTs);
  const setView = useDesignV2Store((s) => s.setView);

  const status = logicStatus({ editorLogicTs, logicTs, isCompiling, compilationErrors, compiledLogicJs });
  const pair = PAIR[status];
  // As in the mock: the types row counts as done (they live in the model), init/trigger once compiled.
  const done = 1 + (status === "compiled" ? 1 : 0);
  const editorEmpty = editorLogicTs.trim() === "";

  const scaffold = () => {
    setEditorLogicTs(DEFAULT_LOGIC_BOILERPLATE);
    void message.success(LOGIC.scaffoldDone);
  };

  const copyLogic = async () => {
    await navigator.clipboard?.writeText(editorLogicTs);
    void message.success(LOGIC.copied);
  };

  const checklist: ChecklistItem[] = [
    { label: LOGIC.rows.types.label, tone: "done" },
    { label: LOGIC.rows.pair.label, tone: pair.tone, tag: LOGIC.status[status] },
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
          <Tooltip title={editorEmpty ? undefined : LOGIC.scaffoldBlocked}>
            <Button size="small" onClick={scaffold} disabled={!editorEmpty}>
              {LOGIC.scaffold}
            </Button>
          </Tooltip>
          <HelpRailReopen />
        </div>

        <section className="nd-editor-card nd-pane nd-logic-card" aria-label={LOGIC.paneLabel}>
          <div className="nd-logic-head">
            <div className="nd-logic-head-row">
              <span className="nd-badge nd-badge-blue">{LOGIC.badge}</span>
              <span className="nd-mono nd-editor-file">{LOGIC.file}</span>
              <ol className="nd-logic-chips" aria-label={LOGIC.chipsLabel}>
                <li className="nd-logic-chip" title={LOGIC.rows.types.hint}>
                  <span className="nd-check-icon nd-check-icon-done" aria-hidden="true">✓</span>
                  <span className="nd-mono nd-logic-chip-label">{LOGIC.rows.types.label}</span>
                  <Button type="link" size="small" className="nd-logic-chip-action" onClick={() => setView(STEP_ID.modelData)}>
                    {LOGIC.rows.types.action}
                  </Button>
                </li>
                <li className="nd-logic-chip" title={status === "failed" ? compilationErrors[0]?.message : LOGIC.rows.pair.hint}>
                  <span className={`nd-check-icon nd-check-icon-${pair.tone}`} aria-hidden="true">{pair.icon}</span>
                  <span className="nd-mono nd-logic-chip-label">{LOGIC.rows.pair.label}</span>
                  <span className={`nd-logic-chip-tag nd-logic-chip-tag-${pair.tone}`}>{LOGIC.status[status]}</span>
                </li>
              </ol>
              <div className="nd-spacer" />
              <span className={`nd-mono nd-logic-done ${done === 2 ? "nd-logic-done-all" : ""}`}>
                {LOGIC.doneCount(done, 2)}
              </span>
            </div>
            <div className="nd-logic-progress" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={done}>
              <div className="nd-logic-progress-bar" style={{ width: `${(done / 2) * 100}%` }} />
            </div>
          </div>

          <div className="nd-editor-card-body nd-editor-card-body-editor nd-logic-editor">
            <LogicMonaco />
          </div>
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
