/**
 * TypeScript interfaces for the Cicero Generator component suite.
 * Defines types for generator state, outputs, and pipeline configuration.
 */

// ─── Contract Brief Types ───────────────────────────────────────────────────

export interface VariableDefinition {
  name: string;
  type: string;
  description: string;
  sampleValue: unknown;
  format: string | null;
}

export interface EnumerationDefinition {
  name: string;
  values: string[];
}

export interface ConditionalProvision {
  variable: string;
  description: string;
  whenTrue: string;
  whenFalse: string;
}

export interface ObligationDefinition {
  name: string;
  type: 'event';
  fields: Array<{ name: string; type: string }>;
  trigger: string;
}

export interface TypeDefinition {
  name: string;
  fields: Array<{ name: string; type: string; initialValue?: unknown }>;
}

export interface ComputedTextPassage {
  location: string;
  expression: string;
  dependencies: string[];
}

export interface ContractBrief {
  templateName: string;
  namespace: string;
  version: string;
  isContract: boolean;
  variables: VariableDefinition[];
  enumerations: EnumerationDefinition[];
  conditionalProvisions: ConditionalProvision[];
  obligations: ObligationDefinition[];
  requestType: TypeDefinition;
  responseType: TypeDefinition;
  stateType: TypeDefinition | null;
  computedTextPassages: ComputedTextPassage[];
}

// ─── Validation Report Types ────────────────────────────────────────────────

export type CheckCategory = 'template-model' | 'model-logic' | 'template-logic' | 'structural';
export type CheckStatus = 'PASS' | 'FAIL' | 'WARN';

export interface ValidationCheck {
  category: CheckCategory;
  check: string;
  status: CheckStatus;
  message: string;
  fix: string | null;
}

export interface CorrectedArtifacts {
  'grammar.tem.md': string | null;
  'model.cto': string | null;
  'logic.ts': string | null;
}

export interface ValidationReport {
  status: 'PASS' | 'FAIL';
  checks: ValidationCheck[];
  correctedArtifacts: CorrectedArtifacts;
}

// ─── Generator Pipeline Types ───────────────────────────────────────────────

export type StepId = 'coordinator' | 'agent1' | 'agent2' | 'agent3' | 'agent4' | 'package';

export interface Step {
  id: StepId;
  label: string;
  icon: string;
}

export interface LogEntry {
  time: string;
  msg: string;
}

// ─── Generator Outputs ──────────────────────────────────────────────────────

export interface GeneratorOutputs {
  contractBrief: ContractBrief | null;
  grammarTem: string | null;
  modelCto: string | null;
  logicTs: string | null;
  validationReport: ValidationReport | string | null;
  packageJson: string | null;
  requestJson: string | null;
}

// ─── Generator State ────────────────────────────────────────────────────────

export interface CiceroGeneratorState {
  // Form inputs
  documentText: string;
  templateName: string;
  namespace: string;
  isContract: boolean;
  
  // Pipeline state
  currentStep: StepId | null;
  completedSteps: StepId[];
  failedStep: StepId | null;
  isGenerating: boolean;
  error: string | null;
  logs: LogEntry[];
  
  // Outputs
  outputs: GeneratorOutputs;
  
  // UI state
  activeTab: OutputTabId;
}

export type OutputTabId = 'brief' | 'grammar' | 'model' | 'logic' | 'validation' | 'package';

export interface OutputTab {
  id: OutputTabId;
  label: string;
  ready: boolean;
}

// ─── Component Props ────────────────────────────────────────────────────────

export interface CiceroGeneratorFormProps {
  documentText: string;
  templateName: string;
  namespace: string;
  isContract: boolean;
  isGenerating: boolean;
  hasOutput: boolean;
  onDocumentTextChange: (value: string) => void;
  onTemplateNameChange: (value: string) => void;
  onNamespaceChange: (value: string) => void;
  onIsContractChange: (value: boolean) => void;
  onGenerate: () => void;
}

export interface CiceroStepIndicatorProps {
  currentStep: StepId | null;
  completedSteps: StepId[];
  failedStep: StepId | null;
}

export interface CiceroOutputViewerProps {
  outputs: GeneratorOutputs;
  activeTab: OutputTabId;
  onTabChange: (tab: OutputTabId) => void;
}

export interface CiceroValidationReportProps {
  report: ValidationReport | string | null;
}

export interface CodeBlockProps {
  code: string;
  language: string;
  filename: string;
}

// ─── Store Actions ──────────────────────────────────────────────────────────

export interface CiceroGeneratorActions {
  setIsCiceroGeneratorOpen: (open: boolean) => void;
  setCiceroGeneratorState: (state: Partial<CiceroGeneratorState>) => void;
  resetCiceroGenerator: () => void;
  loadGeneratedTemplateToEditors: () => Promise<void>;
}

// ─── Initial State ──────────────────────────────────────────────────────────

export const initialGeneratorOutputs: GeneratorOutputs = {
  contractBrief: null,
  grammarTem: null,
  modelCto: null,
  logicTs: null,
  validationReport: null,
  packageJson: null,
  requestJson: null,
};

export const initialCiceroGeneratorState: CiceroGeneratorState = {
  documentText: '',
  templateName: '',
  namespace: '',
  isContract: false,
  currentStep: null,
  completedSteps: [],
  failedStep: null,
  isGenerating: false,
  error: null,
  logs: [],
  outputs: initialGeneratorOutputs,
  activeTab: 'brief',
};
