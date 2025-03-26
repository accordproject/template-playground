import { lazy, Suspense, useMemo, useCallback } from "react";
import { editor } from "monaco-editor";
import useAppStore from "../store/store";
import { Skeleton } from "../components/Skeleton";

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

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  return (
    <div className="editorwrapper">
      <Suspense
        fallback={
          <div>
            <Skeleton
              style={{
                width: "100%",
                height: "60vh",
              }}
            />
          </div>
        }
      >
        <MonacoEditor
          options={options}
          language="json"
          height="60vh"
          value={value}
          onChange={handleChange}
          theme={themeName}
        />
      </Suspense>
    </div>
  );
}
