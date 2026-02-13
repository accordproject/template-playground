import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import * as monaco from "monaco-editor";

function AgreementData({
  editorRef,
}: {
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}) {
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore(
    (state) => state.setEditorAgreementData,
  );
  const setData = useAppStore((state) => state.setData);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity("json");
      setEditorAgreementData(value); // Update editor state
      void setData(value); // Sync to main state and rebuild
    }
  };

  return (
    <JSONEditor
      value={editorAgreementData}
      onChange={handleChange}
      editorRef={editorRef}
    />
  );
}

export default AgreementData;
