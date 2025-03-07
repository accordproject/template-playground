import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import AgreementHtml from "@/AgreementHtml";

import { FullscreenOutlined } from "@ant-design/icons";
import useAppStore from "@store/store";

const FullScreenModal: React.FC = () => {
  const [open, setOpen] = useState(false);
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
      .ant-modal-title{
        color: ${textColor} !important;
        }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [textColor, backgroundColor]);

  return (
    <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", color: textColor, }} className="preview-element">
      <FullscreenOutlined
        style={{ fontSize: "24px", cursor: "pointer", margin: "5px" }}
        onClick={() => setOpen(true)}
      />
      <Modal
        title="Output"
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
      >
        <AgreementHtml loading={false} isModal={true} />
      </Modal>
    </div>
  );
};

export default FullScreenModal;
