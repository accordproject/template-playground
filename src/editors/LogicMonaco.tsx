import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as monacoNS from 'monaco-editor';
import useAppStore from '../store/store';
import useThemeName from '../hooks/useThemeName';
import { registerEditor, unregisterEditor } from '../utils/editorNavigation';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((mod) => ({ default: mod.Editor }))
);

/**
 * The Monaco TypeScript editor for contract logic, bound to the app store:
 * configures the virtual TS compiler with the `TemplateLogic` declarations,
 * writes edits to `editorLogicTs` and surfaces compilation errors as markers.
 * Chrome-free, so both the legacy LogicEditor and the design-v2 Logic step
 * can wrap it in their own header and status bar.
 */
export default function LogicMonaco() {
  const monaco = useMonaco();
  const compilerConfigured = useRef(false);

  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  const logicTs = useAppStore((s) => s.logicTs);
  const setEditorLogicTs = useAppStore((s) => s.setEditorLogicTs);
  const showLineNumbers = useAppStore((s) => s.showLineNumbers);
  const compilationErrors = useAppStore((s) => s.compilationErrors);

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

  // Cleanup editor registration on unmount
  useEffect(() => {
    return () => unregisterEditor('logic');
  }, []);

  // Has the editor content diverged from committed logic?
  const isDirty = editorLogicTs !== logicTs;

  // Sync compilation errors with Monaco markers
  useEffect(() => {
    if (!monaco || !compilerConfigured.current) return;
    const models = monaco.editor.getModels();
    const model = models.find((m) => m.uri.path === '/logic.ts');
    if (model) {
      const markers = !isDirty
        ? (compilationErrors || []).map((e) => ({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: e.line || 1,
            startColumn: e.column || 1,
            endLineNumber: e.line || 1,
            endColumn: e.column ? e.column + (e.length || 1) : 1,
            message: e.message,
          }))
        : [];
      monaco.editor.setModelMarkers(model, 'logic', markers);
    }
  }, [monaco, compilationErrors, isDirty]);

  return (
    <div className="editorwrapper h-full w-full" style={{ position: 'relative', minHeight: 0 }}>
      <Suspense fallback={<div className="logic-editor-loading">Loading editor...</div>}>
        <MonacoEditor
          path="logic.ts"
          language="typescript"
          height="100%"
          value={editorLogicTs}
          theme={themeName}
          options={editorOptions}
          onChange={handleChange}
          onMount={(editor) => registerEditor('logic', editor)}
        />
      </Suspense>
    </div>
  );
}
