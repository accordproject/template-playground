import { useState, useRef } from "react";
import { Button, Drawer, Grid, message, Typography } from "antd";
import DOMPurify from "dompurify";
import html2pdf from "html2pdf.js";
import useAppStore from "../../store/store";
import { PREVIEW } from "./constants";

interface PreviewDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Preview drawer anchored to the right edge of the workspace. Rendered inline
 * (getContainer={false}) so it overlays only the v2 body, without a mask.
 */
const PreviewDrawer = ({ open, onClose }: PreviewDrawerProps) => {
  const screens = Grid.useBreakpoint();
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const element = previewRef.current;
    if (!element || !agreementHtml) {
      void message.warning("No preview content to download.");
      return;
    }
    setIsDownloading(true);
    try {
      const originalBg = element.style.backgroundColor;
      const originalColor = element.style.color;

      element.style.backgroundColor = "#ffffff";
      element.style.color = "#000000";

      const options = {
        margin: 10,
        filename: "agreement.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;

      await html2pdf().set(options).from(element).save();

      element.style.backgroundColor = originalBg;
      element.style.color = originalColor;
    } catch (error) {
      console.error("PDF generation failed:", error);
      void message.error("Failed to generate PDF. Please check the console.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      getContainer={false}
      mask={false}
      placement="right"
      width={screens.md ? "min(412px, 62%)" : "100%"}
      rootClassName="nd-preview"
      title={
        <span className="nd-preview-title">
          {PREVIEW.title} <span className="nd-badge nd-badge-teal">{PREVIEW.liveBadge}</span>
        </span>
      }
      extra={
        <Button
          type="text"
          size="small"
          loading={isDownloading}
          onClick={() => void handleDownloadPdf()}
          disabled={!agreementHtml}
        >
          {PREVIEW.pdf}
        </Button>
      }
    >
      <div className="nd-preview-page">
        {agreementHtml ? (
          <div
            ref={previewRef}
            className="nd-preview-agreement"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
          />
        ) : (
          <Typography.Text type="secondary">
            No preview available. Edit your template or data to generate a preview.
          </Typography.Text>
        )}
      </div>
    </Drawer>
  );
};

export default PreviewDrawer;

