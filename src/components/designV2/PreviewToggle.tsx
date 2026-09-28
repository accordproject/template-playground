import { Button } from "antd";
import useDesignV2Store from "../../store/designV2Store";
import { PREVIEW } from "./constants";

/**
 * Opens and closes the preview drawer. Rendered in the title row of the Text
 * and Data steps — the steps where the preview matters — as the row's one
 * primary control, instead of a small toggle in the global header.
 */
const PreviewToggle = () => {
  const open = useDesignV2Store((s) => s.previewOpen);
  const toggle = useDesignV2Store((s) => s.togglePreview);
  return (
    <Button
      type="primary"
      ghost={open}
      className="nd-preview-toggle"
      onClick={toggle}
      aria-pressed={open}
    >
      {PREVIEW.toggle}
    </Button>
  );
};

export default PreviewToggle;
