import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function TemplateMarkdown() {
  const templateMarkdown = useAppStore((state) => state.templateMarkdown)
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown)

  function onChange(value: string|undefined) {
    if(value) {
      void setTemplateMarkdown(value);
    }
  }

  return <div className="column">
    <h2>Template</h2>
    <MarkdownEditor value={templateMarkdown} onChange={onChange}/>
  </div>;
}

export default TemplateMarkdown;
