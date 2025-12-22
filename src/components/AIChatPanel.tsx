import { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import useAppStore from "../store/store";
import { sendMessage, stopMessage } from "../ai-assistant/chatRelay";

export const AIChatPanel = () => {
  const [promptPreset, setPromptPreset] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editorsContent = useAppStore((state) => ({
    editorTemplateMark: state.editorValue,
    editorModelCto: state.editorModelCto,
    editorAgreementData: state.editorAgreementData,
  }));

  const { chatState, resetChat, aiConfig, setAIConfig, setAIConfigOpen, setAIChatOpen, textColor, backgroundColor } = useAppStore((state) => ({
    chatState: state.chatState,
    resetChat: state.resetChat,
    aiConfig: state.aiConfig,
    setAIConfig: state.setAIConfig,
    setAIConfigOpen: state.setAIConfigOpen,
    setAIChatOpen: state.setAIChatOpen,
    textColor: state.textColor,
    backgroundColor: state.backgroundColor
  }));

  const latestMessageRef = useRef<HTMLDivElement>(null);

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      header: `h-10 -ml-4 -mr-4 -mt-1 p-2 border-gray-200 text-sm font-medium flex justify-between items-center ${
        isDarkMode ? 'bg-gray-700 text-white' : 'bg-slate-100 text-gray-700'
      }`,
      welcomeMessage: isDarkMode ? 'bg-blue-900' : 'bg-blue-100',
      welcomeText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      messageAssistant: isDarkMode ? 'bg-blue-900' : 'bg-blue-100',
      messageUser: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
      thinkingText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      inputContainer: isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200',
      textarea: {
        base: isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900',
        loading: isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
      },
      dropdownButton: isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      dropdownMenu: isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200',
      dropdownItem: isDarkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-gray-900',
      contextButtons: {
        templateMark: {
          active: isDarkMode ? 'bg-blue-900 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-200',
          inactive: isDarkMode ? 'bg-gray-700 text-gray-400 border-gray-600 line-through opacity-70 hover:bg-blue-900 hover:text-blue-300 hover:border-blue-700' : 'bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
          cross: isDarkMode ? 'text-blue-300 hover:text-blue-100' : 'text-blue-700 hover:text-blue-900'
        },
        concerto: {
          active: isDarkMode ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-200',
          inactive: isDarkMode ? 'bg-gray-700 text-gray-400 border-gray-600 line-through opacity-70 hover:bg-green-900 hover:text-green-300 hover:border-green-700' : 'bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-green-50 hover:text-green-700 hover:border-green-200',
          cross: isDarkMode ? 'text-green-300 hover:text-green-100' : 'text-green-700 hover:text-green-900'
        },
        data: {
          active: isDarkMode ? 'bg-yellow-900 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-700 border-yellow-200',
          inactive: isDarkMode ? 'bg-gray-700 text-gray-400 border-gray-600 line-through opacity-70 hover:bg-yellow-900 hover:text-yellow-300 hover:border-yellow-700' : 'bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200',
          cross: isDarkMode ? 'text-yellow-300 hover:text-yellow-100' : 'text-yellow-700 hover:text-yellow-900'
        }
      },
      inlineCode: isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
    };
  }, [backgroundColor]);


  const totalSessionCost = useMemo(() => {
    return chatState.messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
  }, [chatState.messages]);

  const formatCurrency = (value: number) => {
    if (value === 0) return "$0.00";
    return value < 0.01 ? `$${value.toFixed(6)}` : `$${value.toFixed(2)}`;
  };

  const [includeTemplateMarkContent, setIncludeTemplateMarkContent] = useState<boolean>(
    localStorage.getItem('aiIncludeTemplateMark') === 'true'
  );
  const [includeConcertoModelContent, setIncludeConcertoModelContent] = useState<boolean>(
    localStorage.getItem('aiIncludeConcertoModel') === 'true'
  );
  const [includeDataContent, setIncludeDataContent] = useState<boolean>(
    localStorage.getItem('aiIncludeData') === 'true'
  );

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    if (!aiConfig) {
      setAIConfigOpen(true);
      return;
    }
    const prompt = userInput;
    setUserInput("");
    setIsDropdownOpen(false);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
    await sendMessage(prompt, promptPreset, editorsContent);
  };

  const handleTemplateMarkToggle = (checked: boolean) => {
    setIncludeTemplateMarkContent(checked);
    localStorage.setItem('aiIncludeTemplateMark', checked.toString());
    if (aiConfig) {
      setAIConfig({ ...aiConfig, includeTemplateMarkContent: checked });
    }
  };

  const handleConcertoModelToggle = (checked: boolean) => {
    setIncludeConcertoModelContent(checked);
    localStorage.setItem('aiIncludeConcertoModel', checked.toString());
    if (aiConfig) {
      setAIConfig({ ...aiConfig, includeConcertoModelContent: checked });
    }
  };

  const handleDataToggle = (checked: boolean) => {
    setIncludeDataContent(checked);
    localStorage.setItem('aiIncludeData', checked.toString());
    if (aiConfig) {
      setAIConfig({ ...aiConfig, includeDataContent: checked });
    }
  };

  const handleStopMessage = () => stopMessage();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (chatState.isLoading) return;
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content || !content.includes('```')) {
      return (
        <div className="text-sm prose prose-sm break-all max-w-none" style={{ color: textColor }}>
          <ReactMarkdown
            components={{
              code: ({ children, className }) => (
                <code className={`${theme.inlineCode} p-1 rounded-md ${className}`}>
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    const parts = [];
    let key = 0;
    const segments = content.split('```');

    if (segments[0]) {
      parts.push(
        <div className="text-sm prose prose-sm max-w-none" key={key++} style={{ color: textColor }}>
          <ReactMarkdown>{segments[0]}</ReactMarkdown>
        </div>
      );
    }

    for (let i = 1; i < segments.length; i++) {
      if (i % 2 === 1 && segments[i]) {
        const firstLineBreak = segments[i].indexOf('\n');
        const code = firstLineBreak > -1 ? segments[i].substring(firstLineBreak + 1) : segments[i];
        parts.push(
          <div key={key++} className="relative mt-2 mb-2">
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
              {code.trim()}
            </pre>
          </div>
        );
      } else if (i % 2 === 0 && segments[i]) {
        parts.push(
          <div className="text-sm prose prose-sm max-w-none" key={key++} style={{ color: textColor }}>
            <ReactMarkdown>{segments[i]}</ReactMarkdown>
          </div>
        );
      }
    }
    return parts;
  };

  useEffect(() => {
    if (chatState.messages.length > 0 && latestMessageRef.current) {
      const messageContainer = latestMessageRef.current.closest('.overflow-y-auto');
      if (messageContainer) {
        setTimeout(() => {
          const messageTop = latestMessageRef.current!.offsetTop;
          messageContainer.scrollTop = messageTop - 50;
        }, 100);
      }
    }
  }, [chatState.messages, chatState.isLoading]);

  return (
    <div className="twp pl-4 pr-4 -mr-1 flex flex-col border rounded-md h-[calc(100vh-150px)] h-full">
      {/* Header */}
      <div className={theme.header}>
        <h2 className="text-lg font-bold" style={{ color: textColor }}>AI Assistant</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] opacity-70" style={{ color: textColor }}>Session Cost</span>
            <span className="font-mono font-bold text-xs" style={{ color: textColor }}>{formatCurrency(totalSessionCost)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAIConfigOpen(true)} className="text-gray-500 hover:text-gray-800" title="AI Settings">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
            <button onClick={resetChat} className="text-gray-500 hover:text-gray-800" title="Reset Chat">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 1 2.1 5.3M4.5 12V7.5m0 4.5h4.5" />
              </svg>
            </button>
            <button onClick={() => setAIChatOpen(false)} className="text-gray-500 hover:text-gray-800" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-[calc(100%-3rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 px-2 mt-4">
          <div className="space-y-4">
            {chatState.messages.length === 0 ? (
              <div className={`${theme.welcomeMessage} p-3 rounded-lg`}>
                <p className={`text-xs font-semibold mb-1 ${theme.welcomeText}`}>Assistant</p>
                <p className="text-sm" style={{ color: textColor }}>Hello! How can I help you today?</p>
              </div>
            ) : (
              chatState.messages.map((message, index) => {
                if (message.role === "system" || message.content === "") return null;
                return (
                  <div key={message.id} className="w-full" ref={index >= chatState.messages.length - 2 ? latestMessageRef : null}>
                    <div className={`${message.role === 'assistant' ? theme.messageAssistant : theme.messageUser} p-3 rounded-lg`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-semibold" style={{ color: textColor }}>
                          {message.role === 'assistant' ? 'Assistant' : 'You'}
                        </p>
                        {/* FIX: Properly closed cost span with consistent quotes */}
                        {message.role === 'assistant' && message.cost !== undefined && message.cost > 0 && (
                          <span className="text-[10px] font-mono opacity-60" title="Cost of this response">
                            Cost: {formatCurrency(message.cost)}
                          </span>
                        )}
                      </div>
                      {renderMessageContent(
                        message.role === 'user' && aiConfig?.showFullPrompt && index > 0
                          ? `**System message:** ${chatState.messages[index - 1].content}\n**User message:** ${message.content}`
                          : message.content
                      )}

                      {message.role === 'assistant' && index === chatState.messages.length - 1 && chatState.isLoading && (
                        <p className={`text-sm mt-2 italic ${theme.thinkingText}`}>Thinking...</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex flex-col gap-2 pb-2">
          {promptPreset && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg self-start">
              <span className="text-sm font-medium">
                {promptPreset === "textToTemplate" ? "Text to TemplateMark" : "Create Concerto Model"}
              </span>
              <button onClick={() => setPromptPreset(null)} className="text-indigo-200 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center justify-start px-2 gap-2">
            <span className="text-xs text-gray-600" style={{ color: textColor }}>Context:</span>
            {[
              { id: 'tm', label: 'TemplateMark', state: includeTemplateMarkContent, toggle: handleTemplateMarkToggle, styles: theme.contextButtons.templateMark },
              { id: 'co', label: 'Concerto', state: includeConcertoModelContent, toggle: handleConcertoModelToggle, styles: theme.contextButtons.concerto },
              { id: 'da', label: 'Data', state: includeDataContent, toggle: handleDataToggle, styles: theme.contextButtons.data }
            ].map(btn => (
              <div key={btn.id} onClick={() => btn.toggle(!btn.state)} className={`px-2 py-0.5 text-[10px] rounded-full flex items-center cursor-pointer border transition-colors ${btn.state ? btn.styles.active : btn.styles.inactive}`}>
                <span>{btn.label}</span>
              </div>
            ))}
          </div>

          <div className={`flex gap-2 p-2 rounded-lg border ${theme.inputContainer}`}>
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatState.isLoading ? "Press 'Stop' to send another message..." : "Type your message..."
              }
              className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[42px] max-h-[42px] ${chatState.isLoading ? theme.textarea.loading : theme.textarea.base}`}
              rows={1}
            />
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`h-full px-2 rounded-lg ${theme.dropdownButton}`} disabled={chatState.isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className={`absolute bottom-full mb-1 right-0 w-48 rounded-lg shadow-lg border py-1 z-50 ${theme.dropdownMenu}`}>
                  <button onClick={() => { setPromptPreset("textToTemplate"); setIsDropdownOpen(false); }} className={`w-full px-4 py-2 text-left text-sm ${theme.dropdownItem}`}>Text to TemplateMark</button>
                  <button onClick={() => { setPromptPreset("createConcertoModel"); setIsDropdownOpen(false); }} className={`w-full px-4 py-2 text-left text-sm ${theme.dropdownItem}`}>Create Concerto Model</button>
                </div>
              )}
            </div>
            {chatState.isLoading ? (
              <button onClick={handleStopMessage} className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
                <span>Stop</span>
              </button>
            ) : (
              <button onClick={() => void handleSendMessage()} disabled={!userInput.trim()} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};