export class GeminiAPI {
  constructor(private apiKey: string) {}

  async getCompletion({
    prompt,
    currentContent,
    editorType,
    systemPrompt,
  }: {
    prompt: string;
    currentContent?: string;
    editorType?: string;
    systemPrompt?: string;
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    try {
      const formattedPrompt = this.formatPrompt(prompt, currentContent, editorType, systemPrompt);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: formattedPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
              topP: 0.95,
              topK: 40,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        return result.candidates[0].content.parts[0].text;
      }

      throw new Error("Unexpected response format from Gemini API");
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  private formatPrompt(prompt: string, currentContent?: string, editorType?: string, systemPrompt?: string): string {
    const systemPrompts = {
      templatemark: "Create a TemplateMark document following this format:\n",
      concerto: "Create a Concerto model with these specifications:\n",
      data: "Generate JSON data according to this structure:\n",
    };

    const specificSystemPrompt = systemPrompt || systemPrompts[editorType as keyof typeof systemPrompts] || "";

    return `${specificSystemPrompt}
  ${currentContent ? `Current content:\n${currentContent}\n\n` : ""}
  Request: ${prompt}
  `;
  }
}
