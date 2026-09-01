import React, { useEffect } from "react";
import useAppStore from "../store/store";
import ContractRequestEditor from "./ContractRequestEditor";
import ContractExecutionTabs from "./ContractExecutionTabs";
import "../styles/components/ContractRunnerPanel.css";

/**
 * The unified panel container for executing contract logic.
 * Composed of the request editor (top) and the execution results tabs (bottom).
 */
const ContractRunnerPanel: React.FC = () => {
  const { backgroundColor, templateObject, buildTemplateFromMemory } = useAppStore((s) => ({
    backgroundColor: s.backgroundColor,
    templateObject: s.templateObject,
    buildTemplateFromMemory: s.buildTemplateFromMemory,
  }));

  /*
   * Whether the template is stateful comes off the Template object, and that is
   * normally built by compileLogic(). A template with no logic never compiles,
   * so build one here — otherwise the runner would keep offering Init and a
   * State tab for a stateless template until after its first run.
   */
  useEffect(() => {
    if (!templateObject) {
      void buildTemplateFromMemory();
    }
  }, [templateObject, buildTemplateFromMemory]);

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
