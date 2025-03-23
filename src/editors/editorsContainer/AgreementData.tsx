import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { useCallback } from "react";
import { debounce } from "ts-debounce";
import { FaUndo, FaRedo } from "react-icons/fa";
import { AIButton } from "../../components/AIAssistant/AIButton";

function AgreementData() {
  const textColor = useAppStore((state) => state.textColor);
  const setData = useAppStore((state) => state.setData);
  const { value, setValue, undo, redo } = useUndoRedo(
    useAppStore((state) => state.editorAgreementData),
    setData // vinyl: setData to update the preview when undo/redo happens
  );

  const debouncedSetData = useCallback(
    debounce((value: string) => {
      void setData(value);
    }, 500),
    [setData]
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      debouncedSetData(value);
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
