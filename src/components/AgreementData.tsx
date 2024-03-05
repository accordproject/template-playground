import useAppStore from '../store/store';
import JSONEditor from './JSONEditor';

function AgreementData() {
  const agreementData = useAppStore((state) => state.data);
  const setData = useAppStore((state) => state.setData)

  function onChange(value: string | undefined) {
    if (value) {
      void setData(value);
    }
  }

  return <div className="column">
    <div className="tooltip"><h3>Data</h3>
      <span className="tooltiptext">JSON data (an instance of the Concerto model) used to preview output from the template.</span>
    </div>
    <JSONEditor value={agreementData} onChange={onChange} />
  </div>;
}

export default AgreementData;
