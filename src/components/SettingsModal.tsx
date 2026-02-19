import React, { useState } from 'react';
import { Modal, Switch, Collapse, Space, Divider, Typography, Select } from 'antd';
import { BulbOutlined, MoonOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import useAppStore from '../store/store';
import AIConfigSection from './AIConfigSection';
import { FONT_SIZE_OPTIONS } from '../constants/editorSettings';

const { Text } = Typography;

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
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
  }));

  const isDarkMode = backgroundColor === '#121212';
  const [activeKey, setActiveKey] = useState<string | string[]>(['general']);

  const collapseItems = [
    {
      key: 'general',
      label: (
        <Space size={8}>
          <SettingOutlined />
          General
        </Space>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%', paddingTop: 4, paddingBottom: 4 }}>
          {/* Dark Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>Dark Mode</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Toggle between light and dark theme
              </Text>
            </div>
            <Switch
              data-testid="dark-mode-toggle"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<BulbOutlined />}
              aria-label="Toggle dark mode"
            />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Line Numbers Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>Show Line Numbers</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Display line numbers in code editors
              </Text>
            </div>
            <Switch
              checked={showLineNumbers}
              onChange={setShowLineNumbers}
              aria-label="Toggle line numbers"
            />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Font Size Dropdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>Font Size</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Adjust font size in code editors
              </Text>
            </div>
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

          <Divider style={{ margin: 0 }} />

          {/* Word Wrap Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>Word Wrap</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Wrap long lines in code editors
              </Text>
            </div>
            <Switch
              checked={editorWordWrap}
              onChange={setEditorWordWrap}
              aria-label="Toggle word wrap"
            />
          </div>
        </Space>
      ),
    },
    {
      key: 'ai',
      label: (
        <Space size={8}>
          <RobotOutlined />
          AI Configuration
        </Space>
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
