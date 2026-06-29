import React, { useState } from "react";
import { Tabs, Button, Space, Badge } from "antd";
import JSONEditor from "../editors/JSONEditor";
import useAppStore from "../store/store";
import "../styles/components/ContractRunnerPanel.css";

const ContractRunnerPanel: React.FC = () => {
  const {
    backgroundColor,
    textColor,
    requestJson,
    setRequestJson,
    executionState,
    isExecuting,
    initContract,
    triggerContract,
    logicTs,
    compiledLogicJs,
  } = useAppStore((s) => ({
    backgroundColor: s.backgroundColor,
    textColor: s.textColor,
    requestJson: s.requestJson,
    setRequestJson: s.setRequestJson,
    executionState: s.executionState,
    isExecuting: s.isExecuting,
    initContract: s.initContract,
    triggerContract: s.triggerContract,
    logicTs: s.logicTs,
    compiledLogicJs: s.compiledLogicJs,
  }));

  const [activeTab, setActiveTab] = useState("response");

  const tabItems = [
    {
      key: "response",
      label: "Response",
      children: (
        <div
          className="contract-runner-panel-placeholder"
          style={{ color: textColor }}
        >
          Response Output Coming Soon...
        </div>
      ),
    },
    {
      key: "state",
      label: "State",
      children: (
        <div
          className="contract-runner-panel-placeholder"
          style={{ color: textColor }}
        >
          Contract State Coming Soon...
        </div>
      ),
    },
    {
      key: "events",
      label: "Events",
      children: (
        <div
          className="contract-runner-panel-placeholder"
          style={{ color: textColor }}
        >
          Emitted Events Coming Soon...
        </div>
      ),
    },
  ];

  const headerLight = "#f8fafc";
  const headerDark = "#1e293b";
  const panelHeaderBg =
    backgroundColor === "#ffffff" ? headerLight : headerDark;

  /* 
   * The !! operator strictly casts these string | null variables to pure booleans
   * to ensure predictable logic and avoid type warnings in the UI state.
   */
  const canInit = !!compiledLogicJs;
  const canTrigger = !!compiledLogicJs && !!executionState;

  const initTooltip = !canInit ? "Please compile the contract logic first" : "";

  let triggerTooltip = "";
  if (!compiledLogicJs) {
    triggerTooltip = "Please compile the contract logic first";
  } else if (!executionState) {
    triggerTooltip = "Please initialize the contract first";
  }

  let statusBadge = null;
  if (!compiledLogicJs) {
    statusBadge = (
      <Badge
        status="warning"
        text={
          <span className="contract-runner-panel-badge-text">
            Requires Compilation
          </span>
        }
      />
    );
  } else if (executionState) {
    statusBadge = (
      <Badge
        status="success"
        text={
          <span className="contract-runner-panel-badge-text">Initialized</span>
        }
      />
    );
  }

  const headerClass = `main-container-editor-header contract-runner-panel-header ${
    backgroundColor === "#ffffff"
      ? "main-container-editor-header-light"
      : "main-container-editor-header-dark"
  }`;

  return (
    <div
      className="contract-runner-panel-container"
      style={{ backgroundColor }}
    >
      {/* Top Half: Request Editor */}
      <div className="contract-runner-panel-top">
        <div className={headerClass} style={{ backgroundColor: panelHeaderBg }}>
          <div className="contract-runner-panel-header-left">
            <span className="contract-runner-panel-title">
              Request{" "}
              <span className="contract-runner-panel-header-subtitle">
                (JSON)
              </span>
            </span>
            {logicTs && (
              <span className="contract-runner-panel-badge-container">
                {statusBadge}
              </span>
            )}
          </div>
          <Space>
            <span
              title={initTooltip}
              className="contract-runner-panel-button-wrapper"
              data-disabled={!canInit}
            >
              <Button
                size="small"
                type="default"
                onClick={initContract}
                loading={isExecuting}
                disabled={!canInit || isExecuting}
                className="contract-runner-panel-button"
                data-disabled={!canInit}
              >
                Init Contract
              </Button>
            </span>
            <span
              title={triggerTooltip}
              className="contract-runner-panel-button-wrapper"
              data-disabled={!canTrigger}
            >
              <Button
                size="small"
                type="primary"
                onClick={triggerContract}
                loading={isExecuting}
                disabled={!canTrigger || isExecuting}
                className="contract-runner-panel-button"
                data-disabled={!canTrigger}
              >
                Send Request
              </Button>
            </span>
          </Space>
        </div>
        <div className="contract-runner-panel-editor-container">
          <JSONEditor
            value={requestJson}
            onChange={(val) => setRequestJson(val || "")}
          />
        </div>
      </div>

      {/* Bottom Half: Execution Outputs (Tabs) */}
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
    </div>
  );
};

export default ContractRunnerPanel;
