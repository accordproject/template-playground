import ConcertoEditor from "../ConcertoEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { FaUndo, FaRedo } from "react-icons/fa";

function TemplateModel() {
  const textColor = useAppStore((state) => state.textColor);
  const setModelCto = useAppStore((state) => state.setModelCto);
  const { value, setValue, undo, redo } = useUndoRedo(
    useAppStore((state) => state.modelCto),
    setModelCto 
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      setModelCto(value); 
    }
  };

  return (
    <div className="column">
      <div className="tooltip" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: textColor }}>Concerto Model</h3>
        <div>
          <FaUndo onClick={undo} title="Undo" style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} />
          <FaRedo onClick={redo} title="Redo" style={{ cursor: "pointer", color: textColor }} />
        </div>
      </div>
      <span style={{ color: textColor }} className="tooltiptext">
        Defines the data model for the template and its logic.
      </span>
      <ConcertoEditor value={value} onChange={handleChange} />
    </div>
  );
}

export default TemplateModel;