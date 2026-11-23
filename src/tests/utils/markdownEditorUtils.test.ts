import { describe, expect, it, vi } from "vitest";
import { editor as MonacoEditorNS, IRange, Selection } from "monaco-editor";
import {
  applyLinePrefixToggle,
  applyOrderedListToggle,
  getEffectiveLineRange,
} from "../../utils/markdownEditorUtils";

function createMockEditor(lines: string[], selection: IRange) {
  let capturedEdits: MonacoEditorNS.IIdentifiedSingleEditOperation[] = [];

  const model = {
    getLineContent: vi.fn((lineNum: number) => lines[lineNum - 1] ?? ""),
  } as unknown as MonacoEditorNS.ITextModel;

  const executeEdits = vi.fn(
    (
      _source: string,
      edits: MonacoEditorNS.IIdentifiedSingleEditOperation[]
    ) => {
      capturedEdits = edits;
      return true;
    }
  );
  const focus = vi.fn();

  const editor = {
    getModel: vi.fn(() => model),
    getSelection: vi.fn(
      () =>
        ({
          ...selection,
        } as unknown as Selection)
    ),
    executeEdits,
    focus,
  } as unknown as MonacoEditorNS.IStandaloneCodeEditor;

  return {
    editor,
    model,
    executeEdits,
    focus,
    getEdits: () => capturedEdits,
  };
}

describe("getEffectiveLineRange", () => {
  it("preserves single-line selection collapsed at column 1", () => {
    const range = getEffectiveLineRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    });
    expect(range).toEqual({ startLine: 1, endLine: 1 });
  });

  it("preserves single-line selection with text selected", () => {
    const range = getEffectiveLineRange({
      startLineNumber: 2,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 10,
    });
    expect(range).toEqual({ startLine: 2, endLine: 2 });
  });

  it("excludes trailing line when multiline selection ends at column 1", () => {
    const range = getEffectiveLineRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 3,
      endColumn: 1,
    });
    expect(range).toEqual({ startLine: 1, endLine: 2 });
  });

  it("includes trailing line when multiline selection ends at column greater than 1", () => {
    const range = getEffectiveLineRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 3,
      endColumn: 5,
    });
    expect(range).toEqual({ startLine: 1, endLine: 3 });
  });
});

describe("applyLinePrefixToggle", () => {
  describe("heading formatting", () => {
    it("does not format the trailing unselected line when multiline selection ends at column 1", () => {
      const lines = ["Title", "Body text"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 1,
      });

      applyLinePrefixToggle(editor, "#", ["##", "###"]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(1);
      expect(edits[0]?.range).toEqual({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 6,
      });
      expect(edits[0]?.text).toBe("# Title");
    });

    it("formats all lines when multiline selection ends at column greater than 1", () => {
      const lines = ["Title", "Body text"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 5,
      });

      applyLinePrefixToggle(editor, "#", ["##", "###"]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(2);
      expect(edits[0]?.text).toBe("# Title");
      expect(edits[1]?.text).toBe("# Body text");
    });

    it("formats the line when single-line selection is at column 1", () => {
      const lines = ["Title", "Body text"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });

      applyLinePrefixToggle(editor, "#", ["##", "###"]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(1);
      expect(edits[0]?.text).toBe("# Title");
    });

    it("formats the line when cursor is collapsed at column greater than 1", () => {
      const lines = ["Title", "Body text"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 3,
        endLineNumber: 1,
        endColumn: 3,
      });

      applyLinePrefixToggle(editor, "#", ["##", "###"]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(1);
      expect(edits[0]?.text).toBe("# Title");
    });
  });

  describe("unordered-list formatting", () => {
    it("does not format the trailing unselected line when multiline selection ends at column 1", () => {
      const lines = ["First item", "Second item"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 1,
      });

      applyLinePrefixToggle(editor, "-", ["1."]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(1);
      expect(edits[0]?.text).toBe("- First item");
    });

    it("formats both lines when multiline selection ends at column greater than 1", () => {
      const lines = ["First item", "Second item"];
      const { editor, executeEdits, getEdits } = createMockEditor(lines, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 11,
      });

      applyLinePrefixToggle(editor, "-", ["1."]);

      expect(executeEdits).toHaveBeenCalledTimes(1);
      const edits = getEdits();
      expect(edits).toHaveLength(2);
      expect(edits[0]?.text).toBe("- First item");
      expect(edits[1]?.text).toBe("- Second item");
    });
  });
});

describe("applyOrderedListToggle", () => {
  it("does not format the trailing unselected line when multiline selection ends at column 1", () => {
    const lines = ["First item", "Second item"];
    const { editor, executeEdits, getEdits } = createMockEditor(lines, {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 1,
    });

    applyOrderedListToggle(editor, ["-"]);

    expect(executeEdits).toHaveBeenCalledTimes(1);
    const edits = getEdits();
    expect(edits).toHaveLength(1);
    expect(edits[0]?.text).toBe("1. First item");
  });

  it("formats and numbers all lines when multiline selection ends at column greater than 1", () => {
    const lines = ["First item", "Second item"];
    const { editor, executeEdits, getEdits } = createMockEditor(lines, {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 11,
    });

    applyOrderedListToggle(editor, ["-"]);

    expect(executeEdits).toHaveBeenCalledTimes(1);
    const edits = getEdits();
    expect(edits).toHaveLength(2);
    expect(edits[0]?.text).toBe("1. First item");
    expect(edits[1]?.text).toBe("2. Second item");
  });

  it("formats single line when collapsed cursor is at column 1", () => {
    const lines = ["First item", "Second item"];
    const { editor, executeEdits, getEdits } = createMockEditor(lines, {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    });

    applyOrderedListToggle(editor, ["-"]);

    expect(executeEdits).toHaveBeenCalledTimes(1);
    const edits = getEdits();
    expect(edits).toHaveLength(1);
    expect(edits[0]?.text).toBe("1. First item");
  });
});
