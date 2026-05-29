import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import * as monacoNS from 'monaco-editor';
import useAppStore from '../store/store';
import useThemeName from '../hooks/useThemeName';
import { ACCORD_TYPE_STUBS, generateModelTypeStubs } from '../utils/logicTypeStubs';
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
  const typeStubsRegistered = useRef(false);
  const modelStubDisposable = useRef<monacoNS.IDisposable | null>(null);

  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const setEditorLogicTs = useAppStore((s) => s.setEditorLogicTs);
  const setLogicTs = useAppStore((s) => s.setLogicTs);
  const modelCto = useAppStore((s) => s.modelCto);
  const showLineNumbers = useAppStore((s) => s.showLineNumbers);
  const isCompiling = useAppStore((s) => s.isCompiling);
  const compilationErrors = useAppStore((s) => s.compilationErrors);
  const compiledLogicJs = useAppStore((s) => s.compiledLogicJs);

  const themeName = useThemeName();

  // Register global Accord type stubs once Monaco is ready
  useEffect(() => {
    if (!monaco || typeStubsRegistered.current) return;
    typeStubsRegistered.current = true;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      ACCORD_TYPE_STUBS,
      'accord-project-types.d.ts'
    );

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      strict: false,
      noEmit: true,
      allowNonTsExtensions: true,
    });
  }, [monaco]);

  // Re-generate model type stubs whenever the Concerto model changes
  useEffect(() => {
    if (!monaco || !modelCto) return;

    let cancelled = false;

    void generateModelTypeStubs(modelCto).then((stubs: string) => {
      if (cancelled || !stubs) return;
      // Dispose previous model stubs before adding new ones
      modelStubDisposable.current?.dispose();
      modelStubDisposable.current =
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          stubs,
          'generated-model-types.d.ts'
        );
    });

    return () => {
      cancelled = true;
      modelStubDisposable.current?.dispose();
      modelStubDisposable.current = null;
    };
  }, [monaco, modelCto]);

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

  const renderStatus = () => {
    if (isDirty) return <span className="logic-editor-status-unsaved">Unsaved changes</span>;
    if (isCompiling) return <span className="logic-editor-status-compiling">Compiling...</span>;
    if (hasErrors) return <span className="logic-editor-status-error">❌ Compilation Failed</span>;
    if (compiledLogicJs) return <span className="logic-editor-status-success">✅ Compiled Successfully</span>;
    if (logicTs) return <span className="logic-editor-status-pending">Not compiled yet</span>;
    return <span className="logic-editor-status-pending">Nothing to compile</span>;
  };

  return (
    <div className="logic-editor-root">
      <div className="logic-editor-toolbar">
        <span className="logic-editor-status">
          {renderStatus()}
        </span>
        <button
          className={`logic-editor-apply-btn${isDirty ? ' logic-editor-apply-btn--dirty' : ''}`}
          onClick={handleApply}
          title="Save and compile logic"
          disabled={isCompiling}
        >
          {isCompiling ? 'Compiling...' : isDirty ? 'Apply & Compile*' : 'Apply & Compile'}
        </button>
      </div>

      <div className="logic-editor-monaco-wrapper">
        <Suspense fallback={<div className="logic-editor-loading">Loading editor...</div>}>
          <MonacoEditor
            language="typescript"
            height="100%"
            value={editorLogicTs}
            theme={themeName}
            options={editorOptions}
            onChange={handleChange}
          />
        </Suspense>
      </div>

      {hasErrors && (
        <div className="logic-editor-errors">
          <strong>Compilation Errors:</strong>
          <ul>
            {compilationErrors.map((err, idx) => (
              <li key={idx}>
                {err.line ? `[Line ${err.line}] ` : ''}{err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
