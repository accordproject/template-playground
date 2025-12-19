import { v4 as uuidv4 } from 'uuid';
import { AIConfig, Message, editorsContent } from '../types/components/AIAssistant.types';
import { prepareSystemPrompt } from "./prompts";
import { getLLMProvider } from './llmProviders';
import useAppStore from '../store/store';

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
  const { setChatAbortController, setChatState } = useAppStore.getState();
  
  const chatAbortController = useAppStore.getState().chatAbortController;
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
  const { updateChatState, chatAbortController, setChatAbortController } = useAppStore.getState();

  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }
  
  updateChatState({ isLoading: false });
  
  const { chatState, setChatState } = useAppStore.getState();
  const updatedMessages = [...chatState.messages];
  const lastMessage = updatedMessages[updatedMessages.length - 1];
  
  if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content.endsWith('[Stopped]')) {
    updatedMessages[updatedMessages.length - 1] = {
      ...lastMessage,
      content: lastMessage.content + ' [Stopped]',
    };
  }
  
  setChatState({
    ...chatState,
    messages: updatedMessages,
  });
};

export const sendMessage = async (
  userInput: string, 
  promptPreset: string | null, 
  editorsContent: editorsContent,
  addToChat = true,
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
    chatAbortController,
    setChatAbortController
  } = useAppStore.getState();
  
  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }
  
  const newAbortController = new AbortController();
  setChatAbortController(newAbortController);
  const signal = newAbortController.signal;
  
  if (!aiConfig) {
    const error = new Error('Please configure AI settings first');
    if (onError) {
      onError(error);
    } else if (addToChat) {
      updateChatState({ error: error.message });
    }
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

  const systemMessage: Message = {
    id: uuidv4(),
    role: 'system',
    content: systemPrompt,
    timestamp: new Date(),
  };

  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content: userInput,
    timestamp: new Date(),
  };

  const assistantMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: ' ',
    timestamp: new Date(),
  };
  
  let updatedChatState;
  
  if (addToChat) {
    updatedChatState = {
      messages: [...chatState.messages, systemMessage, userMessage, assistantMessage],
      isLoading: true,
      error: null
    };
    setChatState(updatedChatState);
  }

  try {
    const Provider = getLLMProvider(aiConfig);
    let fullResponse = '';
    
    const messagesForAPI = addToChat ? 
      [...(updatedChatState?.messages.slice(0, -1) || [])] : 
      [systemMessage, userMessage];
    
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Request aborted')));
    });

    try {
      await Promise.race([
        Provider.streamChat(
          messagesForAPI,
          (chunk) => {
            if (signal.aborted) return;
            
            fullResponse += chunk;
            
            if (onChunk) {
              onChunk(chunk);
            }
            
            if (addToChat) {
              const { chatState, setChatState } = useAppStore.getState();
              const updatedMessages = [...chatState.messages];

              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: fullResponse,
              };
              
              setChatState({
                ...chatState,
                messages: updatedMessages,
              });
            }
          },
          (error) => {
            function extractErrorCode(input: string, depth = 0): number | undefined {
              if (depth > 3) return;

              try {
                const parsed = JSON.parse(input);

                if (typeof parsed === "string") {
                  return extractErrorCode(parsed, depth + 1);
                }

                // Common API error shapes
                if (typeof parsed?.error?.code === "number") return parsed.error.code;
                if (typeof parsed?.code === "number") return parsed.code;

                return;
              } catch {
                return;
              }
            }

            function extractErrorMessage(error: unknown): string {
            let message =
              error instanceof Error
                ? error.message
                : typeof error === "string"
                ? error
                : "";

            if (!message) return "An unknown error occurred";

            const code = extractErrorCode(message);
            if(code === 429) {
              return 'You have exceeded your usage quota. Please check your plan and try again later.';
            }

            return unwrapMessage(message);
          }

          function unwrapMessage(input: string, depth = 0): string {
            if (depth > 3) return input;

            try {
              const parsed = JSON.parse(input);

              if (typeof parsed === "string") {
                return unwrapMessage(parsed, depth + 1);
              }
              if (parsed?.error?.message) {
                return unwrapMessage(parsed.error.message, depth + 1);
              }
              if (parsed?.message) {
                return unwrapMessage(parsed.message, depth + 1);
              }

              return input;
            } catch {
              return input.trim() || "An unknown error occurred";
            }
          }


            if (!signal.aborted) {
              
              const displayMessage = extractErrorMessage(error);
              
              if (onError) {
                onError(
                  error instanceof Error ? error : new Error(displayMessage)
                );
              } else if (addToChat) {
                // Update last assistant message with simplified error message
                const { chatState, setChatState } = useAppStore.getState();
                const updatedMessages = [...chatState.messages];
                if (updatedMessages.length > 0) {
                  const lastMsgIdx = updatedMessages.length - 1;
                  if (updatedMessages[lastMsgIdx].role === "assistant") {
                    updatedMessages[lastMsgIdx] = {
                      ...updatedMessages[lastMsgIdx],
                      content: `[ERROR] Sorry, something went wrong. Please try again.\n${displayMessage}`,
                    };
                  }
                }

                setChatState({
                  ...chatState,
                  isLoading: false,
                  error: displayMessage,
                  messages: updatedMessages,
                });
              }
            }
          },
          () => {
            if (!signal.aborted) {
              if (onComplete) {
                onComplete();
              }
              
              if (addToChat) {
                updateChatState({ isLoading: false });
              }
              setChatAbortController(null);
            }
          }
        ),
        abortPromise
      ]);
    } catch (err) {
      if (!signal.aborted) {
        throw err;
      }
    }
  } catch (error) {
    if (!newAbortController || !newAbortController.signal.aborted) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      let displayMessage = errorMessage;
      // Try to parse and simplify error message if it's JSON
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed && parsed.error && parsed.error.message) {
          displayMessage = parsed.error.message;
        }
      } catch (e) {
        // Not JSON, use as is
      }
      if (onError) {
        onError(error instanceof Error ? error : new Error(displayMessage));
      } else if (addToChat) {
        // Update last assistant message with simplified error message
        const { chatState, setChatState } = useAppStore.getState();
        const updatedMessages = [...chatState.messages];
        if (updatedMessages.length > 0) {
          const lastMsgIdx = updatedMessages.length - 1;
          if (updatedMessages[lastMsgIdx].role === "assistant") {
            updatedMessages[lastMsgIdx] = {
              ...updatedMessages[lastMsgIdx],
              content: `[ERROR] Sorry, something went wrong. Please try again.\n${displayMessage}`,
            };
          }
        }

        setChatState({
          ...chatState,
          isLoading: false,
          error: displayMessage,
          messages: updatedMessages,
        });
      }
    }
  }
};

loadConfigFromLocalStorage();
