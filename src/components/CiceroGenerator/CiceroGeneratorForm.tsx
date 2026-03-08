/**
 * Form component for Cicero Generator input collection.
 */

import { useMemo } from 'react';
import { Input, Button, Radio } from 'antd';
import useAppStore from '../../store/store';
import { CiceroGeneratorFormProps } from './types';

const { TextArea } = Input;

export const CiceroGeneratorForm = ({
  documentText,
  templateName,
  namespace,
  isContract,
  isGenerating,
  hasOutput,
  onDocumentTextChange,
  onTemplateNameChange,
  onNamespaceChange,
  onIsContractChange,
  onGenerate,
}: CiceroGeneratorFormProps): JSX.Element => {
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      labelColor: isDarkMode ? '#94a3b8' : '#78716c',
      inputBg: isDarkMode ? '#1e293b' : '#fafaf9',
      inputBorder: isDarkMode ? '#334155' : '#d6d3d1',
      inputText: isDarkMode ? '#e2e8f0' : '#1e293b',
      buttonBg: isDarkMode ? '#0f172a' : '#0f172a',
      buttonBgDisabled: isDarkMode ? '#334155' : '#475569',
      sectionBg: isDarkMode ? '#1e293b' : '#fff',
      sectionBorder: isDarkMode ? '#334155' : '#e7e5e4',
    };
  }, [backgroundColor]);

  const isDisabled = isGenerating || !documentText.trim();

  return (
    <div
      className="twp"
      style={{
        background: theme.sectionBg,
        borderRadius: 12,
        border: `1px solid ${theme.sectionBorder}`,
        padding: 20,
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          fontWeight: 600,
          color: theme.inputText,
          fontFamily: 'var(--font-family-primary, Rubik, sans-serif)',
        }}
      >
        Source Document
      </h3>

      <TextArea
        value={documentText}
        onChange={(e) => onDocumentTextChange(e.target.value)}
        placeholder="Paste your legal/contractual text here...

Example: Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 2 days of delay penalty amounting to 10.5% of the total value..."
        style={{
          minHeight: hasOutput ? 120 : 160,
          fontSize: 13,
          fontFamily: "'Source Serif 4', Georgia, serif",
          lineHeight: 1.6,
          color: theme.inputText,
          background: theme.inputBg,
          borderColor: theme.inputBorder,
          resize: 'vertical',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 14,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.labelColor,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Template Name
          </label>
          <Input
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder="e.g. lateDelivery"
            style={{
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              color: theme.inputText,
              background: theme.inputBg,
              borderColor: theme.inputBorder,
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.labelColor,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Namespace
          </label>
          <Input
            value={namespace}
            onChange={(e) => onNamespaceChange(e.target.value)}
            placeholder="e.g. org.example.late"
            style={{
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              color: theme.inputText,
              background: theme.inputBg,
              borderColor: theme.inputBorder,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: theme.labelColor,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Type
        </label>
        <Radio.Group
          value={isContract ? 'contract' : 'clause'}
          onChange={(e) => onIsContractChange(e.target.value === 'contract')}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="clause">Clause</Radio.Button>
          <Radio.Button value="contract">Contract</Radio.Button>
        </Radio.Group>
      </div>

      <Button
        type="primary"
        onClick={onGenerate}
        loading={isGenerating}
        disabled={isDisabled}
        style={{
          marginTop: 16,
          width: '100%',
          height: 40,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-family-primary, Rubik, sans-serif)',
          background: isDisabled ? theme.buttonBgDisabled : theme.buttonBg,
          opacity: !documentText.trim() ? 0.5 : 1,
        }}
      >
        {isGenerating ? 'Generating Template...' : 'Generate Cicero Template'}
      </Button>
    </div>
  );
};

export default CiceroGeneratorForm;
