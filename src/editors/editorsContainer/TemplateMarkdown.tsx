import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";

function TemplateMarkdown() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const { value, setValue, undo, redo } = useUndoRedo(
    editorValue,
    setEditorValue,
    setTemplateMarkdown // Sync to main state and rebuild
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value); // Update editor state and sync
      setTemplateMarkdown(value); 
    }
  };

  return (
    // <div className="column" style={{ backgroundColor }}>
    //   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    //     <h3 style={{ color: textColor }}>TemplateMark</h3>
    //     <div>
    //       <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
    //       <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
    //     </div>
    //   </div>
    //   <p style={{ color: textColor }}>
    //     A natural language template with embedded variables, conditional sections, and TypeScript code.
    //   </p>
      <MarkdownEditor value={value} onChange={handleChange} />
    // </div>
  );
}

export default TemplateMarkdown;