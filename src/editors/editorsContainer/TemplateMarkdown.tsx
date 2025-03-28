import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";
import { Button, Tooltip } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import { SAMPLES } from "../../samples";

function TemplateMarkdown() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const sampleName = useAppStore((state) => state.sampleName);
  const { value, setValue, undo, redo, reset } = useUndoRedo(
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

  const resetEditor = useAppStore((state) => state.resetEditor);

  const handleReset = async () => {
    try {
      await resetEditor();
      const currentSample = SAMPLES.find((s) => s.NAME === sampleName) || SAMPLES[0];
      reset(currentSample.TEMPLATE);
      setTemplateMarkdown(currentSample.TEMPLATE);
    } catch (error) {
      console.error('Error resetting editor:', error);
    }
  };

  return (

    <div className="column" style={{ backgroundColor: backgroundColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: textColor }}>TemplateMark</h2>
        <div>
        <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
        <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
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
        A natural language template with embedded variables, conditional sections, and TypeScript code.
      </p>
      <MarkdownEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default TemplateMarkdown;