import { useState } from "react";
import { Button, Space, Spin, Typography, message } from "antd";
import DOMPurify from "dompurify";
import useAppStore from "../../store/store";
import { downloadMarkdown } from "../../utils/download";
import { saveAgreementPdf } from "../../utils/agreementPdf";
import { PREVIEW } from "./constants";

/**
 * The rendered agreement, shown in place of the editors on the Text and Data
 * steps when their Write | Preview switch is on Preview (see PreviewToggle).
 * It takes the editors' spot rather than floating over them, so the help
 * rail stays in view.
 *
 * Shows the agreement the store last rendered (agreementHtml, sanitised as in
 * the legacy preview). A failed render keeps the last good agreement on the
 * page; the footer carries the error. Until anything has rendered, the page
 * says it is rendering, or that the render failed.
 * The PDF and Markdown buttons render the current sources afresh
 * (store.renderAgreement) and save that, never the page on screen, which
 * keeps the last good render after an error and can lag an edit; a source
 * that doesn't render saves nothing.
 */
const PreviewPane = () => {
  const agreementHtml = useAppStore((s) => s.agreementHtml);
  const error = useAppStore((s) => s.error);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);

  const saveMarkdown = async () => {
    setIsSavingMarkdown(true);
    try {
      downloadMarkdown(await useAppStore.getState().renderAgreement("markdown"));
    } catch (err) {
      console.error("Markdown export failed:", err);
      void message.error(PREVIEW.markdownFailed);
    } finally {
      setIsSavingMarkdown(false);
    }
  };

  const savePdf = async () => {
    setIsSaving(true);
    try {
      await saveAgreementPdf(await useAppStore.getState().renderAgreement(), PREVIEW.pdfFile);
    } catch (err) {
      console.error("PDF generation failed:", err);
      void message.error(PREVIEW.pdfFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="nd-editor-card nd-preview-card" aria-label={PREVIEW.ariaLabel}>
      <div className="nd-editor-card-head">
        <span className="nd-preview-title">{PREVIEW.title}</span>
        <span className="nd-badge nd-badge-teal">{PREVIEW.liveBadge}</span>
        <div className="nd-spacer" />
        <Button
          type="text"
          size="small"
          disabled={!agreementHtml}
          loading={isSavingMarkdown}
          onClick={() => void saveMarkdown()}
        >
          {PREVIEW.markdown}
        </Button>
        <Button type="text" size="small" disabled={!agreementHtml} loading={isSaving} onClick={() => void savePdf()}>
          {PREVIEW.pdf}
        </Button>
      </div>
      <div className="nd-editor-card-body nd-preview-body">
        {agreementHtml ? (
          <div
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
      </div>
    </section>
  );
};

export default PreviewPane;
