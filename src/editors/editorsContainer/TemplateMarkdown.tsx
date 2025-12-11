import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const rebuild = useAppStore((state) => state.rebuild);
  const { value, setValue} = useUndoRedo(
    editorValue,
    setEditorValue
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity('markdown');
      setValue(value);
      void rebuild();
    }
  };

  return (
    <MarkdownEditor value={value} onChange={handleChange} />
  );
}

export default TemplateMarkdown;