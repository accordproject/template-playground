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

export const registerEditor = (
    type: keyof EditorRegistry,
    editor: monaco.editor.IStandaloneCodeEditor
) => {
    editorRegistry[type] = editor;
};

export const unregisterEditor = (type: keyof EditorRegistry) => {
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
                    glyphMarginClassName: 'error-glyph-margin',
                },
            },
        ]);

        // Remove highlight after 2 seconds
        setTimeout(() => {
            decorations.clear();
        }, 2000);

        return true;
    }

    return false;
};
