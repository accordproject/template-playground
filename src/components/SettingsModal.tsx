import React, { useState } from 'react';
import { Modal, Switch, Collapse, Space, Divider, Typography, Row, Col } from 'antd';
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
    backgroundColor,
    toggleDarkMode,
    isLogicFeatureEnabled,
    setLogicFeatureEnabled
  } = useAppStore((state) => ({
    isSettingsOpen: state.isSettingsOpen,
    setSettingsOpen: state.setSettingsOpen,
    showLineNumbers: state.showLineNumbers,
    setShowLineNumbers: state.setShowLineNumbers,
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
    isLogicFeatureEnabled: state.isLogicFeatureEnabled,
    setLogicFeatureEnabled: state.setLogicFeatureEnabled,
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
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col flex="auto">
              <Text strong style={{ display: 'block' }}>Dark Mode</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Toggle between light and dark theme
              </Text>
            </Col>
            <Col>
              <Switch
                data-testid="dark-mode-toggle"
                checked={isDarkMode}
                onChange={toggleDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<BulbOutlined />}
                aria-label="Toggle dark mode"
              />
            </Col>
          </Row>

          <Divider style={{ margin: 0 }} />

          {/* Line Numbers Toggle */}
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col flex="auto">
              <Text strong style={{ display: 'block' }}>Show Line Numbers</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Display line numbers in code editors
              </Text>
            </Col>
            <Col>
              <Switch
                checked={showLineNumbers}
                onChange={setShowLineNumbers}
                aria-label="Toggle line numbers"
              />
            </Col>
          </Row>

          <Divider style={{ margin: 0 }} />

          {/* Logic Feature Flag Toggle */}
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col flex="auto">
              <Text strong style={{ display: 'block' }}>Enable Template Logic (Experimental)</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Turn on the experimental TypeScript logic editor and compilation features (GSoC Project).
              </Text>
            </Col>
            <Col>
              <Switch
                checked={isLogicFeatureEnabled}
                onChange={setLogicFeatureEnabled}
                aria-label="Toggle template logic"
              />
            </Col>
          </Row>
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
