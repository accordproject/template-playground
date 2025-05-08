import { AI_CONFIG } from "../../config/ai.config";

export class HuggingFaceAPI {
  constructor(private apiKey: string) {}

  async getCompletion({
    prompt,
    currentContent,
    editorType,
  }: {
    prompt: string;
    currentContent?: string;
    editorType?: string;
  }): Promise<string> {
    // vinyl: default primary model
    const primaryModel = AI_CONFIG.huggingFaceModels.primary;

    try {
      return await this.callModel(primaryModel, prompt, currentContent, editorType);
    } catch (error) {
      console.error("Primary model error, trying fallback:", error);
      try {
        return await this.fallbackCompletion(prompt, currentContent, editorType);
      } catch (fallbackError) {
        console.error("First fallback failed, trying second fallback:", fallbackError);
        return await this.secondFallbackCompletion(prompt, currentContent, editorType);
      }
    }
  }

  private async callModel(
    model: string,
    prompt: string,
    currentContent?: string,
    editorType?: string
  ): Promise<string> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: this.formatPrompt(prompt, currentContent, editorType),
        parameters: {
          max_length: 2000,
          temperature: 0.7,
          num_return_sequences: 1,
          top_k: 50,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();
    if (Array.isArray(result)) {
      return result[0]?.generated_text || "";
    } else if (typeof result === "object" && result.generated_text) {
      return result.generated_text;
    } else if (typeof result === "string") {
      return result;
    }

    throw new Error("Unexpected response format from Hugging Face API");
  }

  private async fallbackCompletion(prompt: string, currentContent?: string, editorType?: string): Promise<string> {
    const fallbackModel = AI_CONFIG.huggingFaceModels.fallback1;
    return await this.callModel(fallbackModel, prompt, currentContent, editorType);
  }

  private async secondFallbackCompletion(
    prompt: string,
    currentContent?: string,
    editorType?: string
  ): Promise<string> {
    const fallbackModel = AI_CONFIG.huggingFaceModels.fallback2;
    return await this.callModel(fallbackModel, prompt, currentContent, editorType);
  }

  private formatPrompt(prompt: string, currentContent?: string, editorType?: string): string {
    const systemPrompts = {
      templatemark: "Create a TemplateMark document following this format:\n",
      concerto: "Create a Concerto model with these specifications:\n",
      data: "Generate JSON data according to this structure:\n",
    };

    return `${systemPrompts[editorType as keyof typeof systemPrompts] || ""}
${currentContent ? `Current content:\n${currentContent}\n\n` : ""}
Request: ${prompt}

`;
  }
}
