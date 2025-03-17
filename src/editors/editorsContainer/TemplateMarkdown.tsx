import { FaMagic } from "react-icons/fa";
import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import { useCallback } from "react";
import { debounce } from "ts-debounce";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  const debouncedSetTemplateMarkdown = useCallback(
    debounce((value: string) => {
      void setTemplateMarkdown(value);
    }, 500),
    []
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      debouncedSetTemplateMarkdown(value);
    }
  };

  const handleFormat = async () => {
    try {
      const formatted = await remark()
        .use(remarkParse)
        .use(remarkStringify)
        .process(editorValue);
      setEditorValue(String(formatted));
    } catch (error) {
      alert("Error formatting Markdown!");
    }
  };

  return (
    <div className="column" style={{ backgroundColor: backgroundColor }}>
      <div className="tooltip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: textColor }}>TemplateMark</h2>
        <FaMagic
          style={{ cursor: "pointer", color: textColor }}
          onClick={handleFormat}
          title="Format Markdown"
        />
      </div>
      <p style={{ color: textColor }}>
        A natural language template with embedded variables, conditional sections, and TypeScript code.
      </p>
      <MarkdownEditor value={editorValue} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;
