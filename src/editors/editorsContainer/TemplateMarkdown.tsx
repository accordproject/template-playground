import { FaMagic } from "react-icons/fa";
import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";

function TemplateMarkdown() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  
  const { value, setValue, undo, redo } = useUndoRedo(
    editorValue,
    setEditorValue,
    setTemplateMarkdown
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      setTemplateMarkdown(value);
    }
  };

  const handleFormat = async () => {
    try {
      const formatted = await remark().use(remarkParse).use(remarkStringify).process(value);
      setValue(String(formatted));
      setEditorValue(String(formatted));
    } catch {
      alert("Error formatting Markdown!");
    }
  };

  return (
    <div className="column" style={{ backgroundColor }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>TemplateMark</h3>
        <div>
          <FaMagic
            style={{ cursor: "pointer", color: textColor, marginRight: "8px" }}
            onClick={handleFormat}
            title="Format Markdown" 
          />
          <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <p style={{ color: textColor }}>A natural language template with embedded logic.</p>
      <MarkdownEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;
