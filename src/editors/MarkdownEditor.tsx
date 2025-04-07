import {
  lazy,
  Suspense,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import useAppStore from "../store/store";
import { useMonaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor"; // Import Monaco types for the editor instance
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
  // State to track font size for zooming
  // Initialize fontSize from localStorage or default to 14
  const [fontSize, setFontSize] = useState<number>(() => {
    const savedFontSize = localStorage.getItem("markdownEditorFontSize");
    return savedFontSize ? parseFloat(savedFontSize) : 14; // Default to 14 if not found
  });

  // Save fontSize to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("markdownEditorFontSize", fontSize.toString());
  }, [fontSize]);

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
          },
        });
      };

      defineTheme("lightTheme", "vs");
      defineTheme("darkTheme", "vs-dark");

      monaco.editor.setTheme(themeName);
    }
  }, [monaco, backgroundColor, textColor, themeName]);

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      wordWrap: "on" as const,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize,
    }),
    [fontSize]
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  // Handle editor mount to attach zoom functionality
  const handleEditorDidMount = (
    editor: monacoEditor.editor.IStandaloneCodeEditor
  ) => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        // Prevent default browser zoom behavior
        event.preventDefault();

        // Adjust font size based on scroll direction
        const zoomSpeed = 1; // Adjust zoom speed as needed
        const delta = event.deltaY < 0 ? zoomSpeed : -zoomSpeed;
        setFontSize((prev) => {
          const newSize = Math.min(Math.max(prev + delta, 8), 40); // Clamp between 8px and 40px

          editor.updateOptions({ fontSize: newSize });
          return newSize;
        });
      }
    };

    // Get the editor's DOM element and attach the wheel event listener
    const editorDomNode = editor.getDomNode();

    if (editorDomNode) {
      editorDomNode.addEventListener("wheel", handleWheel, { passive: false });
    }

    // Clean up the event listener on unmount
    return () => {
      if (editorDomNode) {
        editorDomNode.removeEventListener("wheel", handleWheel);
      }
    };
  };

  return (
    <div className="editorwrapper">
      <Suspense fallback={<div>Loading Editor...</div>}>
        <MonacoEditor
          options={options}
          language="markdown"
          height="60vh"
          value={value}
          onChange={handleChange}
          theme={themeName}
          onMount={handleEditorDidMount}
        />
      </Suspense>
    </div>
  );
}
