import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import AgreementHtml from "../AgreementHtml";
import { MdFullscreen } from "react-icons/md";
import useAppStore from "../store/store";

const FullScreenModal: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .ant-modal-content {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .ant-modal-header {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .ant-modal-title {
        color: ${textColor} !important;
      }
      /* Fixes invisible close button in dark mode */
      .ant-modal-close {
        color: ${textColor} !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [textColor, backgroundColor]);

  // Hide all tooltips when modal opens to prevent overlay
  useEffect(() => {
    if (open) {
      // Hide tooltips by setting their visibility to hidden
      const tooltips = document.querySelectorAll('.ant-tooltip');
      tooltips.forEach((tooltip) => {
        (tooltip as HTMLElement).style.display = 'none';
      });

      return () => {
        // Restore tooltips when modal closes
        const tooltips = document.querySelectorAll('.ant-tooltip');
        tooltips.forEach((tooltip) => {
          (tooltip as HTMLElement).style.display = '';
        });
      };
    }
  }, [open]);

  return (
    <>
      <MdFullscreen
        size={24}
        style={{ cursor: "pointer" }}
        onClick={() => setOpen(true)}
      />
      <Modal
        title="Output"
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
        zIndex={1000}
      >
        <AgreementHtml loading={false} isModal={true} />
      </Modal>
    </>
  );
};

export default FullScreenModal;