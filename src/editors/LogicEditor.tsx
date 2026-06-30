import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as monacoNS from 'monaco-editor';
import { Button, Badge } from 'antd';
import useAppStore from '../store/store';
import useThemeName from '../hooks/useThemeName';
import '../styles/components/LogicEditor.css';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((mod) => ({ default: mod.Editor }))
);

const DEFAULT_LOGIC_BOILERPLATE = `// Write your contract logic here.
// TemplateLogic, IRequest, IState, IResponse are available as global types.

class ContractLogic extends TemplateLogic<any> {

  // Optional: initialize contract state
  async init(data: any) {
    return {
      state: {
        $identifier: 'contract-state',
        // add your initial state fields here
      },
    };
  }

  // Required: execute business logic for each request
  async trigger(data: any, request: any, state: any) {
    return {
      result: {
        $class: 'org.example.Response',
        $timestamp: new Date().toISOString(),
        // add your response fields here
      },
      state: {
        ...state,
        // update state fields here
      },
    };
  }
}

export default ContractLogic;
`;

export default function LogicEditor() {
  const monaco = useMonaco();
  const compilerConfigured = useRef(false);

  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const setEditorLogicTs = useAppStore((s) => s.setEditorLogicTs);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const showLineNumbers = useAppStore((s) => s.showLineNumbers);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const textColor = useAppStore((s) => s.textColor);

  const themeName = useThemeName();

  // Configure TS compiler options once Monaco is ready
  useEffect(() => {
    if (!monaco || compilerConfigured.current) return;
    compilerConfigured.current = true;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      strict: false,
      strictNullChecks: true,
      noEmit: true,
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
      declare abstract class TemplateLogic<T> {
        abstract init(data: any): Promise<any>;
        abstract trigger(data: any, request: any, state: any): Promise<any>;
      }
    `, 'file:///node_modules/@types/accordproject/index.d.ts');
  }, [monaco]);

  const editorOptions: monacoNS.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      wordWrap: 'on' as const,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      lineNumbers: showLineNumbers ? ('on' as const) : ('off' as const),
      bracketPairColorization: { enabled: true },
      autoClosingBrackets: 'languageDefined' as const,
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      fixedOverflowWidgets: true,
    }),
    [showLineNumbers]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      setEditorLogicTs(value ?? '');
    },
    [setEditorLogicTs]
  );

  const handleApply = useCallback(() => {
    const nextSource =
      editorLogicTs.trim() === '' && logicTs.trim() === ''
        ? DEFAULT_LOGIC_BOILERPLATE
        : editorLogicTs;
    void setLogicTs(nextSource);
  }, [setLogicTs, editorLogicTs, logicTs]);


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
        >
          {isDirty ? 'Apply & Compile*' : 'Apply & Compile'}
        </Button>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Suspense fallback={<div className="logic-editor-loading">Loading editor...</div>}>
          <MonacoEditor
            path="logic.ts"
            language="typescript"
            height="100%"
            value={editorLogicTs}
            theme={themeName}
            options={editorOptions}
            onChange={handleChange}
          />
        </Suspense>
      </div>


    </div>
  );
}
