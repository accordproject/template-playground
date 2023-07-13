import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function TemplateMarkdown() {
  const templateMarkdown = useAppStore((state) => state.templateMarkdown)
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown)

  function onChange(event: { target: { value: string; }; }) {
    void setTemplateMarkdown(event.target.value);
  }

  return <div className="column">
    <h2>Template</h2>
    <MarkdownEditor value={templateMarkdown} onChange={onChange}/>
  </div>;
}

export default TemplateMarkdown;
