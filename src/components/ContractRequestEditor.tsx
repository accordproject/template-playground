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

  // Auto-compile if not compiled when Init Contract is clicked
  const handleInitContract = async () => {
    if (!compiledLogicJs && logicTs) {
      await initContract(); // This will trigger compileLogic first
    } else if (compiledLogicJs) {
      await initContract();
    }
  };

  // Auto-compile and auto-init if needed when Send Request is clicked
  const handleTriggerContract = async () => {
    if (!compiledLogicJs && logicTs) {
      // Auto-compile first
      await initContract(); // This will compile and then init
    } else if (compiledLogicJs && !executionState) {
      // Auto-init if not initialized
      await initContract();
    }
    // Now trigger the contract
    if (compiledLogicJs && executionState) {
      await triggerContract();
    }
  };

  const initTooltip = !compiledLogicJs ? "Auto-compiles logic if needed" : "";

  let triggerTooltip = "";
  if (!compiledLogicJs) {
    triggerTooltip = "Auto-compiles and initializes if needed";
  } else if (!executionState) {
    triggerTooltip = "Auto-initializes if needed";
  }

  let statusBadge: React.ReactNode = null;
  let stepIndicator: React.ReactNode = null;

  if (!compiledLogicJs) {
    statusBadge = (
      <Badge
        status="warning"
        text={
          <span className="contract-runner-panel-badge-text">
            Step 1: Compile Logic
          </span>
        }
      />
    );
    stepIndicator = (
      <div className="step-indicator">
        <div className="step active">1. Compile</div>
        <div className="step-connector"></div>
        <div className="step">2. Init</div>
        <div className="step-connector"></div>
        <div className="step">3. Execute</div>
      </div>
    );
  } else if (!executionState) {
    statusBadge = (
      <Badge
        status="processing"
        text={
          <span className="contract-runner-panel-badge-text">
            Step 2: Initialize Contract
          </span>
        }
      />
    );
    stepIndicator = (
      <div className="step-indicator">
        <div className="step completed">✓ 1. Compile</div>
        <div className="step-connector completed"></div>
        <div className="step active">2. Init</div>
        <div className="step-connector"></div>
        <div className="step">3. Execute</div>
      </div>
    );
  } else {
    statusBadge = (
      <Badge
        status="success"
        text={
          <span className="contract-runner-panel-badge-text">Ready to Execute</span>
        }
      />
    );
    stepIndicator = (
      <div className="step-indicator">
        <div className="step completed">✓ 1. Compile</div>
        <div className="step-connector completed"></div>
        <div className="step completed">✓ 2. Init</div>
        <div className="step-connector completed"></div>
        <div className="step active">3. Execute</div>
      </div>
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
        {logicTs && stepIndicator}
        <Space>
          <span
            title={initTooltip}
            className="contract-runner-panel-button-wrapper"
          >
            <Button
              size="small"
              type="default"
              onClick={handleInitContract}
              loading={isExecuting}
              disabled={isExecuting || !logicTs}
              className="contract-runner-panel-button"
            >
              Init Contract
            </Button>
          </span>
          <span
            title={triggerTooltip}
            className="contract-runner-panel-button-wrapper"
          >
            <Button
              size="small"
              type="primary"
              onClick={handleTriggerContract}
              loading={isExecuting}
              disabled={isExecuting || !logicTs}
              className="contract-runner-panel-button"
            >
              Send Request
            </Button>
          </span>
        </Space>
      </div>
      <div className="contract-runner-panel-editor-container tour-request-editor">
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
