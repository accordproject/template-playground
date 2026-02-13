import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateModel() {
  const editorModelCto = useAppStore((state) => state.editorModelCto);
  const setEditorModelCto = useAppStore((state) => state.setEditorModelCto);
  const setModelCto = useAppStore((state) => state.setModelCto);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity("concerto");
      setEditorModelCto(value); // Update editor state
      void setModelCto(value); // Sync to main state and rebuild
    }
  };

  return <ConcertoEditor value={editorModelCto} onChange={handleChange} />;
}

export default TemplateModel;
