import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const { value, setValue} = useUndoRedo(
    editorValue,
    setEditorValue,
    setTemplateMarkdown // Sync to main state and rebuild
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('markdown');
      setValue(value); // Update editor state and sync
      void setTemplateMarkdown(value); 
    }
  };

  return (
    <MarkdownEditor value={value} onChange={handleChange} />
  );
}

export default TemplateMarkdown;