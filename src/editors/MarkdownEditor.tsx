import { lazy, Suspense, useMemo, useCallback, useEffect } from "react";
import useAppStore from "../store/store";
import { useMonaco } from "@monaco-editor/react";

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
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
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
            "editor.lineHighlightBorder": "#c5b58e60",
            "editor.wordHighlightTextBackground": "#88888860",
            "editor.selectionBackground": "#4A85BF80",
          },
        });
      };

      defineTheme("lightTheme", "vs");
      defineTheme("darkTheme", "vs-dark");

      monaco.editor.setTheme(themeName);
    }
  }, [monaco, backgroundColor, textColor, themeName]);

  const editorOptions = {
    minimap: { enabled: false },
    wordWrap: "on" as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
  };

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  return (
    <div className="editorwrapper">
      <Suspense fallback={<div>Loading Editor...</div>}>
        <MonacoEditor
          options={editorOptions}
          language="markdown"
          height="60vh"
          value={value}
          onChange={handleChange}
          theme={themeName}
        />
      </Suspense>
    </div>
  );
}
