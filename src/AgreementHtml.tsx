import { useRef } from "react";
import { Button, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import useAppStore from "./store/store";
import FullScreenModal from "./components/FullScreenModal";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function AgreementHtml({
  loading,
  isModal,
}: {
  loading: boolean;
  isModal?: boolean;
}) {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const pdfRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
  
    // Wait for the content to fully load
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    const canvas = await html2canvas(pdfRef.current, {
      scale: 2, // High resolution for clarity
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // Ensure transparent background
    });
  
    const imgData = canvas.toDataURL("image/png");
  
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
  
    // Set the image to fully cover the page
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  
    pdf.save("Agreement.pdf");
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
        }}
      >
        <h2
          style={{
            flexGrow: 1,
            textAlign: "center",
            paddingLeft: "34px",
            color: textColor,
          }}
        >
          Preview Output
        </h2>
        {!isModal && <FullScreenModal />}
      </div>
      <p style={{ textAlign: "center", color: textColor }}>
        The result of merging the JSON data with the template. This is AgreementMark converted to HTML.
      </p>

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
              <LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />
            }
          />
        </div>
      ) : (
        <div
          ref={pdfRef}
          className="agreement"
          dangerouslySetInnerHTML={{ __html: agreementHtml }}
          style={{
            flex: 1,
            color: textColor,
            backgroundColor: backgroundColor,
            padding: "16px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      )}

      {!loading && (
        <Button
          type="primary"
          onClick={downloadPDF}
          style={{ marginTop: "16px", alignSelf: "center" }}
        >
          Download as PDF
        </Button>
      )}
    </div>
  );
}

export default AgreementHtml;
