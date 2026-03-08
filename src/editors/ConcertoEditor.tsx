import { useMonaco } from "@monaco-editor/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useCallback } from "react";
import * as monaco from "monaco-editor";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import useAppStore from "../store/store";
import { useCodeSelection } from "../components/CodeSelectionMenu";
import { registerAutocompletion } from "../ai-assistant/autocompletion";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

const concertoKeywords = [
  "map", "concept", "from", "optional", "default", "range",
  "regex", "length", "abstract", "namespace", "import", "enum",
  "scalar", "extends", "participant", "asset", "o",
  "identified by", "transaction", "event",
];

const concertoTypes = [
  "String", "Integer", "Double", "DateTime", "Long", "Boolean",
];

const handleEditorWillMount = (monacoInstance: typeof monaco) => {
  monacoInstance.languages.register({
    id: "concerto",
    extensions: [".cto"],
    aliases: ["Concerto", "concerto"],
    mimetypes: ["application/vnd.accordproject.concerto"],
  });

  monacoInstance.languages.setLanguageConfiguration("concerto", {
    brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "\"", close: "\"" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "\"", close: "\"" },
    ],
  });

  monacoInstance.languages.setMonarchTokensProvider("concerto", {
    keywords: concertoKeywords,
    typeKeywords: concertoTypes,
    operators: ["=", "{", "}", "@", '"'],
    symbols: /[=}{@"]+/,
    escapes: /\\(?:[btnfru"'\\]|\\u[0-9A-Fa-f]{4})/,
    tokenizer: {
      root: [
        { include: "@whitespace" },
        [/[a-zA-Z_]\w*/, {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@default": "identifier",
          },
        }],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, "string", "@pop"],
      ],
      whitespace: [
        [/\s+/, "white"],
        [/(\/\/.*)/, "comment"],
      ],
    },
  });

  if (monacoInstance) {
    registerAutocompletion("concerto", monacoInstance);
  }
};

interface ConcertoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
}

export default function ConcertoEditor({ value, onChange }: ConcertoEditorProps) {
  const { handleSelection, MenuComponent } = useCodeSelection("concerto");
  const monacoInstance = useMonaco();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  const { error, backgroundColor, aiConfig, showLineNumbers } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      error: state.error,
      backgroundColor: state.backgroundColor,
      aiConfig: state.aiConfig,
      showLineNumbers: state.showLineNumbers,
    }),
    shallow
  );

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val);
    },
    [onChange]
  );

  const options: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(() => ({
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbers: showLineNumbers ? "on" : "off",
    autoClosingBrackets: "languageDefined",
    autoSurround: "languageDefined",
    bracketPairColorization: { enabled: true },
    inlineSuggest: {
      enabled: aiConfig?.enableInlineSuggestions !== false,
      mode: "prefix",
      suppressSuggestions: false,
      fontFamily: "inherit",
      keepOnBlur: true,
    },
    suggest: { preview: true, showInlineDetails: true },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: "off",
    tabCompletion: "off",
  }), [showLineNumbers, aiConfig?.enableInlineSuggestions]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    decorationsCollectionRef.current = editor.createDecorationsCollection();
    editor.onDidChangeCursorSelection(() => {
      handleSelection(editor);
    });
  };

  useEffect(() => {
    if (!monacoInstance || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (error) {
      const match = error.match(/Line (\d+)(?::| )Col(?:umn)? (\d+)/i);
      if (match) {
        const line = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);

        monacoInstance.editor.setModelMarkers(model, "customMarker", [{
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
          message: error,
          severity: monaco.MarkerSeverity.Error,
        }]);

        decorationsCollectionRef.current?.set([
          {
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: "errorLineHighlight",
            }
          }
        ]);
      } else {
        monacoInstance.editor.setModelMarkers(model, "customMarker", []);
        decorationsCollectionRef.current?.clear();
      }
    } else {
      monacoInstance.editor.setModelMarkers(model, "customMarker", []);
      decorationsCollectionRef.current?.clear();
    }
  }, [error, monacoInstance]);

  return (
    <div className="editorwrapper h-full w-full">
      <Suspense fallback={<div>Loading Editor...</div>}>
        <MonacoEditor
          options={options}
          language="concerto"
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