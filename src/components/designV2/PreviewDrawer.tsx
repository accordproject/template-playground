import { PREVIEW } from "./constants";

interface PreviewDrawerProps {
  onClose: () => void;
}

/** Slide-in preview drawer anchored to the right edge of the workspace. */
const PreviewDrawer = ({ onClose }: PreviewDrawerProps) => (
  <aside className="nd-preview" aria-label={PREVIEW.ariaLabel}>
    <div className="nd-preview-head">
      <span className="nd-preview-title">{PREVIEW.title}</span>
      <span className="nd-badge nd-badge-teal">{PREVIEW.liveBadge}</span>
      <div className="nd-spacer" />
      <button type="button" className="nd-btn-ghost">{PREVIEW.pdf}</button>
      <button type="button" className="nd-btn-close" onClick={onClose} aria-label={PREVIEW.close}>
        ×
      </button>
    </div>
    <div className="nd-preview-body">
      <div className="nd-preview-page" />
    </div>
  </aside>
);

export default PreviewDrawer;
