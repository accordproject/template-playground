import { describe, it, expect } from "vitest";
import {
    createLineEditRange,
    parseLine,
    detectPrefix,
    allLinesHavePrefix,
    createLineEdit,
} from "../../utils/markdownEditorUtils";

describe("markdownEditorUtils - Pure Functions", () => {
    describe("parseLine", () => {
        it("should extract leading whitespace and content from a line with spaces", () => {
            const result = parseLine("  Hello World");
            expect(result).toEqual({
                leadingWhitespace: "  ",
                content: "Hello World",
            });
        });

        it("should handle line with no leading whitespace", () => {
            const result = parseLine("Hello World");
            expect(result).toEqual({
                leadingWhitespace: "",
                content: "Hello World",
            });
        });

        it("should handle line with tabs as leading whitespace", () => {
            const result = parseLine("\t\tHello");
            expect(result).toEqual({
                leadingWhitespace: "\t\t",
                content: "Hello",
            });
        });

        it("should handle empty string", () => {
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

        it("should handle mixed tabs and spaces", () => {
            const result = parseLine("  \t  content");
            expect(result).toEqual({
                leadingWhitespace: "  \t  ",
                content: "content",
            });
        });
    });

    describe("detectPrefix", () => {
        it("should detect bullet point prefix with space", () => {
            const result = detectPrefix("- item", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: "-",
                stripped: "item",
            });
        });

        it("should detect asterisk prefix", () => {
            const result = detectPrefix("* item", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: "*",
                stripped: "item",
            });
        });

        it("should detect plus prefix", () => {
            const result = detectPrefix("+ item", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: "+",
                stripped: "item",
            });
        });

        it("should return undefined matched when no prefix found", () => {
            const result = detectPrefix("no prefix", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: undefined,
                stripped: "no prefix",
            });
        });

        it("should handle prefix without following content", () => {
            const result = detectPrefix("-", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: "-",
                stripped: "",
            });
        });

        it("should handle content with leading spaces", () => {
            const result = detectPrefix("  - item", ["-", "*", "+"]);
            expect(result).toEqual({
                matched: "-",
                stripped: "item",
            });
        });

        it("should handle blockquote prefix", () => {
            const result = detectPrefix("> quote text", [">"]);
            expect(result).toEqual({
                matched: ">",
                stripped: "quote text",
            });
        });

        it("should handle heading prefix", () => {
            const result = detectPrefix("## Heading", ["#", "##", "###"]);
            expect(result).toEqual({
                matched: "##",
                stripped: "Heading",
            });
        });

        it("should not match partial prefix at start of word", () => {
            const result = detectPrefix("-item", ["-"]);
            expect(result).toEqual({
                matched: undefined,
                stripped: "-item",
            });
        });
    });

    describe("allLinesHavePrefix", () => {
        it("should return true when all lines have the same prefix", () => {
            const lines = ["- item 1", "- item 2", "- item 3"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(true);
        });

        it("should return false when not all lines have the prefix", () => {
            const lines = ["- item 1", "no prefix", "- item 3"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(false);
        });

        it("should return false when lines have different prefixes", () => {
            const lines = ["- item 1", "* item 2", "+ item 3"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(false);
        });

        it("should return true for empty array", () => {
            const result = allLinesHavePrefix([], "-", ["-"]);
            expect(result).toBe(true);
        });

        it("should handle lines with leading whitespace", () => {
            const lines = ["  - item 1", "  - item 2"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(true);
        });

        it("should return true for single line with correct prefix", () => {
            const lines = ["- single item"];
            const result = allLinesHavePrefix(lines, "-", ["-"]);
            expect(result).toBe(true);
        });

        it("should return false for single line without prefix", () => {
            const lines = ["no prefix here"];
            const result = allLinesHavePrefix(lines, "-", ["-"]);
            expect(result).toBe(false);
        });
    });

    describe("createLineEditRange", () => {
        it("should create a range for a line with content", () => {
            const result = createLineEditRange(5, 20);
            expect(result).toEqual({
                startLineNumber: 5,
                startColumn: 1,
                endLineNumber: 5,
                endColumn: 21,
            });
        });

        it("should create a range for line 1", () => {
            const result = createLineEditRange(1, 10);
            expect(result).toEqual({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 11,
            });
        });

        it("should create a range for empty line", () => {
            const result = createLineEditRange(3, 0);
            expect(result).toEqual({
                startLineNumber: 3,
                startColumn: 1,
                endLineNumber: 3,
                endColumn: 1,
            });
        });

        it("should handle large line numbers", () => {
            const result = createLineEditRange(1000, 500);
            expect(result).toEqual({
                startLineNumber: 1000,
                startColumn: 1,
                endLineNumber: 1000,
                endColumn: 501,
            });
        });
    });
});

describe("markdownEditorUtils - createLineEdit", () => {
    it("should create an edit operation for a line", () => {
        const result = createLineEdit(3, "old text", "new text");
        expect(result).toEqual({
            range: {
                startLineNumber: 3,
                startColumn: 1,
                endLineNumber: 3,
                endColumn: 9,
            },
            text: "new text",
            forceMoveMarkers: true,
        });
    });

    it("should handle empty original text", () => {
        const result = createLineEdit(1, "", "inserted text");
        expect(result).toEqual({
            range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
            },
            text: "inserted text",
            forceMoveMarkers: true,
        });
    });

    it("should handle empty replacement text", () => {
        const result = createLineEdit(2, "delete me", "");
        expect(result).toEqual({
            range: {
                startLineNumber: 2,
                startColumn: 1,
                endLineNumber: 2,
                endColumn: 10,
            },
            text: "",
            forceMoveMarkers: true,
        });
    });

    it("should handle line with special characters", () => {
        const result = createLineEdit(1, "**bold**", "_italic_");
        expect(result).toEqual({
            range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 9,
            },
            text: "_italic_",
            forceMoveMarkers: true,
        });
    });

    it("should handle unicode characters", () => {
        const result = createLineEdit(1, "Hello 世界", "Goodbye 世界");
        expect(result).toEqual({
            range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 9,
            },
            text: "Goodbye 世界",
            forceMoveMarkers: true,
        });
    });
});

describe("markdownEditorUtils - Edge Cases", () => {
    describe("parseLine edge cases", () => {
        it("should handle very long lines", () => {
            const longContent = "a".repeat(10000);
            const result = parseLine("  " + longContent);
            expect(result.leadingWhitespace).toBe("  ");
            expect(result.content).toBe(longContent);
        });

        it("should handle unicode whitespace", () => {
            const result = parseLine("  regular spaces");
            expect(result.leadingWhitespace).toBe("  ");
        });

        it("should handle newline characters in the middle", () => {
            const result = parseLine("  content\nmore");
            expect(result.leadingWhitespace).toBe("  ");
            expect(result.content).toBe("content\nmore");
        });
    });

    describe("detectPrefix edge cases", () => {
        it("should handle empty prefixes array", () => {
            const result = detectPrefix("- item", []);
            expect(result).toEqual({
                matched: undefined,
                stripped: "- item",
            });
        });

        it("should handle multi-character prefixes", () => {
            const result = detectPrefix(">>> deeply nested", [">>>", ">>", ">"]);
            expect(result).toEqual({
                matched: ">>>",
                stripped: "deeply nested",
            });
        });

        it("should match longer prefix first when provided first", () => {
            const result = detectPrefix("## heading", ["##", "#"]);
            expect(result.matched).toBe("##");
        });

        it("should handle special regex characters in prefix", () => {
            const result = detectPrefix("* item", ["*", "+"]);
            expect(result).toEqual({
                matched: "*",
                stripped: "item",
            });
        });
    });

    describe("allLinesHavePrefix with whitespace variations", () => {
        it("should handle inconsistent indentation", () => {
            const lines = ["- item 1", "  - item 2", "\t- item 3"];
            const result = allLinesHavePrefix(lines, "-", ["-"]);
            expect(result).toBe(true);
        });

        it("should handle lines with only the prefix", () => {
            const lines = ["-", "- ", "- item"];
            const result = allLinesHavePrefix(lines, "-", ["-"]);
            expect(result).toBe(true);
        });
    });

    describe("createLineEditRange edge cases", () => {
        it("should handle line number 1", () => {
            const result = createLineEditRange(1, 5);
            expect(result.startLineNumber).toBe(1);
            expect(result.endLineNumber).toBe(1);
        });

        it("should set endColumn to lineLength + 1", () => {
            const result = createLineEditRange(1, 10);
            expect(result.endColumn).toBe(11);
        });

        it("should always start at column 1", () => {
            const result = createLineEditRange(5, 20);
            expect(result.startColumn).toBe(1);
        });
    });
});

describe("markdownEditorUtils - Function Integration", () => {
    describe("parseLine and detectPrefix work together", () => {
        it("should correctly parse and detect prefix for indented list item", () => {
            const lineText = "  - list item";
            const { leadingWhitespace, content } = parseLine(lineText);
            const { matched, stripped } = detectPrefix(content, ["-", "*", "+"]);

            expect(leadingWhitespace).toBe("  ");
            expect(matched).toBe("-");
            expect(stripped).toBe("list item");
        });

        it("should correctly parse and detect prefix for blockquote", () => {
            const lineText = "\t> quoted text";
            const { leadingWhitespace, content } = parseLine(lineText);
            const { matched, stripped } = detectPrefix(content, [">"]);

            expect(leadingWhitespace).toBe("\t");
            expect(matched).toBe(">");
            expect(stripped).toBe("quoted text");
        });
    });

    describe("allLinesHavePrefix with parseLine", () => {
        it("should verify all lines in a markdown list", () => {
            const lines = ["- First item", "- Second item", "- Third item"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(true);
        });

        it("should detect broken list", () => {
            const lines = ["- First item", "Not a list item", "- Third item"];
            const result = allLinesHavePrefix(lines, "-", ["-", "*", "+"]);
            expect(result).toBe(false);
        });
    });

    describe("createLineEdit with createLineEditRange", () => {
        it("should create consistent edit operations", () => {
            const lineText = "old content";
            const lineNumber = 5;

            const editOp = createLineEdit(lineNumber, lineText, "new content");
            const expectedRange = createLineEditRange(lineNumber, lineText.length);

            expect(editOp.range).toEqual(expectedRange);
        });
    });
});
