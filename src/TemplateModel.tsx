import ConcertoEditor from "./ConcertoEditor";
import useAppStore from "./store";

function TemplateModel() {
  const model = useAppStore((state) => state.modelCto);
  const setModelCto = useAppStore((state) => state.setModelCto);

  function onChange(value: string | undefined) {
    if (value) {
      void setModelCto(value);
    }
  }

  return (
    <div className="column">
      <div className="tooltip">
        <h3>Concerto Model</h3>
        <span className="tooltiptext">
          Defines the data model for the template and its logic.
        </span>
      </div>
      <ConcertoEditor value={model} onChange={onChange} />
    </div>
  );
}

export default TemplateModel;
