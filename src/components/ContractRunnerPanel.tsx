import React from "react";
import useAppStore from "../store/store";
import ContractRequestEditor from "./ContractRequestEditor";
import ContractExecutionTabs from "./ContractExecutionTabs";
import "../styles/components/ContractRunnerPanel.css";

/**
 * The unified panel container for executing contract logic.
 * Composed of the request editor (top) and the execution results tabs (bottom).
 */
const ContractRunnerPanel: React.FC = () => {
  const { backgroundColor } = useAppStore((s) => ({
    backgroundColor: s.backgroundColor,
  }));

  return (
    <div
      className="contract-runner-panel-container"
      style={{ backgroundColor }}
    >
      <ContractRequestEditor />
      <ContractExecutionTabs />
    </div>
  );
};

export default ContractRunnerPanel;
