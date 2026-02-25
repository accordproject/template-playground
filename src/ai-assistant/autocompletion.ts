import * as monaco from 'monaco-editor';
import { sendMessage } from './chatRelay';
import useAppStore from '../store/store';
import { editorsContent } from '../types/components/AIAssistant.types';
import { getLastActivity } from './activityTracker';

let lastRequestTime = 0;
let isProcessing = false;

export const registerAutocompletion = (
  language: 'concerto' | 'markdown' | 'json',
  monacoInstance: typeof monaco
) => {
  try {
    const provider = monacoInstance.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: async (model, position, _context, token) => {
        if (token.isCancellationRequested) {
          return { items: [] };
        }

        const { aiConfig } = useAppStore.getState();
        const enableInlineSuggestions = aiConfig?.enableInlineSuggestions !== false;
        if (!enableInlineSuggestions) {
          return { items: [] };
        }

        const initialTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const lastActivity = getLastActivity(language);
        if (lastActivity > initialTime) {
          return { items: [] };
        }

        if (token.isCancellationRequested) {
          return { items: [] };
        }

        const currentTime = Date.now();
        if (isProcessing || (currentTime - lastRequestTime < 2000)) {
          return { items: [] };
        }

        isProcessing = true;
        lastRequestTime = currentTime;

        try {
          const result = await getInlineCompletions(model, position, language, monacoInstance);
          return result;
        } finally {
          isProcessing = false;
        }
      },
      freeInlineCompletions: () => {
        // No cleanup needed
      },
    });
    return provider;
  } catch (error) {
    console.error('Error registering completion provider:', error);
    return null;
  }
};

const getInlineCompletions = async (
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  language: 'concerto' | 'markdown' | 'json',
  monacoInstance: typeof monaco
): Promise<{ items: monaco.languages.InlineCompletion[] }> => {
  const { aiConfig } = useAppStore.getState();

  if (!aiConfig) {
    return { items: [] };
  }

  const lineContent = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineContent.substring(0, position.column - 1);
  const textAfterCursor = lineContent.substring(position.column - 1);

  if (!textBeforeCursor.trim() || textBeforeCursor.length < 2) {
    return {
      items: []
    };
  }

  const startLine = Math.max(1, position.lineNumber - 20);
  const endLine = Math.min(model.getLineCount(), position.lineNumber + 20);
  const contextLines: string[] = [];

  for (let i = startLine; i <= endLine; i++) {
    if (i === position.lineNumber) {
      const fullCurrentLine = textBeforeCursor + '<CURSOR>' + textAfterCursor;
      contextLines.push(fullCurrentLine);
    } else if (i < position.lineNumber) {
      contextLines.push(model.getLineContent(i));
    } else {
      contextLines.push(model.getLineContent(i));
    }
  }

  const contextText = contextLines.join('\n');

  const editorsContent: editorsContent = {
    editorTemplateMark: useAppStore.getState().editorValue,
    editorModelCto: useAppStore.getState().editorModelCto,
    editorAgreementData: useAppStore.getState().editorAgreementData,
  };
  const prompt = `Current context:\n${contextText}`;

  try {
    let completion = '';

    await sendMessage(
      prompt,
      'inlineSuggestion',
      editorsContent,
      false,
      language,
      (chunk) => {
        completion += chunk;
      },
      (error) => {
        console.error('Autocompletion error:', error);
      }
    );

    completion = completion.trim();

    completion = completion.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');
    completion = completion.replace(/^`/, '').replace(/`$/, '');

    if (!completion || completion.length < 2) {
      return { items: [] };
    }

    const inlineCompletion: monaco.languages.InlineCompletion = {
      insertText: completion,
      range: new monacoInstance.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      filterText: textBeforeCursor,
    };

    return {
      items: [inlineCompletion],
    };
  } catch (error) {
    console.error('Error getting AI completion:', error);
    return { items: [] };
  }
};
