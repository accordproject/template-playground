import { useState } from "react";
import { Button, message } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";

const UseShare = () => {
  const generateShareableLink = useAppStore(
    (state) => state.generateShareableLink
  );
  const [copied, setCopied] = useState(false);

  const shortenURL = async (url: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error("Failed to shorten URL");

      return await response.text();
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url; // Fallback to original URL in case of error
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      const link: string = generateShareableLink();
      if (!link) {
        void message.error("Failed to generate link!");
        return;
      }

      const shortLink = await shortenURL(link);
      await navigator.clipboard.writeText(shortLink);

      setCopied(true);
      void message.success("Short link copied to clipboard!");
      
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      void message.error("Failed to copy link to clipboard.");
    }
  };

  return (
    <div className="share-element">
      {/* Wrap async function inside an arrow function to avoid ESLint error */}
      <Button icon={<ShareAltOutlined />} onClick={() => void handleCopy()}>
        {copied ? "Copied!" : "Share"}
      </Button>
    </div>
  );
};

export default UseShare;
