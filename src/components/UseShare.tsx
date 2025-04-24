import { useState } from "react";
import { Button, message } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";

const UseShare = () => {
  const { generateShareableLink, backgroundColor } = useAppStore(
    (state) => ({
      generateShareableLink: state.generateShareableLink,
      backgroundColor: state.backgroundColor
    }),
    shallow
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const link = generateShareableLink();
      await navigator.clipboard.writeText(link);
      setCopied(true);
      message.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      message.error("Failed to copy link");
      console.error("Clipboard error:", error);
    }
  };

  return (
    <div className="share-element">
      <Button 
        icon={<ShareAltOutlined />} 
        onClick={handleCopy}
        style={{
          backgroundColor: backgroundColor === '#121212' ? '#1f1f1f' : undefined,
          borderColor: backgroundColor === '#121212' ? '#434343' : undefined,
          color: backgroundColor === '#121212' ? '#fff' : undefined
        }}
      >
        {copied ? "Copied!" : "Share"}
      </Button>
    </div>
  );
};

export default UseShare;