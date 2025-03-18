import useAppStore from "../../store/store";
import JSONEditor from "../JSONEditor";

// Define the component as a functional component with React.FC
const AgreementData: React.FC = () => {
  // Access state and actions from the store
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setAgreementData = useAppStore((state) => state.setEditorAgreementData);
  const value = useAppStore((state) => state.editorAgreementData);

  // Handle changes to the editor value
  const handleChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setAgreementData(value);
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
          Preview Data
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
        Preview the data that will be used to render your template.
      </p>
      <JSONEditor value={value} onChange={handleChange} />
    </div>
  );
};

export default AgreementData;
