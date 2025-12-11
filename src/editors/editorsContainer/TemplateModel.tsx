import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateModel() {
  const editorModelCto = useAppStore((state) => state.editorModelCto);
  const setEditorModelCto = useAppStore((state) => state.setEditorModelCto);
  const rebuild = useAppStore((state) => state.rebuild);
  const { value, setValue} = useUndoRedo(
    editorModelCto,
    setEditorModelCto
  );
 
  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('concerto');
      setValue(value);
      void rebuild();
    }
  };

  return (
    <ConcertoEditor value={value} onChange={handleChange} />
  );
}

export default TemplateModel;