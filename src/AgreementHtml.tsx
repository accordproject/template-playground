
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import useAppStore from "./store/store";
import FullScreenModal from "./components/FullScreenModal";
import DOMPurify from "dompurify";

function AgreementHtml({ loading, isModal }: { loading: boolean; isModal?: boolean }) {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  return (
    <div
      className="column preview-component"
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
      <div
        style={{
          width: "100%",
          display: "flex",
          textAlign: "center",
          color: textColor,
        }}
      >
        <h2 style={{ flexGrow: 1, textAlign: "center", paddingLeft: "34px", color: textColor }}>
          Preview Output
        </h2>
        {!isModal && <FullScreenModal />}
      </div>
      <p style={{ textAlign: "center", color: textColor }}>
        The result of merging the JSON data with the template.
      </p>
      {loading ? (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />} />
        </div>
      ) : (
        <div
          className="agreement"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
          style={{ flex: 1, color: textColor, backgroundColor: backgroundColor }}
        />
      )}
    </div>
  );
}

export default AgreementHtml;
