/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUGGINGFACE_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
