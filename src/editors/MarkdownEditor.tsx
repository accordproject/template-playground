import { lazy, Suspense, useMemo, useCallback, useEffect, useRef } from "react";
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
  onEditorReady,
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
  onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("markdown");
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

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

  // --- 1. ROBUST VALIDATION LOGIC ---
  useEffect(() => {
    if (!monaco || !editorRef.current) return;

    const editorInstance = editorRef.current;
    const model = editorInstance.getModel();

    if (!model) return;

    const validate = () => {
      const text = model.getValue();
      const markers: editor.IMarkerData[] = [];
      
      // Standard JS Regex (Much safer than Monaco's string-based regex)
      // Matches: ![...](file://...) OR ![...](C:...) OR ![...](/...)
      const regex = /!\[.*?\]\(\s*(?:file:\/\/|\\\\|[a-zA-Z]:).+?\)/g;
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        // We found a bad link! Now calculate where it is.
        const startPos = model.getPositionAt(match.index);
        const endPos = model.getPositionAt(match.index + match[0].length);
        
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
          message: "Local file paths are not supported. Please use an HTTPS URL.",
          source: "Markdown Editor"
        });
      }

      // Debug Log
      if (markers.length > 0) {
        console.log("✅ Validation: Found local paths!", markers);
      }

      monaco.editor.setModelMarkers(model, "local-path-check", markers);
    };

    // Run immediately
    validate();

    // Run on change
    const subscription = model.onDidChangeContent(() => {
      validate();
    });

    return () => {
      subscription.dispose();
    };

  }, [monaco, editorRef.current]); 

  // --- (Rest of the file remains standard) ---
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

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorSelection(() => {
      handleSelection(editorInstance);
    });
    if (monaco) {
      registerAutocompletion('markdown', monaco);
    }
    if (onEditorReady) {
      onEditorReady(editorInstance);
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