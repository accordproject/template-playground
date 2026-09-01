/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useState } from "react";
import { Button } from "antd";
import JSONEditor from "../editors/JSONEditor";
import useAppStore from "../store/store";

interface ChainStateTabProps {
  /** Placeholder text color, matching the rest of ContractExecutionTabs. */
  textColor: string;
}

/**
 * The State tab's content once a template has an execution chain: the
 * resulting state of the selected step, and — for a step that isn't the
 * latest — a warning that later steps were computed before this state, with
 * a way to discard them. The state a step ran *against* (its prior state)
 * has its own tab now — see PriorStateTab — so this component only ever
 * shows the state that trigger produced.
 *
 * Editing never recomputes downstream steps automatically. Those steps were
 * computed against the state as it stood before the edit; silently
 * recomputing them would mean re-calling the LLM/TS logic for every step
 * after this one, which is expensive and surprising. `discardChainAfter`
 * (the button in the warning below) is the explicit alternative — it drops
 * the now-stale steps rather than trying to fix them up.
 *
 * For the same reason, "Edit before next trigger" is only enabled on the
 * latest step. The name says why: it changes what the *next* trigger will
 * read as its prior state, which is meaningless once a next trigger has
 * already run off the old value — this applies to every step including
 * Init, which stops being editable the moment Trigger 1 exists.
 */
const ChainStateTab: React.FC<ChainStateTabProps> = ({ textColor }) => {
  const {
    executionChain,
    selectedChainIndex,
    editChainStepState,
    discardChainAfter,
  } = useAppStore((s) => ({
    executionChain: s.executionChain,
    selectedChainIndex: s.selectedChainIndex,
    editChainStepState: s.editChainStepState,
    discardChainAfter: s.discardChainAfter,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const step = executionChain[selectedChainIndex];
  if (!step) {
    return (
      <div
        className="contract-runner-panel-placeholder"
        style={{ color: textColor }}
      >
        Contract state not initialized.
      </div>
    );
  }

  const isLatest = selectedChainIndex === executionChain.length - 1;

  const startEditing = () => {
    setDraftValue(JSON.stringify(step.state, null, 2));
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const saveEdit = () => {
    const err = editChainStepState(draftValue);
    if (err) {
      setError(err);
      return;
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="contract-runner-panel-chain-state">
      <div className="contract-runner-panel-chain-state-row">
        <span className="contract-runner-panel-chain-state-label">
          Resulting state{step.edited ? " (edited)" : ""}
        </span>
        {!isEditing ? (
          <span
            title={
              isLatest
                ? undefined
                : "A later trigger already ran off this state — discard the steps after it to edit"
            }
            className="contract-runner-panel-button-wrapper"
            data-disabled={!isLatest}
          >
            <Button
              size="small"
              onClick={startEditing}
              disabled={!isLatest}
              className="contract-runner-panel-button"
              data-disabled={!isLatest}
            >
              Edit before next trigger
            </Button>
          </span>
        ) : (
          <span className="contract-runner-panel-chain-state-actions">
            <Button size="small" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button size="small" type="primary" onClick={saveEdit}>
              Save edit
            </Button>
          </span>
        )}
      </div>

      <div className="contract-runner-panel-chain-state-block">
        <JSONEditor
          id={`result-state-${selectedChainIndex}`}
          value={isEditing ? draftValue : JSON.stringify(step.state, null, 2)}
          onChange={isEditing ? (val) => setDraftValue(val || "") : undefined}
          readOnly={!isEditing}
        />
      </div>

      {error && (
        <p className="contract-runner-panel-chain-state-error">{error}</p>
      )}

      {!isLatest && (
        <div className="contract-runner-panel-chain-warning">
          <span>
            Later steps in this chain were computed from the original state.
          </span>
          <Button
            size="small"
            onClick={() => discardChainAfter(selectedChainIndex)}
          >
            Discard steps after this
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChainStateTab;