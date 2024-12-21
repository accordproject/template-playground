import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import useAppStore from "./store/store";

function AgreementHtml({ loading }: { loading: any }) {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

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
      aria-label="Agreement preview container" // Added aria-label for the main container
    >
      <div style={{ textAlign: "center", color: textColor }}>
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
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 42, color: "#19c6c7" }}
                spin
                aria-label="Loading agreement content" // Added aria-label for the spinner
              />
            }
          />
        </div>
      ) : (
        <div
          className="agreement"
          dangerouslySetInnerHTML={{ __html: agreementHtml }}
          style={{ flex: 1, color: textColor, backgroundColor: backgroundColor }}
          aria-label="Agreement content preview" // Added aria-label for the agreement content
        />
      )}
    </div>
  );
}

export default AgreementHtml;
