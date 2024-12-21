import useAppStore from "../../store/store";
import { Alert, Space } from "antd";

function Errors() {
  const error = useAppStore((state) => state.error);

  return error ? (
    <Space direction="vertical" style={{ width: "100%" }} aria-live="assertive">
      {/* Added aria-live="assertive" to announce the error message immediately */}
      <Alert
        message={error}
        type="error"
        aria-label="Error alert"
        // Added aria-label to the Alert for better screen reader interaction
      />
    </Space>
  ) : (
    <></>
  );
}

export default Errors;
