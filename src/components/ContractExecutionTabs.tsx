/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useState } from "react";
import { Tabs } from "antd";
import JSONEditor from "../editors/JSONEditor";
import ObligationsList from "./ObligationsList";
import useAppStore from "../store/store";
import usePanelHeaderBg from "../hooks/usePanelHeaderBg";
import "../styles/components/ContractRunnerPanel.css";

type DiffStatus = "added" | "modified" | "removed" | "unchanged";

interface StateDiff {
  path: string;
  before: unknown;
  after: unknown;
  status: DiffStatus;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return Object.is(a, b);
  }
}

function diffState(
  before: unknown,
  after: unknown,
  parentPath = "",
): StateDiff[] {
  const diffs: StateDiff[] = [];

  if (isObject(before) && isObject(after)) {
    const keys = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]);

    for (const key of keys) {
      const path = parentPath ? `${parentPath}.${key}` : key;

      const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(after, key);

      if (!hasBefore && hasAfter) {
        diffs.push({
          path,
          before: undefined,
          after: after[key],
          status: "added",
        });
        continue;
      }

      if (hasBefore && !hasAfter) {
        diffs.push({
          path,
          before: before[key],
          after: undefined,
          status: "removed",
        });
        continue;
      }

      if (isObject(before[key]) && isObject(after[key])) {
        diffs.push(
          ...diffState(before[key], after[key], path),
        );
        continue;
      }

      diffs.push({
        path,
        before: before[key],
        after: after[key],
        status: valuesEqual(before[key], after[key])
          ? "unchanged"
          : "modified",
      });
    }

    return diffs;
  }

  if (valuesEqual(before, after)) {
    return [
      {
        path: parentPath || "state",
        before,
        after,
        status: "unchanged",
      },
    ];
  }

  return [
    {
      path: parentPath || "state",
      before,
      after,
      status: "modified",
    },
  ];
}

function formatValue(value: unknown): string {
  if (value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function DiffStatusBadge({ status }: { status: DiffStatus }) {
  const labels: Record<DiffStatus, string> = {
    added: "Added",
    modified: "Modified",
    removed: "Removed",
    unchanged: "Unchanged",
  };

  const backgrounds: Record<DiffStatus, string> = {
    added: "#166534",
    modified: "#92400e",
    removed: "#991b1b",
    unchanged: "#475569",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: 600,
        color: "#ffffff",
        background: backgrounds[status],
      }}
    >
      {labels[status]}
    </span>
  );
}

function StateDiffView({
  before,
  after,
  textColor,
}: {
  before: object;
  after: object;
  textColor: string;
}) {
  const diffs = diffState(before, after);

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        padding: "12px",
        color: textColor,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, 1fr) minmax(180px, 2fr) minmax(180px, 2fr) 100px",
          gap: "8px",
          alignItems: "start",
          fontSize: "13px",
        }}
      >
        <strong>Field</strong>
        <strong>Before</strong>
        <strong>After</strong>
        <strong>Change</strong>

        {diffs.map((diff) => {
          const isChanged = diff.status !== "unchanged";

          return (
            <React.Fragment key={diff.path}>
              <div
                style={{
                  padding: "8px",
                  fontWeight: isChanged ? 600 : 400,
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                }}
              >
                {diff.path}
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: "8px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                  background:
                    diff.status === "removed"
                      ? "rgba(255, 0, 0, 0.12)"
                      : diff.status === "modified"
                        ? "rgba(255, 165, 0, 0.12)"
                        : "transparent",
                }}
              >
                {formatValue(diff.before)}
              </pre>

              <pre
                style={{
                  margin: 0,
                  padding: "8px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                  background:
                    diff.status === "added"
                      ? "rgba(0, 200, 100, 0.12)"
                      : diff.status === "modified"
                        ? "rgba(255, 165, 0, 0.12)"
                        : "transparent",
                }}
              >
                {formatValue(diff.after)}
              </pre>

              <div
                style={{
                  padding: "8px",
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                }}
              >
                <DiffStatusBadge status={diff.status} />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {diffs.length === 0 && (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          No state changes detected.
        </div>
      )}
    </div>
  );
}

/**
 * Renders the bottom half of the Contract Runner panel.
 * Displays Response, State and Events from the latest execution.
 */
const ContractExecutionTabs: React.FC = () => {
  const {
    textColor,
    executionResponse,
    executionState,
    executionEvents,
    executionHistory,
  } = useAppStore((s) => ({
    textColor: s.textColor,
    executionResponse: s.executionResponse,
    executionState: s.executionState,
    executionEvents: s.executionEvents,
    executionHistory: s.executionHistory,
  }));

  const [activeTab, setActiveTab] = useState("response");

  const isStateEmptyObject = (() => {
    if (!executionState) return false;

    try {
      const parsed = JSON.parse(executionState);

      return (
        typeof parsed === "object" &&
        parsed !== null &&
        Object.keys(parsed).length === 0
      );
    } catch {
      return false;
    }
  })();

  const latestExecution =
    executionHistory && executionHistory.length > 0
      ? executionHistory[executionHistory.length - 1]
      : null;

  const canShowDiff =
    latestExecution?.method === "trigger" &&
    latestExecution.stateBefore !== null &&
    latestExecution.stateAfter !== null;

  const tabItems = [
    {
      key: "response",
      label: "Response",
      children: (
        <div className="contract-runner-panel-editor-container">
          {executionResponse ? (
            <JSONEditor
              id="response"
              value={executionResponse}
              readOnly={true}
            />
          ) : (
            <div
              className="contract-runner-panel-placeholder"
              style={{ color: textColor }}
            >
              No response generated yet.
            </div>
          )}
        </div>
      ),
    },

    {
      key: "state",
      label: "State",
      children: (
        <div className="contract-runner-panel-editor-container">
          {canShowDiff ? (
            <StateDiffView
              before={latestExecution.stateBefore as object}
              after={latestExecution.stateAfter as object}
              textColor={textColor}
            />
          ) : executionState && !isStateEmptyObject ? (
            <JSONEditor
              id="state"
              value={executionState}
              readOnly={true}
            />
          ) : isStateEmptyObject ? (
            <div
              className="contract-runner-panel-placeholder"
              style={{ color: textColor }}
            >
              Stateless contract (no state variables).
            </div>
          ) : (
            <div
              className="contract-runner-panel-placeholder"
              style={{ color: textColor }}
            >
              Contract state not initialized.
            </div>
          )}
        </div>
      ),
    },

    {
      key: "events",
      label: "Events",
      children: (
        <div className="contract-runner-panel-editor-container">
          <ObligationsList eventsJson={executionEvents} />
        </div>
      ),
    },
  ];

  const panelHeaderBg = usePanelHeaderBg();

  return (
    <div className="contract-runner-panel-bottom tour-execution-results">
      <Tabs
        className="contract-runner-panel-tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={
          {
            "--panel-header-bg": panelHeaderBg,
          } as React.CSSProperties
        }
      />
    </div>
  );
};

export default ContractExecutionTabs;
