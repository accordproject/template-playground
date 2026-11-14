import { useCallback } from 'react';
import { Button, Badge } from 'antd';
import useAppStore from '../store/store';
import LogicMonaco from './LogicMonaco';
import { nextLogicSource } from './logicSource';
import '../styles/components/LogicEditor.css';

/**
 * LogicEditor: the legacy layout's logic panel — status badge and "Apply & Compile"
 * on top of LogicMonaco, the store-bound TypeScript editor (which configures the
 * virtual TS compiler and surfaces compilation diagnostic markers).
 */
export default function LogicEditor() {
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const textColor = useAppStore((s) => s.textColor);

  const handleApply = useCallback(() => {
    void setLogicTs(nextLogicSource(editorLogicTs, logicTs, modelCto));
  }, [setLogicTs, editorLogicTs, logicTs, modelCto]);

  // Has the editor content diverged from committed logic?
  const isDirty = editorLogicTs !== logicTs;

  const hasErrors = compilationErrors && compilationErrors.length > 0;
  const themeMode = backgroundColor === '#ffffff' ? 'light' : 'dark';

  const renderStatus = () => {
    let statusProps: { status: 'warning' | 'processing' | 'error' | 'success' | 'default', text: string };

    switch (true) {
      case isDirty:
        statusProps = { status: 'warning', text: 'Unsaved changes' }; break;
      case isCompiling:
        statusProps = { status: 'processing', text: 'Compiling...' }; break;
      case hasErrors:
        statusProps = { status: 'error', text: 'Compilation Failed' }; break;
      case !!compiledLogicJs:
        statusProps = { status: 'success', text: 'Compiled' }; break;
      case !!logicTs:
        statusProps = { status: 'default', text: 'Not compiled yet' }; break;
      default:
        statusProps = { status: 'default', text: 'Nothing to compile' }; break;
    }

    return (
      <div
        className={`logic-editor-badge-wrapper logic-editor-flex-row ${themeMode}`}
      >
        <Badge status={statusProps.status} text={<span style={{ color: textColor, fontSize: '12px' }}>{statusProps.text}</span>} />
      </div>
    );
  };

  return (
    <div className="logic-editor-badge-container logic-editor-flex-col" style={{ height: '100%', width: '100%', backgroundColor }}>
      <div
        className={`logic-editor-toolbar-header logic-editor-flex-between ${themeMode}`}
        style={{ backgroundColor }}
      >
        <div className="logic-editor-flex-row" style={{ gap: '8px' }}>
          {renderStatus()}
        </div>
        <Button
          type={isDirty ? "primary" : "default"}
          onClick={handleApply}
          loading={isCompiling}
          disabled={isCompiling}
          size="small"
          className="tour-apply-compile"
        >
          {isDirty ? 'Apply & Compile*' : 'Apply & Compile'}
        </Button>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <LogicMonaco />
      </div>


    </div>
  );
}
