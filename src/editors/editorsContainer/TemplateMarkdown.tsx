import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { useCallback } from "react";
import { debounce } from "ts-debounce";
import { FaUndo, FaRedo } from "react-icons/fa";

function TemplateMarkdown() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const { value, set, undo, redo } = useUndoRedo(useAppStore((state) => state.editorValue));

  const debouncedSetTemplateMarkdown = useCallback(
    debounce((value: string) => {
      void setTemplateMarkdown(value);
    }, 500),
    [setTemplateMarkdown]
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      set(value);
      debouncedSetTemplateMarkdown(value);
    }
  };

  return (
    <div className="column" style={{ backgroundColor }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>TemplateMark</h3>
        <div>
          <FaUndo onClick={undo} style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <p style={{ color: textColor }}>
        A natural language template with embedded variables, conditional sections, and TypeScript code.
      </p>
      <MarkdownEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;