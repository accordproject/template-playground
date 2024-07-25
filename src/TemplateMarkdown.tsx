import MarkdownEditor from "./MarkdownEditor";
import useAppStore from "./store/store";

function TemplateMarkdown() {
  const templateMarkdown = useAppStore((state) => state.templateMarkdown);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);

  function onChange(value: string | undefined) {
    if (value) {
      void setTemplateMarkdown(value);
    }
  }

  return (
    <div className="column">
      <h2>TemplateMark</h2>
      <p>
        A natural language template with embedded variables, conditional
        sections and TypeScript code.
      </p>
      <MarkdownEditor value={templateMarkdown} onChange={onChange} />
    </div>
  );
}

export default TemplateMarkdown;
