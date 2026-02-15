/**
 * Mock for monaco-editor module used in tests
 * This allows testing utilities that import Monaco types without loading the full editor
 */

export class Selection {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number
  ) {}
}

export const editor = {};

export interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}
