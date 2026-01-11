type AIModelOption = {
  name: string;
  pricing: "free" | "paid" ;
};

const MODELS_BY_PROVIDER: Record<string, AIModelOption[]> = {
  anthropic: [
    { name: "claude-3-opus-20240229", pricing: "paid" },
    { name: "claude-3.5-sonnet-20241022", pricing: "paid" },
    { name: "claude-3-haiku-20240307", pricing: "paid" },
  ],
  google: [
    { name: "gemini-1.5-pro", pricing: "paid" },
    { name: "gemini-1.5-flash", pricing: "free" },
    { name: "gemini-1.0-pro", pricing: "free" },
  ],
  mistral: [
    { name: "mistral-large-latest", pricing: "paid" },
    { name: "mistral-medium-latest", pricing: "paid" },
    { name: "mistral-small-latest", pricing: "paid" },
    { name: "codestral-latest", pricing: "paid" },
    { name: "open-mistral-7b", pricing: "free" },
    { name: "open-mixtral-8x7b", pricing: "free" },
  ],
  ollama: [
    { name: "llama3", pricing: "free" },
    { name: "llama3.1", pricing: "free" },
    { name: "llama3.2", pricing: "free" },
    { name: "mistral", pricing: "free" },
    { name: "mixtral", pricing: "free" },
    { name: "gemma", pricing: "free" },
    { name: "gemma2", pricing: "free" },
    { name: "phi3", pricing: "free" },
    { name: "qwen2.5", pricing: "free" },
    { name: "codellama", pricing: "free" },
    { name: "tinyllama", pricing: "free" },
    { name: "deepseek-coder", pricing: "free" },
  ],
  openai: [
    { name: "gpt-4o", pricing: "paid" },
    { name: "gpt-4o-mini", pricing: "paid" },
  ],
  openrouter: [
    { name: "anthropic/claude-3-opus", pricing: "paid" },
    { name: "anthropic/claude-3-sonnet", pricing: "paid" },
    { name: "google/gemini-pro-1.5", pricing: "paid" },
    { name: "meta-llama/llama-3-70b-instruct", pricing: "paid" },
    { name: "meta-llama/llama-3-8b-instruct", pricing: "free" },
    { name: "mistralai/mistral-7b-instruct", pricing: "free" },
    { name: "google/gemma-7b-it", pricing: "free" },
  ],
};

export default MODELS_BY_PROVIDER;
