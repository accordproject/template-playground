import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import { useCallback } from "react";
import { debounce } from "ts-debounce";
import { Button, Tooltip } from "antd";
import { RedoOutlined } from "@ant-design/icons";

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

  const resetEditor = useAppStore((state) => state.resetEditor);

  const handleReset = () => {
    resetEditor();
  };

  return (
    <div className="column" style={{ backgroundColor: backgroundColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: textColor }}>TemplateMark</h2>
        <div>
          <Tooltip title="Reset to original template">
            <Button
              icon={<RedoOutlined />}
              onClick={handleReset}
              type="text"
              style={{ color: textColor }}
            />
          </Tooltip>
        </div>
      </div>
      <p style={{ color: textColor }}>
        A natural language template with embedded variables, conditional
        sections, and TypeScript code.
      </p>
      <MarkdownEditor value={editorValue} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;
