import { useRef, useState } from "react";
import { Button, Drawer, Grid } from "antd";
import DOMPurify from "dompurify";
import { PREVIEW } from "./constants";

interface PreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Compiled TemplateMark HTML, merged with the sample data. */
  agreementHtml: string;
  /** Exports the drawer's rendered agreement as a PDF download. */
  onDownloadPdf: (element: HTMLElement | null) => Promise<void>;
}

/**
 * Preview drawer anchored to the right edge of the workspace. Rendered inline
 * (getContainer={false}) so it overlays only the v2 body, without a mask.
 */
const PreviewDrawer = ({
  open,
  onClose,
  agreementHtml,
  onDownloadPdf,
}: PreviewDrawerProps) => {
  const screens = Grid.useBreakpoint();
  const pageRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await onDownloadPdf(pageRef.current);
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
        >
          {PREVIEW.pdf}
        </Button>
      }
    >
      <div
        ref={pageRef}
        className="nd-preview-page"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
      />
    </Drawer>
  );
};

export default PreviewDrawer;
