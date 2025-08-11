import { lazy, Suspense, useMemo, useCallback } from "react";
import { editor } from "monaco-editor";
import useAppStore from "../store/store";
import { useCodeSelection } from "../components/CodeSelectionMenu";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

export default function JSONEditor({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string | undefined) => void;
}) {
  const { handleSelection, MenuComponent } = useCodeSelection("json");
  
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  const options: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      wordWrap: "on",
      automaticLayout: true,
      scrollBeyondLastLine: false,
    }),
    []
  );

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

  return (
    <div className="editorwrapper relative">
      <Suspense fallback={<div>Loading Editor...</div>}>
        <MonacoEditor
          options={options}
          language="json"
          height="60vh"
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
