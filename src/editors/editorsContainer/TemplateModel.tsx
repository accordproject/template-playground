import { FaMagic } from "react-icons/fa";
import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";

function TemplateModel() {
  const textColor = useAppStore((state) => state.textColor);
  const editorModelCto = useAppStore((state) => state.editorModelCto);
  const setEditorModelCto = useAppStore((state) => state.setEditorModelCto);
  const setModelCto = useAppStore((state) => state.setModelCto);

  const { value, setValue, undo, redo } = useUndoRedo(
    editorModelCto,
    setEditorModelCto,
    setModelCto
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      setModelCto(value);
    }
  };

  const handleFormat = () => {
    try {
      const lines = value.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      let indentLevel = 0;
      const formattedLines: string[] = [];

      lines.forEach(line => {
        const isClosingBrace = line.startsWith("}");
        if (isClosingBrace) indentLevel = Math.max(0, indentLevel - 1);

        const indent = "  ".repeat(indentLevel);
        if (line.startsWith("concept") && !line.endsWith("{")) {
          formattedLines.push(`${indent}${line} {`);
          indentLevel++;
        } else if (isClosingBrace) {
          formattedLines.push(`${indent}}`);
        } else if (line.startsWith("o")) {
          line.split(/(?=o\s)/).map(field => field.trim()).forEach(field => formattedLines.push(`${indent}${field}`));
        } else if (line.includes("{")) {
          formattedLines.push(`${indent}${line}`);
          indentLevel++;
        } else {
          formattedLines.push(`${indent}${line}`);
        }
      });

      const formatted = formattedLines.join("\n");
      setValue(formatted);
      setEditorModelCto(formatted);
    } catch {
      alert("Error formatting Concerto model!");
    }
  };

  return (
    <div className="column">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>Concerto Model</h3>
        <div>
          <FaMagic
            style={{ cursor: "pointer", color: textColor, marginRight: "8px" }}
            onClick={handleFormat}
            title="Format Concerto Model"
          />
          <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <p style={{ color: textColor }}>Defines the data model for the template.</p>
      <ConcertoEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default TemplateModel;
