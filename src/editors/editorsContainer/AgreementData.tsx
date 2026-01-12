import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import * as monaco from "monaco-editor";

function AgreementData({ editorRef }: { editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> }) {
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore((state) => state.setEditorAgreementData);
  const setData = useAppStore((state) => state.setData);
  const { value, setValue } = useUndoRedo(
    editorAgreementData,
    setEditorAgreementData,
    setData // Sync to main state and rebuild
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('json');
      setValue(value); // Update editor state and sync
      setData(value); 
    }
  };

  return (
    <JSONEditor value={value} onChange={handleChange} editorRef={editorRef} />
  );
}

export default AgreementData;