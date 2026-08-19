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

const ContractExecutionTabs: React.FC = () => {
  const {
    textColor,
    executionResponse,
    executionState,
    executionEvents,
  } = useAppStore((s) => ({
    textColor: s.textColor,
    executionResponse: s.executionResponse,
    executionState: s.executionState,
    executionEvents: s.executionEvents,
  }));

  const [activeTab, setActiveTab] = useState("response");

  const isStateEmptyObject = (() => {
    if (!executionState) return false;
    try {
      const parsed = JSON.parse(executionState);
      return typeof parsed === "object" && parsed !== null && Object.keys(parsed).length === 0;
    } catch {
      return false;
    }
  })();

  const tabItems = [
    {
      key: "response",
      label: "Response",
      children: (
        <div className="contract-runner-panel-editor-container">
          {executionResponse ? (
            <JSONEditor id="response" value={executionResponse} readOnly={true} />
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
          {executionState && !isStateEmptyObject ? (
            <JSONEditor id="state" value={executionState} readOnly={true} />
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
        style={{ "--panel-header-bg": panelHeaderBg } as React.CSSProperties}
      />
    </div>
  );
};

export default ContractExecutionTabs;
