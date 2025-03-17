import { FaMagic } from "react-icons/fa";
import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import { useCallback } from "react";
import { debounce } from "ts-debounce";

function TemplateModel() {
  const editorModelCto = useAppStore((state) => state.editorModelCto);
  const setEditorModelCto = useAppStore((state) => state.setEditorModelCto);
  const setModelCto = useAppStore((state) => state.setModelCto);
  const textColor = useAppStore((state) => state.textColor);

  const debouncedSetModelCto = useCallback(
    debounce((value: string) => {
      void setModelCto(value);
    }, 500),
    [setModelCto]
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorModelCto(value);
      debouncedSetModelCto(value);
    }
  };

  const handleFormat = () => {
    try {
      // Split into lines and filter out empty ones
      const lines = editorModelCto.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      let indentLevel = 0;
      const formattedLines = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const isClosingBrace = line.startsWith("}");

        // Decrease indent before adding the line if it's a closing brace
        if (isClosingBrace) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indent = "  ".repeat(indentLevel);

        // Handle concept declaration with opening brace
        if (line.startsWith("concept") && !line.endsWith("{")) {
          formattedLines.push(`${indent}${line} {`);
          indentLevel++;
        } 
        // Handle closing brace
        else if (isClosingBrace) {
          formattedLines.push(`${indent}}`);
        } 
        // Handle fields (lines starting with "o")
        else if (line.startsWith("o")) {
          // Split multiple "o" declarations on the same line
          const fields = line.split(/(?=o\s)/).map(field => field.trim());
          fields.forEach(field => {
            if (field) formattedLines.push(`${indent}${field}`);
          });
        } 
        // Handle lines that already have an opening brace
        else if (line.includes("{")) {
          formattedLines.push(`${indent}${line}`);
          indentLevel++;
        } 
        // Default case: just add the line with current indent
        else {
          formattedLines.push(`${indent}${line}`);
        }
      }

      const formatted = formattedLines.join("\n");
      setEditorModelCto(formatted);
    } catch (error) {
      alert("Error formatting Concerto model!");
    }
  };

  return (
    <div className="column">
      <div className="tooltip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: textColor }}>Concerto Model</h3>
        <FaMagic
          style={{ cursor: "pointer", color: textColor }}
          onClick={handleFormat}
          title="Format Concerto Model"
        />
      </div>
      <span style={{ color: textColor }} className="tooltiptext">
        Defines the data model for the template and its logic.
      </span>
      <ConcertoEditor value={editorModelCto} onChange={handleChange} />
    </div>
  );
}

export default TemplateModel;