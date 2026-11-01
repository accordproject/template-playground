import { describe, it, expect, vi } from "vitest";
import * as monaco from "monaco-editor";
import {
  applyWrappedEdit,
  parseLine,
  detectPrefix,
  allLinesHavePrefix,
  applyLinePrefixToggle,
  applyOrderedListToggle,
  insertMarkdownLinkOrImage,
} from "../../utils/markdownEditorUtils";

function createMockEditor(
  initialContent: string,
  initialSelection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }
) {
  const lines = initialContent.split("\n");
  let currentSelection = new monaco.Selection(
    initialSelection.startLineNumber,
    initialSelection.startColumn,
    initialSelection.endLineNumber,
    initialSelection.endColumn
  );

  const model = {
    getLineContent: (line: number) => lines[line - 1] ?? "",
    getValueInRange: (sel: monaco.IRange) => {
      if (sel.startLineNumber === sel.endLineNumber) {
        const line = lines[sel.startLineNumber - 1] ?? "";
        return line.slice(sel.startColumn - 1, sel.endColumn - 1);
      }
      return "";
    },
  };

  const setSelectionSpy = vi.fn((newSel: monaco.Selection) => {
    currentSelection = newSel;
  });

  const editor = {
    getModel: () => model,
    getSelection: () => currentSelection,
    setSelection: setSelectionSpy,
    setSelectionSpy,
    executeEdits: vi.fn((_source: string, edits: monaco.editor.IIdentifiedSingleEditOperation[]) => {
      for (const edit of edits) {
        const range = edit.range;
        if (range.startLineNumber === range.endLineNumber) {
          const line = lines[range.startLineNumber - 1];
          const before = line.slice(0, range.startColumn - 1);
          const after = line.slice(range.endColumn - 1);
          lines[range.startLineNumber - 1] = before + (edit.text ?? "") + after;
        }
      }
    }),
    focus: vi.fn(),
    getContent: () => lines.join("\n"),
    getCurrentSelection: () => currentSelection,
  };

  return editor as unknown as monaco.editor.IStandaloneCodeEditor & {
    getContent: () => string;
    getCurrentSelection: () => monaco.Selection;
    setSelectionSpy: typeof setSelectionSpy;
  };
}

describe("markdownEditorUtils", () => {
  describe("applyWrappedEdit when no text is selected (#983)", () => {
    it("inserts bold markers and positions cursor inside when editor is empty", () => {
      const editor = createMockEditor("", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("****");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 3, 1, 3)
      );
      expect(editor.getCurrentSelection().startColumn).toBe(3);
    });

    it("toggles off and removes empty bold markers if cursor is already between them", () => {
      const editor = createMockEditor("****", {
        startLineNumber: 1,
        startColumn: 3,
        endLineNumber: 1,
        endColumn: 3,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 1, 1, 1)
      );
      expect(editor.getCurrentSelection().startColumn).toBe(1);
    });

    it("inserts bold markers at cursor position and sets cursor between them", () => {
      const editor = createMockEditor("hello world", {
        startLineNumber: 1,
        startColumn: 6,
        endLineNumber: 1,
        endColumn: 6,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("hello**** world");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 8, 1, 8)
      );
    });

    it("inserts italic markers and positions cursor inside when editor is empty", () => {
      const editor = createMockEditor("", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });

      applyWrappedEdit(editor, "*");

      expect(editor.getContent()).toBe("**");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 2, 1, 2)
      );
    });

    it("toggles off empty italic markers if cursor is between them", () => {
      const editor = createMockEditor("**", {
        startLineNumber: 1,
        startColumn: 2,
        endLineNumber: 1,
        endColumn: 2,
      });

      applyWrappedEdit(editor, "*");

      expect(editor.getContent()).toBe("");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 1, 1, 1)
      );
    });

    it("inserts italic inside bold markers (producing bold+italic) instead of falsely toggling off", () => {
      const editor = createMockEditor("****", {
        startLineNumber: 1,
        startColumn: 3,
        endLineNumber: 1,
        endColumn: 3,
      });

      // User has **|** and clicks italic
      applyWrappedEdit(editor, "*");

      expect(editor.getContent()).toBe("******");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 4, 1, 4)
      );
    });

    it("toggles off italic from bold+italic (leaving bold)", () => {
      const editor = createMockEditor("******", {
        startLineNumber: 1,
        startColumn: 4,
        endLineNumber: 1,
        endColumn: 4,
      });

      // User has ***|*** and clicks italic
      applyWrappedEdit(editor, "*");

      expect(editor.getContent()).toBe("****");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 3, 1, 3)
      );
    });

    it("toggles off bold from bold+italic (leaving italic)", () => {
      const editor = createMockEditor("******", {
        startLineNumber: 1,
        startColumn: 4,
        endLineNumber: 1,
        endColumn: 4,
      });

      // User has ***|*** and clicks bold
      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("**");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 2, 1, 2)
      );
    });
  });

  describe("applyWrappedEdit when text is selected", () => {
    it("wraps selected text in markers", () => {
      const editor = createMockEditor("hello world", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 6,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("**hello** world");
    });

    it("unwraps directly wrapped text", () => {
      const editor = createMockEditor("**hello** world", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("hello world");
    });

    it("unwraps text when inner text is selected inside markers", () => {
      const editor = createMockEditor("**hello** world", {
        startLineNumber: 1,
        startColumn: 3,
        endLineNumber: 1,
        endColumn: 8,
      });

      applyWrappedEdit(editor, "**");

      expect(editor.getContent()).toBe("hello world");
    });
  });

  describe("parseLine and detectPrefix", () => {
    it("parses leading whitespace correctly", () => {
      expect(parseLine("   hello")).toEqual({
        leadingWhitespace: "   ",
        content: "hello",
      });
      expect(parseLine("world")).toEqual({
        leadingWhitespace: "",
        content: "world",
      });
    });

    it("detects prefixes correctly", () => {
      expect(detectPrefix("# Title", ["#", "##"])).toEqual({
        matched: "#",
        stripped: "Title",
      });
      expect(detectPrefix("- item", ["-"])).toEqual({
        matched: "-",
        stripped: "item",
      });
      expect(detectPrefix("no prefix", ["#", "-"])).toEqual({
        matched: undefined,
        stripped: "no prefix",
      });
    });

    it("checks if all lines have prefix", () => {
      expect(allLinesHavePrefix(["- a", "- b"], "-", ["-"])).toBe(true);
      expect(allLinesHavePrefix(["- a", "b"], "-", ["-"])).toBe(false);
    });
  });

  describe("applyLinePrefixToggle and applyOrderedListToggle", () => {
    it("toggles heading prefix", () => {
      const editor = createMockEditor("title", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 6,
      });

      applyLinePrefixToggle(editor, "#", ["##", "###"]);
      expect(editor.getContent()).toBe("# title");

      applyLinePrefixToggle(editor, "#", ["##", "###"]);
      expect(editor.getContent()).toBe("title");
    });

    it("applies and toggles sequential ordered list", () => {
      const editor = createMockEditor("first\nsecond", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 7,
      });

      applyOrderedListToggle(editor);
      expect(editor.getContent()).toBe("1. first\n2. second");

      applyOrderedListToggle(editor);
      expect(editor.getContent()).toBe("first\nsecond");
    });
  });

  describe("insertMarkdownLinkOrImage", () => {
    it("inserts link and positions cursor in parentheses", () => {
      const editor = createMockEditor("", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });

      insertMarkdownLinkOrImage(editor, "", false);
      expect(editor.getContent()).toBe("[link text]()");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 13, 1, 13)
      );
    });

    it("inserts image and positions cursor in parentheses", () => {
      const editor = createMockEditor("", {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });

      insertMarkdownLinkOrImage(editor, "my photo", true);
      expect(editor.getContent()).toBe("![my photo]()");
      expect(editor.setSelectionSpy).toHaveBeenCalledWith(
        new monaco.Selection(1, 13, 1, 13)
      );
    });
  });
});
