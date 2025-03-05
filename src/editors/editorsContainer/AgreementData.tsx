import JSONEditor from "@editors/JSONEditor";
import useAppStore from "@store/store";
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
      setEditorAgreementData(value); // Immediate state update
      debouncedSetData(value); // Debounced state update
    }
  };

  return (
    <div className="column">
      <div className="tooltip">
        <h3 style={{ color: textColor }}>Data</h3>
        <span style={{ color: textColor }} className="tooltiptext">
          JSON data (an instance of the Concerto model) used to preview output
          from the template.
        </span>
      </div>
      <JSONEditor value={editorAgreementData} onChange={handleChange} />
    </div>
  );
}

export default AgreementData;