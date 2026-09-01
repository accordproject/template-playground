/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import JSONEditor from "../editors/JSONEditor";
import ObligationsList from "./ObligationsList";
import ChainStepper from "./ChainStepper";
import PriorStateTab from "./PriorStateTab";
import ChainStateTab from "./ChainStateTab";
import useAppStore from "../store/store";
import usePanelHeaderBg from "../hooks/usePanelHeaderBg";
import "../styles/components/ContractRunnerPanel.css";

/**
 * Renders the bottom half of the Contract Runner panel.
 * Uses a tabbed interface to display the execution artifacts, in the order
 * they happen: Prior State, Response, State, Events. Prior State and State
 * only appear for a stateful template.
 */
const ContractExecutionTabs: React.FC = () => {
  const {
    textColor,
    executionResponse,
    executionState,
    executionEvents,
    isTemplateStateful,
    executionChain,
  } = useAppStore((s) => ({
    textColor: s.textColor,
    executionResponse: s.executionResponse,
    executionState: s.executionState,
    executionEvents: s.executionEvents,
    isTemplateStateful: s.isTemplateStateful,
    executionChain: s.executionChain,
  }));

  const [activeTab, setActiveTab] = useState("response");

  /*
   * A stateless template carries no state, so neither the Prior State nor
   * the State tab has anything to show. Fall back to Response if either
   * disappears while it is open.
   */
  useEffect(() => {
    if (
      !isTemplateStateful &&
      (activeTab === "priorState" || activeTab === "state")
    ) {
      setActiveTab("response");
    }
  }, [activeTab, isTemplateStateful]);

  const isStateEmptyObject = (() => {
    if (!executionState) return false;
    try {
      const parsed = JSON.parse(executionState);
      return typeof parsed === "object" && parsed !== null && Object.keys(parsed).length === 0;
    } catch {
      return false;
    }
  })();

  /*
   * Prior State and State share the same "is there anything to show yet"
   * fallback (no chain started / stateless template) — factored out so both
   * tab definitions below stay in sync rather than drifting.
   */
  const emptyStatePlaceholder = isStateEmptyObject ? (
    <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
      Stateless contract (no state variables).
    </div>
  ) : (
    <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
      Contract state not initialized.
    </div>
  );

  const tabItems = [
    /*
     * Tab order is Prior State, Response, State, Events — the state a step
     * ran against, then what it produced (response), then the state that
     * resulted, then its events, left to right in the order they happened.
     */
    ...(isTemplateStateful ? [{
      key: "priorState",
      label: "Prior State",
      children: (
        <div className="contract-runner-panel-editor-container">
          {executionChain.length > 0 ? (
            <PriorStateTab textColor={textColor} />
          ) : (
            emptyStatePlaceholder
          )}
        </div>
      ),
    }] : []),
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
    ...(isTemplateStateful ? [{
      key: "state",
      label: "State",
      children: (
        <div className="contract-runner-panel-editor-container">
          {executionChain.length > 0 ? (
            <ChainStateTab textColor={textColor} />
          ) : (
            emptyStatePlaceholder
          )}
        </div>
      ),
    }] : []),
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
      {isTemplateStateful && executionChain.length > 0 && <ChainStepper />}
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