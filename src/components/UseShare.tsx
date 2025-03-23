import { useState } from "react";
import { Button, message } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";
import styled from "styled-components";

// Styled button matching SampleDropdown
const StyledShareButton = styled(Button)`
  background-color: #ffffff;
  color: #1b2540;
  border: none;
  border-radius: 5px;
  border: 1px solid #1b2540;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  width: 200px; /* Increased width for the button */
  justify-content: center; /* Spread text and icon */

  &:hover {
    background-color: #ffffff;
    color: #050c40;
  }
`;

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
    <StyledShareButton icon={<ShareAltOutlined />} onClick={handleCopy}>
      {copied ? "Copied!" : "Share"}
    </StyledShareButton>
  );
};

export default UseShare;
