import useAppStore from "../../store/store";
import ConcertoEditor from "../ConcertoEditor";

const TemplateModel: React.FC = () => {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setTemplateModel: (value: string) => void = useAppStore(
    (state) => state.setTemplateModel
  );
  const value = useAppStore((state) => state.modelValue);

  const handleChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setTemplateModel(value);
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
          Concerto Model
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
        Define the data model for your template using Concerto.
      </p>
      <ConcertoEditor value={value} onChange={handleChange} />
    </div>
  );
};

export default TemplateModel;
