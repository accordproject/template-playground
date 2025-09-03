import { lazy, Suspense, useMemo, useCallback, useEffect } from "react";
import useAppStore from "../store/store";
import { useMonaco } from "@monaco-editor/react";
import { useCodeSelection } from "../components/CodeSelectionMenu";
import type { editor } from "monaco-editor";
import { registerAutocompletion } from "../ai-assistant/autocompletion";


const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("markdown");
  const { backgroundColor, textColor, aiConfig } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
    textColor: state.textColor,
    aiConfig: state.aiConfig,
  }));
  const monaco = useMonaco();

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  useEffect(() => {
    if (monaco) {
      const defineTheme = (name: string, base: "vs" | "vs-dark") => {
        monaco.editor.defineTheme(name, {
          base,
          inherit: true,
          rules: [],
          colors: {
            "editor.background": backgroundColor,
            "editor.foreground": textColor,
            "editor.lineHighlightBorder": "#EDE8DC",
            "editorGhostText.foreground": "#9c9a9a"
          },
        });
      };

      defineTheme("lightTheme", "vs");
      defineTheme("darkTheme", "vs-dark");

      monaco.editor.setTheme(themeName);
    }
  }, [monaco, backgroundColor, textColor, themeName]);

  const editorOptions: editor.IStandaloneEditorConstructionOptions = useMemo(() => ({
    minimap: { enabled: false },
    wordWrap: "on" as const,
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

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editor.onDidChangeCursorSelection(() => {
      handleSelection(editor);
    });

    if (monaco) {
      registerAutocompletion('markdown', monaco);
    }
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
          options={editorOptions}
          language="markdown"
          height="100%"
          value={value}
          onMount={handleEditorDidMount}
          onChange={handleChange}
          theme={themeName}
        />
      </Suspense>
      {MenuComponent}
    </div>
  );
}