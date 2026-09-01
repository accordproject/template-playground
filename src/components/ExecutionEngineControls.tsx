import React, { useMemo } from "react";
import { Segmented, Tag, Tooltip } from "antd";
import useAppStore from "../store/store";
import {
  LLMMode,
  LLM_MODES,
  isLLMConfigured,
} from "../ai-assistant/llm/LLMConfig";
import "../styles/components/ContractRunnerPanel.css";

/** Human-readable label and tooltip for each execution mode. */
const MODE_INFO: Record<LLMMode, { label: string; hint: string }> = {
  disabled: {
    label: "Disabled",
    hint: "Only run the template's compiled TypeScript logic.",
  },
  fallback: {
    label: "Fallback",
    hint: "Run the compiled logic when there is some, otherwise let the AI model execute the contract.",
  },
  force: {
    label: "Force",
    hint: "Always let the AI model execute the contract, even when compiled logic exists.",
  },
};

/**
 * The engine badge shown under the mode switch: which engine the next run will
 * use, and the model behind it when that engine is the LLM.
 */
interface EngineDescriptor {
  label: string;
  color: string;
  hint: string;
}

/**
 * Describes the engine the next run will use, following the same branch the
 * store (and the engine's TemplateArchiveProcessor) takes.
 * @returns the engine badge descriptor
 */
function useEngineDescriptor(): EngineDescriptor {
  const { llmExecutionMode, compiledLogicJs, model } = useAppStore((s) => ({
    llmExecutionMode: s.llmExecutionMode,
    compiledLogicJs: s.compiledLogicJs,
    model: s.aiConfig?.model,
  }));

  return useMemo(() => {
    const suffix = model ? ` · ${model}` : "";
    if (llmExecutionMode === "force") {
      return {
        label: `AI · forced${suffix}`,
        color: "purple",
        hint: "Every run is evaluated by the AI model, even though compiled logic may exist.",
      };
    }
    if (compiledLogicJs) {
      return {
        label: "TypeScript logic",
        color: "success",
        hint: "Runs the template's compiled logic in the sandbox.",
      };
    }
    if (llmExecutionMode === "fallback") {
      return {
        label: `AI · fallback${suffix}`,
        color: "purple",
        hint: "There is no compiled logic, so the AI model evaluates the contract.",
      };
    }
    return {
      label: "No logic · AI disabled",
      color: "error",
      hint: "There is no compiled logic and AI execution is disabled, so requests will fail.",
    };
  }, [compiledLogicJs, llmExecutionMode, model]);
}

/**
 * Chooses when the AI engine is used, mirroring `llmConfig.mode` on the
 * template-engine's `TemplateArchiveProcessor`. The provider, model and API key
 * behind that engine come from the shared AI configuration (Settings → AI
 * Configuration), so this control never duplicates them.
 */
export const ExecutionModeSwitch: React.FC = () => {
  const { llmExecutionMode, setLLMExecutionMode, isExecuting } = useAppStore((s) => ({
    llmExecutionMode: s.llmExecutionMode,
    setLLMExecutionMode: s.setLLMExecutionMode,
    isExecuting: s.isExecuting,
  }));

  return (
    <Segmented
      size="small"
      value={llmExecutionMode}
      onChange={(value) => setLLMExecutionMode(value as LLMMode)}
      disabled={isExecuting}
      aria-label="AI execution mode"
      className="contract-runner-panel-mode-switch tour-execution-mode"
      options={LLM_MODES.map((mode) => ({
        value: mode,
        label: <Tooltip title={MODE_INFO[mode].hint}>{MODE_INFO[mode].label}</Tooltip>,
      }))}
    />
  );
};

/**
 * Badges describing the engine the next run will use, plus a nudge towards the
 * AI settings when a mode needs a configuration that isn't there yet.
 */
export const ExecutionEngineTags: React.FC = () => {
  const { llmExecutionMode, aiConfig } = useAppStore((s) => ({
    llmExecutionMode: s.llmExecutionMode,
    aiConfig: s.aiConfig,
  }));

  const engine = useEngineDescriptor();
  const needsConfig = llmExecutionMode !== "disabled" && !isLLMConfigured(aiConfig);

  return (
    <>
      <Tooltip title={engine.hint}>
        <Tag color={engine.color} className="contract-runner-panel-engine-tag">
          {engine.label}
        </Tag>
      </Tooltip>

      {needsConfig && (
        <Tooltip title="Select a provider, model and API key in Settings → AI Configuration before running the AI engine.">
          <Tag color="warning" className="contract-runner-panel-engine-tag">
            AI not configured
          </Tag>
        </Tooltip>
      )}
    </>
  );
};
