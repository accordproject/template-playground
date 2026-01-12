export interface TokenUsage{
  prompt_tokens:number;
  completion_token:number;
  total_tokens:number;
  estimated_cost?:number;
}
export interface Message {
  id: string,
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  usage?:TokenUsage;
  cost?:number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  totalUsage?:{
    totalPromptTokens:number;
    totalCompletionTokens:number;
    totalCost: number;
  };
}

export interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  customEndpoint?: string;
  maxTokens?: number;
  showFullPrompt?: boolean;
  includeTemplateMarkContent: boolean;
  includeConcertoModelContent: boolean;
  includeDataContent: boolean;
  enableCodeSelectionMenu?: boolean;
  enableInlineSuggestions?: boolean;
}

export interface AIConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export interface editorsContent {
  editorTemplateMark: string,
  editorModelCto: string,
  editorAgreementData: string,
}

export interface CodeSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  editorType: 'markdown' | 'concerto' | 'json';
}
