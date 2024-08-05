import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import { useCallback } from 'react';
import { debounce } from "ts-debounce";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);

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

  return (
    <div className="column">
      <h2>TemplateMark</h2>
      <p>
        A natural language template with embedded variables, conditional
        sections, and TypeScript code.
      </p>
      <MarkdownEditor value={editorValue} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;
