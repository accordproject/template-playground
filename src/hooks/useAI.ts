import { useState, useCallback } from "react";
import { AIService, type EditorType } from "../services/ai/AIService";

const aiService = new AIService();

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);

  const getCompletion = useCallback(
    async ({
      prompt,
      editorType,
      currentContent,
    }: {
      prompt: string;
      editorType: EditorType;
      currentContent?: string;
    }) => {
      setIsProcessing(true);
      try {
        const result = await aiService.getCompletion({
          prompt,
          editorType,
          currentContent,
        });
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    isProcessing,
    getCompletion,
  };
}
