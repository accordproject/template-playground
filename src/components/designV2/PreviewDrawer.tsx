import { Button, Drawer, Grid } from "antd";
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
      extra={<Button type="text" size="small">{PREVIEW.pdf}</Button>}
    >
      <div className="nd-preview-page" />
    </Drawer>
  );
};

export default PreviewDrawer;
