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
  enableCodeSelectionMenu?: boolean;
  enableInlineSuggestions?: boolean;
}

export interface AIConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
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

export interface EncryptedKeyData {
  credentialId: string;
  ciphertext: string;
  iv: string;
  salt: string;
}

export type KeyProtectionLevel = 'webauthn' | 'memory-only' | 'legacy-plaintext';