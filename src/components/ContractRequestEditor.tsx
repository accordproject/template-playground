import React from "react";
import { Button, Space, Badge } from "antd";
import JSONEditor from "../editors/JSONEditor";
import useAppStore from "../store/store";
import usePanelHeaderBg from "../hooks/usePanelHeaderBg";
import "../styles/components/ContractRunnerPanel.css";

const ContractRequestEditor: React.FC = () => {
  const {
    backgroundColor,
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
    requestJson: s.requestJson,
    setRequestJson: s.setRequestJson,
    executionState: s.executionState,
    isExecuting: s.isExecuting,
    initContract: s.initContract,
    triggerContract: s.triggerContract,
    logicTs: s.logicTs,
    compiledLogicJs: s.compiledLogicJs,
  }));

  const panelHeaderBg = usePanelHeaderBg();

  /*
   * `compiledLogicJs` can be null and `executionState` can be an empty string.
   * Coercing with `!!` normalizes these values to booleans for UI enable/disable logic.
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

  let statusBadge: React.ReactNode = null;
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
              onClick={() => { void initContract(); }}
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
              onClick={() => { void triggerContract(); }}
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
          id="request"
          value={requestJson}
          onChange={(val) => setRequestJson(val || "")}
        />
      </div>
    </div>
  );
};

export default ContractRequestEditor;
