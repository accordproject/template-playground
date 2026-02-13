import { lazy, Suspense, useMemo, useCallback, useEffect } from "react";
import * as monaco from "monaco-editor";
import useAppStore from "../store/store";
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
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("json");

  const { backgroundColor, aiConfig } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    aiConfig: state.aiConfig,
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
  }), [aiConfig?.enableInlineSuggestions]);


  const handleEditorWillMount = (monacoInstance: typeof monaco) => {
    if (monacoInstance) {
      registerAutocompletion('json', monacoInstance);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (editorRef) {
      editorRef.current = editor;
    }
    registerEditor('json', editor);
    editor.onDidChangeCursorSelection(() => {
      handleSelection(editor);
    });
  };

  useEffect(() => {
    return () => {
      unregisterEditor('json');
    };
  }, []);

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
