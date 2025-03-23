import { HuggingFaceAPI } from "./HuggingFaceAPI";
import { GeminiAPI } from "./GeminiAPI";

import { TEMPLATEMARK_SYSTEM_PROMPT, TEMPLATEMARK_EXAMPLES } from "./prompts/templateMark";
import { CONCERTO_SYSTEM_PROMPT, CONCERTO_EXAMPLES } from "./prompts/concerto";
import { DATA_SYSTEM_PROMPT, DATA_EXAMPLES } from "./prompts/data";

import { AI_CONFIG } from "../../config/ai.config";

export type EditorType = "templatemark" | "concerto" | "data";

export interface AIRequest {
  prompt: string;
  editorType: EditorType;
  currentContent?: string;
}

export interface AICompletion {
  content: string;
  diff?: string;
  explanation?: string;
}

export class AIService {
  private huggingFaceAPI: HuggingFaceAPI;
  private geminiAPI: GeminiAPI;

  constructor() {
    this.huggingFaceAPI = new HuggingFaceAPI(AI_CONFIG.huggingfaceApiKey || "");
    this.geminiAPI = new GeminiAPI(AI_CONFIG.geminiApiKey || "");
  }

  async getCompletion({ prompt, editorType, currentContent }: AIRequest): Promise<AICompletion> {
    try {
      const result = await this.getHuggingFaceCompletion({ prompt, editorType, currentContent });
      return this.processCompletion(result, currentContent);
    } catch (error: any) {
      console.log("Hugging Face API error, trying Gemini:", error.message);
      try {
        const result = await this.getGeminiCompletion({ prompt, editorType, currentContent });
        return this.processCompletion(result, currentContent);
      } catch (geminiError: any) {
        console.error("All AI providers failed:", geminiError.message);
        return {
          content: "Could not generate completion. Please try again.",
          explanation: "All AI providers failed to generate a response.",
        };
      }
    }
  }

  private processCompletion(generatedText: string, currentContent?: string): AICompletion {
    // vinyl: extract comments that might be explanations
    const explanationRegex = /\/\*\*([\s\S]*?)\*\//g;
    const explanationMatches = [...generatedText.matchAll(explanationRegex)];
    let explanation = "";

    if (explanationMatches.length > 0) {
      explanation = explanationMatches.map((match) => match[1].trim()).join("\n");
      // vinyl: remove explanations from the content
      generatedText = generatedText.replace(explanationRegex, "");
    }

    if (!currentContent) {
      return {
        content: generatedText.trim(),
        explanation,
      };
    }

    const diff = this.generateDiff(currentContent, generatedText);

    return {
      content: generatedText.trim(),
      diff,
      explanation,
    };
  }

  private generateDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    let diffText = "";

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      const oldLine = i < oldLines.length ? oldLines[i] : "";
      const newLine = i < newLines.length ? newLines[i] : "";

      if (oldLine !== newLine) {
        if (oldLine) {
          diffText += `- ${oldLine}\n`;
        }
        if (newLine) {
          diffText += `+ ${newLine}\n`;
        }
      }
    }

    return diffText;
  }

  private async getHuggingFaceCompletion({ prompt, editorType, currentContent }: AIRequest): Promise<string> {
    return await this.huggingFaceAPI.getCompletion({
      prompt,
      currentContent,
      editorType,
    });
  }

  private async getGeminiCompletion({ prompt, editorType, currentContent }: AIRequest): Promise<string> {
    return await this.geminiAPI.getCompletion({
      prompt,
      currentContent,
      editorType,
      systemPrompt: this.getSystemPrompt(editorType),
      examples: this.getExamples(editorType),
    });
  }

  private getSystemPrompt(editorType: EditorType): string {
    switch (editorType) {
      case "templatemark":
        return TEMPLATEMARK_SYSTEM_PROMPT;
      case "concerto":
        return CONCERTO_SYSTEM_PROMPT;
      case "data":
        return DATA_SYSTEM_PROMPT;
      default:
        return "";
    }
  }

  private getExamples(editorType: EditorType): Array<{ role: string; content: string }> {
    switch (editorType) {
      case "templatemark":
        return TEMPLATEMARK_EXAMPLES;
      case "concerto":
        return CONCERTO_EXAMPLES;
      case "data":
        return DATA_EXAMPLES;
      default:
        return [];
    }
  }
}
