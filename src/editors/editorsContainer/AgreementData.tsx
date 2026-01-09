import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import * as monaco from "monaco-editor";

function AgreementData({ editorRef }: { editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> }) {
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore((state) => state.setEditorAgreementData);
  const rebuild = useAppStore((state) => state.rebuild);
  const { value, setValue } = useUndoRedo(
    editorAgreementData,
    setEditorAgreementData
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('json');
      setValue(value);
      void rebuild();
    }
  };

  return (
    <JSONEditor value={value} onChange={handleChange} editorRef={editorRef} />
  );
}

export default AgreementData;