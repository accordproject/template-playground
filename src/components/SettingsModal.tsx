import React, { useState } from 'react';
import { Modal, Switch, Collapse, Space, Divider, Typography, Tag } from 'antd';
import { BulbOutlined, MoonOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import useAppStore from '../store/store';
import AIConfigSection from './AIConfigSection';

const { Text } = Typography;

const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    showLineNumbers, 
    setShowLineNumbers,
    useRichEditor,
    setUseRichEditor,
    backgroundColor,
    toggleDarkMode
  } = useAppStore((state) => ({
    isSettingsOpen: state.isSettingsOpen,
    setSettingsOpen: state.setSettingsOpen,
    showLineNumbers: state.showLineNumbers,
    setShowLineNumbers: state.setShowLineNumbers,
    useRichEditor: state.useRichEditor,
    setUseRichEditor: state.setUseRichEditor,
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

          {/* Rich Template Editor Toggle (Beta) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>
                Rich Template Editor
                <Tag color="blue" style={{ marginLeft: 8, fontSize: 10, verticalAlign: 'middle' }}>Beta</Tag>
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Use an interactive WYSIWYG editor for TemplateMark
              </Text>
            </div>
            <Switch
              checked={useRichEditor}
              onChange={setUseRichEditor}
              aria-label="Toggle rich template editor"
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
