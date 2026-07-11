import { lazy, Suspense, useMemo, useCallback, useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import useAppStore from "../store/store";
import useThemeName from "../hooks/useThemeName";
import { useCodeSelection } from "../components/CodeSelectionMenu";
import { registerAutocompletion } from "../ai-assistant/autocompletion";
import { registerEditor, unregisterEditor } from "../utils/editorNavigation";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

export default function JSONEditor({
  value,
  onChange,
  editorRef,
  readOnly = false,
  id = "json",
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  readOnly?: boolean;
  id?: string;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("json");
  const internalEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { aiConfig, showLineNumbers } = useAppStore((state) => ({
    aiConfig: state.aiConfig,
    showLineNumbers: state.showLineNumbers,
  }));

  const themeName = useThemeName();

  const options: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(() => ({
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    readOnly,
    inlineSuggest: {
      enabled: aiConfig?.enableInlineSuggestions !== false,
      mode: "prefix",
      suppressSuggestions: false,
      fontFamily: "inherit",
      keepOnBlur: true,
    },
    suggest: {
      preview: true,
      showInlineDetails: true,
    },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: "off",
    tabCompletion: "off",
  }), [aiConfig?.enableInlineSuggestions, showLineNumbers, readOnly]);


  const handleEditorWillMount = (monacoInstance: typeof monaco) => {
    if (monacoInstance) {
      registerAutocompletion('json', monacoInstance);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    internalEditorRef.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }
    /*
     * Monaco reuses cached models when a path already exists in its registry.
     * In that case, the `value` prop is ignored entirely. We explicitly call
     * setValue() here to guarantee the editor always reflects the correct data,
     * even when a stale model was fetched from the Monaco model cache.
     */
        if (value !== undefined && editor.getValue() !== value) {
      editor.setValue(value);
    }
    if (!readOnly) {
      registerEditor('json', editor);
      editor.onDidChangeCursorSelection(() => {
        handleSelection(editor);
      });
    }
  };

  /*
   * Sync the value prop to the editor imperatively. The @monaco-editor/react
   * library only uses `value` at model-creation time when a `path` is set;
   * if the model already exists in the Monaco registry, subsequent value
   * changes via props are ignored. This effect ensures read-only output
   * editors always reflect the latest store data.
   */
  useEffect(() => {
    const editor = internalEditorRef.current;
    if (editor && value !== undefined && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (!readOnly) {
        unregisterEditor('json');
      }
    };
  }, [readOnly]);

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  return (
    <div className="editorwrapper h-full w-full">
      <Suspense fallback={<div>Loading Editor...</div>}>
        <MonacoEditor
          options={options}
          language="json"
          path={`${id}.json`}
          height="100%"
          value={value}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleChange}
          theme={themeName}
        />
      </Suspense>
      {MenuComponent}
    </div>
  );
}
