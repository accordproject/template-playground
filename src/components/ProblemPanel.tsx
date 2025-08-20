import React, { useMemo } from 'react';
import useAppStore from '../store/store';
import '../styles/components/ProblemPanel.css';

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
  const { error } = useAppStore((state) => ({ 
    error: state.error
  }));
  
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
    <div className="problem-panel-container">
      <div className="problem-panel-header">
        <span className="problem-panel-title">Problems</span>
      </div>
      <div className="problem-panel-content">
        {problems.length === 0 ? (
          <div className="problem-panel-empty-state">
            <div className="problem-panel-empty-state-content">
              <div className="problem-panel-empty-state-icon">✨</div>
              <div className="problem-panel-empty-state-text">No problems detected</div>
            </div>
          </div>
        ) : (
          <div className="problem-panel-problems-list">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className={`problem-panel-problem-item ${
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
                          <span className="problem-panel-problem-source">
                            {problem.source}
                          </span>
                        )}
                        {(problem.line || problem.column) && (
                          <span className="problem-panel-problem-location">
                            {problem.line && `Line ${problem.line}`}
                            {problem.line && problem.column && ':'}
                            {problem.column && `Col ${problem.column}`}
                          </span>
                        )}
                      </div>
                      <span className="problem-panel-problem-timestamp">
                        {formatTimestamp(problem.timestamp)}
                      </span>
                    </div>
                    
                    <div className="problem-panel-problem-message-container">
                      <p className="problem-panel-problem-message">
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