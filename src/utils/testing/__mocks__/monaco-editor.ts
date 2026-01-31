// Mock for monaco-editor to be used in vitest tests
// This avoids the package resolution issues

export class Selection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;

    constructor(
        startLineNumber: number,
        startColumn: number,
        endLineNumber: number,
        endColumn: number
    ) {
        this.startLineNumber = startLineNumber;
        this.startColumn = startColumn;
        this.endLineNumber = endLineNumber;
        this.endColumn = endColumn;
    }
}

export const editor = {};
export const IRange = {};

export default {
    Selection,
    editor,
    IRange,
};
