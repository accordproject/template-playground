import { create } from "zustand";
import { AIService, type EditorType, type AICompletion } from "../services/ai/AIService";

interface AIState {
  isProcessing: boolean;
  error: string | null;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  generateContent: (params: {
    prompt: string;
    editorType: EditorType;
    currentContent?: string;
  }) => Promise<AICompletion>;
}

const aiService = new AIService();

export const useAIStore = create<AIState>((set) => ({
  isProcessing: false,
  error: null,
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  generateContent: async ({ prompt, editorType, currentContent }) => {
    set({ isProcessing: true, error: null });
    try {
      const result = await aiService.getCompletion({
        prompt,
        editorType,
        currentContent,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },
}));
