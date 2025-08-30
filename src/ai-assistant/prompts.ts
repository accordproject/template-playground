import { editorsContent } from '../types/components/AIAssistant.types';

const includeEditorContents = (prompt: string, aiConfig: any, editorsContent: editorsContent) => {
  if (!aiConfig?.includeTemplateMarkContent && !aiConfig?.includeConcertoModelContent && !aiConfig?.includeDataContent) {
    return prompt;
  }

  prompt += `\n\nThe user is working inside a web code playground. The contents of user's code editor(s) follows.
  Whether you use this content to generate your response depends on the specific query that the user asks.\n`;

  if (aiConfig?.includeTemplateMarkContent && editorsContent.editorTemplateMark) {
    prompt += `\n\nCurrent TemplateMark content:\n\`\`\`\n${editorsContent.editorTemplateMark}\n\`\`\``;
  }
  
  if (aiConfig?.includeConcertoModelContent && editorsContent.editorModelCto) {
    prompt += `\n\nCurrent Concerto Model content:\n\`\`\`\n${editorsContent.editorModelCto}\n\`\`\``;
  }

  if (aiConfig?.includeDataContent && editorsContent.editorAgreementData) {
    prompt += `\n\nCurrent JSON Data content:\n\`\`\`\n${editorsContent.editorAgreementData}\n\`\`\``;
  }
  
  return prompt;
};

export const prepareSystemPrompt = {
  textToTemplate: (editorsContent: editorsContent, aiConfig?: any) => {
    let prompt = `You are a helpful assistant that converts the following text into a valid Accord Project TemplateMark template without corresponding Concerto and JSON data.\n\n`;
    return includeEditorContents(prompt, aiConfig, editorsContent);
  },

  createConcertoModel: (editorsContent: editorsContent, aiConfig?: any) => {
    let prompt = `You are a helpful assistant that creates valid Accord Project Concerto models without corresponding TemplateMark and JSON data.\n\n`;
    return includeEditorContents(prompt, aiConfig, editorsContent);
  },

  explainCode: (editorsContent: editorsContent, aiConfig?: any, editorType?: 'markdown' | 'concerto' | 'json') => {
    const editorTypeMap = {
      "markdown": 'TemplateMark',
      "concerto": 'Concerto',
      "json": 'JSON Data'
    };
    
    const typeName = editorType ? editorTypeMap[editorType] || editorType : '';
    
    let prompt = `You are a helpful assistant that explains Accord Project ${typeName} code clearly and concisely. 
    Focus on what the code does, its purpose, and any important details about its structure or syntax. 
    Provide easy to understand explanations for developers. You can break down the code in detail line-by-line
    but don't include the complete code block in your response as it is, user already knows their selection.\n\n`;

    return includeEditorContents(prompt, aiConfig, editorsContent);
  },

  default: (editorsContent: editorsContent, aiConfig?: any) => {
    let prompt = `You are a helpful assistant that answers questions about open source Accord Project. You assist the user 
    to work with TemplateMark, Concerto models and JSON data. Code blocks returned by you should enclosed in backticks\n\n`;
    return includeEditorContents(prompt, aiConfig, editorsContent);
  }
};