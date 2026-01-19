import React, { useMemo, useCallback } from 'react';
import useAppStore from '../store/store';
import { navigateToLine, EditorSource } from '../utils/editorNavigation';
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
  const { error, backgroundColor, textColor } = useAppStore((state) => ({
    error: state.error,
    backgroundColor: state.backgroundColor,
    textColor: state.textColor
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

      // Detect source based on error content
      // c: prefix indicates Concerto/CTO errors
      if (part.startsWith('c:') || part.includes('CTO') || part.includes('.cto') ||
        (part.includes('model') && !part.includes('grammar'))) {
        source = 'Concerto Model';
      } else if (part.includes('JSON') || part.includes('json') || part.includes('data')) {
        source = 'JSON Data';
      } else if (part.includes('template') || part.includes('Template') ||
        part.includes('grammar') || part.includes('mark')) {
        source = 'TemplateMark';
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

  const handleProblemClick = useCallback((problem: ProblemItem) => {
    if (problem.source && problem.line && problem.line > 0) {
      navigateToLine(problem.source as EditorSource, problem.line, problem.column);
    }
  }, []);

  const isClickable = (problem: ProblemItem) => {
    return problem.source && problem.line && problem.line > 0;
  };

  return (
    <div className="problem-panel-container" style={{ backgroundColor }}>
      <div className={`problem-panel-header ${backgroundColor === '#ffffff' ? 'problem-panel-header-light' : 'problem-panel-header-dark'}`}>
        <span className="problem-panel-title">Problems</span>
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
                className={`problem-panel-problem-item ${backgroundColor === '#ffffff' ? 'problem-panel-problem-item-light' : 'problem-panel-problem-item-dark'
                  } ${problem.type === 'error' ? 'problem-panel-problem-item-error' :
                    problem.type === 'warning' ? 'problem-panel-problem-item-warning' :
                      'problem-panel-problem-item-info'
                  } ${isClickable(problem) ? 'problem-panel-problem-item-clickable' : ''
                  }`}
                onClick={() => handleProblemClick(problem)}
                role={isClickable(problem) ? 'button' : undefined}
                tabIndex={isClickable(problem) ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable(problem) && (e.key === 'Enter' || e.key === ' ')) {
                    handleProblemClick(problem);
                  }
                }}
                title={isClickable(problem) ? 'Click to go to error location' : undefined}
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
                        {isClickable(problem) && (
                          <span className="problem-panel-clickable-link">
                            Go to line {problem.line}
                            {problem.column && problem.column > 0 && `:${problem.column}`}
                            <span className="ml-1">{"-->"}</span>
                          </span>
                        )}
                        {!isClickable(problem) && (problem.line || problem.column) && (
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