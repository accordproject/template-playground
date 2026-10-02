import { describe, it, expect } from "vitest";
import { sdkLoaders, SdkProvider } from "../../ai-assistant/sdkLoaders";

// The client constructor template-engine's reasoners read off each SDK module.
const expectedExports: Record<SdkProvider, string> = {
  groq: "default",
  openai: "default",
  anthropic: "default",
  google: "GoogleGenAI",
  mistral: "Mistral",
  openrouter: "OpenRouter",
  ollama: "default",
  "openai-compatible": "default",
};

describe("sdkLoaders", () => {
  it.each(Object.entries(expectedExports))(
    "loads the %s SDK exposing %s",
    async (provider, exportName) => {
      const loader = sdkLoaders[provider as SdkProvider];
      expect(loader).toBeTypeOf("function");
      const mod = (await loader!()) as Record<string, unknown>;
      expect(mod[exportName]).toBeTypeOf("function");
    }
  );
});
