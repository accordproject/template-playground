import React, { useEffect } from "react";
import { Modal } from "antd";
import AgreementHtml from "../AgreementHtml";
import { MdFullscreen } from "react-icons/md";
import useAppStore from "../store/store";

const FullScreenModal: React.FC = () => {
  const { isFullScreenModalOpen, setFullScreenModalOpen, textColor, backgroundColor } = useAppStore((state) => ({
    isFullScreenModalOpen: state.isFullScreenModalOpen,
    setFullScreenModalOpen: state.setFullScreenModalOpen,
    textColor: state.textColor,
    backgroundColor: state.backgroundColor,
  }));

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

  return (
    <>
      <MdFullscreen
        size={24}
        style={{ cursor: "pointer" }}
        onClick={() => setFullScreenModalOpen(true)}
      />
      <Modal
        title="Output"
        centered
        open={isFullScreenModalOpen}
        onOk={() => setFullScreenModalOpen(false)}
        onCancel={() => setFullScreenModalOpen(false)}
        width={1000}
      >
        <AgreementHtml loading={false} isModal={true} />
      </Modal>
    </>
  );
};

export default FullScreenModal;