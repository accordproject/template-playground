export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  size: number;
  base64Content: string;
}

export interface Message {
  id: string,
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
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