import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";

function AgreementData() {
  const textColor = useAppStore((state) => state.textColor);
  const setData = useAppStore((state) => state.setData);
  const { value, setValue, undo, redo } = useUndoRedo(
    useAppStore((state) => state.editorAgreementData),
    setData // Pass setData to update the preview when undo/redo happens
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      setData(value); // Call setData directly
    }
  };

  return (
    <div className="column" >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>Data</h3>
        <div>
          <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <p style={{ color: textColor }}>
      JSON data (an instance of the Concerto model) used to preview output from the template.
      </p>
      <JSONEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default AgreementData;