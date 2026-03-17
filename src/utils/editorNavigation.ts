import * as monaco from "monaco-editor";

export type EditorSource = 'Concerto Model' | 'TemplateMark' | 'JSON Data' | 'Template Compilation';

type EditorRegistry = {
    concerto: monaco.editor.IStandaloneCodeEditor | null;
    template: monaco.editor.IStandaloneCodeEditor | null;
    json: monaco.editor.IStandaloneCodeEditor | null;
};

const editorRegistry: EditorRegistry = {
    concerto: null,
    template: null,
    json: null,
};

// Track active highlight timeouts for cleanup
const activeTimeouts = new Map<monaco.editor.IStandaloneCodeEditor, number>();

// Track active decoration collections for cleanup
const activeDecorations = new Map<monaco.editor.IStandaloneCodeEditor, monaco.editor.IEditorDecorationsCollection>();

// Highlight duration for error line navigation
const HIGHLIGHT_DURATION_MS = 2000;

export const registerEditor = (
    type: keyof EditorRegistry,
    editor: monaco.editor.IStandaloneCodeEditor
) => {
    editorRegistry[type] = editor;
};

export const unregisterEditor = (type: keyof EditorRegistry) => {
    const editor = editorRegistry[type];
    if (editor) {
        // Clear any pending highlight timeouts for this editor
        const timeoutId = activeTimeouts.get(editor);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            activeTimeouts.delete(editor);
        }
        
        // Clear any active decorations for this editor
        const decorations = activeDecorations.get(editor);
        if (decorations) {
            decorations.clear();
            activeDecorations.delete(editor);
        }
    }
    editorRegistry[type] = null;
};

export const navigateToLine = (
    source: EditorSource,
    line: number,
    column?: number
): boolean => {
    let editor: monaco.editor.IStandaloneCodeEditor | null = null;

    switch (source) {
        case 'Concerto Model':
            editor = editorRegistry.concerto;
            break;
        case 'TemplateMark':
        case 'Template Compilation':
            editor = editorRegistry.template;
            break;
        case 'JSON Data':
            editor = editorRegistry.json;
            break;
    }

    if (editor && line > 0) {
        // Clear any existing highlight timeout for this editor
        const existingTimeout = activeTimeouts.get(editor);
        if (existingTimeout !== undefined) {
            clearTimeout(existingTimeout);
        }
        
        // Clear any existing decorations for this editor
        const existingDecorations = activeDecorations.get(editor);
        if (existingDecorations) {
            existingDecorations.clear();
        }

        const position = { lineNumber: line, column: column || 1 };
        editor.revealLineInCenter(line);
        editor.setPosition(position);
        editor.focus();

        // Add a brief highlight effect
        const decorations = editor.createDecorationsCollection([
            {
                range: new monaco.Range(line, 1, line, 1),
                options: {
                    isWholeLine: true,
                    className: 'error-line-highlight',
                },
            },
        ]);
        
        // Track the decorations collection
        activeDecorations.set(editor, decorations);

        // Remove highlight after 2 seconds
        const timeoutId = window.setTimeout(() => {
            decorations.clear();
            activeTimeouts.delete(editor);
            activeDecorations.delete(editor);
        }, HIGHLIGHT_DURATION_MS);
        
        activeTimeouts.set(editor, timeoutId);

        return true;
    }

    return false;
};
