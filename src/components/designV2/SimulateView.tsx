import { useState } from "react";
import { Button, Dropdown, Modal, type MenuProps } from "antd";
import JSONEditor from "../../editors/JSONEditor";
import useAppStore, { type LogicExecutionResult } from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import { STEP_ID } from "../../types/designV2.types";
import { SIMULATE } from "./constants";
import { pretty, runEventsSummary, runStateSummary, runStats, runSummary } from "./simulateRuns";

/*
 * Step 6: Simulate.
 *
 *   ┌ runs (46%) ───────────────┬ selected run (54%) ─────────────┐
 *   │ Simulate  [3 runs · 2 ok] │ #2  increment 2 → "…"   ✓ ok    │
 *   │ init  contract initialised│ ┌ Request ─────────────────────┐│
 *   │ #1    increment 1 → …     │ │ { "$class": …, "increment" }  ││
 *   │ #2    increment 2 → …  ●  │ ├ Response / Error ────────────┤│
 *   │ #3    increment 9 — threw │ │ { "message": … }              ││
 *   │ ┌ New request ─ reuse #2 ┐│ └───────────────────────────────┘│
 *   │ │ { … }          ▶ Send  ││ [State after …] [Events …]       │
 *   └───────────────────────────┴─────────────────────────────────┘
 *
 * Execution itself is the legacy runner's: initContract / triggerContract in
 * src/store/store.ts run inside the SandboxFrame and append to
 * executionHistory. This view only renders that history and the request
 * editor (the same JSONEditor the legacy ContractRequestEditor uses).
 * The selected run lives in useDesignV2Store so it survives step changes.
 */

const RunChip = ({ run }: { run: LogicExecutionResult }) => (
  <span className={`nd-run-id ${run.error ? "nd-run-id-failed" : ""}`}>{run.id}</span>
);

const RunStatus = ({ run }: { run: LogicExecutionResult }) => (
  <span className={`nd-run-status ${run.error ? "nd-run-status-failed" : "nd-run-status-ok"}`}>
    {run.error ? SIMULATE.status.failed : SIMULATE.status.ok}
  </span>
);

interface RunRowProps {
  run: LogicExecutionResult;
  active: boolean;
  onSelect: () => void;
}

const RunRow = ({ run, active, onSelect }: RunRowProps) => (
  <button
    type="button"
    className={`nd-run ${active ? "nd-run-active" : ""} ${run.error ? "nd-run-failed" : ""}`}
    aria-pressed={active}
    onClick={onSelect}
  >
    <RunChip run={run} />
    <span className="nd-run-summary">{runSummary(run)}</span>
    {run.method === "trigger" && <span className="nd-mono nd-run-ms">{run.durationMs}ms</span>}
    <RunStatus run={run} />
  </button>
);

interface RunDetailProps {
  run: LogicExecutionResult;
  busy: boolean;
  onRerun: () => void;
  onOpenLogic: () => void;
}

/** Right-hand column: request, response (or error), state after and events of one run. */
const RunDetail = ({ run, busy, onRerun, onOpenLogic }: RunDetailProps) => {
  const [copied, setCopied] = useState(false);
  const copyRequest = () => {
    void navigator.clipboard?.writeText(pretty(run.request));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="nd-sim-detail">
      <div className="nd-sim-detail-head">
        <RunChip run={run} />
        <span className="nd-sim-detail-summary">{runSummary(run)}</span>
        <RunStatus run={run} />
        <Button type="link" size="small" onClick={onRerun} disabled={busy}>
          {SIMULATE.rerun}
        </Button>
      </div>

      <div className="nd-sim-panes">
        <section className="nd-sim-pane" aria-label={SIMULATE.request}>
          <div className="nd-sim-pane-head">
            <span className="nd-sim-pane-title">{SIMULATE.request}</span>
            <span className="nd-mono nd-muted">{SIMULATE.json}</span>
            <span className="nd-spacer" />
            <Button type="link" size="small" onClick={copyRequest}>
              {copied ? SIMULATE.copied : SIMULATE.requestActions}
            </Button>
          </div>
          <pre className="nd-sim-code">{pretty(run.request)}</pre>
        </section>

        {run.error === null ? (
          <section className="nd-sim-pane nd-sim-pane-ok" aria-label={SIMULATE.response}>
            <div className="nd-sim-pane-head">
              <span className="nd-sim-pane-title">{SIMULATE.response}</span>
              <span className="nd-mono nd-muted">{SIMULATE.json}</span>
              <span className="nd-spacer" />
              <span className="nd-status-ok">{SIMULATE.returned}</span>
            </div>
            <pre className="nd-sim-code">{pretty(run.response)}</pre>
          </section>
        ) : (
          <section className="nd-sim-pane nd-sim-pane-failed" aria-label={SIMULATE.errorTitle}>
            <div className="nd-sim-pane-head">
              <span className="nd-sim-pane-title nd-sim-error-title">{SIMULATE.errorTitle}</span>
              <span className="nd-spacer" />
              <Button type="link" size="small" onClick={onOpenLogic}>
                {SIMULATE.openTrigger}
              </Button>
            </div>
            <div className="nd-sim-error">
              <span className="nd-sim-error-message">{run.error}</span>
              <span className="nd-mono nd-sim-error-at">
                {run.stage === "parse" ? SIMULATE.notSent : SIMULATE.thrownIn(run.method)}
              </span>
            </div>
          </section>
        )}
      </div>

      <div className="nd-sim-facts">
        <div className="nd-sim-fact">
          <span className="nd-sim-fact-label">{SIMULATE.stateAfter}</span>
          <span className="nd-spacer" />
          <span className="nd-mono nd-sim-fact-value" title={pretty(run.stateAfter)}>
            {runStateSummary(run)}
          </span>
        </div>
        <div className="nd-sim-fact">
          <span className="nd-sim-fact-label">{SIMULATE.events}</span>
          <span className="nd-spacer" />
          <span className="nd-mono nd-sim-fact-value" title={pretty(run.events)}>
            {runEventsSummary(run)}
          </span>
        </div>
      </div>
    </div>
  );
};

/** Step 6: Simulate — runs list, request editor and the selected run's request / response. */
const SimulateView = () => {
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const history = useAppStore((s) => s.executionHistory);
  const executionState = useAppStore((s) => s.executionState);
  const isExecuting = useAppStore((s) => s.isExecuting);
  const requestJson = useAppStore((s) => s.requestJson);
  const setRequestJson = useAppStore((s) => s.setRequestJson);
  const initContract = useAppStore((s) => s.initContract);
  const triggerContract = useAppStore((s) => s.triggerContract);

  const selectedRunId = useDesignV2Store((s) => s.selectedRunId);
  const selectRun = useDesignV2Store((s) => s.selectRun);
  const setView = useDesignV2Store((s) => s.setView);

  const [blockedDismissed, setBlockedDismissed] = useState(false);

  const compiled = Boolean(compiledLogicJs);
  const stats = runStats(history);
  const selected = history.find((run) => run.id === selectedRunId) ?? history[history.length - 1] ?? null;
  const initialised = Boolean(executionState);
  const triggerRuns = history.filter((run) => run.method === "trigger");
  const lastTrigger = triggerRuns[triggerRuns.length - 1];

  const openLogic = () => setView(STEP_ID.logic);

  const restart = async () => {
    await initContract();
    selectRun(null);
  };

  const send = async () => {
    await triggerContract();
    selectRun(null);
  };

  const rerun = async (run: LogicExecutionResult) => {
    if (run.method === "init") {
      await restart();
      return;
    }
    setRequestJson(pretty(run.request));
    await send();
  };

  const reuseItems: MenuProps["items"] = triggerRuns.map((run) => ({
    key: run.id,
    label: `${run.id} · ${runSummary(run)}`,
    onClick: () => setRequestJson(pretty(run.request)),
  }));

  return (
    <div className="nd-view nd-view-simulate">
      <div className="nd-sim-runs">
        <div className="nd-sim-head">
          <h1>{SIMULATE.title}</h1>
          <span className="nd-badge nd-badge-grey">{SIMULATE.stats(stats.runs, stats.ok, stats.failed)}</span>
          <span className="nd-spacer" />
          <Button
            size="small"
            onClick={() => { void restart(); }}
            disabled={!compiled || isExecuting}
            title={SIMULATE.restartHint}
          >
            {SIMULATE.restart}
          </Button>
        </div>

        <div className="nd-sim-list" role="list" aria-label={SIMULATE.runsLabel}>
          {history.length === 0 ? (
            <div className="nd-sim-empty">
              <span>{SIMULATE.noRuns}</span>
              <Button
                type="primary"
                ghost
                size="small"
                onClick={() => { void restart(); }}
                disabled={!compiled || isExecuting}
              >
                {SIMULATE.init}
              </Button>
            </div>
          ) : (
            history.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                active={selected?.id === run.id}
                onSelect={() => selectRun(run.id)}
              />
            ))
          )}
        </div>

        <div className="nd-card nd-sim-request">
          <div className="nd-card-head nd-card-head-bordered">
            <span className="nd-card-title-strong">{SIMULATE.newRequest}</span>
            <span className="nd-mono nd-muted">{SIMULATE.json}</span>
            <span className="nd-spacer" />
            {lastTrigger && (
              <Dropdown menu={{ items: reuseItems }} trigger={["click"]} placement="bottomRight">
                <Button type="text" size="small" aria-label={SIMULATE.reuseMenuLabel}>
                  {SIMULATE.reuse(lastTrigger.id)}
                </Button>
              </Dropdown>
            )}
          </div>
          <div className="nd-sim-request-body">
            <div className="nd-sim-request-editor">
              <JSONEditor id="request" value={requestJson} onChange={(val) => setRequestJson(val || "")} />
            </div>
            <Button
              type="primary"
              onClick={() => { void send(); }}
              loading={isExecuting}
              disabled={!compiled || !initialised || isExecuting}
              title={compiled && !initialised ? SIMULATE.sendHintNoInit : undefined}
            >
              {SIMULATE.send}
            </Button>
          </div>
        </div>
      </div>

      {selected ? (
        <RunDetail
          run={selected}
          busy={isExecuting}
          onRerun={() => { void rerun(selected); }}
          onOpenLogic={openLogic}
        />
      ) : (
        <div className="nd-sim-detail nd-sim-detail-empty">{SIMULATE.noSelection}</div>
      )}

      <Modal
        open={!compiled && !blockedDismissed}
        closable={false}
        maskClosable={false}
        width={440}
        title={
          <span className="nd-blocked-title">
            <span className="nd-blocked-icon" aria-hidden="true">⚠</span>
            {SIMULATE.blocked.title}
          </span>
        }
        footer={[
          <Button key="stay" onClick={() => setBlockedDismissed(true)}>
            {SIMULATE.blocked.stay}
          </Button>,
          <Button key="jump" type="primary" onClick={openLogic}>
            {SIMULATE.blocked.jump}
          </Button>,
        ]}
      >
        <p className="nd-blocked-body">{SIMULATE.blocked.body}</p>
      </Modal>
    </div>
  );
};

export default SimulateView;
