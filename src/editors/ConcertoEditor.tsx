import { useMonaco } from "@monaco-editor/react";
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import * as monaco from "monaco-editor";
import useAppStore from "../store/store";
import { useCodeSelection } from "../components/CodeSelectionMenu";

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
  "default",
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
        [/"([^"\\]|\\.)*$/, "string.invalid"], // non-terminated string
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

  monacoInstance.editor.defineTheme("concertoTheme", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "cd2184" },
      { token: "type", foreground: "008080" },
      { token: "identifier", foreground: "000000" },
      { token: "string", foreground: "008000" },
      { token: "string.escape", foreground: "800000" },
      { token: "comment", foreground: "808080" },
      { token: "white", foreground: "FFFFFF" },
    ],
    colors: {},
  });

  monacoInstance.editor.setTheme("concertoTheme");
};

interface ConcertoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
}

export default function ConcertoEditor({
  value,
  onChange,
}: ConcertoEditorProps) {
  const { handleSelection, MenuComponent } = useCodeSelection("concerto");
  const monacoInstance = useMonaco();
  const error = useAppStore((state) => state.error);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const ctoErr = error?.startsWith("c:") ? error : undefined;

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    autoClosingBrackets: "languageDefined",
    autoSurround: "languageDefined",
    bracketPairColorization: { enabled: true },
  };

  const handleEditorDidMount = (editor: any) => {
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

  useEffect(() => {
    if (!monacoInstance) return;

    const model = monacoInstance.editor.getModels()?.[0];
    if (!model) return;

    if (ctoErr) {
      const match = ctoErr.match(/Line (\d+) column (\d+)/);
      if (match) {
        const lineNumber = parseInt(match[1], 10);
        const columnNumber = parseInt(match[2], 10);
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
