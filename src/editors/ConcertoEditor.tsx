import { useMonaco } from "@monaco-editor/react";
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import * as monaco from "monaco-editor";
import useAppStore from "../store/store";
import { useCodeSelection } from "../components/CodeSelectionMenu";
import { registerAutocompletion } from "../ai-assistant/autocompletion";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

const concertoKeywords = [
  "map",
  "concept",
  "from",
  "optional",
  "default",
  "range",
  "regex",
  "length",
  "abstract",
  "namespace",
  "import",
  "enum",
  "scalar",
  "extends",
  "participant",
  "asset",
  "o",
  "identified by",
  "transaction",
  "event",
];

const concertoTypes = [
  "String",
  "Integer",
  "Double",
  "DateTime",
  "Long",
  "Boolean",
];

const handleEditorWillMount = (monacoInstance: typeof monaco) => {
  monacoInstance.languages.register({
    id: "concerto",
    extensions: [".cto"],
    aliases: ["Concerto", "concerto"],
    mimetypes: ["application/vnd.accordproject.concerto"],
  });

  monacoInstance.languages.setLanguageConfiguration("concerto", {
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: `"`, close: `"` },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: `"`, close: `"` },
    ],
  });

  monacoInstance.languages.setMonarchTokensProvider("concerto", {
    keywords: concertoKeywords,
    typeKeywords: concertoTypes,
    operators: ["=", "{", "}", "@", `"`],
    symbols: /[=}{@"]+/,
    tokenizer: {
      root: [
        { include: "@whitespace" },
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              "@keywords": "keyword",
              "@typeKeywords": "type",
              "@default": "identifier",
            },
          },
        ],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape.invalid"],
        [/"/, "string", "@pop"],
      ],
      whitespace: [
        [/\s+/, "white"],
        [/(\/\/.*)/, "comment"],
      ],
    },
  });

  registerAutocompletion("concerto", monacoInstance);
};

interface ConcertoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
}

export default function ConcertoEditor({ value, onChange }: ConcertoEditorProps) {
  const { handleSelection, MenuComponent } = useCodeSelection("concerto");
  const monacoInstance = useMonaco();

  const {
    error,
    backgroundColor,
    aiConfig,
    showLineNumbers,
    editorSettings,
  } = useAppStore((state) => ({
    error: state.error,
    backgroundColor: state.backgroundColor,
    aiConfig: state.aiConfig,
    showLineNumbers: state.showLineNumbers,
    editorSettings: state.editorSettings,
  }));

  const ctoErr = error?.startsWith("c:") ? error : undefined;

  const themeName = useMemo(
    () => (backgroundColor === "#121212" ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  const options: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,

      // 🔑 NEW — editor settings
      fontSize: editorSettings.fontSize,
      wordWrap: editorSettings.wordWrap,

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

      suggest: {
        preview: true,
        showInlineDetails: true,
      },

      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnCommitCharacter: false,
      acceptSuggestionOnEnter: "off",
      tabCompletion: "off",
    }),
    [
      aiConfig?.enableInlineSuggestions,
      showLineNumbers,
      editorSettings.fontSize,
      editorSettings.wordWrap,
    ]
  );

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor
  ) => {
    editor.onDidChangeCursorSelection(() => {
      handleSelection(editor);
    });
  };

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val);
    },
    [onChange]
  );

  useEffect(() => {
    if (!monacoInstance) return;

    const model = monacoInstance.editor.getModels()?.[0];
    if (!model) return;

    if (ctoErr) {
      const match = ctoErr.match(/Line (\d+) column (\d+)/);
      if (match) {
        const lineNumber = Number(match[1]);
        const columnNumber = Number(match[2]);

        monacoInstance.editor.setModelMarkers(model, "customMarker", [
          {
            startLineNumber: lineNumber,
            startColumn: columnNumber - 1,
            endLineNumber: lineNumber,
            endColumn: columnNumber + 1,
            message: ctoErr,
            severity: monaco.MarkerSeverity.Error,
          },
        ]);
      }
    } else {
      monacoInstance.editor.setModelMarkers(model, "customMarker", []);
    }
  }, [ctoErr, monacoInstance]);

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