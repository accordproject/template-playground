import React from "react";
import useAppStore from "../store/store";
import ContractRequestEditor from "./ContractRequestEditor";
import ContractExecutionTabs from "./ContractExecutionTabs";
import "../styles/components/ContractRunnerPanel.css";

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
