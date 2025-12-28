import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import AgreementHtml from "../AgreementHtml";
import { MdFullscreen } from "react-icons/md";
import useAppStore from "../store/store";
import html2pdf from "html2pdf.js";

const FullScreenModal: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);

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

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .ant-modal-content {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .ant-modal-header {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
        padding: 16px 24px;
        position: relative;
      }
      .ant-modal-title {
        color: ${textColor} !important;
        margin-right: 120px;
      }
      .modal-header-actions {
        position: absolute;
        right: 48px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .modal-header-actions .ant-btn {
        background-color: ${backgroundColor === '#ffffff' ? '#ffffff' : '#1f1f1f'} !important;
        color: ${backgroundColor === '#ffffff' ? '#000000' : '#ffffff'} !important;
        border: 1px solid ${backgroundColor === '#ffffff' ? '#d9d9d9' : '#434343'} !important;
        box-shadow: none !important;
      }
      .modal-header-actions .ant-btn:hover {
        background-color: ${backgroundColor === '#ffffff' ? '#fafafa' : '#262626'} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#40a9ff' : '#434343'} !important;
        color: ${backgroundColor === '#ffffff' ? '#000000' : '#ffffff'} !important;
      }
      .modal-header-actions .ant-btn:focus {
        background-color: ${backgroundColor === '#ffffff' ? '#ffffff' : '#1f1f1f'} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#d9d9d9' : '#434343'} !important;
        color: ${backgroundColor === '#ffffff' ? '#000000' : '#ffffff'} !important;
      }
      .modal-header-actions .ant-btn-loading {
        background-color: ${backgroundColor === '#ffffff' ? '#ffffff' : '#1f1f1f'} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#d9d9d9' : '#434343'} !important;
      }
      @media (max-width: 768px) {
        .modal-header-actions {
          right: 40px;
        }
        .ant-modal-title {
          margin-right: 100px;
          font-size: 14px;
        }
        .modal-header-actions .ant-btn {
          font-size: 12px;
          padding: 4px 8px;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [textColor, backgroundColor]);

  return (
    <>
      <MdFullscreen
        size={24}
        style={{ cursor: "pointer" }}
        onClick={() => setOpen(true)}
      />
      <Modal
        title={
          <>
            <span>Output</span>
            <div className="modal-header-actions">
              <Button
                onClick={handleDownloadPdf}
                loading={isDownloading}
                size="small"
              >
                Download PDF
              </Button>
            </div>
          </>
        }
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
      >
        <AgreementHtml ref={downloadRef} loading={false} isModal={true} />
      </Modal>
    </>
  );
};

export default FullScreenModal;
