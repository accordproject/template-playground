interface PreviewDrawerProps {
  onClose: () => void;
}

/** Slide-in preview drawer anchored to the right edge of the workspace. */
const PreviewDrawer = ({ onClose }: PreviewDrawerProps) => (
  <aside className="nd-preview" aria-label="Preview">
    <div className="nd-preview-head">
      <span className="nd-preview-title">Preview</span>
      <span className="nd-badge nd-badge-teal">live</span>
      <div className="nd-spacer" />
      <button type="button" className="nd-btn-ghost">↓ PDF</button>
      <button type="button" className="nd-btn-close" onClick={onClose} aria-label="Close preview">
        ×
      </button>
    </div>
    <div className="nd-preview-body">
      <div className="nd-preview-page" />
    </div>
  </aside>
);

export default PreviewDrawer;
