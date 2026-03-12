import React, { useState } from 'react';
import { Modal, Switch, Collapse } from 'antd';
import { RobotOutlined, SettingOutlined } from '@ant-design/icons';
import DarkModeToggle from 'react-dark-mode-toggle';
import useAppStore from '../store/store';
import AIConfigSection from './AIConfigSection';

const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    showLineNumbers, 
    setShowLineNumbers,
    textColor,
    backgroundColor,
    toggleDarkMode
  } = useAppStore((state) => ({
    isSettingsOpen: state.isSettingsOpen,
    setSettingsOpen: state.setSettingsOpen,
    showLineNumbers: state.showLineNumbers,
    setShowLineNumbers: state.setShowLineNumbers,
    textColor: state.textColor,
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
  }));

  const isDarkMode = backgroundColor === '#121212';
  const [activeKey, setActiveKey] = useState<string | string[]>(['general']);

  const collapseItems = [
    {
      key: 'general',
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          General
        </span>
      ),
      children: (
        <div className="twp space-y-6 py-2">
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
        </div>
      ),
    },
    {
      key: 'ai',
      label: (
        <span className="flex items-center gap-2">
          <RobotOutlined />
          AI Configuration
        </span>
      ),
      children: <AIConfigSection />,
    },
  ];

  return (
    <Modal
      title="Settings"
      open={isSettingsOpen}
      onCancel={() => setSettingsOpen(false)}
      footer={null}
      className={isDarkMode ? 'dark-modal' : ''}
      width="90%"
      style={{ maxWidth: 520 }}
    >
      <Collapse
        activeKey={activeKey}
        onChange={setActiveKey}
        items={collapseItems}
        bordered={false}
        className={isDarkMode ? 'dark-collapse' : ''}
      />
    </Modal>
  );
};

export default SettingsModal;
