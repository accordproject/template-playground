import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function TemplateModel() {
  const model = useAppStore((state) => state.modelCto)
  const setModelCto = useAppStore((state) => state.setModelCto)

  function onChange(value: string|undefined) {
    if(value) {
      void setModelCto(value);
    }
  }

  return <div className="column">
    <h2>Model</h2>
    <MarkdownEditor value={model} onChange={onChange}/>
  </div>;
}

export default TemplateModel;
