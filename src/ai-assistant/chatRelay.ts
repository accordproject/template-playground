import { v4 as uuidv4 } from "uuid";
import {
  AIConfig,
  Message,
  editorsContent,
} from "../types/components/AIAssistant.types";
import { prepareSystemPrompt } from "./prompts";
import { getLLMProvider } from "./llmProviders";
import useAppStore from "../store/store";
import { extractErrorMessage } from "../utils/helpers/errorUtils";

export const loadConfigFromLocalStorage = () => {
  const setAIConfig = useAppStore.getState().setAIConfig;

  const savedProvider = localStorage.getItem("aiProvider");
  const savedModel = localStorage.getItem("aiModel");
  const savedApiKey = localStorage.getItem("aiApiKey");
  const savedCustomEndpoint = localStorage.getItem("aiCustomEndpoint");
  const savedMaxTokens = localStorage.getItem("aiResMaxTokens");

  const savedIncludeTemplateMark =
    localStorage.getItem("aiIncludeTemplateMark") === "true";
  const savedIncludeConcertoModel =
    localStorage.getItem("aiIncludeConcertoModel") === "true";
  const savedIncludeData = localStorage.getItem("aiIncludeData") === "true";

  const savedShowFullPrompt =
    localStorage.getItem("aiShowFullPrompt") === "true";
  const savedEnableCodeSelectionMenu =
    localStorage.getItem("aiEnableCodeSelectionMenu") !== "false";
  const savedEnableInlineSuggestions =
    localStorage.getItem("aiEnableInlineSuggestions") !== "false";

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

    if (savedCustomEndpoint && savedProvider === "openai-compatible") {
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
  const { updateChatState, chatAbortController, setChatAbortController } =
    useAppStore.getState();

  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }

  updateChatState({ isLoading: false });

  const { chatState, setChatState } = useAppStore.getState();
  const updatedMessages = [...chatState.messages];
  const lastMessage = updatedMessages[updatedMessages.length - 1];

  if (
    lastMessage &&
    lastMessage.role === "assistant" &&
    !lastMessage.content.endsWith("[Stopped]")
  ) {
    updatedMessages[updatedMessages.length - 1] = {
      ...lastMessage,
      content: lastMessage.content + " [Stopped]",
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
  editorType?: "markdown" | "concerto" | "json",
  onChunk?: (chunk: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void,
) => {
  const {
    aiConfig,
    chatState,
    setChatState,
    updateChatState,
    chatAbortController,
    setChatAbortController,
  } = useAppStore.getState();

  if (chatAbortController) {
    chatAbortController.abort();
    setChatAbortController(null);
  }

  const newAbortController = new AbortController();
  setChatAbortController(newAbortController);
  const signal = newAbortController.signal;

  if (!aiConfig) {
    const error = new Error("Please configure AI settings first");
    if (onError) {
      onError(error);
    } else if (addToChat) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `[ERROR] ${error.message}`,
        timestamp: new Date(),
      };

      const updatedChatState = {
        messages: [...chatState.messages, errorMessage],
        isLoading: false,
        error: null,
      };
      setChatState(updatedChatState);
    }
    return;
  }

  let systemPrompt = "";
  if (promptPreset === "textToTemplate") {
    systemPrompt = prepareSystemPrompt.textToTemplate(editorsContent, aiConfig);
  } else if (promptPreset === "createConcertoModel") {
    systemPrompt = prepareSystemPrompt.createConcertoModel(
      editorsContent,
      aiConfig,
    );
  } else if (promptPreset === "explainCode") {
    systemPrompt = prepareSystemPrompt.explainCode(
      editorsContent,
      aiConfig,
      editorType,
    );
  } else if (promptPreset === "inlineSuggestion") {
    systemPrompt = prepareSystemPrompt.inlineSuggestion(
      editorsContent,
      aiConfig,
      editorType,
    );
  } else {
    systemPrompt = prepareSystemPrompt.default(editorsContent, aiConfig);
  }

  const systemMessage: Message = {
    id: uuidv4(),
    role: "system",
    content: systemPrompt,
    timestamp: new Date(),
  };

  const userMessage: Message = {
    id: uuidv4(),
    role: "user",
    content: userInput,
    timestamp: new Date(),
  };

  const assistantMessage: Message = {
    id: uuidv4(),
    role: "assistant",
    content: " ",
    timestamp: new Date(),
  };

  let updatedChatState;

  if (addToChat) {
    updatedChatState = {
      messages: [
        ...chatState.messages,
        systemMessage,
        userMessage,
        assistantMessage,
      ],
      isLoading: true,
      error: null,
    };
    setChatState(updatedChatState);
  }

  try {
    const Provider = getLLMProvider(aiConfig);
    let fullResponse = "";

    const messagesForAPI = addToChat
      ? [...(updatedChatState?.messages.slice(0, -1) || [])]
      : [systemMessage, userMessage];

    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener("abort", () =>
        reject(new Error("Request aborted")),
      );
    });

    try {
      await Promise.race([
        Provider.streamChat(
          messagesForAPI,
          chunk => {
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
          error => {
            if (!signal.aborted) {
              if (onError) {
                onError(error);
              } else if (addToChat) {
                // Add error message to chat
                const { chatState, setChatState } = useAppStore.getState();
                const updatedMessages = [...chatState.messages];
                const simpleErrorMessage = extractErrorMessage(error);
                const errorMessage = `[ERROR] ${simpleErrorMessage}`;

                updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: errorMessage,
                };

                setChatState({
                  ...chatState,
                  messages: updatedMessages,
                  isLoading: false,
                  error: null,
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
          },
        ),
        abortPromise,
      ]);
    } catch (err) {
      if (!signal.aborted) {
        throw err;
      }
    }
  } catch (error) {
    if (!newAbortController || !newAbortController.signal.aborted) {
      const simpleErrorMessage = extractErrorMessage(error);

      if (onError) {
        onError(error instanceof Error ? error : new Error(simpleErrorMessage));
      } else if (addToChat) {
        // Add error message to chat
        const { chatState, setChatState } = useAppStore.getState();
        const updatedMessages = [...chatState.messages];
        const formattedError = `[ERROR] ${simpleErrorMessage}`;

        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          content: formattedError,
        };

        setChatState({
          ...chatState,
          messages: updatedMessages,
          isLoading: false,
          error: null,
        });
      }
    }
  }
};

loadConfigFromLocalStorage();
