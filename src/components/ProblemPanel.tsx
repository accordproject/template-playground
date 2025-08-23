import React, { useMemo, useState } from 'react';
import useAppStore from '../store/store';
import '../styles/components/ProblemPanel.css';
import { sendMessage } from '../ai-assistant/chatRelay';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

export interface ProblemItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: Date;
}

const ProblemPanel: React.FC = () => {
  const { error, backgroundColor, textColor } = useAppStore((state) => ({ 
    error: state.error,
    backgroundColor: state.backgroundColor,
    textColor: state.textColor
  }));

  const [isSending, setIsSending] = useState(false);

  const editorsContent = useAppStore((state) => ({
    editorTemplateMark: state.editorValue,
    editorModelCto: state.editorModelCto,
    editorAgreementData: state.editorAgreementData,
  }));

  const handleFixProblem = async (problem: ProblemItem) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const prompt = `Fix this ${problem.type}: ${problem.message}
      Source: ${problem.source || 'Unknown'}
      ${problem.line ? `Line: ${problem.line}` : ''}
      ${problem.column ? `Column: ${problem.column}` : ''}`;

      await sendMessage(prompt, null, editorsContent);
      useAppStore.getState().setAIChatOpen(true);
    } finally {
      setIsSending(false);
    }
  };
  
  const parseError = (errorMessage: string) => {
    const errors: Omit<ProblemItem, 'id' | 'timestamp'>[] = [];
    
    const errorParts = errorMessage.split(/\n(?=Error:|TypeError:|SyntaxError:|ReferenceError:)/);
    
    errorParts.forEach((part) => {
      if (!part.trim()) return;
      
      const lineMatch = part.match(/[Ll]ine (\d+)/);
      const columnMatch = part.match(/[Cc]olumn? (\d+)/);
      
      let type: 'error' | 'warning' | 'info' = 'error';
      let source = 'Template Compilation';
      
      if (part.includes('Warning') || part.includes('warning')) {
        type = 'warning';
      } else if (part.includes('Info') || part.includes('info')) {
        type = 'info';
      }
      
      if (part.includes('model') || part.includes('Model') || part.includes('CTO')) {
        source = 'Concerto Model';
      } else if (part.includes('template') || part.includes('Template') || part.includes('mark')) {
        source = 'TemplateMark';
      } else if (part.includes('data') || part.includes('JSON')) {
        source = 'JSON Data';
      }
      
      errors.push({
        type,
        message: part.trim(),
        source,
        line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        column: columnMatch ? parseInt(columnMatch[1]) : undefined,
      });
    });
    
    return errors;
  };
  
  const problems = useMemo((): ProblemItem[] => {
    if (!error) return [];
    
    const parsedErrors = parseError(error);
    return parsedErrors.map((parsedError, index) => ({
      id: `error-${Date.now()}-${index}`,
      timestamp: new Date(),
      ...parsedError
    }));
  }, [error]);
  

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="problem-panel-container" style={{ backgroundColor }}>
      <div className={`problem-panel-header ${backgroundColor === '#ffffff' ? 'problem-panel-header-light' : 'problem-panel-header-dark'}`}>
        <span className="problem-panel-title">Problems</span>
        {problems.length > 0 && (
          <button
            onClick={() => handleFixProblem(problems[0])}
            disabled={isSending}
            className="relative flex items-center px-2 py-1 bg-blue-400 hover:bg-blue-600 text-white rounded-md text-sm"
            title="Ask AI to fix this problem"
          >
            <div className="relative w-5 h-5 mr-1.5">
              <IoChatbubbleEllipsesOutline size={20} />
              <div
                className="absolute -top-2.5 -right-3 text-[10px] font-bold px-0.5 py-0 bg-white rounded shadow-sm text-transparent bg-gradient-to-r from-[#bdff68ff] via-[#e6fc6dff] to-[#ebb6b6ff] bg-clip-text"
                style={{
                  WebkitBackgroundClip: "text"
                }}
              >
                AI
              </div>
            </div>
            <span className="ml-2">{isSending ? "Suggesting a fix..." : "Fix"}</span>
          </button>
        )}
      </div>
      <div className="problem-panel-content" style={{ backgroundColor }}>
        {problems.length === 0 ? (
          <div className="problem-panel-empty-state">
            <div className="problem-panel-empty-state-content">
              <div className="problem-panel-empty-state-icon">✨</div>
              <div className="problem-panel-empty-state-text" style={{ color: textColor }}>No problems detected</div>
            </div>
          </div>
        ) : (
          <div className="problem-panel-problems-list">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className={`problem-panel-problem-item ${
                  backgroundColor === '#ffffff' ? 'problem-panel-problem-item-light' : 'problem-panel-problem-item-dark'
                } ${
                  problem.type === 'error' ? 'problem-panel-problem-item-error' :
                  problem.type === 'warning' ? 'problem-panel-problem-item-warning' :
                  'problem-panel-problem-item-info'
                }`}
              >
                <div className="problem-panel-problem-content">
                  <div className="problem-panel-problem-details">
                    <div className="problem-panel-problem-meta">
                      <div className="problem-panel-problem-tags">
                        <span className="problem-panel-problem-type-badge">
                          {problem.type.toUpperCase()}
                        </span>
                        {problem.source && (
                          <span className="problem-panel-problem-source" style={{ color: textColor }}>
                            {problem.source}
                          </span>
                        )}
                        {(problem.line || problem.column) && (
                          <span className="problem-panel-problem-location" style={{ color: textColor }}>
                            {problem.line && `Line ${problem.line}`}
                            {problem.line && problem.column && ':'}
                            {problem.column && `Col ${problem.column}`}
                          </span>
                        )}
                      </div>
                      <span className="problem-panel-problem-timestamp" style={{ color: textColor }}>
                        {formatTimestamp(problem.timestamp)}
                      </span>
                    </div>
                    
                    <div className="problem-panel-problem-message-container">
                      <p className="problem-panel-problem-message" style={{ color: textColor }}>
                        {problem.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel; 