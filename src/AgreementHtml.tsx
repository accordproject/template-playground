import { Spin } from "antd";
import useAppStore from "./store";

function AgreementHtml({ loading }: { loading: any }) {
  const agreementHtml = useAppStore((state) => state.agreementHtml);

  return (
    <div
      className="column"
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: "8px",
        padding: "16px",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2>Preview Output</h2>
        <p>
          The result of merging the JSON data with the template. This is
          AgreementMark converted to HTML.
        </p>
      </div>
      {loading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin tip="Loading..." size="large" />
        </div>
      ) : (
        <div
          className="agreement"
          dangerouslySetInnerHTML={{ __html: agreementHtml }}
          style={{ flex: 1 }}
        />
      )}
    </div>
  );
}

export default AgreementHtml;
