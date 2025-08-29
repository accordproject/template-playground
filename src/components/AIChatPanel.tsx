import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import useAppStore from "../store/store";
import { sendMessage, stopMessage } from "../ai-assistant/chatRelay";
import CodeDiffPopup from "./CodeDiffPopup";

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
  
  const {
    chatState,
    resetChat,
    aiConfig,
    setAIConfig,
    setAIConfigOpen,
    setAIChatOpen,
    setEditorValue,
    setTemplateMarkdown,
    setEditorModelCto,
    setModelCto,
    setEditorAgreementData,
    setData,
    textColor
  } = useAppStore.getState()
  
  const latestMessageRef = useRef<HTMLDivElement>(null);
  
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
      const updatedConfig = {
        ...aiConfig,
        includeTemplateMarkContent: checked
      };
      
      setAIConfig(updatedConfig);
    }
  };
  
  const handleConcertoModelToggle = (checked: boolean) => {
    setIncludeConcertoModelContent(checked);
    localStorage.setItem('aiIncludeConcertoModel', checked.toString());
    
    if (aiConfig) {
      const updatedConfig = {
        ...aiConfig,
        includeConcertoModelContent: checked
      };
      
      setAIConfig(updatedConfig);
    }
  };
  
  const handleDataToggle = (checked: boolean) => {
    setIncludeDataContent(checked);
    localStorage.setItem('aiIncludeData', checked.toString());
    
    if (aiConfig) {
      const updatedConfig = {
        ...aiConfig,
        includeDataContent: checked
      };
      
      setAIConfig(updatedConfig);
    }
  };
  
  const handleStopMessage = () => {
    stopMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (chatState.isLoading) {
        return;
      }
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const [showDiffPopup, setShowDiffPopup] = useState(false);
  const [diffCodeProps, setDiffCodeProps] = useState({
    newCode: "",
    currentCode: "",
    language: "",
    onApply: (_code: string) => {}
  });

  const handleApplyCode = (code: string, language: string) => {
    let currentCode = "";
    let applyFunction = (_code: string) => {};

    if (language === "concerto") {
      currentCode = editorsContent.editorModelCto;
      applyFunction = (code: string) => {
        setEditorModelCto(code);
        setModelCto(code);
      };
    } else if (language === "templatemark") {
      currentCode = editorsContent.editorTemplateMark;
      applyFunction = (code: string) => {
        setEditorValue(code);
        setTemplateMarkdown(code);
      };
    } else if (language === "json") {
      currentCode = editorsContent.editorAgreementData;
      applyFunction = (code: string) => {
        setEditorAgreementData(code);
        setData(code);
      };
    }

    const normalize = (str: string) => str.trim();
    if (normalize(currentCode) === normalize(code)) {
      applyFunction(code);
      return;
    }

    setDiffCodeProps({
      newCode: code,
      currentCode,
      language,
      onApply: applyFunction
    });
    setShowDiffPopup(true);
  };

  const renderMessageContent = (content: string) => {
    return (
      <div className="text-sm prose prose-md break-all max-w-none">
        <ReactMarkdown
          components={{
            code: ({ children, className }) => {
              if (className === undefined) return <code className={`rounded-md`}>{children}</code>;
              let language = ((className as string).match(/language-[^ ]*/)?.toString())?.split("-")[1] || "";
              const isApplicable = ["concertoApply", "templatemarkApply", "jsonApply"].includes(language);
              language = language.slice(0, -5)
              const codeContent = children?.toString() || "";

              return (
                <div className="relative">
                  {isApplicable && (
                    <button
                      onClick={() => handleApplyCode(codeContent, language)}
                      className="sticky top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors flex items-center"
                      title={`Apply to ${language} editor`}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14L4 9L9 4" />
                      <path d="M4 9H16C18.2091 9 20 10.7909 20 13C20 15.2091 18.2091 17 16 17H12" />
                    </svg>
                    </button>
                  )}
                  <code className={`rounded-md ${className} block p-4`}>{children}</code>
                </div>
              );
            }
          }}>
          {content}
        </ReactMarkdown>
      </div>
    );
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
    <div className="twp pl-4 pr-4 pt-3 flex flex-col border rounded-md h-[calc(100vh-150px)] h-full">
      <div className="flex justify-between items-center h-4">
        <h2 className="text-lg font-bold" style={{ color: textColor }}>AI Assistant</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAIConfigOpen(true)}
            className="text-gray-500 hover:text-gray-800"
            title="AI Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
          {/* Reset Chat Button */}
          <button
            onClick={resetChat}
            className="text-gray-500 hover:text-gray-800"
            title="Reset Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12a7.5 7.5 0 1 1 2.1 5.3M4.5 12V7.5m0 4.5h4.5"
              />
            </svg>
          </button>
          <button
            onClick={() => setAIChatOpen(false)}
            className="text-gray-500 hover:text-gray-800"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="w-full h-[calc(100%-1rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 px-2 mt-4">
          <div className="space-y-2">
            {chatState.messages.length === 0 ? (
              <div className="w-full">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Assistant</p>
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
              </div>
            ) : (
              chatState.messages.map((message, index) => {
                if (message.role === "system" || message.content === "") return null;
                return (
                  <div
                    key={message.id}
                    className="w-full"
                    ref={
                      ((index === chatState.messages.length - 1) || (index === chatState.messages.length - 2))  
                      
                      ? latestMessageRef 
                      : null
                    }
                  >
                    <div className={`${message.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'} p-3 rounded-lg`}>
                      <p className="text-xs font-semibold mb-1" style={{ color: textColor }}>
                          {message.role === 'assistant' ? 'Assistant' : 'You'}
                      </p>
                      {message.content && renderMessageContent(
                        (message.role === 'user') 
                          ? (aiConfig?.showFullPrompt ? (
                            `**System message:** ${chatState.messages[index-1].content}\n**User message:** ${message.content}`
                          ) : message.content)
                          : message.content
                      )}
                      
                      {message.role === 'assistant' && 
                          message.id === chatState.messages[chatState.messages.length - 1].id && 
                          chatState.isLoading && (
                          <p className="text-sm mt-2 text-gray-500 italic">Thinking...</p>
                        )
                      }
                    </div>
                  </div>
                )})
              )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
            {promptPreset && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 bg-opacity-95 text-white rounded-lg self-start">
                <span className="text-sm font-medium">
                  {
                    promptPreset === "textToTemplate" ? "Text to TemplateMark" : "Create Concerto Model"
                  }
                </span>
                <button
                onClick={() => setPromptPreset(null)}
                className="text-indigo-200 hover:text-white transition-colors"
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
                </button>
            </div>
            )}
            
            {/* Context selection row */}
            <div className="flex items-center justify-start px-2 gap-2">
              <span className="text-xs text-gray-600 mr-1" style={{color: textColor}}>Context:</span>
              {/* TemplateMark Button */}
              <div
                onClick={() => handleTemplateMarkToggle(!includeTemplateMarkContent)}
                className={
                  `px-1 py-0.5 text-xs rounded-full flex items-center cursor-pointer border transition-colors
                  ${includeTemplateMarkContent
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"}`
                }
              >
                <span>TemplateMark</span>
                {includeTemplateMarkContent && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleTemplateMarkToggle(false);
                    }}
                    className="ml-1 text-blue-700 hover:text-blue-900 focus:outline-none"
                    tabIndex={-1}
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Concerto Button */}
              <div
                onClick={() => handleConcertoModelToggle(!includeConcertoModelContent)}
                className={
                  `px-1 py-0.5 text-xs rounded-full flex items-center cursor-pointer border transition-colors
                  ${includeConcertoModelContent
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-green-50 hover:text-green-700 hover:border-green-200"}`
                }
              >
                <span>Concerto</span>
                {includeConcertoModelContent && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleConcertoModelToggle(false);
                    }}
                    className="ml-1 text-green-700 hover:text-green-900 focus:outline-none"
                    tabIndex={-1}
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Data Button */}
              <div
                onClick={() => handleDataToggle(!includeDataContent)}
                className={
                  `px-1 py-0.5 text-xs rounded-full flex items-center cursor-pointer border transition-colors
                  ${includeDataContent
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-gray-200 text-gray-500 border-gray-300 line-through opacity-70 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"}`
                }
              >
                <span>Data</span>
                {includeDataContent && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDataToggle(false);
                    }}
                    className="ml-1 text-yellow-700 hover:text-yellow-900 focus:outline-none"
                    tabIndex={-1}
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border">
              <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    promptPreset === "textToTemplate"
                      ? "Enter simple plain text of an agreement"
                      : promptPreset === "createConcertoModel"
                      ? "Describe the type of agreement for the Concerto Model"
                      : chatState.isLoading 
                        ? "Press 'Stop' to send another message..."
                        : "Type your message..."
                  }
                  className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none min-h-[42px] max-h-[42px] overflow-y-hidden ${
                    chatState.isLoading ? 'bg-gray-100' : ''
                  }`}
                  rows={1}
              />
              <div className="relative">
                  <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`h-full bg-gray-100 text-gray-700 px-3 rounded-lg hover:bg-gray-200 flex items-center justify-center ${
                    chatState.isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Select Prompt Mode"
                  disabled={chatState.isLoading}
              >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                  >
                      <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                      />
                  </svg>
                  </button>
                  {isDropdownOpen && !chatState.isLoading && (
                  <div className="absolute bottom-full mb-1 right-0 w-48 bg-white rounded-lg shadow-lg border py-1">
                      <button
                      onClick={() => {
                          setPromptPreset("textToTemplate");
                          setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                      Text to TemplateMark
                      </button>
                      <button
                      onClick={() => {
                          setPromptPreset("createConcertoModel");
                          setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                      Create Concerto Model
                      </button>
                  </div>
                  )}
              </div>
              
              {chatState.isLoading ? (
                <button 
                  onClick={handleStopMessage}
                  className="bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-4 h-4 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                  </svg>
                  <span>Stop</span>
                </button>
              ) : (
                <button 
                  onClick={() => void handleSendMessage()}
                  disabled={!userInput.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  Send
              </button>
              )}
            </div>
        </div>
    </div>
    {showDiffPopup && (
      <CodeDiffPopup
        newCode={diffCodeProps.newCode}
        currentCode={diffCodeProps.currentCode}
        language={diffCodeProps.language}
        onApply={diffCodeProps.onApply}
        onClose={() => setShowDiffPopup(false)}
      />
    )}
    </div>
  );
}