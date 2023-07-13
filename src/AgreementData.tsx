import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function AgreementData() {
  const agreementData = useAppStore((state) => state.data);
  const setData = useAppStore((state) => state.setData)

  function onChange(event: { target: { value: string; }; }) {
    void setData(event.target.value);
  }

  return <div className="column">
    <h2>Data</h2>
    <MarkdownEditor value={agreementData} onChange={onChange}/>
  </div>;
}

export default AgreementData;
