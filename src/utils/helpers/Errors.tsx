import useAppStore from "@store/store";
import { Alert, Space } from "antd";

function Errors() {
  const error = useAppStore((state) => state.error);
  return error ? (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Alert message={error} type="error" />
    </Space>
  ) : (
    <></>
  );
}

export default Errors;
