export const AI_CONFIG = {
  huggingfaceApiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
  temperature: 0.7,
  maxTokens: 2000,
  huggingFaceModels: {
    primary: "mistralai/Mistral-7B-Instruct-v0.1",
    fallback1: "meta-llama/Llama-2-7b-chat-hf",
    fallback2: "gpt2",
  },
};
