import React from "react";
import { Button, Badge, Modal } from "antd";
import JSONEditor from "../editors/JSONEditor";
import useAppStore from "../store/store";
import usePanelHeaderBg from "../hooks/usePanelHeaderBg";
import {
  ExecutionEngineTags,
  ExecutionModeSwitch,
} from "./ExecutionEngineControls";
import { isLLMConfigured } from "../ai-assistant/llm/LLMConfig";
import "../styles/components/ContractRunnerPanel.css";

/**
 * Provides a JSON editor for authoring the request payload.
 * Also houses the execution engine controls, the primary execution action
 * buttons ("Init Contract" and "Send Request"), and the current execution
 * readiness status.
 */
const ContractRequestEditor: React.FC = () => {
  const {
    backgroundColor,
    requestJson,
    setRequestJson,
    isExecuting,
    executingOperation,
    initContract,
    triggerContract,
    logicTs,
    compiledLogicJs,
    llmExecutionMode,
    isTemplateStateful,
    isContractInitialized,
    aiConfig,
    executionChain,
    selectedChainIndex,
  } = useAppStore((s) => ({
    backgroundColor: s.backgroundColor,
    requestJson: s.requestJson,
    setRequestJson: s.setRequestJson,
    isExecuting: s.isExecuting,
    executingOperation: s.executingOperation,
    initContract: s.initContract,
    triggerContract: s.triggerContract,
    logicTs: s.logicTs,
    compiledLogicJs: s.compiledLogicJs,
    llmExecutionMode: s.llmExecutionMode,
    isTemplateStateful: s.isTemplateStateful,
    isContractInitialized: s.isContractInitialized,
    aiConfig: s.aiConfig,
    executionChain: s.executionChain,
    selectedChainIndex: s.selectedChainIndex,
  }));

  const panelHeaderBg = usePanelHeaderBg();

  /*
   * Which engine the next run would use — the same decision the store (and the
   * engine's TemplateArchiveProcessor) makes, so the buttons and their tooltips
   * never promise a run that would immediately fail.
   *
   * `compiledLogicJs` can be null and `executionState` can be an empty string.
   * Coercing with `!!` normalizes these values to booleans for UI enable/disable logic.
   */
  const forceLLM = llmExecutionMode === "force";
  const usesLLM = forceLLM || (llmExecutionMode !== "disabled" && !compiledLogicJs);
  const usesTypeScript = !forceLLM && !!compiledLogicJs;
  const llmReady = isLLMConfigured(aiConfig);

  const canInit = usesTypeScript || (usesLLM && llmReady);
  /*
   * Sending a request only ever extends the chain from its latest step —
   * see triggerContract's guard in the store. Branching from a past step
   * would need trigger()'s single priorState-in/state-out contract to
   * support more than one state per step, which it doesn't.
   */
  const isOnLatestChainStep =
    executionChain.length === 0 || selectedChainIndex === executionChain.length - 1;
  /*
   * A stateful contract can only be triggered once it has been initialized
   * under the engine that is selected now. `isContractInitialized` resets on
   * every mode change, so switching engines re-locks the button rather than
   * letting the previous engine's init stand in for one this engine never ran.
   */
  const canTrigger =
    canInit && (!isTemplateStateful || isContractInitialized) && isOnLatestChainStep;

  let engineTooltip = "";
  if (!usesTypeScript && !usesLLM) {
    engineTooltip =
      "No compiled logic and AI execution is disabled — compile the logic or switch the mode to Fallback";
  } else if (usesLLM && !llmReady) {
    engineTooltip =
      "Configure a provider, model and API key in Settings → AI Configuration first";
  }

  const initTooltip = engineTooltip;

  let triggerTooltip = engineTooltip;
  if (!triggerTooltip && isTemplateStateful && !isContractInitialized) {
    triggerTooltip = "Please initialize the contract first";
  } else if (!triggerTooltip && !isOnLatestChainStep) {
    triggerTooltip = "Select the latest step in the chain before sending a new request";
  }

  /*
   * Once a chain exists, Init effectively means "start a new chain" — so
   * confirm before clearing history the user may still want, rather than
   * quietly discarding it the way a first Init (with no chain yet) can.
   */
  const handleInitClick = () => {
    if (executionChain.length > 0) {
      Modal.confirm({
        title: "Start a new execution chain?",
        content:
          "This clears the current chain — every step since the last Init — and starts over.",
        okText: "Clear and Init",
        okButtonProps: { danger: true },
        onOk: () => {
          void initContract();
        },
      });
      return;
    }
    void initContract();
  };

  let statusBadge: React.ReactNode = null;
  if (!compiledLogicJs && !usesLLM) {
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
  } else if (!isTemplateStateful) {
    statusBadge = (
      <Badge
        status="default"
        text={
          <span className="contract-runner-panel-badge-text">
            Stateless — no init needed
          </span>
        }
      />
    );
  } else if (isContractInitialized) {
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
      {/*
        * The header stacks into rows — title + mode switch, then the engine
        * badges, then the actions. A container query collapses the first row
        * onto two lines once the panel itself gets narrow, so the layout
        * follows the panel rather than the viewport.
        */}
      <div className={headerClass} style={{ backgroundColor: panelHeaderBg }}>
        <div className="contract-runner-panel-header-row contract-runner-panel-title-row">
          <span className="contract-runner-panel-title">
            Request{" "}
            <span className="contract-runner-panel-header-subtitle">
              (JSON)
            </span>
          </span>
          <ExecutionModeSwitch />
        </div>

        <div className="contract-runner-panel-header-row contract-runner-panel-tag-row">
          <ExecutionEngineTags />
          {logicTs && statusBadge}
        </div>

        <div className="contract-runner-panel-header-row contract-runner-panel-action-row">
          {/*
            * Stateless templates have no state to seed, so the engine skips
            * init entirely — hiding the button keeps the runner honest about
            * what the template supports.
            */}
          {isTemplateStateful && (
            <span
              title={initTooltip}
              className="contract-runner-panel-button-wrapper tour-init-contract"
              data-disabled={!canInit}
            >
              <Button
                size="small"
                type="default"
                onClick={handleInitClick}
                loading={executingOperation === "init"}
                disabled={!canInit || isExecuting}
                className="contract-runner-panel-button"
                data-disabled={!canInit}
              >
                Init Contract
              </Button>
            </span>
          )}
          <span
            title={triggerTooltip}
            className="contract-runner-panel-button-wrapper tour-send-request"
            data-disabled={!canTrigger}
          >
            <Button
              size="small"
              type="primary"
              onClick={() => { void triggerContract(); }}
              loading={executingOperation === "trigger"}
              disabled={!canTrigger || isExecuting}
              className="contract-runner-panel-button"
              data-disabled={!canTrigger}
            >
              Send Request
            </Button>
          </span>
        </div>
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