import { v4 as uuidv4 } from 'uuid';
import { AIConfig, Message, editorsContent } from '../types/components/AIAssistant.types';
import { prepareSystemPrompt } from "./prompts";
import { getLLMProvider } from './llmProviders';
import useAppStore from '../store/store';

/**
 * Calculates dollar cost based on token usage.
 * Rates based on standard December 2025 market pricing (per 1M tokens).
 */
const calculateCost = (model: string, usage?: { prompt_tokens: number; completion_tokens: number }) => {
  if (!usage) return 0;
  
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'default': { input: 1.00, output: 2.00 }
  };

  const modelKey = Object.keys(rates).find(key => model.toLowerCase().includes(key)) || 'default';
  const rate = rates[modelKey];

  const inputCost = (usage.prompt_tokens / 1_000_000) * rate.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * rate.output;
  
  return inputCost + outputCost;
};

export const loadConfigFromLocalStorage = () => {
  const setAIConfig = useAppStore.getState().setAIConfig;
  
  const savedProvider = localStorage.getItem('aiProvider');
  const savedModel = localStorage.getItem('aiModel');
  const savedApiKey = localStorage.getItem('aiApiKey');
  const savedCustomEndpoint = localStorage.getItem('aiCustomEndpoint');
  const savedMaxTokens = localStorage.getItem('aiResMaxTokens');
  
  const savedIncludeTemplateMark = localStorage.getItem('aiIncludeTemplateMark') === 'true';
  const savedIncludeConcertoModel = localStorage.getItem('aiIncludeConcertoModel') === 'true';
  const savedIncludeData = localStorage.getItem('aiIncludeData') === 'true';
  
  const savedShowFullPrompt = localStorage.getItem('aiShowFullPrompt') === 'true';
  const savedEnableCodeSelectionMenu = localStorage.getItem('aiEnableCodeSelectionMenu') !== 'false';
  const savedEnableInlineSuggestions = localStorage.getItem('aiEnableInlineSuggestions') !== 'false';

  if (savedProvider && savedModel && savedApiKey) {
    const config: AIConfig = {
      provider: savedProvider,
      model: savedModel,
      apiKey: savedApiKey,
      includeTemplateMarkContent: savedIncludeTemplateMark,
      includeConcertoModelContent: savedIncludeConcertoModel,
      includeDataContent: savedIncludeData,
      showFullPrompt: savedShowFullPrompt,
      enableCodeSelectionMenu: savedEnableCodeSelectionMenu,
      enableInlineSuggestions: savedEnableInlineSuggestions,
    };
    
    if (savedCustomEndpoint && savedProvider === 'openai-compatible') {
      config.customEndpoint = savedCustomEndpoint;
    }
    
    if (savedMaxTokens) {
      config.maxTokens = parseInt(savedMaxTokens);
    }
    
    setAIConfig(config);
  }
};

export const resetChat = () => {
  const { setChatAbortController, setChatState, chatAbortController } = useAppStore.getState();
  
  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }
  
  setChatState({
    messages: [],
    isLoading: false,
    error: null,
  });
};

export const stopMessage = () => {
  const { updateChatState, chatAbortController, setChatAbortController, chatState, setChatState } = useAppStore.getState();

  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }
  
  updateChatState({ isLoading: false });
  
  const updatedMessages = [...chatState.messages];
  const lastMessage = updatedMessages[updatedMessages.length - 1];
  
  if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content.endsWith('[Stopped]')) {
    updatedMessages[updatedMessages.length - 1] = {
      ...lastMessage,
      content: lastMessage.content + ' [Stopped]',
    };
    setChatState({ ...chatState, messages: updatedMessages });
  }
};

export const sendMessage = async (
  userInput: string, 
  promptPreset: string | null, 
  editorsContent: editorsContent,
  addToChat: boolean = true,
  editorType?: 'markdown' | 'concerto' | 'json',
  onChunk?: (chunk: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
) => {
  const { 
    aiConfig, 
    chatState, 
    setChatState, 
    updateChatState,
    setChatAbortController
  } = useAppStore.getState();
  
  const oldController = useAppStore.getState().chatAbortController;
  if (oldController) oldController.abort();
  
  const newAbortController = new AbortController();
  setChatAbortController(newAbortController);
  const signal = newAbortController.signal;
  
  if (!aiConfig) {
    const error = new Error('Please configure AI settings first');
    if (onError) onError(error);
    else if (addToChat) updateChatState({ error: error.message });
    return;
  }
  
  let systemPrompt = "";
  if (promptPreset === "textToTemplate") {
    systemPrompt = prepareSystemPrompt.textToTemplate(editorsContent, aiConfig);
  } else if (promptPreset === "createConcertoModel") {
    systemPrompt = prepareSystemPrompt.createConcertoModel(editorsContent, aiConfig);
  } else if (promptPreset === "explainCode") {
    systemPrompt = prepareSystemPrompt.explainCode(editorsContent, aiConfig, editorType);
  } else if (promptPreset === "inlineSuggestion") {
    systemPrompt = prepareSystemPrompt.inlineSuggestion(editorsContent, aiConfig, editorType);
  } else {
    systemPrompt = prepareSystemPrompt.default(editorsContent, aiConfig);
  }

  const systemMessage: Message = { id: uuidv4(), role: 'system', content: systemPrompt, timestamp: new Date() };
  const userMessage: Message = { id: uuidv4(), role: 'user', content: userInput, timestamp: new Date() };
  const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: '', timestamp: new Date(), cost: 0 };
  
  if (addToChat) {
    setChatState({
      messages: [...chatState.messages, systemMessage, userMessage, assistantMessage],
      isLoading: true,
      error: null
    });
  }

  try {
    const Provider = getLLMProvider(aiConfig);
    let fullResponse = '';
    
    const messagesForAPI = [systemMessage, userMessage];

    await Provider.streamChat(
      messagesForAPI,
      (chunk) => {
        if (signal.aborted) return;
        fullResponse += chunk;
        if (onChunk) onChunk(chunk);
        
        if (addToChat) {
          const currentMessages = [...useAppStore.getState().chatState.messages];
          const lastIdx = currentMessages.length - 1;
          if (lastIdx >= 0) {
            currentMessages[lastIdx] = { ...currentMessages[lastIdx], content: fullResponse };
            updateChatState({ messages: currentMessages });
          }
        }
      },
      (error) => {
        if (signal.aborted) return;
        if (onError) onError(error);
        else if (addToChat) updateChatState({ isLoading: false, error: error.message });
      },
      (usage) => {
        if (signal.aborted) return;

        if (addToChat) {
          const finalMessages = [...useAppStore.getState().chatState.messages];
          const lastIdx = finalMessages.length - 1;
          const cost = calculateCost(aiConfig.model, usage);
          
          finalMessages[lastIdx] = {
            ...finalMessages[lastIdx],
            content: fullResponse,
            cost: cost 
          };

          setChatState({
            ...useAppStore.getState().chatState,
            messages: finalMessages,
            isLoading: false
          });
        }

        if (onComplete) onComplete();
        setChatAbortController(null);
      }
    );
  } catch (error) {
    if (!signal.aborted) {
      updateChatState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
};

/**
 * INITIALIZATION: This line runs immediately when this file is imported
 * to load saved settings from the user's browser storage.
 */
loadConfigFromLocalStorage();
