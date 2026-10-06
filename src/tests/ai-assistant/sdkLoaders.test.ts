import { describe, it, expect } from "vitest";
import type { SdkLoaders } from "@accordproject/template-engine/lib/llm";
import { sdkLoaders } from "../../ai-assistant/sdkLoaders";

type SdkProvider = keyof SdkLoaders;

// The client constructor template-engine's reasoners read off each SDK module.
const expectedExports: Partial<Record<SdkProvider, string>> = {
  groq: "default",
  openai: "default",
  anthropic: "default",
  google: "GoogleGenAI",
  mistral: "Mistral",
  openrouter: "OpenRouter",
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
