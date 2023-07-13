import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function TemplateModel() {
  const model = useAppStore((state) => state.modelCto)
  const setModelCto = useAppStore((state) => state.setModelCto)

  function onChange(event: { target: { value: string; }; }) {
    void setModelCto(event.target.value);
  }

  return <div className="column">
    <h2>Model</h2>
    <MarkdownEditor value={model} onChange={onChange}/>
  </div>;
}

export default TemplateModel;
