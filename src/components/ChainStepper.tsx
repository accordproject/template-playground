/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React from "react";
import useAppStore from "../store/store";

/**
 * The horizontal step list above the execution tabs for a stateful template:
 * Init, then one entry per `triggerContract()` call. Selecting a step swaps
 * the Response/State/Events tabs to what that step produced — the store
 * keeps `executionResponse`/`executionState`/`executionEvents` in sync with
 * whichever step is selected, so the tabs need no changes of their own.
 *
 * `ContractExecutionTabs` only mounts this once the template is stateful and
 * the chain has at least an Init step; it renders nothing on its own for a
 * stateless template or an un-initialized one, since a chain has no meaning
 * there (`priorState` is ignored entirely for stateless templates).
 */
const ChainStepper: React.FC = () => {
  const { executionChain, selectedChainIndex, selectChainStep } = useAppStore(
    (s) => ({
      executionChain: s.executionChain,
      selectedChainIndex: s.selectedChainIndex,
      selectChainStep: s.selectChainStep,
    }),
  );

  return (
    <div className="contract-runner-panel-stepper-container">
      <p className="contract-runner-panel-stepper-label">Execution chain</p>
      <div
        className="contract-runner-panel-stepper"
        role="tablist"
        aria-label="Execution chain steps"
      >
        {executionChain.map((step, i) => (
          <React.Fragment key={i}>
            <button
              type="button"
              role="tab"
              aria-selected={i === selectedChainIndex}
              className={
                "contract-runner-panel-step" +
                (i === selectedChainIndex
                  ? " contract-runner-panel-step-active"
                  : "") +
                (step.edited ? " contract-runner-panel-step-edited" : "")
              }
              onClick={() => selectChainStep(i)}
            >
              {step.edited && (
                <span
                  className="contract-runner-panel-step-dot"
                  aria-hidden="true"
                  title="State was hand-edited"
                />
              )}
              {step.label}
            </button>
            {i < executionChain.length - 1 && (
              <span
                className="contract-runner-panel-step-connector"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ChainStepper;