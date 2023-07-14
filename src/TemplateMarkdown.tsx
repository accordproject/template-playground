import MarkdownEditor from './MarkdownEditor';
import useAppStore from './store';

function TemplateMarkdown() {
  const templateMarkdown = useAppStore((state) => state.templateMarkdown)
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown)

  function onChange(value: string | undefined) {
    if (value) {
      void setTemplateMarkdown(value);
    }
  }

  return <div className="column">
    <div className="tooltip"><h3>TemplateMark</h3>
      <span className="tooltiptext">A natural language template with embedded variables, conditional sections and TypeScript code.</span>
    </div>
    <MarkdownEditor value={templateMarkdown} onChange={onChange} />
  </div>;
}

export default TemplateMarkdown;
