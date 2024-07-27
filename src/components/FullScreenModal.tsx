import React, { useState } from "react";
import { Modal } from "antd";
import AgreementHtml from "../AgreementHtml";
import { FullscreenOutlined } from "@ant-design/icons";

const FullScreenModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ textAlign: "right" }}>
      <FullscreenOutlined
        style={{ fontSize: "24px", cursor: "pointer", marginRight: "10px" }}
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
        <AgreementHtml loading={false} />
      </Modal>
    </div>
  );
};

export default FullScreenModal;
