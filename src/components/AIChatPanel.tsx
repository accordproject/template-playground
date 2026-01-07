import { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { message } from "antd";
import useAppStore from "../store/store";
import { sendMessage, stopMessage } from "../ai-assistant/chatRelay";
import { Attachment } from "../types/components/AIAssistant.types";
import { v4 as uuidv4 } from 'uuid';

export const AIChatPanel = () => {
  const [promptPreset, setPromptPreset] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

      inputContainer: isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300',
      inputBox: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300',
      textarea: {
        base: isDarkMode ? 'bg-transparent text-white placeholder-gray-500' : 'bg-transparent text-gray-900 placeholder-gray-400',
        loading: isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
      },
      controlButton: isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
      dropdownMenu: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
      dropdownItem: isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800',
      
      attachmentChip: isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600',
      warningBanner: isDarkMode ? 'bg-amber-950/40 border-amber-800 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-700',

      contextDot: {
        active: isDarkMode ? 'bg-blue-500' : 'bg-blue-600',
        inactive: isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-200 border border-gray-300'
      },

      inlineCode: isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
    };
  }, [backgroundColor]);
  
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
    const currentAttachments = attachments;
    
    setUserInput("");
    setAttachments([]);
    setIsDropdownOpen(false);
    
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
    
    await sendMessage(prompt, promptPreset, editorsContent, true, undefined, currentAttachments);
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;
    
    if (attachments.length + files.length > maxFiles) {
      message.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown', 'application/json', 'application/pdf'
    ];

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        message.error(`File ${file.name} exceeds 10MB limit`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        message.error(`File type ${file.type} not supported`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const attachment: Attachment = {
          id: uuidv4(),
          fileName: file.name,
          fileType: file.type.split('/')[0], // 'image', 'text', 'application'
          mimeType: file.type,
          size: file.size,
          base64Content: base64
        };
        newAttachments.push(attachment);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        message.error(`Failed to process ${file.name}`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return '📷';
      case 'text': return '📝';
      case 'application': return '📄';
      default: return '📎';
    }
  };

  const checkModelSupportsAttachments = (): { supportsVision: boolean; warning: string | null } => {
    if (!aiConfig || attachments.length === 0) {
      return { supportsVision: true, warning: null };
    }

    const hasImages = attachments.some(att => att.fileType === 'image');
    if (!hasImages) {
      return { supportsVision: true, warning: null };
    }

    const visionModels = [
      'gpt-4-vision', 'gpt-4o', 'gpt-4-turbo',
      'claude-3', 'claude-opus', 'claude-sonnet',
      'gemini-pro-vision', 'gemini-1.5'
    ];

    const modelLower = aiConfig.model.toLowerCase();
    const supportsVision = visionModels.some(vm => modelLower.includes(vm));

    if (!supportsVision && hasImages) {
      return {
        supportsVision: false,
        warning: '⚠️ Current model may not support images. Text will be extracted where possible.'
      };
    }

    return { supportsVision: true, warning: null };
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

  const renderMessageContent = (content: string) => {
    if (!content || !content.includes('```')) {
      console.log("content is", content);
      return (
        <div className="text-sm prose prose-sm break-all max-w-none" style={{ color: textColor }}>
          <ReactMarkdown
            components={{
              code: ({ children, className }) => <code className={`${theme.inlineCode} p-1 rounded-md before:content-[''] after:content-[''] ${className || ''}`}>{children}</code>,
          }}>
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
          <ReactMarkdown>
            {segments[0]}
          </ReactMarkdown>
        </div>
      );
    }
    
    for (let i = 1; i < segments.length; i++) {
      if (i % 2 === 1 && segments[i]) {
        const firstLineBreak = segments[i].indexOf('\n');
        let code = segments[i];
        
        if (firstLineBreak > -1) {
          code = segments[i].substring(firstLineBreak + 1);
        }
        
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
            <ReactMarkdown>
              {segments[i]}
            </ReactMarkdown>
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
    <div className="twp pl-4 pr-4 -mr-1 flex flex-col border rounded-md h-full">
      <div className={theme.header}>
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
      <div className="w-full h-[calc(100%-3rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 px-2 mt-4">
          <div className="space-y-2">
            {chatState.messages.length === 0 ? (
              <div className="w-full">
                <div className={`${theme.welcomeMessage} p-3 rounded-lg`}>
                  <p className={`text-xs font-semibold mb-1 ${theme.welcomeText}`}>Assistant</p>
                  <p className="text-sm" style={{ color: textColor }}>Hello! How can I help you today?</p>
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
                    <div className={`${
                      message.role === 'assistant'
                        ? theme.messageAssistant
                        : theme.messageUser
                    } p-3 rounded-lg`}>
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
                          <p className={`text-sm mt-2 italic ${theme.thinkingText}`}>Thinking...</p>
                        )
                      }
                    </div>
                  </div>
                )})
              )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 pb-1">
            {promptPreset && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 bg-opacity-90 text-white rounded text-xs self-start">
                <span className="font-medium">
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
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3 h-3"
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

            {/* Attachment warning banner */}
            {(() => {
              const { warning } = checkModelSupportsAttachments();
              return warning ? (
                <div className={`${theme.warningBanner} px-2 py-1 rounded text-xs border-l-2 flex items-center gap-1.5`}>
                  <span>{warning}</span>
                </div>
              ) : null;
            })()}

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className={`${theme.attachmentChip} px-2 py-0.5 rounded text-xs flex items-center gap-1.5 border`}
                  >
                    <span className="text-sm">{getFileIcon(att.fileType)}</span>
                    <span className="max-w-[100px] truncate">{att.fileName}</span>
                    <span className="text-gray-500 text-[10px]">({formatFileSize(att.size)})</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="hover:text-red-500 transition-colors"
                      title="Remove attachment"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-2.5 h-2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Context selection - compact with labels */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Context:</span>
              <button
                onClick={() => handleTemplateMarkToggle(!includeTemplateMarkContent)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  includeTemplateMarkContent 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${includeTemplateMarkContent ? 'bg-white' : 'bg-gray-500 dark:bg-gray-400'}`} />
                Template
              </button>
              <button
                onClick={() => handleConcertoModelToggle(!includeConcertoModelContent)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  includeConcertoModelContent 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${includeConcertoModelContent ? 'bg-white' : 'bg-gray-500 dark:bg-gray-400'}`} />
                Concerto
              </button>
              <button
                onClick={() => handleDataToggle(!includeDataContent)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  includeDataContent 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${includeDataContent ? 'bg-white' : 'bg-gray-500 dark:bg-gray-400'}`} />
                Data
              </button>
            </div>
            
            {/* Compact all-in-one input container */}
            <div className={`relative rounded-lg border transition-all ${theme.inputBox} ${
              chatState.isLoading ? 'opacity-70' : 'focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500'
            }`}>
              <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    promptPreset === "textToTemplate"
                      ? "Enter text to convert..."
                      : promptPreset === "createConcertoModel"
                      ? "Describe the model..."
                      : chatState.isLoading 
                        ? "Generating..."
                        : "Ask anything..."
                  }
                  className={`w-full px-3 pt-2 pb-9 text-sm focus:outline-none resize-none min-h-[68px] max-h-[160px] overflow-y-auto ${
                    theme.textarea.base
                  }`}
                  rows={1}
                  disabled={chatState.isLoading}
              />
              
              {/* Bottom control bar - minimal icons only */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5">
                {/* Left side controls */}
                <div className="flex items-center gap-1">
                  {/* Attachment button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={chatState.isLoading || attachments.length >= 5}
                    className={`p-2 rounded transition-colors ${theme.controlButton} disabled:opacity-40 disabled:cursor-not-allowed`}
                    title="Attach files"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                      />
                    </svg>
                  </button>
                  
                  {/* Preset dropdown button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={chatState.isLoading}
                      className={`p-2 rounded transition-colors ${theme.controlButton} disabled:opacity-40 disabled:cursor-not-allowed`}
                      title="Presets"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                        />
                      </svg>
                    </button>
                    {isDropdownOpen && !chatState.isLoading && (
                      <div className={`absolute bottom-full mb-1 left-0 w-44 rounded-md shadow-lg border ${theme.dropdownMenu}`}>
                        <button
                          onClick={() => {
                            setPromptPreset("textToTemplate");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs ${theme.dropdownItem} flex items-center gap-2`}
                        >
                          <span>📝</span> Text to TemplateMark
                        </button>
                        <button
                          onClick={() => {
                            setPromptPreset("createConcertoModel");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs ${theme.dropdownItem} flex items-center gap-2`}
                        >
                          <span>🔧</span> Create Concerto Model
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Send/Stop button */}
                <div>
                  {chatState.isLoading ? (
                    <button 
                      onClick={handleStopMessage}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Stop"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="currentColor" 
                        viewBox="0 0 24 24" 
                        className="w-5 h-5"
                      >
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={() => void handleSendMessage()}
                      disabled={!userInput.trim()}
                      className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      title="Send"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2} 
                        stroke="currentColor" 
                        className="w-5 h-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,text/plain,text/markdown,application/json,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
        </div>
    </div>
    </div>
  );
}