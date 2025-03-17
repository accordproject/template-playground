import { FaMagic } from "react-icons/fa";
import JSONEditor from "../JSONEditor";
import useAppStore from "../../store/store";
import { useCallback } from "react";
import { debounce } from "ts-debounce";

function AgreementData() {
  const editorAgreementData = useAppStore((state) => state.editorAgreementData);
  const setEditorAgreementData = useAppStore(
    (state) => state.setEditorAgreementData
  );
  const setData = useAppStore((state) => state.setData);
  const textColor = useAppStore((state) => state.textColor);

  const debouncedSetData = useCallback(
    debounce((value: string) => {
      void setData(value);
    }, 500),
    [setData]
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorAgreementData(value);
      debouncedSetData(value);
    }
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(editorAgreementData), null, 2);
      setEditorAgreementData(formatted);
    } catch (error) {
      alert("Invalid JSON format!");
    }
  };

  return (
    <div className="column">
      <div className="tooltip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: textColor }}>Data</h3>
        <FaMagic
          style={{ cursor: "pointer", color: textColor }}
          onClick={handleFormat}
          title="Format JSON"
        />
      </div>
      <span style={{ color: textColor }} className="tooltiptext">
        JSON data (an instance of the Concerto model) used to preview output from the template.
      </span>
      <JSONEditor value={editorAgreementData} onChange={handleChange} />
    </div>
  );
}

export default AgreementData;
