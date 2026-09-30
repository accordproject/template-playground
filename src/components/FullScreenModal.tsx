import React, { useState } from "react";
import { Modal } from "antd";
import AgreementHtml from "../AgreementHtml";
import { MdFullscreen } from "react-icons/md";

const FullScreenModal: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

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
      >
        <AgreementHtml loading={false} isModal={true} />
      </Modal>
    </>
  );
};

export default FullScreenModal;