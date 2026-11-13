import { describe, expect, it, vi } from "vitest";

import { applyWrappedEdit } from "../../utils/markdownEditorUtils.ts";

describe("applyWrappedEdit", () => {
  it("places the cursor between markers when no text is selected", () => {
    const mockModel = {
      getValueInRange: vi.fn().mockReturnValue(""),
    };

    const mockEditor = {
      getModel: vi.fn().mockReturnValue(mockModel),
      getSelection: vi.fn().mockReturnValue({
        startLineNumber: 1,
        startColumn: 6,
        endLineNumber: 1,
        endColumn: 6,
      }),
      executeEdits: vi.fn(),
      focus: vi.fn(),
      setSelection: vi.fn(),
    };

    applyWrappedEdit(mockEditor as any, "**");

    expect(mockEditor.executeEdits).toHaveBeenCalledWith(
      "markdown-toolbar",
      [
        {
          range: {
            startLineNumber: 1,
            startColumn: 6,
            endLineNumber: 1,
            endColumn: 6,
          },
          text: "****",
          forceMoveMarkers: true,
        },
      ],
    );

    expect(mockEditor.setSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        startLineNumber: 1,
        startColumn: 8,
        endLineNumber: 1,
        endColumn: 8,
      }),
    );
  });
});