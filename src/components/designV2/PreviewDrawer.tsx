import { useRef, useState } from "react";
import { Button, Drawer, Grid, Space, Spin, Typography, message } from "antd";
import DOMPurify from "dompurify";
import useAppStore from "../../store/store";
import { PREVIEW } from "./constants";

interface PreviewDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Preview drawer anchored to the right edge of the workspace. Rendered inline
 * (getContainer={false}) so it overlays only the v2 body, without a mask.
 *
 * Shows the agreement the store last rendered (agreementHtml, sanitised as in
 * the legacy preview). A failed render keeps the last good agreement on the
 * page; the footer carries the error. Until anything has rendered, the page
 * says it is rendering, or that the render failed.
 * The PDF button saves the page with html2pdf, loaded on first use.
 */
const PreviewDrawer = ({ open, onClose }: PreviewDrawerProps) => {
  const screens = Grid.useBreakpoint();
  const agreementHtml = useAppStore((s) => s.agreementHtml);
  const error = useAppStore((s) => s.error);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const savePdf = async () => {
    if (!pageRef.current) return;
    setIsSaving(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: PREVIEW.pdfFile,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pageRef.current)
        .save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      void message.error(PREVIEW.pdfFailed);
    } finally {
      setIsSaving(false);
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
          disabled={!agreementHtml}
          loading={isSaving}
          onClick={() => void savePdf()}
        >
          {PREVIEW.pdf}
        </Button>
      }
    >
      {agreementHtml ? (
        <div
          ref={pageRef}
          className="nd-preview-page"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
        />
      ) : (
        <div className="nd-preview-page">
          <Space direction="vertical" align="center" size={12} style={{ width: "100%" }}>
            {!error && <Spin />}
            <Typography.Text type="secondary">{error ? PREVIEW.failed : PREVIEW.rendering}</Typography.Text>
          </Space>
        </div>
      )}
    </Drawer>
  );
};

export default PreviewDrawer;
