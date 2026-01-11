import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import * as monaco from "monaco-editor";
import { lazy, Suspense, useMemo } from "react";
import * as yaml from "js-yaml";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((mod) => ({ default: mod.Editor }))
);

function AgreementData({
  editorRef,
  format,
}: {
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  format: "json" | "yaml";
}) {
  const editorAgreementData = useAppStore(
    (state) => state.editorAgreementData
  );
  const setEditorAgreementData = useAppStore(
    (state) => state.setEditorAgreementData
  );
  const setData = useAppStore((state) => state.setData);

  const { value, setValue } = useUndoRedo(
    editorAgreementData,
    setEditorAgreementData,
    setData
  );

  const backgroundColor = useAppStore((state) => state.backgroundColor);

  const themeName = useMemo(
    () => (backgroundColor ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  /** YAML derived from JSON (read-only) */
  const yamlValue = useMemo(() => {
    try {
      if (!value.trim()) return "";
      return yaml.dump(JSON.parse(value));
    } catch {
      return "# Invalid JSON – cannot render YAML";
    }
  }, [value]);

  const handleJsonChange = (val: string | undefined) => {
    if (val !== undefined) {
      updateEditorActivity("json");
      setValue(val);
      setData(val);
    }
  };

  return (
    <div className="h-full">
      {format === "json" ? (
        <JSONEditor
          value={value}
          onChange={handleJsonChange}
          editorRef={editorRef}
        />
      ) : (
        <Suspense fallback={<div className="p-2">Loading editor…</div>}>
          <MonacoEditor
            language="yaml"
            value={yamlValue}
            theme={themeName}
            height="100%"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default AgreementData;
