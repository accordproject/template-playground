import React, { useState, useEffect } from 'react';
import { diffLines as computeDiff } from 'diff';
import { LineDiffProps, CodeDiffPopupProps } from "../types/components/AIAssistant.types"

const LineDiff: React.FC<LineDiffProps> = ({ line, type, displayLineNumber }) => {
  const getBgColor = () => {
    if (type === 'added') return 'bg-green-100';
    if (type === 'removed') return 'bg-red-100';
    return '';
  };

  const getLinePrefix = () => {
    if (type === 'added') return '+ ';
    if (type === 'removed') return '- ';
    return '  ';
  };

  return (
    <div className={`flex items-stretch ${getBgColor()}`}>
      <div className="w-10 text-right px-2 text-gray-500 select-none border-r border-gray-300">
        {displayLineNumber !== null ? displayLineNumber + 1 : ''}
      </div>
      <div className="w-6 flex-shrink-0 text-center select-none border-r border-gray-300">
        {getLinePrefix()}
      </div>
      <div className="flex-grow px-2 whitespace-pre-wrap break-words font-mono text-sm select-none">
        {line}
      </div>
    </div>
  );
};

const CodeDiffPopup: React.FC<CodeDiffPopupProps> = ({
  newCode,
  currentCode,
  language,
  onApply,
  onClose,
}) => {
  const [diffResult, setDiffResult] = useState<Array<{
    value: string;
    added?: boolean;
    removed?: boolean;
    displayLineNumber: number | null;
    originalIndex: number;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lastToggledLine, setLastToggledLine] = useState<number | null>(null);

  useEffect(() => {
    const normalizeCode = (code: string) => {
      let normalized = code.replace(/\r\n/g, '\n');

      if (!normalized.endsWith('\n')) {
        normalized += '\n';
      } else if (normalized.endsWith('\n\n')) {
        while (normalized.endsWith('\n\n')) {
          normalized = normalized.slice(0, -1);
        }
      }

      return normalized;
    };

    const normalizedCurrent = normalizeCode(currentCode);
    const normalizedNew = normalizeCode(newCode);

    if (normalizedCurrent === normalizedNew) {
      setDiffResult([{
        value: normalizedNew,
        added: false,
        removed: false,
        displayLineNumber: 0,
        originalIndex: 0
      }]);
      return;
    }

    const diff = computeDiff(normalizedCurrent, normalizedNew);

    let resultLineNumber = 0;
    let originalIndex = 0;
    const formattedDiff: Array<{
      value: string;
      added?: boolean;
      removed?: boolean;
      displayLineNumber: number | null;
      originalIndex: number;
    }> = [];

    diff.forEach(part => {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      lines.forEach(line => {
        if (part.added) {
          formattedDiff.push({
            value: line,
            added: true,
            displayLineNumber: resultLineNumber++,
            originalIndex: originalIndex++
          });
        } else if (part.removed) {
          formattedDiff.push({
            value: line,
            removed: true,
            displayLineNumber: null,
            originalIndex: -1
          });
        } else {
          formattedDiff.push({
            value: line,
            displayLineNumber: resultLineNumber++,
            originalIndex: originalIndex++
          });
        }
      });
    });

    setDiffResult(formattedDiff);
  }, [newCode, currentCode]);

  const calculateResultLineNumbers = () => {
    let resultLineCounter = 0;

    return diffResult.map(line => {
      if (line.removed) {
        return { ...line, displayLineNumber: null };
      }

      if (line.added) {
        return { ...line, displayLineNumber: resultLineCounter++ };
      }

      return { ...line, displayLineNumber: resultLineCounter++ };
    });
  };

  const toggleLine = (index: number) => {
    setDiffResult(prev => {
      const updated = [...prev];
      const line = updated[index];

      if (line.added) {
        updated[index] = { ...line, added: false, removed: true };
      } else if (line.removed) {
        updated[index] = { ...line, added: true, removed: false };
      }

      return updated;
    });

    setLastToggledLine(index);
  };

  const handleMouseDown = (index: number) => {
    toggleLine(index);
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastToggledLine(null);
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging && lastToggledLine !== null) {
      const start = Math.min(lastToggledLine, index);
      const end = Math.max(lastToggledLine, index);

      setDiffResult(prev => {
        const updated = [...prev];
        const lastLine = prev[lastToggledLine];
        const targetState = lastLine.removed;

        for (let i = start; i <= end; i++) {
          const line = updated[i];
          if (line.added || line.removed) {
            updated[i] = {
              ...line,
              added: !targetState,
              removed: targetState
            };
          }
        }
        return updated;
      });

      setLastToggledLine(index);
    }
  };

  const applyChanges = () => {
    const newCodeLines = diffResult
      .filter(line => !line.removed)
      .map(line => line.value);

    onApply(newCodeLines.join('\n'));
    onClose();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setLastToggledLine(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        setLastToggledLine(null);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging]);

  const displayedDiff = calculateResultLineNumbers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-4/5 max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold">Apply Code Changes ({language})</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
        <div className="p-2 text-sm bg-gray-100">
          <span className="inline-block px-2 py-1 mr-2 bg-green-100 border border-green-300 rounded">+ Added</span>
          <span className="inline-block px-2 py-1 mr-2 bg-red-100 border border-red-300 rounded">- Removed</span>
          <span className="inline-block px-2 py-1 bg-white border border-gray-300 rounded">Unchanged</span>
          <div className="mt-2 text-xs">Click on a line to toggle between added and removed. Click and drag to toggle multiple lines at once.</div>
        </div>
          <div
            className="overflow-auto"
            onMouseUp={handleMouseUp}
          >
            {displayedDiff.map((line, index) => {
              const type = line.added ? 'added' : line.removed ? 'removed' : 'unchanged';
              const canToggle = line.added || line.removed;

              return (
                <div
                  key={`diff-${index}`}
                  className={`${canToggle ? 'cursor-pointer hover:opacity-80' : ''} border-b border-gray-100 select-none`}
                  onMouseDown={() => canToggle && handleMouseDown(index)}
                  onMouseEnter={() => canToggle && handleMouseEnter(index)}
                >
                  <LineDiff
                    line={line.value}
                    type={type}
                    displayLineNumber={line.displayLineNumber}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeDiffPopup;
