import { useEffect, useRef, useState, useMemo } from "react";
import useAppStore from "../store/store";
import { sendMessage, stopMessage } from "../ai-assistant/chatRelay";
import ChatMessage from "./ai-chat/ChatMessage";
import ChatInput from "./ai-chat/ChatInput";
import ContextToggle from "./ai-chat/ContextToggle";
import { MdSettings, MdDeleteOutline, MdClose, MdAutoAwesome } from "react-icons/md";

export const AIChatPanel = () => {
  const latestMessageRef = useRef<HTMLDivElement>(null);

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
    backgroundColor
  } = useAppStore((state) => ({
    chatState: state.chatState,
    resetChat: state.resetChat,
    aiConfig: state.aiConfig,
    setAIConfig: state.setAIConfig,
    setAIConfigOpen: state.setAIConfigOpen,
    setAIChatOpen: state.setAIChatOpen,
    backgroundColor: state.backgroundColor
  }));

  const isDarkMode = useMemo(() => backgroundColor !== '#ffffff', [backgroundColor]);

  const [contextState, setContextState] = useState({
    templateMark: localStorage.getItem('aiIncludeTemplateMark') === 'true',
    concerto: localStorage.getItem('aiIncludeConcertoModel') === 'true',
    data: localStorage.getItem('aiIncludeData') === 'true',
  });

  const handleContextToggle = (key: 'templateMark' | 'concerto' | 'data', value: boolean) => {
    setContextState(prev => ({ ...prev, [key]: value }));

    const configKeyMap = {
      templateMark: 'aiIncludeTemplateMark',
      concerto: 'aiIncludeConcertoModel',
      data: 'aiIncludeData'
    };

    localStorage.setItem(configKeyMap[key], value.toString());

    if (aiConfig) {
      const configKey = {
        templateMark: 'includeTemplateMarkContent',
        concerto: 'includeConcertoModelContent',
        data: 'includeDataContent'
      } as const;

      setAIConfig({ ...aiConfig, [configKey[key]]: value });
    }
  };

  const handleSendMessage = (input: string) => {
    if (!aiConfig) {
      setAIConfigOpen(true);
      return;
    }
    void sendMessage(input, null, editorsContent);
  };

  useEffect(() => {
    if (chatState.messages.length > 0 && latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [chatState.messages, chatState.isLoading]);

  return (
    <div className={`
      flex flex-col h-full border-l shadow-2xl transition-colors duration-300
      ${isDarkMode ? 'bg-[#121212] border-gray-800' : 'bg-white border-gray-200'}
    `}>
      <div className={`
        flex items-center justify-between px-4 py-3 border-b
        ${isDarkMode ? 'border-gray-800 bg-[#1b2540]/50' : 'border-gray-100 bg-white'}
      `}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-gradient-to-br from-[#19c6c7] to-blue-600 text-white shadow-lg`}>
            <MdAutoAwesome size={16} />
          </div>
          <h2 className={`font-bold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-400' : 'from-slate-800 to-slate-500'}`}>
            CONCERTO COPILOT
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            className={`p-2 rounded-lg border-none shadow-none bg-transparent transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title="Clear Chat"
          >
            <MdDeleteOutline size={18} />
          </button>
          <button
            onClick={() => setAIConfigOpen(true)}
            className={`p-2 rounded-lg border-none shadow-none bg-transparent transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title="Settings"
          >
            <MdSettings size={18} />
          </button>

          <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

          <button
            onClick={() => setAIChatOpen(false)}
            className={`p-2 rounded-lg border-none shadow-none bg-transparent transition-colors ${isDarkMode ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500'}`}
            title="Close Panel"
          >
            <MdClose size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatState.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-b from-[#1b2540] to-transparent' : 'bg-gradient-to-b from-slate-50 to-transparent'}`}>
              <div className="p-4 bg-gradient-to-br from-[#19c6c7] to-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white inline-flex">
                <MdAutoAwesome size={32} />
              </div>
            </div>

            <h3 className={`text-lg font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-400' : 'from-slate-800 to-slate-600'}`}>
              How can I help you today?
            </h3>

            <div className={`text-sm space-y-2 max-w-[240px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>I'm your intelligent companion for Accord Project templates.</p>
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Try asking:</p>
                <ul className="text-xs space-y-2 text-left bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                  <li>"create a sales contract from this text..."</li>
                  <li>"explain the logic in this clause..."</li>
                  <li>"fix the syntax error in my model..."</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          chatState.messages.map((msg, idx) => (
            (msg.role !== 'system') && (
              <div key={msg.id || idx} ref={idx === chatState.messages.length - 1 ? latestMessageRef : null}>
                <ChatMessage
                  message={msg}
                  isDarkMode={isDarkMode}
                  isThinking={msg.role === 'assistant' && chatState.isLoading && idx === chatState.messages.length - 1}
                />
              </div>
            )
          ))
        )}
      </div>

      <div className={`
        p-4 space-y-3 border-t
        ${isDarkMode ? 'bg-[#1b2540] border-gray-800' : 'bg-slate-50 border-gray-200'}
      `}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className={`flex items-center gap-1.5 px-1 rounded-md ${isDarkMode ? 'text-gray-400' : 'text-slate-400'}`}>
            <MdAutoAwesome size={14} />
            <span className="text-[10px] font-bold tracking-wider uppercase">Context</span>
          </div>
          <ContextToggle
            label="Template"
            isActive={contextState.templateMark}
            onToggle={(v) => handleContextToggle('templateMark', v)}
            colorClass="blue"
            isDarkMode={isDarkMode}
          />
          <ContextToggle
            label="Model"
            isActive={contextState.concerto}
            onToggle={(v) => handleContextToggle('concerto', v)}
            colorClass="green"
            isDarkMode={isDarkMode}
          />
          <ContextToggle
            label="Data"
            isActive={contextState.data}
            onToggle={(v) => handleContextToggle('data', v)}
            colorClass="yellow"
            isDarkMode={isDarkMode}
          />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          onStop={() => stopMessage()}
          isLoading={chatState.isLoading}
          isDarkMode={isDarkMode}
        />

        <div className="flex justify-between items-center px-1">
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Powered by Accord Project
          </span>
        </div>
      </div>
    </div>
  );
};