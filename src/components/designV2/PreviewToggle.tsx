import { Segmented } from "antd";
import useDesignV2Store from "../../store/designV2Store";
import { PREVIEW } from "./constants";

/**
 * Write | Preview switch in the title row of the Text and Data steps — the
 * steps where the rendered text matters. Preview shows the agreement in
 * place of the editors (PreviewPane), Write brings the editors back.
 */
const PreviewToggle = () => {
  const open = useDesignV2Store((s) => s.previewOpen);
  const setOpen = useDesignV2Store((s) => s.setPreviewOpen);
  return (
    <Segmented
      className="nd-preview-toggle"
      aria-label={PREVIEW.toggleLabel}
      options={[PREVIEW.write, PREVIEW.preview]}
      value={open ? PREVIEW.preview : PREVIEW.write}
      onChange={(mode) => setOpen(mode === PREVIEW.preview)}
    />
  );
};

export default PreviewToggle;
