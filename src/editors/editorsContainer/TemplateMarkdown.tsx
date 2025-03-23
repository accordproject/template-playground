import useAppStore from "../../store/store";
import MarkdownEditor from "../MarkdownEditor";

const TemplateMarkdown: React.FC = () => {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const value = useAppStore((state) => state.editorValue);

  const handleChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setTemplateMarkdown(value);
    }
  };

  return (
    <div
      className="column"
      style={{
        backgroundColor,
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            color: textColor,
            fontSize: "16px",
            margin: 0,
            fontWeight: 500,
          }}
        >
          TemplateMark
        </h3>
      </div>
      <p
        style={{
          color: textColor,
          fontSize: "12px",
          marginBottom: "16px",
          opacity: 0.7,
          lineHeight: "1.4",
        }}
      >
        A natural language template with embedded variables, conditional
        sections, and TypeScript code.
      </p>
      <div
        style={{
          color: "#f8f8f2",
          borderRadius: "4px",
          minHeight: "500px",
          fontFamily: "'Consolas', 'Monaco', monospace",
          fontSize: "14px",
        }}
      >
        <MarkdownEditor value={value} onChange={handleChange} />
      </div>
    </div>
  );
};

export default TemplateMarkdown;
