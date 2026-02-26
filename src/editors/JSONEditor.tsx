import { lazy, Suspense, useMemo, useCallback } from "react";
import * as monaco from "monaco-editor";
import useAppStore from "../store/store";
import { useCodeSelection } from "../components/CodeSelectionMenu";
import { registerAutocompletion } from "../ai-assistant/autocompletion";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

export default function JSONEditor({
  value,
  onChange,
  editorRef,
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("json");

  const { backgroundColor, aiConfig, showLineNumbers } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    aiConfig: state.aiConfig,
    showLineNumbers: state.showLineNumbers,
  }));

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  const options: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(() => ({
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbers: showLineNumbers ? 'on' : 'off',
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
  }), [aiConfig?.enableInlineSuggestions, showLineNumbers]);


  const handleEditorWillMount = (monacoInstance: typeof monaco) => {
    if (monacoInstance) {
      registerAutocompletion('json', monacoInstance);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (editorRef) {
      editorRef.current = editor;
    }
    // Register editor reference in store for snippet insertion
    useAppStore.getState().setJsonEditorRef(editor);

    editor.onDidChangeCursorSelection(() => {
      handleSelection(editor);
    });
  };

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
