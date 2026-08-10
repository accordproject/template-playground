import React, { useState } from "react";
import { Tabs } from "antd";
import JSONEditor from "../editors/JSONEditor";
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

  const panelHeaderBg = usePanelHeaderBg();

  const [activeTab, setActiveTab] = useState("response");

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
          {executionState ? (
            <JSONEditor id="state" value={executionState} readOnly={true} />
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
          {executionEvents ? (
            <JSONEditor id="events" value={executionEvents} readOnly={true} />
          ) : (
            <div
              className="contract-runner-panel-placeholder"
              style={{ color: textColor }}
            >
              No events emitted.
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="contract-runner-panel-bottom">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
        className="contract-runner-panel-tabs"
        tabBarStyle={{
          backgroundColor: panelHeaderBg,
          color: textColor,
        }}
      />
    </div>
  );
};

export default ContractExecutionTabs;
