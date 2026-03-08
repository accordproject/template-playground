/**
 * Sliding panel wrapper for the Cicero Generator.
 * Follows the AIChatPanel pattern for consistent UX.
 */

import { useMemo } from 'react';
import { Button, message, Badge } from 'antd';
import { CloseOutlined, ExportOutlined } from '@ant-design/icons';
import useAppStore from '../../store/store';
import CiceroGenerator from './index';

export const CiceroGeneratorPanel = (): JSX.Element => {
  const {
    backgroundColor,
    textColor,
    setIsCiceroGeneratorOpen,
    ciceroGeneratorState,
    loadGeneratedTemplateToEditors,
  } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    textColor: state.textColor,
    setIsCiceroGeneratorOpen: state.setIsCiceroGeneratorOpen,
    ciceroGeneratorState: state.ciceroGeneratorState,
    loadGeneratedTemplateToEditors: state.loadGeneratedTemplateToEditors,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      panelBg: isDarkMode ? '#0f172a' : '#fafaf9',
      headerBg: isDarkMode ? '#1e293b' : '#f1f5f9',
      headerBorder: isDarkMode ? '#334155' : '#e2e8f0',
      headerText: isDarkMode ? '#e2e8f0' : '#1e293b',
      footerBg: isDarkMode ? '#1e293b' : '#f8fafc',
      footerBorder: isDarkMode ? '#334155' : '#e2e8f0',
      betaBadgeBg: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #ef4444 100%)',
    };
  }, [backgroundColor]);

  const hasLoadableOutput =
    ciceroGeneratorState.outputs.grammarTem || ciceroGeneratorState.outputs.modelCto;

  const handleClose = () => {
    setIsCiceroGeneratorOpen(false);
  };

  const handleLoadToPlayground = async () => {
    try {
      await loadGeneratedTemplateToEditors();
      void message.success('Template loaded to playground');
      setIsCiceroGeneratorOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      void message.error(`Failed to load template: ${errorMessage}`);
    }
  };

  return (
    <div
      className="twp"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.panelBg,
        color: textColor,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: theme.headerBg,
          borderBottom: `1px solid ${theme.headerBorder}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.headerText,
              fontFamily: 'var(--font-family-primary, Rubik, sans-serif)',
            }}
          >
            AI Template Generator
          </span>
          <Badge
            count="BETA"
            style={{
              background: theme.betaBadgeBg,
              fontSize: 9,
              fontWeight: 700,
              padding: '0 6px',
              height: 18,
              lineHeight: '18px',
              borderRadius: 4,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.05em',
            }}
          />
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          style={{
            color: theme.headerText,
          }}
          aria-label="Close generator panel"
        />
      </div>

      {/* Body - scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
        }}
      >
        <CiceroGenerator />
      </div>

      {/* Footer - Load to Playground button */}
      {hasLoadableOutput && (
        <div
          style={{
            padding: '12px 16px',
            background: theme.footerBg,
            borderTop: `1px solid ${theme.footerBorder}`,
            flexShrink: 0,
          }}
        >
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => void handleLoadToPlayground()}
            disabled={ciceroGeneratorState.isGenerating}
            style={{
              width: '100%',
              height: 40,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-family-primary, Rubik, sans-serif)',
              background: '#19C6C8',
              borderColor: '#19C6C8',
            }}
          >
            Load to Playground
          </Button>
        </div>
      )}
    </div>
  );
};

export default CiceroGeneratorPanel;
