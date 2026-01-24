import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateModel() {
  const editorModelCto = useAppStore(state => state.editorModelCto);
  const setEditorModelCto = useAppStore(state => state.setEditorModelCto);
  const setModelCto = useAppStore(state => state.setModelCto);
  const { value, setValue } = useUndoRedo(
    editorModelCto,
    setEditorModelCto,
    setModelCto, // Sync to main state and rebuild
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity("concerto");
      setValue(value); // Update editor state and sync
      void setModelCto(value);
    }
  };

  return <ConcertoEditor value={value} onChange={handleChange} />;
}

export default TemplateModel;
