import React from 'react';
import { Modal, Switch, Select } from 'antd';
import DarkModeToggle from 'react-dark-mode-toggle';
import useAppStore from '../store/store';

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];

const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    showLineNumbers,
    setShowLineNumbers,
    textColor,
    backgroundColor,
    toggleDarkMode,
    editorSettings,
    setEditorSettings,
  } = useAppStore((state) => ({
    isSettingsOpen: state.isSettingsOpen,
    setSettingsOpen: state.setSettingsOpen,
    showLineNumbers: state.showLineNumbers,
    setShowLineNumbers: state.setShowLineNumbers,
    textColor: state.textColor,
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
    editorSettings: state.editorSettings,
    setEditorSettings: state.setEditorSettings,
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

        {/* Dark Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Dark Mode
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Toggle between light and dark theme
            </p>
          </div>
          <DarkModeToggle onChange={toggleDarkMode} checked={isDarkMode} size={50} />
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Line Numbers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Show Line Numbers
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Display line numbers in code editors
            </p>
          </div>
          <Switch checked={showLineNumbers} onChange={setShowLineNumbers} />
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Font Size */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Font Size
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Adjust editor font size
            </p>
          </div>
          <Select
            value={editorSettings.fontSize}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onChange={(value) => setEditorSettings({ fontSize: value })}
            style={{ width: 110 }}
            options={FONT_SIZES.map((size) => ({
              label: `${size}px`,
              value: size,
            }))}
          />
        </div>

        <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

        {/* Word Wrap */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
              Word Wrap
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Wrap long lines in editors
            </p>
          </div>
          <Switch
            checked={editorSettings.wordWrap === 'on'}
            onChange={(checked) =>
              setEditorSettings({ wordWrap: checked ? 'on' : 'off' })
            }
          />
        </div>

      </div>
    </Modal>
  );
};

export default SettingsModal;