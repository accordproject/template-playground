import ConcertoEditor from "../ConcertoEditor";
import DiffViewer from "../DiffEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateModel() {
  const {
    editorModelCto,
    setEditorModelCto,
    setModelCto,
    isDiffViewEnabled,
    originalModel,
    backgroundColor
  } = useAppStore((state) => ({
    editorModelCto: state.editorModelCto,
    setEditorModelCto: state.setEditorModelCto,
    setModelCto: state.setModelCto,
    isDiffViewEnabled: state.isDiffViewEnabled,
    originalModel: state.originalModel,
    backgroundColor: state.backgroundColor,
  }));
  const { value, setValue } = useUndoRedo(
    editorModelCto,
    setEditorModelCto,
    setModelCto // Sync to main state and rebuild
  );
 
  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('concerto');
      setValue(value); // Update editor state and sync
      void setModelCto(value); 
    }
  };

  return (
    <>
      {isDiffViewEnabled ? (
        <DiffViewer
          original={originalModel}
          modified={value}
          language="concerto"
          theme={backgroundColor ? "darkTheme" : "lightTheme"}
        />
      ) : (
        <ConcertoEditor value={value} onChange={handleChange} />
      )}
    </>
  );
}

export default TemplateModel;