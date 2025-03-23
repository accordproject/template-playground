import { useState } from "react";
import { Modal, Input } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { AiFillOpenAI } from "react-icons/ai";

const { TextArea } = Input;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: ${(props) => props.theme.backgroundColor};
    color: ${(props) => props.theme.textColor};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
  isProcessing: boolean;
  editorType: string;
}

export function AIModal({ isOpen, onClose, onSubmit, isProcessing, editorType }: AIModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    await onSubmit(prompt);
    setPrompt("");
  };

  return (
    <StyledModal
      title={
        <>
          <AiFillOpenAI /> AI Assistant
        </>
      }
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      okButtonProps={{ loading: isProcessing }}
    >
      <TextArea
        value={prompt}
        onChange={(e: any) => setPrompt(e.target.value)}
        placeholder={`What would you like me to help with in the ${editorType}?`}
        rows={4}
      />
      {isProcessing && (
        <LoadingContainer>
          <LoadingOutlined spin />
          <span>Processing your request...</span>
        </LoadingContainer>
      )}
    </StyledModal>
  );
}
