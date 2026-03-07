import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage } from '../ai-assistant/chatRelay';
import { CodeSelectionMenuProps } from '../types/components/AIAssistant.types';
import useAppStore from '../store/store';
import ReactMarkdown from "react-markdown";

const CodeSelectionMenu: React.FC<CodeSelectionMenuProps> = ({
  selectedText,
  position,
  onClose,
  editorType,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const { aiConfig, setAIConfigOpen, setAIChatOpen } = useAppStore();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleClose = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsExplaining(false);
    setShowExplanation(false);
    onClose();
  }, [abortController, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        (!explanationRef.current || !explanationRef.current.contains(event.target as Node))
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  const editorsContent = useAppStore((state) => ({
      editorTemplateMark: state.editorValue,
      editorModelCto: state.editorModelCto,
      editorAgreementData: state.editorAgreementData,
  }));

  const handleExplain = async () => {
    if (!aiConfig) {
      setAIConfigOpen(true);
      return;
    }

    if (abortController) {
      abortController.abort();
    }

    setShowExplanation(true);
    setIsExplaining(true);
    setExplanation('');

    try {
      const selectedCode = `Code: \n \`\`\`${selectedText}\`\`\` \n`
      
      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      
      await sendMessage(
        selectedCode,
        'explainCode',
        editorsContent,
        false,
        editorType,
        (chunk) => {
          if (!newAbortController.signal.aborted) {
            setExplanation(prev => prev + chunk);
          }
        },
        (error) => {
          if (!newAbortController.signal.aborted) {
            setExplanation(`Error: ${error.message}`);
            setIsExplaining(false);
          }
        },
        () => {
          if (!newAbortController.signal.aborted) {
            setIsExplaining(false);
          }
          setAbortController(null);
        }
      );
    } catch (error) {
      if (abortController && !abortController.signal.aborted) {
        setExplanation(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsExplaining(false);
      }
    }
  };

  const handleChat = async () => {
    if (!aiConfig) {
      setAIConfigOpen(true);
      return;
    }

    if (abortController) {
      abortController.abort();
    }

    setAIChatOpen(true);
    onClose();
    
    const selectedCode = `Code: \n \`\`\`${selectedText}\`\`\` \n`
    await sendMessage(
      selectedCode,
      'explainCode',
      editorsContent,
      true,
      editorType
    );
  };

  const popupPosition = {
    left: Math.max(300, Math.min(position.x, window.innerWidth - 350)),
    top: isExplaining ? position.y - 20 : Math.max(10, Math.min(position.y - 20, window.innerHeight - 300)),
  };
  
  useEffect(() => {
    if (explanationRef.current && showExplanation) {
      const popup = explanationRef.current;
      const rect = popup.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        popup.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    }
  }, [showExplanation, position]);

  if (showExplanation) {
    return (
      <div
        ref={explanationRef}
        className="twp fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50"
        style={{
          left: popupPosition.left,
          top: popupPosition.top,
          maxHeight: '80vh',
          maxWidth: '80vw',
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-0.5 right-0.5 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          aria-label="Close explanation"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className={`max-h-64 pr-6 ${isExplaining ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {isExplaining ? (
            <div className="flex items-center text-gray-500 text-sm">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Explaining...
            </div>
          ) : (
            <div className="text-sm text-gray-700 prose lg:prose-md">
              <ReactMarkdown
                components={{
                  pre: ({ children }) => {
                    return (
                      <pre className="[&_code]:bg-transparent">
                        {children}
                      </pre>
                    );
                  },
                  code: ({ children, className }) => {
                    return (
                      <code className={`bg-gray-200 p-1 rounded-md before:content-[''] after:content-[''] ${className || ''}`}>
                        {children}
                      </code>
                    );
                  }
              }}>
                {explanation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="twp fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 flex"
      style={{ 
        left: Math.max(10, Math.min(225, window.innerWidth - 150)), 
        top: Math.max(10, Math.min(position.y, window.innerHeight - 50)),
        minWidth: '120px'
      }}
    >
      <button
        onClick={() => void handleExplain()}
        className="flex-1 px-1 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-center border-r border-gray-200"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Explain
      </button>
      <button
        onClick={() => void handleChat()}
        className="flex-1 px-1 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
        </svg>
        Chat
      </button>
    </div>
  );
};

export default CodeSelectionMenu;
