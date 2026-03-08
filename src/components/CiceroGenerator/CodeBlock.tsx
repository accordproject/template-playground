/**
 * Code block component with syntax highlighting styling and copy functionality.
 */

import { useState, useMemo } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import useAppStore from '../../store/store';
import { CodeBlockProps } from './types';

export const CodeBlock = ({ code, language, filename }: CodeBlockProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      containerBg: isDarkMode ? '#0f172a' : '#1e293b',
      headerBg: isDarkMode ? '#1e293b' : '#334155',
      headerBorder: isDarkMode ? '#334155' : '#475569',
      filenameColor: '#94a3b8',
      languageColor: '#64748b',
      codeColor: '#e2e8f0',
      buttonBorder: '#475569',
      buttonColor: '#94a3b8',
      buttonColorCopied: '#4ade80',
    };
  }, [backgroundColor]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      void message.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      void message.error('Failed to copy');
    }
  };

  return (
    <div
      className="twp"
      style={{
        background: theme.containerBg,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        border: `1px solid ${theme.headerBorder}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: theme.headerBg,
          borderBottom: `1px solid ${theme.headerBorder}`,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
            color: theme.filenameColor,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {filename}
          <span style={{ color: theme.languageColor, marginLeft: 8 }}>{language}</span>
        </span>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={() => void handleCopy()}
          style={{
            color: copied ? theme.buttonColorCopied : theme.buttonColor,
            fontSize: 11,
            fontFamily: "'IBM Plex Mono', monospace",
            border: `1px solid ${theme.buttonBorder}`,
            borderRadius: 4,
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
          color: theme.codeColor,
          overflowX: 'auto',
          maxHeight: 350,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {code}
      </pre>
    </div>
  );
};

export default CodeBlock;
