
import { LoadingOutlined } from "@ant-design/icons";
import { Spin, Button } from "antd";
import useAppStore from "./store/store";
import FullScreenModal from "./components/FullScreenModal";
import { useRef, useState } from "react";
import html2pdf from "html2pdf.js";

function AgreementHtml({ loading, isModal }: { loading: boolean; isModal?: boolean }) {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    const element = downloadRef.current;
    if (!element) return;

    try {
      setIsDownloading(true);
      const options = {
        margin: 10,
        filename: 'agreement.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as const;

      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please check the console.");
    } finally {
      setIsDownloading(false);
    }
  };

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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ flexGrow: 1, textAlign: "center", paddingLeft: "34px", color: textColor }}>
          Preview Output
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isModal && (
            <Button
              onClick={() => void handleDownloadPdf()}
              loading={isDownloading}
            >
              Download PDF
            </Button>
          )}
          {!isModal && <FullScreenModal />}
        </div>
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
          ref={downloadRef}
          className="agreement"
          dangerouslySetInnerHTML={{ __html: agreementHtml }}
          style={{ flex: 1, color: textColor, backgroundColor: backgroundColor }}
        />
      )}
    </div>
  );
}

export default AgreementHtml;
