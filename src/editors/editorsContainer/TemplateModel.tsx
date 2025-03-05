import ConcertoEditor from "@editors/ConcertoEditor";
import useAppStore from "@store/store";
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

  return (
    <div className="column">
      <div className="tooltip">
        <h3 style={{ color: textColor }}>Concerto Model</h3>
        <span style={{ color: textColor }} className="tooltiptext">
          Defines the data model for the template and its logic.
        </span>
      </div>
      <ConcertoEditor value={editorModelCto} onChange={handleChange} />
    </div>
  );
}

export default TemplateModel;