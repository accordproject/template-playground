/**
 * Validation report component showing check results.
 */

import { useMemo } from 'react';
import useAppStore from '../../store/store';
import { CiceroValidationReportProps, ValidationReport, ValidationCheck } from './types';
import { tryParseJSON } from './agentPipeline';
import CodeBlock from './CodeBlock';

export const CiceroValidationReport = ({ report }: CiceroValidationReportProps): JSX.Element | null => {
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      passBg: isDarkMode ? '#052e16' : '#f0fdf4',
      passBorder: '#16a34a',
      passText: isDarkMode ? '#4ade80' : '#16a34a',
      failBg: isDarkMode ? '#450a0a' : '#fef2f2',
      failBorder: '#dc2626',
      failText: isDarkMode ? '#fca5a5' : '#dc2626',
      warnBg: isDarkMode ? '#422006' : '#fefce8',
      warnBorder: isDarkMode ? '#ca8a04' : '#fef08a',
      checkPassBg: isDarkMode ? '#052e16' : '#f0fdf4',
      checkPassBorder: isDarkMode ? '#166534' : '#bbf7d0',
      checkFailBg: isDarkMode ? '#450a0a' : '#fef2f2',
      checkFailBorder: isDarkMode ? '#991b1b' : '#fecaca',
      checkWarnBg: isDarkMode ? '#422006' : '#fefce8',
      checkWarnBorder: isDarkMode ? '#854d0e' : '#fef08a',
      categoryColor: isDarkMode ? '#94a3b8' : '#475569',
      messageColor: isDarkMode ? '#e2e8f0' : '#1e293b',
      fixColor: '#9333ea',
    };
  }, [backgroundColor]);

  if (!report) return null;

  const parsed: ValidationReport | null =
    typeof report === 'string' ? tryParseJSON<ValidationReport>(report) : report;

  if (!parsed) {
    return <CodeBlock code={String(report)} language="json" filename="validation-report.json" />;
  }

  const getCheckStyles = (status: ValidationCheck['status']) => {
    switch (status) {
      case 'PASS':
        return {
          bg: theme.checkPassBg,
          border: theme.checkPassBorder,
          icon: '✓',
        };
      case 'FAIL':
        return {
          bg: theme.checkFailBg,
          border: theme.checkFailBorder,
          icon: '✕',
        };
      case 'WARN':
        return {
          bg: theme.checkWarnBg,
          border: theme.checkWarnBorder,
          icon: '⚠',
        };
    }
  };

  return (
    <div className="twp" style={{ marginBottom: 12 }}>
      {/* Status banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          padding: '10px 14px',
          borderRadius: 8,
          background: parsed.status === 'PASS' ? theme.passBg : theme.failBg,
          border: `1px solid ${parsed.status === 'PASS' ? theme.passBorder : theme.failBorder}`,
        }}
      >
        <span style={{ fontSize: 20 }}>{parsed.status === 'PASS' ? '✓' : '✕'}</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: parsed.status === 'PASS' ? theme.passText : theme.failText,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.05em',
          }}
        >
          VALIDATION {parsed.status}
        </span>
      </div>

      {/* Check list */}
      {parsed.checks && parsed.checks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {parsed.checks.map((check, i) => {
            const styles = getCheckStyles(check.status);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: styles.bg,
                  border: `1px solid ${styles.border}`,
                  fontSize: 12,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 13 }}>{styles.icon}</span>
                <div>
                  <span style={{ color: theme.categoryColor, fontWeight: 600 }}>
                    [{check.category}]
                  </span>{' '}
                  <span style={{ color: theme.messageColor }}>{check.message}</span>
                  {check.fix && (
                    <div style={{ color: theme.fixColor, marginTop: 2, fontSize: 11 }}>
                      Fix: {check.fix}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CiceroValidationReport;
