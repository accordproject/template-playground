import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";

import { FaUndo, FaRedo } from "react-icons/fa";
import { AIButton } from "../../components/AIAssistant/AIButton";

function AgreementData() {
  const textColor = useAppStore((state) => state.textColor);
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore((state) => state.setEditorAgreementData);
  const setData = useAppStore((state) => state.setData);
  const { value, setValue, undo, redo } = useUndoRedo(
    editorAgreementData,
    setEditorAgreementData,
    setData // Sync to main state and rebuild
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value); // Update editor state and sync
      setData(value); 
    }
  };

  return (
    <div className="column">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>Data</h3>
        <div>
          <AIButton editorType="data" currentContent={value} onComplete={handleChange} />
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

export default AgreementData;
