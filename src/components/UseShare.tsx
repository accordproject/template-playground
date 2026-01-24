import { useState } from "react";
import { Button, message } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";

const UseShare = () => {
  const generateShareableLink = useAppStore(
    state => state.generateShareableLink,
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const link = generateShareableLink();
      await navigator.clipboard.writeText(link);
      setCopied(true);
      void message.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      void message.error("Failed to copy link");
      console.error("Clipboard error:", error);
    }
  };

  return (
    <div className="share-element">
      <Button icon={<ShareAltOutlined />} onClick={() => void handleCopy()}>
        {copied ? "Copied!" : "Share"}
      </Button>
    </div>
  );
};

export default UseShare;
