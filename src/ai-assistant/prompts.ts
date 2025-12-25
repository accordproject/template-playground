import { editorsContent } from '../types/components/AIAssistant.types';
import { encode } from '@toon-format/toon';

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
    try {
      const jsonData = JSON.parse(editorsContent.editorAgreementData);
      const toonData = encode(jsonData);
      prompt += `\n\nCurrent JSON Data content:\n\`\`\`toon\n${toonData}\n\`\`\``;
    } catch (e) {
      prompt += `\n\nCurrent JSON Data content:\n\`\`\`\n${editorsContent.editorAgreementData}\n\`\`\``;
    }
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

  inlineSuggestion: (editorsContent: editorsContent, aiConfig?: any, editorType?: 'markdown' | 'concerto' | 'json') => {
    const editorName = editorType === 'markdown' ? 'TemplateMark' : editorType === 'concerto' ? 'Concerto' : 'JSON Data';
    let prompt = `You are a helpful assistant that provides inline code completion suggestions for Accord Project
    ${editorName} code. You should only suggest valid code that will
    compile. For instance, while making a suggestion in TemplateMark you must make sure that it conforms with
    provided (if any) Concerto model/JSON data.

    IMPORTANT: Your response will be directly used for inline suggestions in the code editor.
    - <CURSOR> represents the current cursor position in the editor
    - Return ONLY the code completion text that should be inserted at the cursor position.
    - Do NOT include any explanations, markdown formatting, backticks, or additional text.
    - Do NOT repeat the existing code that's already in the editor.
    - Do NOT suggest replacement for existing code after the cursor, just addition.
    - Provide only the logical continuation from the cursor position.
    - If no meaningful completion can be suggested, return an empty response.
    - Responses should ideally not be very long unless the situation demands it.
    - Make sure completion is well-formatted with appropriate newlines and spaces as per context.
    - The tendency should be to return a contentful ${editorName} completion every time and not empty response.
    - Focus on syntactically correct and contextually appropriate completions\n\n`;
    return includeEditorContents(prompt, aiConfig, editorsContent);
  },

  default: (editorsContent: editorsContent, aiConfig?: any) => {
    let prompt = `You are a helpful assistant that answers questions about open source Accord Project. You assist the user in working with TemplateMark, Concerto models and JSON data. Code blocks returned by you should be enclosed in backticks, the language names that you can use after three backticks are- "concerto","templatemark" and "json", suffix 'Apply' to the language name if it is a complete code block that can be used to replace the corresponding editor content, precisely, concertoApply, templatemarkApply and jsonApply. You must always try to return complete code block that can be applied to the editors. Concerto code, TemplateMark code and JSON data are supplied to TemplateEngine to produce the final output. For instance, a data field that is not in Concerto data model can't be in JSON data and therefore can't be used in TemplateMark you generate. Analyze the data (provided in JSON or TOON format) and Concerto model (if provided) carefully, only the fields with simple data types (String, Integer etc.) present in concept annotated with @template decorator can be directly accessed anywhere in the template. Other complex data fields that have custom concept declaration in the Concerto model and are represented as nested fields in JSON data, can only be used within {{#clause conceptName}} {{concept_property_name}} {{/clause}} tags. Therefore, in most cases you have to create a scope using clause tag in TemplateMark to access properties defined under a concept in Concerto. For enumerating through a list you can create a scope to access the properties in list items via {{#olist listName}} {{instancePropertyName}} {{/olist}} or {{#ulist listName}} {{instancePropertyName}} {{/ulist}}. For TemplateMark code, there's no such thing as 'this' keyword within list scope. Optional fields shouldn't be wrapped in an if or with block to check for their availability e.g. if Concerto model has age as optional don't wrap it in if block in TemplateMark. You can also use Typescript within TemplateMark by enclosing the Typescript code in {{% %}}, you must write all of the Typescript code within a single line enclosed in a single pair of opening {{% and closing %}}. You may use Typescript to achieve an objective in TemplateMark only if TemplateMark syntax makes doing something hard, the data objects from JSON are readily available within {{% %}} enclosed Typescript using direct access, e.g. {{% return order.orderLines %}}. For e.g., you could use TypeScript to render ordered/unordered primitive list types such as String[]. Keep your focus on generating valid output based on current editors' contents but if you make a change that isn't compatible with the content of existing editors, you must return the full code for those editors as well. You mustn't add any placeholder in TemplateMark which isn't in Concerto model and JSON data unless you modify the Concerto and JSON data to have that field at the appropriate place.\n\n`;
    return includeEditorContents(prompt, aiConfig, editorsContent);
  }
};
