import { useCallback } from "react";
import { type EditorType, type AICompletion } from "../services/ai/AIService";
import { useAIStore } from "../store/aistore";

export function useAI() {
  const { isProcessing, generateContent } = useAIStore();

  const getCompletion = useCallback(
    async ({
      prompt,
      editorType,
      currentContent,
    }: {
      prompt: string;
      editorType: EditorType;
      currentContent?: string;
    }): Promise<AICompletion> => {
      return await generateContent({
        prompt,
        editorType,
        currentContent,
      });
    },
    [generateContent]
  );

  return {
    isProcessing,
    getCompletion,
  };
}
