/**
 * Main CiceroGenerator component - orchestrates the template generation workflow.
 */

import { useCallback, useMemo, useRef } from 'react';
import { Alert, message } from 'antd';
import useAppStore from '../../store/store';
import { runGenerationPipeline, PipelineCallbacks } from './agentPipeline';
import { StepId, LogEntry, GeneratorOutputs, OutputTabId } from './types';
import CiceroGeneratorForm from './CiceroGeneratorForm';
import CiceroStepIndicator from './CiceroStepIndicator';
import CiceroOutputViewer from './CiceroOutputViewer';

export const CiceroGenerator = (): JSX.Element => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    backgroundColor,
    aiConfig,
    setAIConfigOpen,
    ciceroGeneratorState,
    setCiceroGeneratorState,
  } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    aiConfig: state.aiConfig,
    setAIConfigOpen: state.setAIConfigOpen,
    ciceroGeneratorState: state.ciceroGeneratorState,
    setCiceroGeneratorState: state.setCiceroGeneratorState,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      containerBg: isDarkMode ? '#0f172a' : '#fafaf9',
      logBg: isDarkMode ? '#0f172a' : '#1e293b',
      logBorder: isDarkMode ? '#334155' : '#1e293b',
      logTimeColor: '#475569',
      logTextColor: '#94a3b8',
      logErrorColor: '#fca5a5',
      logSuccessColor: '#4ade80',
      warningBg: isDarkMode ? '#422006' : '#fefce8',
      warningBorder: isDarkMode ? '#854d0e' : '#fbbf24',
      warningText: isDarkMode ? '#fcd34d' : '#92400e',
    };
  }, [backgroundColor]);

  const {
    documentText,
    templateName,
    namespace,
    isContract,
    currentStep,
    completedSteps,
    failedStep,
    isGenerating,
    error,
    logs,
    outputs,
    activeTab,
  } = ciceroGeneratorState;

  const hasOutput = !!(outputs.grammarTem || outputs.modelCto || outputs.logicTs);

  const handleGenerate = useCallback(async () => {
    if (!documentText.trim()) return;

    // Check for AI config
    if (!aiConfig) {
      setAIConfigOpen(true);
      void message.info('Please configure your AI provider first');
      return;
    }

    // Reset state
    setCiceroGeneratorState({
      currentStep: null,
      completedSteps: [],
      failedStep: null,
      isGenerating: true,
      error: null,
      logs: [],
      outputs: {
        contractBrief: null,
        grammarTem: null,
        modelCto: null,
        logicTs: null,
        validationReport: null,
        packageJson: null,
        requestJson: null,
      },
      activeTab: 'brief',
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    const callbacks: PipelineCallbacks = {
      onStepStart: (step: StepId) => {
        setCiceroGeneratorState({ currentStep: step });
      },
      onStepComplete: (step: StepId) => {
        setCiceroGeneratorState({
          completedSteps: [...ciceroGeneratorState.completedSteps, step],
        });
      },
      onStepFail: (step: StepId, err: Error) => {
        setCiceroGeneratorState({
          failedStep: step,
          error: err.message,
          currentStep: null,
        });
      },
      onLog: (entry: LogEntry) => {
        setCiceroGeneratorState({
          logs: [...useAppStore.getState().ciceroGeneratorState.logs, entry],
        });
      },
      onOutputUpdate: (partial: Partial<GeneratorOutputs>) => {
        setCiceroGeneratorState({
          outputs: {
            ...useAppStore.getState().ciceroGeneratorState.outputs,
            ...partial,
          },
        });
      },
    };

    try {
      await runGenerationPipeline({
        documentText,
        templateName,
        namespace,
        isContract,
        aiConfig,
        callbacks,
        abortSignal: abortControllerRef.current.signal,
      });

      // Auto-switch to grammar tab on success
      setCiceroGeneratorState({
        activeTab: 'grammar',
        currentStep: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage !== 'Generation cancelled') {
        setCiceroGeneratorState({
          error: errorMessage,
        });
      }
    } finally {
      setCiceroGeneratorState({ isGenerating: false });
      abortControllerRef.current = null;
    }
  }, [documentText, templateName, namespace, isContract, aiConfig, setAIConfigOpen, setCiceroGeneratorState, ciceroGeneratorState.completedSteps]);

  const handleTabChange = useCallback(
    (tab: OutputTabId) => {
      setCiceroGeneratorState({ activeTab: tab });
    },
    [setCiceroGeneratorState]
  );

  // Check if provider is not Anthropic
  const showProviderWarning = aiConfig && aiConfig.provider !== 'anthropic';

  return (
    <div className="twp" style={{ background: theme.containerBg }}>
      {/* Provider warning */}
      {showProviderWarning && (
        <Alert
          message="For best results, use Anthropic Claude"
          description="The Cicero Generator is optimized for Anthropic's Claude models. Other providers may produce less accurate results."
          type="warning"
          showIcon
          style={{
            marginBottom: 16,
            background: theme.warningBg,
            borderColor: theme.warningBorder,
          }}
        />
      )}

      {/* Error display */}
      {error && (
        <Alert
          message="Generation Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setCiceroGeneratorState({ error: null })}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Step indicator - only show when running or has output */}
      {(isGenerating || hasOutput) && (
        <CiceroStepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          failedStep={failedStep}
        />
      )}

      {/* Input form */}
      <CiceroGeneratorForm
        documentText={documentText}
        templateName={templateName}
        namespace={namespace}
        isContract={isContract}
        isGenerating={isGenerating}
        hasOutput={hasOutput}
        onDocumentTextChange={(value) => setCiceroGeneratorState({ documentText: value })}
        onTemplateNameChange={(value) => setCiceroGeneratorState({ templateName: value })}
        onNamespaceChange={(value) => setCiceroGeneratorState({ namespace: value })}
        onIsContractChange={(value) => setCiceroGeneratorState({ isContract: value })}
        onGenerate={() => void handleGenerate()}
      />

      {/* Log panel */}
      {logs.length > 0 && (
        <div
          style={{
            marginTop: 16,
            background: theme.logBg,
            borderRadius: 8,
            padding: 12,
            maxHeight: 180,
            overflowY: 'auto',
            border: `1px solid ${theme.logBorder}`,
          }}
        >
          {logs.map((l, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: l.msg.startsWith('ERROR')
                  ? theme.logErrorColor
                  : l.msg.startsWith('✓')
                  ? theme.logSuccessColor
                  : theme.logTextColor,
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: theme.logTimeColor }}>{l.time}</span> {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Output viewer */}
      <CiceroOutputViewer outputs={outputs} activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default CiceroGenerator;
