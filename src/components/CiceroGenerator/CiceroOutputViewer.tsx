/**
 * Tabbed output viewer for generated template artifacts.
 */

import { useMemo } from 'react';
import { Tabs } from 'antd';
import useAppStore from '../../store/store';
import { CiceroOutputViewerProps, OutputTab, OutputTabId } from './types';
import CodeBlock from './CodeBlock';
import CiceroValidationReport from './CiceroValidationReport';

export const CiceroOutputViewer = ({
  outputs,
  activeTab,
  onTabChange,
}: CiceroOutputViewerProps): JSX.Element | null => {
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      containerBg: isDarkMode ? '#1e293b' : '#fff',
      containerBorder: isDarkMode ? '#334155' : '#e7e5e4',
      tabBarBg: isDarkMode ? '#0f172a' : '#fafaf9',
    };
  }, [backgroundColor]);

  const hasOutput =
    outputs.grammarTem || outputs.modelCto || outputs.logicTs || outputs.contractBrief;

  if (!hasOutput) return null;

  const tabs: OutputTab[] = [
    { id: 'brief', label: 'Contract Brief', ready: !!outputs.contractBrief },
    { id: 'grammar', label: 'grammar.tem.md', ready: !!outputs.grammarTem },
    { id: 'model', label: 'model.cto', ready: !!outputs.modelCto },
    { id: 'logic', label: 'logic.ts', ready: !!outputs.logicTs },
    { id: 'validation', label: 'Validation', ready: !!outputs.validationReport },
    { id: 'package', label: 'Package Files', ready: !!outputs.packageJson },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'brief':
        return outputs.contractBrief ? (
          <CodeBlock
            code={JSON.stringify(outputs.contractBrief, null, 2)}
            language="json"
            filename="contract-brief.json"
          />
        ) : null;
      case 'grammar':
        return outputs.grammarTem ? (
          <CodeBlock code={outputs.grammarTem} language="templatemark" filename="text/grammar.tem.md" />
        ) : null;
      case 'model':
        return outputs.modelCto ? (
          <CodeBlock code={outputs.modelCto} language="concerto" filename="model/model.cto" />
        ) : null;
      case 'logic':
        return outputs.logicTs ? (
          <CodeBlock code={outputs.logicTs} language="typescript" filename="logic/logic.ts" />
        ) : null;
      case 'validation':
        return outputs.validationReport ? (
          <CiceroValidationReport report={outputs.validationReport} />
        ) : null;
      case 'package':
        return (
          <>
            {outputs.packageJson && (
              <CodeBlock code={outputs.packageJson} language="json" filename="package.json" />
            )}
            {outputs.requestJson && (
              <CodeBlock code={outputs.requestJson} language="json" filename="request.json" />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="twp"
      style={{
        background: theme.containerBg,
        borderRadius: 12,
        border: `1px solid ${theme.containerBorder}`,
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const tab = tabs.find((t) => t.id === key);
          if (tab?.ready) {
            onTabChange(key as OutputTabId);
          }
        }}
        tabBarStyle={{
          background: theme.tabBarBg,
          margin: 0,
          paddingLeft: 8,
          borderBottom: `1px solid ${theme.containerBorder}`,
        }}
        items={tabs.map((tab) => ({
          key: tab.id,
          label: (
            <span
              style={{
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: activeTab === tab.id ? 600 : 400,
                opacity: tab.ready ? 1 : 0.4,
                cursor: tab.ready ? 'pointer' : 'not-allowed',
              }}
            >
              {tab.label}
            </span>
          ),
          disabled: !tab.ready,
        }))}
      />
      <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>{renderTabContent()}</div>
    </div>
  );
};

export default CiceroOutputViewer;
