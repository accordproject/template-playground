import React, { useState } from 'react';
import { Tabs, Button, Space, Badge } from 'antd';
import { FaPlay, FaRocket } from 'react-icons/fa6';
import useAppStore from '../store/store';
import '../styles/components/ContractRunnerPanel.css';

const ContractRunnerPanel: React.FC = () => {
  const { 
    backgroundColor, 
    textColor,
    executionState,
    isExecuting,
    initContract,
    logicTs,
    compiledLogicJs
  } = useAppStore(s => ({
    backgroundColor: s.backgroundColor,
    textColor: s.textColor,
    executionState: s.executionState,
    isExecuting: s.isExecuting,
    initContract: s.initContract,
    logicTs: s.logicTs,
    compiledLogicJs: s.compiledLogicJs
  }));

  const [activeTab, setActiveTab] = useState('response');

  const tabItems = [
    {
      key: 'response',
      label: 'Response',
      children: (
        <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
          Response Output Coming Soon...
        </div>
      )
    },
    {
      key: 'state',
      label: 'State',
      children: (
        <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
          Contract State Coming Soon...
        </div>
      )
    },
    {
      key: 'events',
      label: 'Events',
      children: (
        <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
          Emitted Events Coming Soon...
        </div>
      )
    }
  ];

  const headerLight = '#f8fafc';
  const headerDark = '#1e293b';
  const panelHeaderBg = backgroundColor === '#ffffff' ? headerLight : headerDark;

  return (
    <div className="contract-runner-panel-container" style={{ backgroundColor }}>
      {/* Top Half: Request Editor */}
      <div className="contract-runner-panel-top">
        <div 
          className={`main-container-editor-header contract-runner-panel-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}
          style={{ 
            backgroundColor: panelHeaderBg
          }}
        >
          <div className="contract-runner-panel-header-left">
            <span className="contract-runner-panel-title">Request <span className="contract-runner-panel-header-subtitle">(JSON)</span></span>
            {logicTs && (
              <span className="contract-runner-panel-badge-container">
                {!compiledLogicJs ? (
                  <Badge status="warning" text={<span className="contract-runner-panel-badge-text">Requires Compilation</span>} />
                ) : executionState ? (
                  <Badge status="success" text={<span className="contract-runner-panel-badge-text">Initialized</span>} />
                ) : null}
              </span>
            )}
          </div>
          <Space>
            <span title={!compiledLogicJs ? 'Please compile the contract logic first' : ''} className="contract-runner-panel-button-wrapper" data-disabled={!compiledLogicJs}>
              <Button size="small" type="default" icon={<FaRocket />} onClick={initContract} loading={isExecuting} disabled={!compiledLogicJs || isExecuting} className="contract-runner-panel-button" data-disabled={!compiledLogicJs}>Init Contract</Button>
            </span>
            <Button size="small" type="primary" icon={<FaPlay />}>Send Request</Button>
          </Space>
        </div>
        <div className="contract-runner-panel-placeholder" style={{ color: textColor }}>
          Request Editor Coming Soon...
        </div>
      </div>

      {/* Bottom Half: Execution Outputs (Tabs) */}
      <div className="contract-runner-panel-bottom">
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          className="contract-runner-panel-tabs"
          tabBarStyle={{ 
            backgroundColor: panelHeaderBg,
            color: textColor
          }}
        />
      </div>
    </div>
  );
};

export default ContractRunnerPanel;
