export interface Message {
  id: string,
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
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
}

export interface editorsContent {
  editorTemplateMark: string,
  editorModelCto: string,
  editorAgreementData: string,
}

export type ChatContextType = {
  chatState: ChatState;
  sendMessage: (userInput: string, promptPreset: string | null, editorsContent: editorsContent) => Promise<void>;
  stopMessage: () => void;
  resetChat: () => void;
  aiConfig: AIConfig | null;
  setAIConfig: (config: AIConfig | null) => void;
  loadConfigFromLocalStorage: () => void;
};