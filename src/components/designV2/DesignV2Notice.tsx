import { useEffect } from "react";
import { Alert, Button, Space, Typography, message } from "antd";
import useAppStore from "../../store/store";
import { markDesignV2NoticeSeen } from "../../utils/designV2Preference";
import { NOTICE, URLS } from "./constants";

/**
 * One-time banner announcing design v2 to people who got it as the new
 * default rather than by turning it on. It is recorded as seen as soon as it
 * shows, so it appears only once even if the user never clicks it; "Switch to
 * classic" opts out straight away, without a reload.
 *
 * It is a polite status region (not an alert) and never takes focus, so it
 * doesn't interrupt someone already typing in an editor.
 */
const DesignV2Notice = () => {
  const show = useAppStore((s) => s.showDesignV2Notice);
  const dismiss = useAppStore((s) => s.dismissDesignV2Notice);
  const setDesignV2Enabled = useAppStore((s) => s.setDesignV2Enabled);

  useEffect(() => {
    if (show) markDesignV2NoticeSeen();
  }, [show]);

  if (!show) return null;

  const switchToClassic = () => {
    dismiss();
    setDesignV2Enabled(false);
    void message.info(NOTICE.switched);
  };

  return (
    <section className="nd-notice" aria-label={NOTICE.label}>
      <Alert
        banner
        type="info"
        role="status"
        message={
          <Space size={12} wrap>
            <Typography.Text strong>{NOTICE.title}</Typography.Text>
            <Typography.Link href={URLS.designFeedback} target="_blank" rel="noopener noreferrer">
              {NOTICE.feedback}
            </Typography.Link>
          </Space>
        }
        action={
          <Space wrap>
            <Button size="small" onClick={switchToClassic}>
              {NOTICE.switchToClassic}
            </Button>
            <Button size="small" type="primary" onClick={dismiss}>
              {NOTICE.dismiss}
            </Button>
          </Space>
        }
      />
    </section>
  );
};

export default DesignV2Notice;
