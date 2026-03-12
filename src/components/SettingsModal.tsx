import React from 'react';
import { Modal, Select, Switch } from 'antd';
import DarkModeToggle from 'react-dark-mode-toggle';
import useAppStore from '../store/store';
import { FONT_SIZE_OPTIONS } from '../constants/editorSettings';


const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    showLineNumbers, 
    setShowLineNumbers,
    editorFontSize,
    setEditorFontSize,
    editorWordWrap,
    setEditorWordWrap,
    textColor,
    backgroundColor,
    toggleDarkMode
  } = useAppStore((state) => ({
    isSettingsOpen: state.isSettingsOpen,
    setSettingsOpen: state.setSettingsOpen,
    showLineNumbers: state.showLineNumbers,
    setShowLineNumbers: state.setShowLineNumbers,
    editorFontSize: state.editorFontSize,
    setEditorFontSize: state.setEditorFontSize,
    editorWordWrap: state.editorWordWrap,
    setEditorWordWrap: state.setEditorWordWrap,
    textColor: state.textColor,
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
  }));

  const isDarkMode = backgroundColor === '#121212';

  return (
    <Modal
      title="Settings"
      open={isSettingsOpen}
      onCancel={() => setSettingsOpen(false)}
      footer={null}
      className={isDarkMode ? 'dark-modal' : ''}
      width="90%"
      style={{ maxWidth: 480 }}
    >
      <div className="space-y-6 py-4">
        {/* Dark Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Dark Mode
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Toggle between light and dark theme
            </p>
          </div>
          <div className="flex-shrink-0">
            <DarkModeToggle
              onChange={toggleDarkMode}
              checked={isDarkMode}
              size={50}
            />
          </div>
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Line Numbers Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Show Line Numbers
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Display line numbers in code editors
            </p>
          </div>
          <div className="flex-shrink-0">
            <Switch
              checked={showLineNumbers}
              onChange={setShowLineNumbers}
              aria-label="Toggle line numbers"
            />
          </div>
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Font Size Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Font Size
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Adjust font size in code editors
            </p>
          </div>
          <div className="flex-shrink-0">
            <Select
              value={editorFontSize}
              onChange={setEditorFontSize}
              style={{ width: 80 }}
              aria-label="Editor font size"
              options={FONT_SIZE_OPTIONS.map((size) => ({
                value: size,
                label: `${size}px`,
              }))}
            />
          </div>
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Word Wrap Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Word Wrap
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Wrap long lines in code editors
            </p>
          </div>
          <div className="flex-shrink-0">
            <Switch
              checked={editorWordWrap}
              onChange={setEditorWordWrap}
              aria-label="Toggle word wrap"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
