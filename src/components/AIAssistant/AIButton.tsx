import { useState } from "react";
import { FaMagic } from "react-icons/fa";
import { message } from "antd";
import { useAI } from "../../hooks/useAI";
import { AIModal } from "./AIModal";
import { EditorType } from "../../services/ai/AIService";
import { DiffModal } from "./DiffModal";

interface AIButtonProps {
  editorType: EditorType;
  currentContent: string;
  onComplete: (completion: string) => void;
}

export function AIButton({ editorType, currentContent, onComplete }: AIButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffInfo, setDiffInfo] = useState({ content: "", diff: "", explanation: "" });
  const { isProcessing, getCompletion } = useAI();

  const handleSubmit = async (prompt: string) => {
    try {
      const completion = await getCompletion({
        prompt,
        editorType,
        currentContent,
      });

      if (completion.diff && completion.diff.trim()) {
        setDiffInfo({
          content: completion.content,
          diff: completion.diff,
          explanation: completion.explanation || "",
        });
        setIsModalOpen(false);
        setIsDiffModalOpen(true);
      } else {
        onComplete(completion.content);
        setIsModalOpen(false);
        if (completion.explanation) {
          message.info(completion.explanation);
        }
      }
    } catch (error) {
      console.error("AI completion error:", error);
      message.error("Failed to get AI completion");
    }
  };

  const handleAcceptChanges = () => {
    onComplete(diffInfo.content);
    setIsDiffModalOpen(false);
  };

  return (
    <>
      <FaMagic
        onClick={() => setIsModalOpen(true)}
        title="AI Assist"
        style={{
          cursor: isProcessing ? "wait" : "pointer",
          opacity: isProcessing ? 0.5 : 1,
          marginRight: "8px",
        }}
      />
      <AIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isProcessing={isProcessing}
        editorType={editorType}
      />
      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onAccept={handleAcceptChanges}
        diff={diffInfo.diff}
        explanation={diffInfo.explanation}
      />
    </>
  );
}
