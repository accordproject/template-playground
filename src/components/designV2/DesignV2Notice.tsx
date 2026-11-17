import { useEffect, useState } from "react";
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
  // Visibility is local to this mount: the store's eligibility is consumed as
  // soon as the banner appears, so a remount (navigating away and back, or
  // switching layouts in Settings) never shows it again.
  const [show, setShow] = useState(() => useAppStore.getState().showDesignV2Notice);
  const consume = useAppStore((s) => s.dismissDesignV2Notice);
  const setDesignV2Enabled = useAppStore((s) => s.setDesignV2Enabled);

  useEffect(() => {
    if (!show) return;
    markDesignV2NoticeSeen();
    consume();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on first show
  }, []);

  if (!show) return null;

  const dismiss = () => setShow(false);

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
