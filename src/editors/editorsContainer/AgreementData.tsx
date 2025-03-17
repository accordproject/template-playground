import { FaMagic } from "react-icons/fa";
import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";

function AgreementData() {
  const textColor = useAppStore((state) => state.textColor);
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore((state) => state.setEditorAgreementData);
  const setData = useAppStore((state) => state.setData);
  
  const { value, setValue, undo, redo } = useUndoRedo(
    editorAgreementData,
    setEditorAgreementData,
    setData
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      setData(value);
    }
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      setValue(formatted);
      setEditorAgreementData(formatted);
    } catch {
      alert("Invalid JSON format!");
    }
  };

  return (
    <div className="column">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>Data</h3>
        <div>
          <FaMagic
            style={{ cursor: "pointer", color: textColor, marginRight: "8px" }}
            onClick={handleFormat}
            title="Format JSON"
          />
          <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <p style={{ color: textColor }}>JSON data (instance of the Concerto model) for preview output.</p>
      <JSONEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default AgreementData;
