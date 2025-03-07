import { useState } from "react";
import { Button, message } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "@store/store";

const UseShare = () => {
  const generateShareableLink = useAppStore(
    (state) => state.generateShareableLink
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const link = generateShareableLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      message.success("Link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    });
  };

  return (
    <div className="share-element">
      <Button icon={<ShareAltOutlined />} onClick={handleCopy}>
        {copied ? "Copied!" : "Share"}
      </Button>
    </div>
  );
};

export default UseShare;
