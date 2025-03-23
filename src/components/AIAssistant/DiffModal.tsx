import { Modal, Button, Typography } from "antd";
import styled from "styled-components";

const { Text, Paragraph } = Typography;

const DiffContainer = styled.pre`
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  white-space: pre-wrap;

  .removed {
    background-color: #ffdddd;
    color: #b30000;
  }

  .added {
    background-color: #ddffdd;
    color: #006600;
  }
`;

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  diff: string;
  explanation: string;
}

export function DiffModal({ isOpen, onClose, onAccept, diff, explanation }: DiffModalProps) {
  const formattedDiff = diff.split("\n").map((line, index) => {
    if (line.startsWith("+")) {
      return (
        <div key={index} className="added">
          {line}
        </div>
      );
    } else if (line.startsWith("-")) {
      return (
        <div key={index} className="removed">
          {line}
        </div>
      );
    }
    return <div key={index}>{line}</div>;
  });

  return (
    <Modal
      title="Review AI Changes"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={onAccept}>
          Accept Changes
        </Button>,
      ]}
      width={700}
    >
      {explanation && (
        <Paragraph>
          <Text strong>Explanation:</Text>
          <br />
          {explanation}
        </Paragraph>
      )}

      <Text strong>Changes:</Text>
      <DiffContainer>{formattedDiff}</DiffContainer>
    </Modal>
  );
}
