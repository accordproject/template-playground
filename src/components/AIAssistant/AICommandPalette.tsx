import { useState } from "react";
import { Modal, Input, Select, message } from "antd";
import { useAI } from "../../hooks/useAI";
import type { EditorType } from "../../services/ai/AIService";

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  editorType: EditorType;
  currentContent: string;
  onComplete: (completion: any) => void;
}

const { TextArea } = Input;
const { Option } = Select;

export function AICommandPalette({ isOpen, onClose, editorType, currentContent, onComplete }: AICommandPaletteProps) {
  const [prompt, setPrompt] = useState("");
  const { isProcessing, getCompletion } = useAI();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    try {
      const completion = await getCompletion({
        prompt,
        editorType,
        currentContent,
      });
      onComplete(completion);
      onClose();
      setPrompt("");
    } catch (error) {
      console.error("AI completion error:", error);
      message.error("Failed to get AI completion. Please try again.");
    }
  };

  return (
    <Modal
      title="AI Assistant"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      okButtonProps={{ loading: isProcessing }}
    >
      <TextArea
        value={prompt}
        onChange={(e: any) => setPrompt(e.target.value)}
        placeholder="What would you like me to help you with?"
        rows={4}
      />
    </Modal>
  );
}
