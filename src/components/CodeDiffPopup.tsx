import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { CodeDiffPopupProps } from "../types/components/AIAssistant.types"
import useAppStore from '../store/store';

const MonacoDiffEditor = lazy(() =>
  import("@monaco-editor/react").then(mod => ({ default: mod.DiffEditor }))
);

const CodeDiffPopup: React.FC<CodeDiffPopupProps> = ({
  newCode,
  currentCode,
  language,
  onApply,
  onClose,
}) => {
  language = (language === 'templatemark' ? 'markdown' : language);
  const monaco = useMonaco();
  const [modifiedContent, setModifiedContent] = useState(newCode);

  const {backgroundColor} = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));
  const isDarkMode = useMemo(() =>
    backgroundColor && backgroundColor !== '#ffffff',
  [backgroundColor]);
  const theme = useMemo(() => ({
    popupBg: isDarkMode ? 'bg-gray-900' : 'bg-white',
    popupBorder: isDarkMode ? 'border-gray-700' : 'border-gray-300',
    headerBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    headerText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    subHeaderBg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
    subHeaderText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    buttonBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
    buttonBgHover: isDarkMode ? 'bg-gray-600' : 'bg-gray-300',
    buttonText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    closeButtonText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    closeButtonHover: isDarkMode ? 'hover:text-gray-200' : 'hover:text-gray-800',
    applyButtonBg: isDarkMode ? 'bg-blue-700' : 'bg-blue-500',
    applyButtonBgHover: isDarkMode ? 'bg-blue-800' : 'bg-blue-600',
    applyButtonText: 'text-white',
    border: isDarkMode ? 'border border-gray-700' : 'border border-gray-300',
  }), [isDarkMode]);
  const themeName = useMemo(
    () => (isDarkMode ? "darkTheme" : "lightTheme"),
    [isDarkMode]
  );

  const diffEditorOptions = useMemo(() => ({
    originalEditable: false,
    readOnly: false,
    renderSideBySide: true,
    enableSplitViewResizing: false,
    renderIndicators: true,
    folding: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    ignoreTrimWhitespace: false,
    glyphMargin: true,
  }), []);

  React.useEffect(() => {
    setModifiedContent(newCode);
  }, [newCode]);

  if (!monaco) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
        <div className={`rounded-lg w-4/5 max-w-4xl max-h-[80vh] flex flex-col ${theme.popupBg} ${theme.popupBorder}`} style={{height: '80vh'}}>
          <div className="flex items-center justify-center h-full">
            <div className={`${theme.headerText}`}>Loading Monaco Editor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
      <div className={`rounded-lg w-4/5 max-w-4xl max-h-[80vh] flex flex-col ${theme.popupBg} ${theme.popupBorder}`} style={{height: '80vh'}}>
        <div className={`flex-shrink-0 flex justify-between items-center p-4 border-b ${theme.headerBg} ${theme.popupBorder}`}>
          <h3 className={`font-bold ${theme.headerText}`}>Apply Code Changes ({language})</h3>
          <button onClick={onClose} className={`${theme.closeButtonText} ${theme.closeButtonHover}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0" style={{height: '100%'}}>
          <div className={`flex-shrink-0 p-2 text-sm border-b ${theme.subHeaderBg} ${theme.popupBorder}`}>
            <div className={`text-xs ${theme.subHeaderText}`}>
              Review and edit the proposed changes below.
            </div>
          </div>
          <Suspense fallback={<div>Loading Diff Editor...</div>}>
            <MonacoDiffEditor
              height="100%"
              language={language}
              theme={themeName}
              options={diffEditorOptions}
              original={currentCode}
              modified={modifiedContent}
            />
          </Suspense>
        </div>

        <div className={`flex-shrink-0 p-4 border-t flex justify-end gap-2 ${theme.popupBorder}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${theme.buttonBg} ${theme.buttonText} hover:${theme.buttonBgHover}`}
          >
            Cancel
          </button>
          <button
            onClick={() => { onApply(modifiedContent); onClose(); }}
            className={`px-4 py-2 rounded ${theme.applyButtonBg} ${theme.applyButtonText} hover:${theme.applyButtonBgHover}`}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeDiffPopup;
