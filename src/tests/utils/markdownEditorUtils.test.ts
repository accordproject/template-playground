import {
  parseLine,
  detectPrefix,
  allLinesHavePrefix,
  createLineEditRange,
} from "../../utils/markdownEditorUtils";

describe("markdownEditorUtils", () => {
  describe("parseLine", () => {
    it("should return empty whitespace for line with no leading spaces", () => {
      const result = parseLine("Hello World");
      expect(result).toEqual({
        leadingWhitespace: "",
        content: "Hello World",
      });
    });

    it("should extract leading spaces", () => {
      const result = parseLine("  Hello");
      expect(result).toEqual({
        leadingWhitespace: "  ",
        content: "Hello",
      });
    });

    it("should extract leading tabs", () => {
      const result = parseLine("\t\tHello");
      expect(result).toEqual({
        leadingWhitespace: "\t\t",
        content: "Hello",
      });
    });

    it("should handle mixed whitespace", () => {
      const result = parseLine(" \t Hello");
      expect(result).toEqual({
        leadingWhitespace: " \t ",
        content: "Hello",
      });
    });

    it("should handle empty line", () => {
      const result = parseLine("");
      expect(result).toEqual({
        leadingWhitespace: "",
        content: "",
      });
    });

    it("should handle line with only whitespace", () => {
      const result = parseLine("   ");
      expect(result).toEqual({
        leadingWhitespace: "   ",
        content: "",
      });
    });
  });

  describe("detectPrefix", () => {
    it("should return undefined matched when no prefix found", () => {
      const result = detectPrefix("Hello World", ["#", "##", "###"]);
      expect(result).toEqual({
        matched: undefined,
        stripped: "Hello World",
      });
    });

    it("should detect single hash heading prefix", () => {
      const result = detectPrefix("# Hello", ["#", "##", "###"]);
      expect(result).toEqual({
        matched: "#",
        stripped: "Hello",
      });
    });

    it("should detect double hash heading prefix", () => {
      const result = detectPrefix("## Hello", ["#", "##", "###"]);
      expect(result).toEqual({
        matched: "##",
        stripped: "Hello",
      });
    });

    it("should detect triple hash heading prefix", () => {
      const result = detectPrefix("### Hello", ["#", "##", "###"]);
      expect(result).toEqual({
        matched: "###",
        stripped: "Hello",
      });
    });

    it("should detect unordered list prefix", () => {
      const result = detectPrefix("- Item", ["-"]);
      expect(result).toEqual({
        matched: "-",
        stripped: "Item",
      });
    });

    it("should handle prefix with no content after it", () => {
      const result = detectPrefix("#", ["#", "##"]);
      expect(result).toEqual({
        matched: "#",
        stripped: "",
      });
    });

    it("should not match prefix that is not in the list", () => {
      const result = detectPrefix("* Item", ["-"]);
      expect(result).toEqual({
        matched: undefined,
        stripped: "* Item",
      });
    });

    it("should handle content with leading spaces before prefix", () => {
      const result = detectPrefix("  # Hello", ["#", "##"]);
      expect(result).toEqual({
        matched: "#",
        stripped: "Hello",
      });
    });

    it("should not match when prefix is part of word", () => {
      const result = detectPrefix("#hashtag", ["#"]);
      expect(result).toEqual({
        matched: undefined,
        stripped: "#hashtag",
      });
    });
  });

  describe("allLinesHavePrefix", () => {
    it("should return true when all lines have the same prefix", () => {
      const lines = ["# Hello", "# World", "# Test"];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(true);
    });

    it("should return false when lines have different prefixes", () => {
      const lines = ["# Hello", "## World", "# Test"];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(false);
    });

    it("should return false when some lines have no prefix", () => {
      const lines = ["# Hello", "World", "# Test"];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(false);
    });

    it("should handle single line", () => {
      const lines = ["# Hello"];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(true);
    });

    it("should handle lines with leading whitespace", () => {
      const lines = ["  # Hello", "  # World"];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(true);
    });

    it("should return true for empty array", () => {
      const lines: string[] = [];
      const result = allLinesHavePrefix(lines, "#", ["#", "##", "###"]);
      expect(result).toBe(true);
    });
  });

  describe("createLineEditRange", () => {
    it("should create correct range for line 1", () => {
      const result = createLineEditRange(1, 10);
      expect(result).toEqual({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 11,
      });
    });

    it("should create correct range for arbitrary line", () => {
      const result = createLineEditRange(5, 20);
      expect(result).toEqual({
        startLineNumber: 5,
        startColumn: 1,
        endLineNumber: 5,
        endColumn: 21,
      });
    });

    it("should handle zero-length line", () => {
      const result = createLineEditRange(3, 0);
      expect(result).toEqual({
        startLineNumber: 3,
        startColumn: 1,
        endLineNumber: 3,
        endColumn: 1,
      });
    });
  });
});
