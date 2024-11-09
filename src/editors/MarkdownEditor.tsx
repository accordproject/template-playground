import { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import useAppStore from "../store/store";

const options = {
  minimap: { enabled: false },
  wordWrap: "on" as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
};

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
}) {
  const monaco = useMonaco();
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("lightTheme", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": backgroundColor,
          "editor.foreground": textColor,
          "editor.lineHighlightBorder": "#EDE8DC",
        },
      });

      monaco.editor.defineTheme("darkTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": backgroundColor,
          "editor.foreground": textColor,
          "editor.lineHighlightBorder": "#EDE8DC",
        },
      });
      monaco.editor.setTheme(backgroundColor ? "darkTheme" : "lightTheme");
    }
  }, [monaco, backgroundColor, textColor]);

  return (
    <div className="editorwrapper">
      <Editor
        options={options}
        language="markdown"
        height="60vh"
        value={value}
        onChange={onChange}
        theme={backgroundColor ? "darkTheme" : "lightTheme"}
      />
    </div>
  );
}