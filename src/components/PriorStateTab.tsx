/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React from "react";
import JSONEditor from "../editors/JSONEditor";
import useAppStore from "../store/store";

interface PriorStateTabProps {
  /** Placeholder text color, matching the rest of ContractExecutionTabs. */
  textColor: string;
}

/**
 * The "Prior State" tab's content: the state the selected step's trigger
 * ran against — i.e. what the contract looked like immediately before this
 * step. Always read-only: prior state is a historical input, fixed once the
 * step has run, and editing it would only make sense by recomputing this
 * step (and everything chained after it), which ChainStateTab's "Resulting
 * state" already handles via `discardChainAfter`.
 *
 * Laid out the same way as the Response tab — the editor fills the tab
 * directly, no label or boxed card around it — since both are read-only
 * JSON views of something that already happened.
 *
 * The Init step has no prior state (there's nothing before it), so it falls
 * back to an explanatory placeholder instead of an editor.
 */
const PriorStateTab: React.FC<PriorStateTabProps> = ({ textColor }) => {
  const { executionChain, selectedChainIndex } = useAppStore((s) => ({
    executionChain: s.executionChain,
    selectedChainIndex: s.selectedChainIndex,
  }));

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

  if (!step.priorState) {
    return (
      <div
        className="contract-runner-panel-placeholder"
        style={{ color: textColor }}
      >
        No prior state — this is the Init step.
      </div>
    );
  }

  return (
    <JSONEditor
      id={`prior-state-${selectedChainIndex}`}
      value={JSON.stringify(step.priorState, null, 2)}
      readOnly={true}
    />
  );
};

export default PriorStateTab;